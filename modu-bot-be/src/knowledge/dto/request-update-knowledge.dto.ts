import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { KnowledgeCategory } from './submit-knowledge.dto';

export class RequestUpdateKnowledgeDto {
  @IsEnum(KnowledgeCategory)
  category!: KnowledgeCategory;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsUUID()
  questionId!: string;
}
