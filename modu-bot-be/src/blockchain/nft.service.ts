import {
  Injectable,
  OnModuleInit,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NftProduct } from './entities/nft-product.entity';
import { Users } from 'src/users/entities/users.entity';
import * as HsNftAbi from './abis/hs-nft.abi.json';

@Injectable()
export class NftService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NftService.name);
  private provider: ethers.WebSocketProvider;
  private nftContract: ethers.Contract;
  private wallet: ethers.Wallet;

  constructor(
    private configService: ConfigService,
    @InjectRepository(NftProduct)
    private nftRepository: Repository<NftProduct>,
    @InjectRepository(Users)
    private userRepository: Repository<Users>,
  ) {}

  async onModuleInit() {
    this.connectToNFTContract();
  }

  private connectToNFTContract() {
    try {
      const wssUrl = this.configService.getOrThrow<string>('AMOI_WSS_URL');
      const contractAddress =
        this.configService.getOrThrow<string>('HS_NFT_ADDRESS');
      const privateKey = this.configService.getOrThrow<string>('PRIVATE_KEY');

      this.provider = new ethers.WebSocketProvider(wssUrl);
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      this.nftContract = new ethers.Contract(
        contractAddress,
        HsNftAbi.abi,
        this.wallet,
      );

      // 이벤트 리스너 설정
      this.setupEventListeners();

      this.provider.on('error', (error) => {
        this.logger.error('WSS 연결 도중 에러 발생:', error);
        this.reconnect();
      });

      this.logger.log('HS NFT 서비스가 준비되었습니다.');
    } catch (error) {
      this.logger.error('HS NFT 서비스 초기화 실패:', error.message);
      this.reconnect();
    }
  }

  // --- 상점 (Store) ---

  private readonly NFT_PRICE = '20';

  // NFT 판매 목록 조회 (DB 데이터 기반 + 블록체인 상태 실시간 동기화)
  async getNftGoods(): Promise<NftProduct[]> {
    const metadataCid =
      this.configService.getOrThrow<string>('NFT_METADATA_CID');
    const imageCid = this.configService.getOrThrow<string>('NFT_IMAGE_CID');
    const gateway = 'https://ipfs.io/ipfs';

    try {
      // 블록체인에서 현재 판매 상태 가져오기
      const onChainStatus = await this.nftContract.getInventoryStatus();

      // DB 동기화 로직
      const inventory: NftProduct[] = [];
      for (let i = 0; i < 5; i++) {
        let product = await this.nftRepository.findOne({
          where: { index: i },
          relations: ['owner'],
        });

        const isSoldOnChain = onChainStatus[i];
        const fileName = (i + 1).toString().padStart(2, '0');

        if (!product) {
          // DB에 없으면 초기 데이터 생성
          product = this.nftRepository.create({
            index: i,
            name: `HanSung NFT #${i}`,
            description: '한성대학교 3D NFT 프로젝트',
            price: this.NFT_PRICE,
            imageUrl: `${gateway}/${imageCid}/${fileName}.png`,
            metadataUrl: `${gateway}/${metadataCid}/${i}`,
            isSold: isSoldOnChain,
          });
          product = await this.nftRepository.save(product);
        } else if (product.isSold !== isSoldOnChain) {
          // 블록체인 상태와 DB가 다르면 업데이트
          product.isSold = isSoldOnChain;
          await this.nftRepository.save(product);
        }
        inventory.push(product);
      }

      return inventory;
    } catch (error) {
      this.logger.error('인벤토리 조회 실패:', error.message);
      throw error;
    }
  }

  // 유저를 대신해 NFT 구매 (서버 가스비 대납 로직)
  async purchaseNftForUser(
    userAddress: string,
    index: number,
  ): Promise<ethers.ContractTransactionReceipt> {
    try {
      this.logger.log(
        `NFT 구매 시도: 유저 ${userAddress}, 번호 ${index}, 가격 ${this.NFT_PRICE} HS`,
      );

      const user = await this.userRepository.findOne({
        where: { walletAddress: userAddress },
      });
      if (!user) throw new Error('등록되지 않은 유저입니다.');

      // 블록체인 트랜잭션 전송
      const priceWei = ethers.parseEther(this.NFT_PRICE);
      const tx = await this.nftContract.buyNftForUser(
        userAddress,
        index,
        priceWei,
      );

      this.logger.log(`트랜잭션 전송 완료: ${tx.hash}`);

      // 트랜잭션 완료 대기
      const receipt = await tx.wait();

      // DB 업데이트
      await this.handleNftPurchase(userAddress, index, tx.hash);

      return receipt;
    } catch (error) {
      this.logger.error('NFT 구매 실패:', error.message);
      throw error;
    }
  }

  // DB 업데이트 로직
  private async handleNftPurchase(
    buyerAddress: string,
    index: number,
    txHash: string,
  ) {
    try {
      const user = await this.userRepository.findOne({
        where: { walletAddress: buyerAddress },
      });
      const product = await this.nftRepository.findOne({ where: { index } });

      if (user && product) {
        product.isSold = true;
        product.owner = user;
        product.txHash = txHash;
        await this.nftRepository.save(product);
        this.logger.log(`DB 업데이트 완료: NFT #${index} -> ${buyerAddress}`);
      }
    } catch (error) {
      this.logger.error('DB 업데이트 실패:', error.message);
    }
  }

  private async setupEventListeners() {
    this.nftContract.removeAllListeners('NftPurchased');
    this.logger.log('HS NFT 이벤트 리스너 설정 완료 (NftPurchased)');

    this.nftContract.on(
      'NftPurchased',
      async (buyer, index, _tokenId, _price, event) => {
        try {
          this.logger.log(
            `🔥 온체인 이벤트 감지: 구매자 ${buyer}, NFT #${index}`,
          );
          // 트랜잭션 해시 -> event.log.transactionHash 에 위치
          await this.handleNftPurchase(
            buyer,
            Number(index),
            event.log.transactionHash,
          );
        } catch (error) {
          this.logger.error('이벤트 처리 중 오류:', error.message);
        }
      },
    );
  }

  private reconnect() {
    this.logger.warn('5초 후 WSS 재연결을 시도합니다...');
    if (this.provider) {
      this.provider.destroy();
    }
    setTimeout(() => this.connectToNFTContract(), 5000);
  }

  async onModuleDestroy() {
    if (this.provider) {
      await this.provider.destroy();
    }
  }
}
