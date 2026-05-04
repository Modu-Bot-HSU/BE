import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PendingKnowledgeType } from '../enum/pending-knowledge-type.enum';
import { PendingKnowledgeStatus } from '../enum/pending-knowledge-status.enum';
import { Users } from 'src/users/entities/users.entity';

@Entity('pending_knowledge')
export class PendingKnowledge {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string; // UUID v7 — 생성 시 uuidv7()로 직접 할당

  @Column({
    type: 'enum',
    enum: PendingKnowledgeType,
  })
  type: PendingKnowledgeType;

  @Column({
    type: 'enum',
    enum: PendingKnowledgeStatus,
    default: PendingKnowledgeStatus.PENDING,
  })
  status: PendingKnowledgeStatus;

  @Column({ type: 'varchar', length: 36, nullable: true })
  knowledgeId: string | null; // UPDATE/DELETE 시 대상 Qdrant 포인트 ID

  @ManyToOne(() => Users, { nullable: false })
  @JoinColumn({ name: 'submitted_by_user_id' })
  submittedBy: Users;

  @Column({ type: 'varchar', length: 42 })
  submittedByWallet: string;

  @Column({ type: 'varchar', length: 50 })
  category: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  questionId: string | null;

  @Column({ type: 'text', nullable: true })
  originalQuestion: string | null;

  @Column({ type: 'text', nullable: true })
  rejectReason: string | null;

  @Column({ type: 'varchar', nullable: true })
  approvedBy: string | null;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
