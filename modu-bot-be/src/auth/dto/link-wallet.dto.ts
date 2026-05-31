import { PickType } from '@nestjs/mapped-types';
import { CreateUsersDto } from 'src/users/dto/create-users.dto';

/**
 * 회원가입 3단계 DTO: 이메일 + 지갑주소 연동
 * CreateUsersDto에서 email, walletAddress 필드만 선택하여 재활용
 */
export class LinkWalletDto extends PickType(CreateUsersDto, [
  'email',
  'walletAddress',
] as const) {}
