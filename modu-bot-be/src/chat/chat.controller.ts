import { Body, Controller, Post } from '@nestjs/common';
import { AiClientService } from 'src/ai-client/ai-client.service';
import { AskDto } from './dto/ask.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly aiClientService: AiClientService) {}

  @Post('ask')
  async ask(@Body() body: AskDto) {
    const { answer } = await this.aiClientService.ask(body.question);
    return { message: '답변 생성 완료', answer };
  }
}
