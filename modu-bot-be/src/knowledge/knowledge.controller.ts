import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { AccessTokenGuard } from 'src/common/guards/access-token.guard';
import { GetCurrentUserId } from 'src/common/decorators/get-current-user-id.decorator';
import { UsersService } from 'src/users/users.service';
import { SubmitKnowledgeDto } from './dto/submit-knowledge.dto';
import { RequestUpdateKnowledgeDto } from './dto/request-update-knowledge.dto';
import { RequestDeleteKnowledgeDto } from './dto/request-delete-knowledge.dto';

@Controller('knowledge')
export class KnowledgeController {
  constructor(
    private readonly knowledgeService: KnowledgeService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  async getKnowledge(
    @Query('category') category: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: string,
  ) {
    return this.knowledgeService.getKnowledge(category, limit, offset);
  }

  @UseGuards(AccessTokenGuard)
  @Post('submit')
  async submitKnowledge(
    @GetCurrentUserId() userId: string,
    @Body() dto: SubmitKnowledgeDto,
  ) {
    const user = await this.usersService.getUserById(userId);
    const result = await this.knowledgeService.submitKnowledge(user, dto);
    return {
      message: '지식이 제출되었습니다. 관리자 승인 후 반영됩니다.',
      requestId: result.id,
    };
  }

  @UseGuards(AccessTokenGuard)
  @Post(':knowledgeId/update')
  async requestUpdate(
    @GetCurrentUserId() userId: string,
    @Param('knowledgeId') knowledgeId: string,
    @Body() dto: RequestUpdateKnowledgeDto,
  ) {
    const user = await this.usersService.getUserById(userId);
    const result = await this.knowledgeService.requestUpdateKnowledge(user, knowledgeId, dto);
    return {
      message: '수정 요청이 제출되었습니다. 관리자 승인 후 반영됩니다.',
      requestId: result.id,
    };
  }

  @UseGuards(AccessTokenGuard)
  @Post(':knowledgeId/delete')
  async requestDelete(
    @GetCurrentUserId() userId: string,
    @Param('knowledgeId') knowledgeId: string,
    @Body() dto: RequestDeleteKnowledgeDto,
  ) {
    const user = await this.usersService.getUserById(userId);
    const result = await this.knowledgeService.requestDeleteKnowledge(user, knowledgeId, dto);
    return {
      message: '삭제 요청이 제출되었습니다. 관리자 승인 후 반영됩니다.',
      requestId: result.id,
    };
  }
}
