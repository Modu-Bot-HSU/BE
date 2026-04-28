import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface AiKnowledgeItem {
  id: string;
  category: string;
  title: string;
  content: string;
  source: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  approved_by: string;
}

export interface AiKnowledgeListResponse {
  total_count: number;
  knowledges: AiKnowledgeItem[];
  next_offset: string | null;
}

@Injectable()
export class AiClientService {
  private readonly logger = new Logger(AiClientService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const host = this.configService.get<string>('FAST_API_HOST', 'localhost');
    const port = this.configService.get<string>('FAST_API_PORT', '8000');
    this.baseUrl = `http://${host}:${port}`;
  }

  async getKnowledge(
    category: string,
    limit?: number,
    offset?: string,
  ): Promise<AiKnowledgeListResponse> {
    try {
      const params: Record<string, string | number> = { category };
      if (limit) params.limit = limit;
      if (offset) params.offset = offset;

      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/v1/knowledge`, { params }),
      );
      return response.data.data;
    } catch (error) {
      this.logger.error('AI 서버 지식 조회 실패:', error.message);
      throw new InternalServerErrorException('AI 서버와의 통신에 실패했습니다.');
    }
  }

  async insertKnowledge(payload: {
    knowledge_id: string;
    wallet_address: string;
    category: string;
    content: string;
    original_question?: string;
  }): Promise<{ id: string }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/api/v1/knowledge`, payload),
      );
      return response.data.data;
    } catch (error) {
      this.logger.error('AI 서버 지식 등록 실패:', error.message);
      throw new InternalServerErrorException('AI 서버 지식 등록에 실패했습니다.');
    }
  }

  async updateKnowledge(
    knowledgeId: string,
    payload: {
      wallet_address: string;
      category: string;
      content: string;
      original_question?: string;
    },
  ): Promise<{ id: string }> {
    try {
      const response = await firstValueFrom(
        this.httpService.put(
          `${this.baseUrl}/api/v1/update_knowledge/${knowledgeId}`,
          payload,
        ),
      );
      return response.data.data;
    } catch (error) {
      this.logger.error('AI 서버 지식 수정 실패:', error.message);
      throw new InternalServerErrorException('AI 서버 지식 수정에 실패했습니다.');
    }
  }

  async deleteKnowledge(knowledgeId: string): Promise<{ id: string }> {
    try {
      const response = await firstValueFrom(
        this.httpService.delete(
          `${this.baseUrl}/api/v1/knowledge/${knowledgeId}`,
        ),
      );
      return response.data.data;
    } catch (error) {
      this.logger.error('AI 서버 지식 삭제 실패:', error.message);
      throw new InternalServerErrorException('AI 서버 지식 삭제에 실패했습니다.');
    }
  }
}
