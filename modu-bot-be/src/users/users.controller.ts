import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AccessTokenGuard } from 'src/common/guards/access-token.guard';
import { GetCurrentUserId } from 'src/common/decorators/get-current-user-id.decorator';
import { TokenService } from 'src/blockchain/token.service';
import { NftService } from 'src/blockchain/nft.service';
import { plainToInstance } from 'class-transformer';
import { MyPageNftDto, MyPageResponseDto } from './dto/response-mypage.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly nftService: NftService,
    private readonly tokenService: TokenService,
  ) {}

  /**
   * 마이페이지 정보 조회
   * GET /users/mypage
   */
  @UseGuards(AccessTokenGuard)
  @Get('mypage')
  async getMyPage(
    @GetCurrentUserId() userId: string,
  ): Promise<MyPageResponseDto> {
    const user = await this.usersService.getUserById(userId);
    const ownedNfts = await this.nftService.getUserOwnedNfts(userId);
    const hsTokenBalance = await this.tokenService.getBalance(
      user.walletAddress,
    );

    const result: MyPageResponseDto = plainToInstance(
      MyPageResponseDto,
      {
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
        hsTokenBalance,
        nftCount: ownedNfts.length,
        nfts: plainToInstance(MyPageNftDto, ownedNfts, {
          excludeExtraneousValues: true,
        }),
      },
      { excludeExtraneousValues: true },
    );

    return result;
  }
}
