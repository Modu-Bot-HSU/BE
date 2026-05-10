import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { PendingKnowledge } from './entities/pending-knowledge.entity';
import { PendingKnowledgeType } from './enum/pending-knowledge-type.enum';
import { PendingKnowledgeStatus } from './enum/pending-knowledge-status.enum';
import {
  AiClientService,
  AiKnowledgeListResponse,
} from 'src/ai-client/ai-client.service';
import { Users } from 'src/users/entities/users.entity';
import { SubmitKnowledgeDto } from './dto/submit-knowledge.dto';
import { RequestUpdateKnowledgeDto } from './dto/request-update-knowledge.dto';
import { RequestDeleteKnowledgeDto } from './dto/request-delete-knowledge.dto';
import { QuestionService } from 'src/question/question.service';
import { TokenService } from 'src/blockchain/token.service';

const SUBMIT_REWARD_AMOUNT = '3';

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(
    @InjectRepository(PendingKnowledge)
    private readonly pendingRepo: Repository<PendingKnowledge>,
    private readonly aiClientService: AiClientService,
    private readonly questionService: QuestionService,
    private readonly tokenService: TokenService,
  ) {}

  async getKnowledge(
    category?: string,
    limit?: number,
    offset?: string,
  ): Promise<AiKnowledgeListResponse> {
    return this.aiClientService.getKnowledge(category, limit, offset);
  }

  async submitKnowledge(
    user: Users,
    dto: SubmitKnowledgeDto,
  ): Promise<PendingKnowledge> {
    const question = await this.questionService.findById(dto.questionId);

    const pending = this.pendingRepo.create({
      id: uuidv7(),
      type: PendingKnowledgeType.CREATE,
      status: PendingKnowledgeStatus.PENDING,
      knowledgeId: null,
      submittedBy: user,
      submittedByWallet: user.walletAddress,
      category: dto.category,
      content: dto.content,
      questionId: question.id,
      originalQuestion: question.text,
    });

    const saved = await this.pendingRepo.save(pending);

    this.tokenService
      .rewardUser(user.walletAddress, SUBMIT_REWARD_AMOUNT)
      .then(() =>
        this.logger.log(
          `제출 보상 ${SUBMIT_REWARD_AMOUNT} HS 지급 완료 (${user.walletAddress})`,
        ),
      )
      .catch((err) =>
        this.logger.error(
          `제출 보상 지급 실패 (${user.walletAddress}): ${err.message}`,
        ),
      );

    return saved;
  }

  async requestUpdateKnowledge(
    user: Users,
    knowledgeId: string,
    dto: RequestUpdateKnowledgeDto,
  ): Promise<PendingKnowledge> {
    const question = await this.questionService.findById(dto.questionId);

    const pending = this.pendingRepo.create({
      id: uuidv7(),
      type: PendingKnowledgeType.UPDATE,
      status: PendingKnowledgeStatus.PENDING,
      knowledgeId,
      submittedBy: user,
      submittedByWallet: user.walletAddress,
      category: dto.category,
      content: dto.content,
      questionId: question.id,
      originalQuestion: question.text,
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

  async getMySubmissions(
    userId: string,
    status?: PendingKnowledgeStatus,
  ): Promise<PendingKnowledge[]> {
    const where: FindOptionsWhere<PendingKnowledge> = {
      submittedBy: { id: userId },
    };
    if (status) where.status = status;

    return this.pendingRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }
}
