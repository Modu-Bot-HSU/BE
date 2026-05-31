import {
  ForbiddenException,
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { UsersService } from 'src/users/users.service';
import * as argon2 from 'argon2';
import { Users } from 'src/users/entities/users.entity';
import { SignUpRequestDto } from './dto/sign-up-request.dto';
import { SignInUserDto } from './dto/sign-in.dto';
import { LinkWalletDto } from './dto/link-wallet.dto';
import { ethers } from 'ethers';

/** 회원가입 임시 저장소 항목 */
interface PendingSignUpEntry {
  data: SignUpRequestDto;
  code: string;
  expiresAt: Date;
  isEmailVerified: boolean; // 이메일 인증 완료 여부
}

@Injectable()
export class AuthService implements OnModuleInit {
  /** 이메일 인증 전/후 임시 회원가입 데이터 저장소 (추후 Redis로 교체 예정) */
  private pendingSignUpStore = new Map<string, PendingSignUpEntry>();

  private gcInterval: NodeJS.Timeout;

  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {}

  onModuleInit() {
    // 만료된 임시 회원가입 데이터 주기적 정리 (1분마다)
    this.gcInterval = setInterval(() => {
      const now = new Date();
      for (const [key, value] of this.pendingSignUpStore.entries()) {
        if (now > value.expiresAt) {
          this.pendingSignUpStore.delete(key);
        }
      }
    }, 60_000);
  }

  private async hashFn(data: string): Promise<string> {
    return argon2.hash(data);
  }

  private async getTokens(user: Users): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: user.id,
          username: user.name,
          role: user.role,
        },
        {
          secret: this.configService.get('JWT_ACCESS_SECRET'),
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        {
          sub: user.id,
          username: user.name,
          role: user.role,
        },
        {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await this.hashFn(refreshToken);
    const user = await this.userService.getUserById(userId);
    user.refreshToken = hashedRefreshToken;
    await this.userService.saveUser(user);
  }

  async refreshAllTokens(userId: string, refreshToken: string) {
    const user = await this.userService.getUserById(userId);
    if (!user || !user.refreshToken) {
      throw new ForbiddenException('refresh token이 존재하지 않습니다.');
    }

    const isRefreshTokenMatched = await argon2.verify(
      user.refreshToken,
      refreshToken,
    );
    if (!isRefreshTokenMatched) {
      throw new ForbiddenException('refresh token이 일치하지 않습니다.');
    }

    const tokens = await this.getTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  /**
   * 회원가입 1단계: 이메일 + 이름 입력 후 인증 코드 발송
   * walletAddress는 이 단계에서 받지 않음
   * DB에는 아직 유저를 생성하지 않음
   */
  async requestSignUp(data: SignUpRequestDto): Promise<{ message: string }> {
    const normalizedEmail = data.email.trim().toLowerCase();

    if (!normalizedEmail.endsWith('hansung.ac.kr')) {
      throw new BadRequestException(
        '한성대학교 이메일 형식(hansung.ac.kr)만 지원합니다.',
      );
    }

    // 이메일 중복 검사
    const existByEmail =
      await this.userService.getUserByEmailOrNull(normalizedEmail);
    if (existByEmail) {
      throw new BadRequestException('이미 가입된 이메일입니다.');
    }

    // 6자리 인증 코드 생성
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 만료 시간 설정 (+5분)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // 임시 저장소에 보관 (같은 이메일로 재요청 시 덮어씀)
    this.pendingSignUpStore.set(normalizedEmail, {
      data: { ...data, email: normalizedEmail },
      code,
      expiresAt,
      isEmailVerified: false,
    });

    // 이메일 발송
    await this.mailerService.sendMail({
      to: normalizedEmail,
      subject: '[ModuBot] 회원가입 이메일 인증 코드 안내',
      template: './verification',
      context: {
        code,
      },
    });

    return { message: '인증 코드가 이메일로 발송되었습니다. 5분 내로 인증을 완료해주세요.' };
  }

  /**
   * 회원가입 2단계: 인증 코드 검증
   * 검증 성공 시 isEmailVerified = true로 업데이트하고 만료 시간 연장 (+10분)
   * DB에는 아직 유저를 생성하지 않음
   */
  async verifySignUpEmail(
    email: string,
    inputCode: string,
  ): Promise<{ message: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const entry = this.pendingSignUpStore.get(normalizedEmail);

    if (!entry) {
      throw new BadRequestException(
        '회원가입 요청 내역이 없습니다. 먼저 회원가입을 요청해주세요.',
      );
    }

    if (new Date() > entry.expiresAt) {
      this.pendingSignUpStore.delete(normalizedEmail);
      throw new BadRequestException(
        '인증 코드의 유효 시간이 만료되었습니다. 회원가입을 다시 요청해주세요.',
      );
    }

    if (entry.code !== inputCode) {
      throw new BadRequestException('인증 코드가 일치하지 않습니다.');
    }

    // 인증 완료 -> isEmailVerified = true, 만료 시간 +10분 연장
    const extendedExpiresAt = new Date();
    extendedExpiresAt.setMinutes(extendedExpiresAt.getMinutes() + 10);

    this.pendingSignUpStore.set(normalizedEmail, {
      ...entry,
      code: '', // 재사용 방지
      isEmailVerified: true,
      expiresAt: extendedExpiresAt,
    });

    return { message: '이메일 인증이 완료되었습니다. 지갑 주소를 연동해주세요.' };
  }

  /**
   * 회원가입 3단계: 지갑주소 연동 + DB 유저 생성 + nonce 반환
   * 이메일 인증이 완료된 상태(isEmailVerified = true)에서만 허용
   */
  async linkWalletAndCreate(dto: LinkWalletDto): Promise<{ nonce: string }> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const entry = this.pendingSignUpStore.get(normalizedEmail);

    if (!entry) {
      throw new BadRequestException(
        '회원가입 요청 내역이 없습니다. 먼저 회원가입을 요청해주세요.',
      );
    }

    if (!entry.isEmailVerified) {
      throw new BadRequestException(
        '이메일 인증을 먼저 완료해주세요.',
      );
    }

    if (new Date() > entry.expiresAt) {
      this.pendingSignUpStore.delete(normalizedEmail);
      throw new BadRequestException(
        '회원가입 세션이 만료되었습니다. 이메일 인증을 다시 완료해주세요.',
      );
    }

    // 지갑 주소 중복 검사
    const existByWallet = await this.userService.getUserByWallet(
      dto.walletAddress,
    );
    if (existByWallet) {
      throw new BadRequestException('이미 가입된 지갑 주소입니다.');
    }

    // 이메일 중복 재검사 (verifiedToken 발급 후 다른 경로로 가입됐을 수 있음)
    const existByEmail =
      await this.userService.getUserByEmailOrNull(normalizedEmail);
    if (existByEmail) {
      this.pendingSignUpStore.delete(normalizedEmail);
      throw new BadRequestException('이미 가입된 이메일입니다.');
    }

    // nonce 생성 및 유저 DB 저장
    const nonce = Math.floor(Math.random() * 1000000).toString();
    const newUser = await this.userService.createUser({
      name: entry.data.name,
      email: normalizedEmail,
      walletAddress: dto.walletAddress,
      nonce,
      isVerified: true,
    });

    // 사용된 임시 데이터 삭제
    this.pendingSignUpStore.delete(normalizedEmail);

    return { nonce: newUser.nonce };
  }

  async requestSignIn(data: SignInUserDto): Promise<{ nonce: string }> {
    const user = await this.userService.getUserByWallet(data.walletAddress);
    if (!user) {
      throw new NotFoundException('가입되지 않은 지갑 주소입니다.');
    }

    if (!user.nonce) {
      user.nonce = Math.floor(Math.random() * 1000000).toString();
      await this.userService.saveUser(user);
    }

    return { nonce: user.nonce };
  }

  // 서명 검증 및 토큰 발급
  async verifySignatureAndLogin(walletAddress: string, signature: string) {
    const user = await this.userService.getUserByWallet(walletAddress);
    if (!user) {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    }

    if (!user.nonce) {
      throw new BadRequestException('Nonce 값이 존재하지 않습니다.');
    }

    try {
      // ethers.js를 사용하여 서명 데이터 복구
      const recoveredAddress = ethers.verifyMessage(user.nonce, signature);

      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new UnauthorizedException('서명이 올바르지 않습니다.');
      }
    } catch (e) {
      throw new UnauthorizedException('서명 검증 중 오류가 발생했습니다.');
    }

    // 검증 성공 -> Replay Attack 방지 위해 nonce 재생성
    user.nonce = Math.floor(Math.random() * 1000000).toString();
    await this.userService.saveUser(user);

    // JWT 발급
    const tokens = await this.getTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }
}
