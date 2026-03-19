import { Exclude, Expose, Type } from 'class-transformer';
import { UserResponseDto } from 'src/users/dto/response-users.dto';

@Exclude()
export class NftGoodsResponseDto {
  @Expose() index: number;
  @Expose() name: string;
  @Expose() description: string;
  @Expose() price: string;
  @Expose() imageUrl: string;
  @Expose() metadataUrl: string;
  @Expose() isSold: boolean;
  @Expose() txHash: string;

  @Expose()
  @Type(() => UserResponseDto)
  owner: UserResponseDto;
}
