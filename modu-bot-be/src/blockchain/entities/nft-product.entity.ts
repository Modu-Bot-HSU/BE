import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Users } from 'src/users/entities/users.entity';

@Entity('nft_products')
export class NftProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  index: number; // 블록체인상의 인덱스 (0~19)

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: '20' })
  price: string;

  @Column()
  imageUrl: string;

  @Column()
  metadataUrl: string;

  @Column({ default: false })
  isSold: boolean;

  // 구매 시 기록할 트랜잭션 해시
  @Column({ nullable: true })
  txHash: string;

  // 소유자 관계 설정
  @ManyToOne(() => Users, (user) => user.nfts, { nullable: true })
  @JoinColumn({ name: 'owner_id' })
  owner: Users;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
