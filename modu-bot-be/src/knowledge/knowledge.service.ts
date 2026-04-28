import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { PendingKnowledge } from './entities/pending-knowledge.entity';
import { PendingKnowledgeType } from './enum/pending-knowledge-type.enum';
import { PendingKnowledgeStatus } from './enum/pending-knowledge-status.enum';
import { AiClientService, AiKnowledgeListResponse } from 'src/ai-client/ai-client.service';
import { Users } from 'src/users/entities/users.entity';
import { SubmitKnowledgeDto } from './dto/submit-knowledge.dto';
import { RequestUpdateKnowledgeDto } from './dto/request-update-knowledge.dto';
import { RequestDeleteKnowledgeDto } from './dto/request-delete-knowledge.dto';

@Injectable()
export class KnowledgeService {
  constructor(
    @InjectRepository(PendingKnowledge)
    private readonly pendingRepo: Repository<PendingKnowledge>,
    private readonly aiClientService: AiClientService,
  ) {}

  async getKnowledge(
    category: string,
    limit?: number,
    offset?: string,
  ): Promise<AiKnowledgeListResponse> {
    return this.aiClientService.getKnowledge(category, limit, offset);
  }

  async submitKnowledge(user: Users, dto: SubmitKnowledgeDto): Promise<PendingKnowledge> {
    const pending = this.pendingRepo.create({
      id: uuidv7(),
      type: PendingKnowledgeType.CREATE,
      status: PendingKnowledgeStatus.PENDING,
      knowledgeId: null,
      submittedBy: user,
      submittedByWallet: user.walletAddress,
      category: dto.category,
      content: dto.content,
      originalQuestion: dto.originalQuestion ?? null,
    });
    return this.pendingRepo.save(pending);
  }

  async requestUpdateKnowledge(
    user: Users,
    knowledgeId: string,
    dto: RequestUpdateKnowledgeDto,
  ): Promise<PendingKnowledge> {
    const pending = this.pendingRepo.create({
      id: uuidv7(),
      type: PendingKnowledgeType.UPDATE,
      status: PendingKnowledgeStatus.PENDING,
      knowledgeId,
      submittedBy: user,
      submittedByWallet: user.walletAddress,
      category: dto.category,
      content: dto.content,
      originalQuestion: dto.originalQuestion ?? null,
    });
    return this.pendingRepo.save(pending);
  }

  async requestDeleteKnowledge(
    user: Users,
    knowledgeId: string,
    dto: RequestDeleteKnowledgeDto,
  ): Promise<PendingKnowledge> {
    const pending = this.pendingRepo.create({
      id: uuidv7(),
      type: PendingKnowledgeType.DELETE,
      status: PendingKnowledgeStatus.PENDING,
      knowledgeId,
      submittedBy: user,
      submittedByWallet: user.walletAddress,
      category: '',
      content: dto.reason ?? '',
      originalQuestion: null,
    });
    return this.pendingRepo.save(pending);
  }
}
