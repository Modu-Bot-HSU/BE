import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from 'src/users/entities/users.entity';
import { Question } from 'src/question/entities/question.entity';
import { AdminSeederService } from './admin-seeder.service';
import { QuestionSeederService } from './question-seeder.service';
import { KnowledgeSeederService } from './knowledge-seeder.service';
import { AiClientModule } from 'src/ai-client/ai-client.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users, Question]),
    ConfigModule,
    AiClientModule,
  ],
  providers: [
    AdminSeederService,
    QuestionSeederService,
    KnowledgeSeederService,
  ],
})
export class SeederModule {}
