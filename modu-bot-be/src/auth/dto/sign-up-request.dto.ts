import { PickType } from '@nestjs/mapped-types';
import { CreateUsersDto } from 'src/users/dto/create-users.dto';

/**
 * 회원가입 1단계 DTO: 이메일 + 이름만 입력
 * CreateUsersDto에서 name, email 필드만 선택하여 재활용
 */
export class SignUpRequestDto extends PickType(CreateUsersDto, [
  'name',
  'email',
] as const) {}
