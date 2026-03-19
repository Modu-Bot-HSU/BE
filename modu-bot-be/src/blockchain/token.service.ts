import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';
import * as HsTokenAbi from './abis/hs-token.abi.json';

@Injectable()
export class TokenService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TokenService.name);
  private provider: ethers.WebSocketProvider;
  private wallet: ethers.Wallet;
  private tokenContract: ethers.Contract;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.connectToTokenContract();
  }

  private connectToTokenContract() {
    try {
      const wssUrl = this.configService.getOrThrow<string>('AMOI_WSS_URL');
      const privateKey = this.configService.getOrThrow<string>('PRIVATE_KEY');
      const contractAddress =
        this.configService.getOrThrow<string>('HS_TOKEN_ADDRESS');

      this.provider = new ethers.WebSocketProvider(wssUrl);
      this.wallet = new ethers.Wallet(privateKey, this.provider);

      this.tokenContract = new ethers.Contract(
        contractAddress,
        HsTokenAbi.abi,
        this.wallet, // -> Signer(서명자) : admin
      );

      this.provider.on('error', (error) => {
        this.logger.error('WSS 연결 도중 에러 발생:', error);
        this.reconnect();
      });

      this.logger.log('HS Token 서비스가 준비되었습니다.');
    } catch (error) {
      this.logger.error('HS Token 서비스 초기화 실패:', error.message);
      this.reconnect();
    }
  }

  async getAdminBalance() {
    const adminAddress = this.wallet.address;
    const balance = await this.tokenContract.balanceOf(adminAddress);
    return ethers.formatEther(balance);
  }

  // 테스트 유저 지갑으로 NFT 컨트랙트 승인 진행 (테스트용) -> 추후 삭제 예정
  async approveByTestUser(): Promise<ethers.ContractTransactionReceipt> {
    const nftContractAddress =
      this.configService.getOrThrow<string>('HS_NFT_ADDRESS');
    const userPrivateKey =
      this.configService.getOrThrow<string>('USER_PRIVATE_KEY');

    try {
      // 유저 지갑으로 새로운 컨트랙트 인스턴스 생성
      const userWallet = new ethers.Wallet(userPrivateKey, this.provider);
      const userTokenContract = new ethers.Contract(
        this.tokenContract.target,
        HsTokenAbi.abi,
        userWallet, // -> Signer(서명자) : admin
      );

      this.logger.log(`테스트 유저 승인 시도 (${userWallet.address})...`);

      const tx = await userTokenContract.approve(
        nftContractAddress,
        ethers.MaxUint256,
      );

      this.logger.log(`유저 승인 트랜잭션 전송: ${tx.hash}`);
      return await tx.wait();
    } catch (error) {
      this.logger.error('유저 승인 실패:', error.message);
      throw error;
    }
  }

  /**
   * 유저의 HS 토큰 잔액 조회
   * @param address 유저 지갑 주소
   */
  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.tokenContract.balanceOf(address);
      return ethers.formatEther(balance);
    } catch (error) {
      this.logger.error(`잔액 조회 실패 (${address}):`, error.message);
      throw error;
    }
  }

  /**
   * 챗봇 기여에 대한 보상 지급 (Admin 권한 필요)
   * @param to 보상 받을 유저 지갑 주소
   * @param amount 지급할 토큰 양
   * @returns {Promise<ethers.ContractTransactionReceipt>} 트렌젝션 hash
   */
  async rewardUser(
    to: string,
    amount: string,
  ): Promise<ethers.ContractTransactionReceipt> {
    try {
      this.logger.log(`보상 지급 시도: ${to}, 수량: ${amount}`);

      const amountWei = ethers.parseEther(amount);
      const tx = await this.tokenContract.rewardUser(to, amountWei);

      this.logger.log(`트랜잭션 전송됨: ${tx.hash}`);

      // 트랜잭션 확정 대기
      const receipt = await tx.wait();
      this.logger.log(`보상 지급 완료! 블록: ${receipt.blockNumber}`);

      return tx.hash;
    } catch (error) {
      this.logger.error(`보상 지급 실패 (${to}):`, error.message);
      throw error;
    }
  }

  private reconnect() {
    this.logger.warn('5초 후 WSS 재연결을 시도합니다...');
    if (this.provider) {
      this.provider.destroy();
    }
    setTimeout(() => this.connectToTokenContract(), 5000);
  }

  async onModuleDestroy() {
    if (this.provider) {
      await this.provider.destroy();
    }
  }
}
