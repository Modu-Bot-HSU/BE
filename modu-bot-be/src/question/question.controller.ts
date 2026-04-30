import { Controller, Get, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QuestionService } from './question.service';
import { AccessTokenGuard } from 'src/common/guards/access-token.guard';
import { GetCurrentUserId } from 'src/common/decorators/get-current-user-id.decorator';

@Controller('questions')
export class QuestionController {
  constructor(
    private readonly questionService: QuestionService,
    private readonly configService: ConfigService,
  ) {}

  @UseGuards(AccessTokenGuard)
  @Get('next')
  async getNextQuestion(@GetCurrentUserId() userId: string) {
    const dailyLimit = this.configService.get<number>('DAILY_QUESTION_LIMIT') ?? 5;
    const result = await this.questionService.getNextQuestion(userId, dailyLimit);

    if (result.remaining === 0) {
      return {
        message: '오늘 받을 수 있는 질문을 모두 소진했습니다.',
        data: null,
        remaining: 0,
      };
    }

    if (result.exhausted) {
      return {
        message: '답변 가능한 질문이 더 없습니다.',
        data: null,
        remaining: result.remaining,
      };
    }

    return {
      message: '질문 조회 성공',
      data: result.question,
      remaining: result.remaining,
    };
  }
}
