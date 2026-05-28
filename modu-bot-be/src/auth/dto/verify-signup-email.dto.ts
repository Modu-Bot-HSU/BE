import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifySignUpEmailDto {
  @IsEmail({}, { message: '유효한 이메일 형식이 아닙니다.' })
  @IsNotEmpty({ message: '이메일을 입력해주세요.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: '인증 코드를 입력해주세요.' })
  @Length(6, 6, { message: '인증 코드는 6자리입니다.' })
  code: string;
}
