import { Global, Module } from '@nestjs/common';
import { NftService } from './nft.service';
import { TokenService } from './token.service';
import { BlockchainController } from './blockchain.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NftProduct } from './entities/nft-product.entity';
import { Users } from 'src/users/entities/users.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([NftProduct, Users])],
  providers: [NftService, TokenService],
  controllers: [BlockchainController],
  exports: [TokenService, NftService],
})
export class BlockchainModule {}
