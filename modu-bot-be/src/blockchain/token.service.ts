import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';
import * as HsTokenAbi from './abis/hs-token.abi.json';

@Injectable()
export class TokenService implements OnModuleInit {
  private readonly logger = new Logger(TokenService.name);
  private provider: ethers.WebSocketProvider;
  private wallet: ethers.Wallet;
  private tokenContract: ethers.Contract;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.setupContract();
  }

  private setupContract() {
    const wssUrl = this.configService.getOrThrow<string>('AMOI_WSS_URL');
    const privateKey = this.configService.getOrThrow<string>('PRIVATE_KEY');
    const contractAddress =
      this.configService.getOrThrow<string>('HS_TOKEN_ADDRESS');

    this.provider = new ethers.WebSocketProvider(wssUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);

    this.tokenContract = new ethers.Contract(
      contractAddress,
      HsTokenAbi.abi,
      this.wallet, // Signer를 연결하여 트랜잭션 전송 가능하게 함
    );

    this.logger.log('HS Token 서비스가 준비되었습니다.');
  }

  /**
   * 유저의 HS 토큰 잔액  // 관리자 잔액 조회
   */
  async getAdminBalance() {
    const adminAddress = this.wallet.address;
    const balance = await this.tokenContract.balanceOf(adminAddress);
    return ethers.formatEther(balance);
  }

  // NFT 컨트랙트가 관리자의 토큰을 가져갈 수 있도록 승인 (테스트용)
  async approveNftContract() {
    const nftContractAddress =
      this.configService.getOrThrow<string>('HS_NFT_ADDRESS');
    try {
      this.logger.log(`NFT 컨트랙트(${nftContractAddress}) 승인 시도...`);

      // 100만개 넉넉하게 승인 (ethersv6 MaxUint256)
      const tx = await this.tokenContract.approve(
        nftContractAddress,
        ethers.MaxUint256,
      );

      this.logger.log(`승인 트랜잭션 전송: ${tx.hash}`);
      return await tx.wait();
    } catch (error) {
      this.logger.error('승인 실패:', error.message);
      throw error;
    }
  }

  // 테스트 유저 지갑으로 NFT 컨트랙트 승인 진행 (테스트용)
  async approveByTestUser() {
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
        userWallet,
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
   * @param amount 지급할 토큰 양 (예: "10.5")
   */
  async rewardUser(to: string, amount: string): Promise<string> {
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

  /**
   * 일반 토큰 전송 (admin 지갑 -> 유저)
   */
  async transfer(to: string, amount: string): Promise<string> {
    try {
      const amountWei = ethers.parseEther(amount);
      const tx = await this.tokenContract.transfer(to, amountWei);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      this.logger.error(`토큰 전송 실패 (${to}):`, error.message);
      throw error;
    }
  }
}
