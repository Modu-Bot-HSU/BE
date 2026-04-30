import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Question } from './entities/question.entity';
import { PendingKnowledge } from 'src/knowledge/entities/pending-knowledge.entity';
import { PendingKnowledgeStatus } from 'src/knowledge/enum/pending-knowledge-status.enum';
import { PendingKnowledgeType } from 'src/knowledge/enum/pending-knowledge-type.enum';

export interface NextQuestionResult {
  question: Question | null;
  remaining: number;
  exhausted: boolean; // 답할 질문이 더 없음(한도는 남아도)
}

@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(PendingKnowledge)
    private readonly pendingRepo: Repository<PendingKnowledge>,
  ) {}

  async getNextQuestion(
    userId: string,
    dailyLimit: number,
  ): Promise<NextQuestionResult> {
    // 오늘 자정 (UTC)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    // 오늘 제출 횟수 (상태 무관 — REJECTED 포함해서 카운트해야 파밍 방지)
    const todayCount = await this.pendingRepo
      .createQueryBuilder('pk')
      .where('pk.submitted_by_user_id = :userId', { userId })
      .andWhere('pk.type = :type', { type: PendingKnowledgeType.CREATE })
      .andWhere('pk.created_at >= :todayStart', { todayStart })
      .getCount();

    const remaining = dailyLimit - todayCount;

    if (remaining <= 0) {
      return { question: null, remaining: 0, exhausted: false };
    }

    // PENDING·APPROVED 상태로 이미 제출한 questionId 제외 (REJECTED는 재노출 허용)
    const answered = await this.pendingRepo
      .createQueryBuilder('pk')
      .select('pk.questionId')
      .where('pk.submitted_by_user_id = :userId', { userId })
      .andWhere('pk.status != :rejected', {
        rejected: PendingKnowledgeStatus.REJECTED,
      })
      .andWhere('pk.questionId IS NOT NULL')
      .getRawMany<{ pk_questionId: string }>();

    const excludedIds = answered.map((row) => row.pk_questionId);

    const qb = this.questionRepo
      .createQueryBuilder('q')
      .where('q.isActive = :isActive', { isActive: true });

    if (excludedIds.length > 0) {
      qb.andWhere('q.id NOT IN (:...excludedIds)', { excludedIds });
    }

    const questions = await qb.getMany();

    if (questions.length === 0) {
      return { question: null, remaining, exhausted: true };
    }

    const randomIndex = Math.floor(Math.random() * questions.length);
    return { question: questions[randomIndex], remaining, exhausted: false };
  }

  async findById(id: string): Promise<Question> {
    const question = await this.questionRepo.findOne({ where: { id } });
    if (!question) throw new NotFoundException('질문을 찾을 수 없습니다.');
    return question;
  }
}
