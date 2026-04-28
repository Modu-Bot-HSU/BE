import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiClientService } from './ai-client.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 3,
    }),
  ],
  providers: [AiClientService],
  exports: [AiClientService],
})
export class AiClientModule {}
