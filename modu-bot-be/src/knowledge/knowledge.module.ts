import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';
import { PendingKnowledge } from './entities/pending-knowledge.entity';
import { AiClientModule } from 'src/ai-client/ai-client.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PendingKnowledge]),
    AiClientModule,
    UsersModule,
  ],
  controllers: [KnowledgeController],
  providers: [KnowledgeService],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
