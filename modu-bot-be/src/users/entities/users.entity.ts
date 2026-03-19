import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { NftProduct } from 'src/blockchain/entities/nft-product.entity';

@Entity('users')
export class Users {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => NftProduct, (nft) => nft.owner)
  nfts: NftProduct[];

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    default: '',
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    unique: true,
  })
  email: string;

  @Column({
    type: 'varchar',
    length: 42,
    nullable: false,
    unique: true,
  })
  walletAddress: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  nonce: string; // 서명 검증을 위한 일회성 난수

  @Column({
    type: 'boolean',
    default: false,
  })
  isVerified: boolean; // 대학교 인증 여부

  @Column({
    name: 'refresh_token',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  refreshToken?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
