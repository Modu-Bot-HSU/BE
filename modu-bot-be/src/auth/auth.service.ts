import {
  ForbiddenException,
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as argon2 from 'argon2';
import { Users } from 'src/users/entities/users.entity';
import { SignUpUserDto } from './dto/sign-up.dto';
import { SignInUserDto } from './dto/sign-in.dto';
import { ethers } from 'ethers';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

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

  async requestSignUp(data: SignUpUserDto): Promise<{ nonce: string }> {
    const existUser = await this.userService.getUserByWallet(
      data.walletAddress,
    );
    if (existUser) {
      throw new BadRequestException('이미 가입된 지갑 주소입니다.');
    }

    const nonce = Math.floor(Math.random() * 1000000).toString();

    const newUser = await this.userService.createUser({
      ...data,
      nonce,
    });

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
