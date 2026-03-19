import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserResponseDto {
  @Expose() id: number;
  @Expose() name: string;
  @Expose() walletAddress: string;
}
