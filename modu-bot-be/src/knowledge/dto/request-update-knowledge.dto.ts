import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { KnowledgeCategory } from './submit-knowledge.dto';

export class RequestUpdateKnowledgeDto {
  @IsEnum(KnowledgeCategory)
  category: KnowledgeCategory;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  originalQuestion?: string;
}
