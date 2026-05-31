import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class MyPageNftDto {
  @Expose() index: number;
  @Expose() name: string;
  @Expose() description: string;
  @Expose() price: string;
  @Expose() imageUrl: string;
  @Expose() metadataUrl: string;
  @Expose() txHash: string;
}

@Exclude()
export class MyPageResponseDto {
  @Expose() name: string;
  @Expose() email: string;
  @Expose() walletAddress: string;

  // 블록체인에서 조회한 HS 토큰 잔액
  @Expose() hsTokenBalance: string;

  // 보유 NFT 개수
  @Expose() nftCount: number;

  // 보유 NFT 세부 정보 목록
  @Expose()
  @Type(() => MyPageNftDto)
  nfts: MyPageNftDto[];
}
