import { IsOptional, IsString } from 'class-validator';

export class RequestDeleteKnowledgeDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
