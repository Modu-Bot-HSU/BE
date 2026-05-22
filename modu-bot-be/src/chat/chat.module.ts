import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { AiClientModule } from 'src/ai-client/ai-client.module';

@Module({
  imports: [AiClientModule],
  controllers: [ChatController],
})
export class ChatModule {}
