import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum KnowledgeCategory {
  ACADEMIC = 'academic',
  SCHOLARSHIP = 'scholarship',
  FACILITY = 'facility',
  CAMPUS_LIFE = 'campus_life',
  CAREER = 'career',
  IT_SERVICE = 'it_service',
  SUPPORT = 'support',
  ETC = 'etc',
}

export class SubmitKnowledgeDto {
  @IsEnum(KnowledgeCategory)
  category: KnowledgeCategory;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  originalQuestion?: string;
}
