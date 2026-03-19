import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { TokenService } from './token.service';
import { AccessTokenGuard } from 'src/common/guards/access-token.guard';
import { NftService } from './nft.service';
import { GetCurrentUserId } from 'src/common/decorators/get-current-user-id.decorator';
import { UsersService } from 'src/users/users.service';
import { plainToInstance } from 'class-transformer';
import { NftGoodsResponseDto } from './dto/response-nftGoods.dto';

@Controller('blockchain')
export class BlockchainController {
  constructor(
    private readonly tokenService: TokenService,
    private readonly nftService: NftService,
    private readonly usersService: UsersService,
  ) {}

  // 내 토큰 잔액 조회 (로그인된 정보 기반)
  @UseGuards(AccessTokenGuard)
  @Get('balance')
  async getMyBalance(@GetCurrentUserId() userId: string) {
    const user = await this.usersService.getUserById(userId);
    const balance = await this.tokenService.getBalance(user.walletAddress);
    return {
      address: user.walletAddress,
      balance,
      symbol: 'HS',
    };
  }

  // 보상 지급
  @Post('reward')
  async rewardUser(@Body() body: { to: string; amount: string }) {
    const txHash = await this.tokenService.rewardUser(body.to, body.amount);
    return {
      message: '보상이 성공적으로 지급되었습니다.',
      txHash,
    };
  }

  @UseGuards(AccessTokenGuard)
  @Get('nft/goods')
  async getInventory() {
    const rawData = await this.nftService.getNftGoods();
    return plainToInstance(NftGoodsResponseDto, rawData);
  }

  // 백엔드 테스트 용 -> 추후 삭제 예정
  @Get('approve-user-test')
  async approveUserTest() {
    const receipt = await this.tokenService.approveByTestUser();
    return {
      message: '테스트 유저 지갑의 토큰 사용 승인이 완료되었습니다.',
      txHash: receipt.hash,
    };
  }

  @UseGuards(AccessTokenGuard)
  @Post('nft/purchase')
  async purchaseNft(
    @Body() body: { index: number },
    @GetCurrentUserId() userId: string,
  ) {
    const user = await this.usersService.getUserById(userId);
    const receipt = await this.nftService.purchaseNftForUser(
      user.walletAddress,
      body.index,
    );
    return {
      message: 'NFT 구매가 완료되었습니다.',
      txHash: receipt.hash,
    };
  }
}
