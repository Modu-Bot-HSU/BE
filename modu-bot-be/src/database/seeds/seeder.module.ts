import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from 'src/users/entities/users.entity';
import { Question } from 'src/question/entities/question.entity';
import { AdminSeederService } from './admin-seeder.service';
import { QuestionSeederService } from './question-seeder.service';

@Module({
  imports: [TypeOrmModule.forFeature([Users, Question]), ConfigModule],
  providers: [AdminSeederService, QuestionSeederService],
})
export class SeederModule {}
