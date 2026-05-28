import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpUserDto } from './dto/sign-up.dto';
import { SignInUserDto } from './dto/sign-in.dto';
import { VerifySignUpEmailDto } from './dto/verify-signup-email.dto';
import {
  GetCurrentUser,
  GetCurrentUserId,
} from 'src/common/decorators/get-current-user-id.decorator';
import { RefreshTokenGuard } from 'src/common/guards/refresh-token.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** 회원가입 1단계: 이메일로 인증 코드 발송 */
  @Post('signup/request')
  async requestSignUp(@Body() body: SignUpUserDto) {
    return this.authService.requestSignUp(body);
  }

  /** 회원가입 2단계: 인증 코드 검증 + 유저 생성 + nonce 반환 */
  @Post('signup/verify')
  async verifySignUp(@Body() body: VerifySignUpEmailDto) {
    return this.authService.verifySignUpAndCreate(body.email, body.code);
  }

  @Post('signin/request')
  async requestSignIn(@Body() body: SignInUserDto) {
    return this.authService.requestSignIn(body);
  }

  @Post('signin/verify')
  async verifySignature(
    @Body() body: { walletAddress: string; signature: string },
  ) {
    return this.authService.verifySignatureAndLogin(
      body.walletAddress,
      body.signature,
    );
  }

  @UseGuards(RefreshTokenGuard)
  @Get('refresh')
  refreshAllTokens(
    @GetCurrentUserId() userId: string,
    @GetCurrentUser('refreshToken') refreshToken: string,
  ) {
    return this.authService.refreshAllTokens(userId, refreshToken);
  }
}
