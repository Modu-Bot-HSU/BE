import { PickType } from '@nestjs/mapped-types';
import { CreateUsersDto } from 'src/users/dto/create-users.dto';

export class SignInUserDto extends PickType(CreateUsersDto, [
  'walletAddress',
]) {}
