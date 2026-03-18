import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { TokenService } from './token.service';
import { AccessTokenGuard } from 'src/common/guards/access-token.guard';
import { NftService } from './nft.service';

@Controller('blockchain')
export class BlockchainController {
  constructor(
    private readonly tokenService: TokenService,
    private readonly nftService: NftService,
  ) {}

  // 유저 토큰 조회
  // @UseGuards(AccessTokenGuard)
  @Get('balance/:address')
  async getBalance(@Param('address') address: string) {
    const balance = await this.tokenService.getBalance(address);
    return {
      address,
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

  // 토큰 전송
  @Post('transfer')
  async transfer(@Body() body: { to: string; amount: string }) {
    const txHash = await this.tokenService.transfer(body.to, body.amount);
    return {
      message: '토큰 전송이 완료되었습니다.',
      txHash,
    };
  }

  @Get('nft/inventory')
  async getInventory() {
    return await this.nftService.getInventory();
  }

  @Get('approve-test')
  async approveTest() {
    const receipt = await this.tokenService.approveNftContract();
    return {
      message: '관리자 지갑의 토큰 사용 승인이 완료되었습니다.',
      txHash: receipt.hash,
    };
  }

  @Get('approve-user-test')
  async approveUserTest() {
    const receipt = await this.tokenService.approveByTestUser();
    return {
      message: '테스트 유저 지갑의 토큰 사용 승인이 완료되었습니다.',
      txHash: receipt.hash,
    };
  }

  @Post('nft/purchase')
  async purchaseNft(@Body() body: { userAddress: string; index: number }) {
    const receipt = await this.nftService.purchaseNftForUser(
      body.userAddress,
      body.index,
    );
    return {
      message: 'NFT 구매가 완료되었습니다.',
      txHash: receipt.hash,
    };
  }
}
