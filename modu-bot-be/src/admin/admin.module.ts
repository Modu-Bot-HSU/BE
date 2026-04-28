import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PendingKnowledge } from 'src/knowledge/entities/pending-knowledge.entity';
import { AiClientModule } from 'src/ai-client/ai-client.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PendingKnowledge]),
    AiClientModule,
    UsersModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
