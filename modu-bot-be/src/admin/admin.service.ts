import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PendingKnowledge } from 'src/knowledge/entities/pending-knowledge.entity';
import { PendingKnowledgeStatus } from 'src/knowledge/enum/pending-knowledge-status.enum';
import { PendingKnowledgeType } from 'src/knowledge/enum/pending-knowledge-type.enum';
import { AiClientService } from 'src/ai-client/ai-client.service';
import { TokenService } from 'src/blockchain/token.service';

const KNOWLEDGE_REWARD_AMOUNT = '10';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(PendingKnowledge)
    private readonly pendingRepo: Repository<PendingKnowledge>,
    private readonly aiClientService: AiClientService,
    private readonly tokenService: TokenService,
  ) {}

  async getPendingRequests(status?: PendingKnowledgeStatus): Promise<PendingKnowledge[]> {
    return this.pendingRepo.find({
      where: { status: status ?? PendingKnowledgeStatus.PENDING },
      order: { createdAt: 'ASC' },
    });
  }

  async approveRequest(requestId: string, adminWallet: string): Promise<PendingKnowledge> {
    const request = await this.pendingRepo.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException(`요청 ID ${requestId}를 찾을 수 없습니다.`);
    }
    if (request.status !== PendingKnowledgeStatus.PENDING) {
      throw new BadRequestException('이미 처리된 요청입니다.');
    }

    // AI 서버 연동
    await this.syncToAiServer(request);

    // DB 상태 업데이트
    request.status = PendingKnowledgeStatus.APPROVED;
    request.approvedBy = adminWallet;
    request.approvedAt = new Date();
    const saved = await this.pendingRepo.save(request);

    // CREATE 요청만 보상 지급
    if (request.type === PendingKnowledgeType.CREATE) {
      try {
        await this.tokenService.rewardUser(request.submittedByWallet, KNOWLEDGE_REWARD_AMOUNT);
        this.logger.log(`보상 지급 완료: ${request.submittedByWallet} +${KNOWLEDGE_REWARD_AMOUNT} HS`);
      } catch (error) {
        this.logger.error(`보상 지급 실패 (요청 ID: ${requestId}):`, error.message);
        // 보상 실패가 승인을 롤백하지 않도록 예외를 삼킴
      }
    }

    return saved;
  }

  async rejectRequest(requestId: string, reason?: string): Promise<PendingKnowledge> {
    const request = await this.pendingRepo.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException(`요청 ID ${requestId}를 찾을 수 없습니다.`);
    }
    if (request.status !== PendingKnowledgeStatus.PENDING) {
      throw new BadRequestException('이미 처리된 요청입니다.');
    }

    request.status = PendingKnowledgeStatus.REJECTED;
    request.rejectReason = reason ?? null;
    return this.pendingRepo.save(request);
  }

  private async syncToAiServer(request: PendingKnowledge): Promise<void> {
    switch (request.type) {
      case PendingKnowledgeType.CREATE:
        await this.aiClientService.insertKnowledge({
          knowledge_id: request.id,
          wallet_address: request.submittedByWallet,
          category: request.category,
          content: request.content,
          original_question: request.originalQuestion ?? undefined,
        });
        break;

      case PendingKnowledgeType.UPDATE:
        await this.aiClientService.updateKnowledge(request.knowledgeId!, {
          wallet_address: request.submittedByWallet,
          category: request.category,
          content: request.content,
          original_question: request.originalQuestion ?? undefined,
        });
        break;

      case PendingKnowledgeType.DELETE:
        await this.aiClientService.deleteKnowledge(request.knowledgeId!);
        break;
    }
  }
}
