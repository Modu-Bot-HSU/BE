import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { uuidv7 } from 'uuidv7';
import { AiClientService } from 'src/ai-client/ai-client.service';

const SYSTEM_WALLET = 'system';

interface SeedKnowledgeItem {
  category: string;
  original_question: string;
  content: string;
}

function loadSeedData(): SeedKnowledgeItem[] {
  const filePath = join(__dirname, 'knowledge-seed.json');
  return JSON.parse(readFileSync(filePath, 'utf-8')) as SeedKnowledgeItem[];
}

@Injectable()
export class KnowledgeSeederService implements OnModuleInit {
  private readonly logger = new Logger(KnowledgeSeederService.name);

  constructor(private readonly aiClientService: AiClientService) {}

  async onModuleInit() {
    await this.seedKnowledge();
  }

  private async seedKnowledge() {
    try {
      const existing = await this.aiClientService.getKnowledge(undefined, 1);
      if (existing.total_count > 0) {
        this.logger.log(
          `RAG 지식 베이스에 이미 ${existing.total_count}개의 데이터가 있습니다. 시드를 건너뜁니다.`,
        );
        return;
      }
    } catch {
      this.logger.warn(
        'AI 서버 연결 실패 — RAG 지식 시드를 건너뜁니다. 서버가 준비된 후 재시작하세요.',
      );
      return;
    }

    const seedData = loadSeedData();
    let inserted = 0;

    for (const item of seedData) {
      try {
        await this.aiClientService.insertKnowledge({
          knowledge_id: uuidv7(),
          wallet_address: SYSTEM_WALLET,
          category: item.category,
          content: item.content,
          original_question: item.original_question,
          refine: false,
        });
        inserted++;
      } catch (err) {
        this.logger.error(`지식 시드 삽입 실패 [${item.category}]: ${err.message}`);
      }
    }

    this.logger.log(`RAG 지식 시드 완료: ${inserted}/${seedData.length}개 삽입`);
  }
}
