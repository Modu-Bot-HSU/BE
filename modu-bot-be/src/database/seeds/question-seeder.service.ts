import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, Table } from 'typeorm';
import { Question } from 'src/question/entities/question.entity';

const INITIAL_QUESTIONS = [
  // 학업
  { text: '수강신청은 언제, 어떻게 하나요?', category: 'academic' },
  { text: '전공 변경(전과) 신청 방법과 조건은 무엇인가요?', category: 'academic' },
  { text: '졸업 요건(이수 학점, 필수 과목 등)은 어떻게 되나요?', category: 'academic' },
  { text: '복수전공 또는 부전공 신청은 어떻게 하나요?', category: 'academic' },

  // 장학금
  { text: '교내 장학금의 종류와 신청 방법은 무엇인가요?', category: 'scholarship' },
  { text: '성적 우수 장학금 수혜 기준은 어떻게 되나요?', category: 'scholarship' },
  { text: '근로장학금 신청 방법과 조건은 무엇인가요?', category: 'scholarship' },

  // 시설
  { text: '도서관 이용 시간과 도서 대출 권수는 어떻게 되나요?', category: 'facility' },
  { text: '학생 식당 위치와 운영 시간은 어떻게 되나요?', category: 'facility' },
  { text: '기숙사 신청 방법과 입사 비용은 어떻게 되나요?', category: 'facility' },

  // 캠퍼스 생활
  { text: '동아리 가입 방법과 활동 지원은 어떻게 되나요?', category: 'campus_life' },
  { text: '학생증 발급 및 재발급 방법은 어떻게 되나요?', category: 'campus_life' },
  { text: '학교 셔틀버스 노선과 운행 시간은 어떻게 되나요?', category: 'campus_life' },

  // 취업/진로
  { text: '취업지원센터에서 제공하는 서비스는 무엇인가요?', category: 'career' },
  { text: '현장실습(인턴십) 신청 방법과 조건은 무엇인가요?', category: 'career' },
  { text: '취업 관련 자격증 취득 지원 프로그램이 있나요?', category: 'career' },

  // IT 서비스
  { text: '학교 포털(HY-in) 이용 방법은 무엇인가요?', category: 'it_service' },
  { text: '캠퍼스 내 Wi-Fi 접속 방법은 어떻게 되나요?', category: 'it_service' },
  { text: '학교 이메일 계정 발급 방법은 무엇인가요?', category: 'it_service' },
  { text: '마이크로소프트 오피스 등 소프트웨어 무료 이용 방법은 무엇인가요?', category: 'it_service' },

  // 학생 지원
  { text: '심리상담센터 이용 방법과 예약은 어떻게 하나요?', category: 'support' },
  { text: '저소득층 학생을 위한 지원 서비스는 무엇이 있나요?', category: 'support' },
  { text: '외국인 유학생을 위한 지원 서비스는 무엇이 있나요?', category: 'support' },

  // 기타
  { text: '학교 주요 공지사항 확인 방법은 무엇인가요?', category: 'etc' },
  { text: '졸업 앨범 신청 방법과 일정은 어떻게 되나요?', category: 'etc' },
];

@Injectable()
export class QuestionSeederService implements OnModuleInit {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.ensureTableExists();
    await this.seedQuestions();
  }

  private async ensureTableExists() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      const exists = await queryRunner.hasTable('questions');
      if (exists) return;

      await queryRunner.createTable(
        new Table({
          name: 'questions',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              default: 'uuid_generate_v4()',
            },
            { name: 'text', type: 'text', isNullable: false },
            { name: 'category', type: 'varchar', length: '50', isNullable: false },
            { name: 'isActive', type: 'boolean', default: 'true', isNullable: false },
            { name: 'created_at', type: 'timestamp', default: 'now()', isNullable: false },
          ],
        }),
      );
      console.log('questions 테이블이 생성되었습니다.');
    } finally {
      await queryRunner.release();
    }
  }

  private async seedQuestions() {
    const count = await this.questionRepo.count();
    if (count > 0) return;

    const questions = INITIAL_QUESTIONS.map((q) =>
      this.questionRepo.create({ ...q, isActive: true }),
    );
    await this.questionRepo.save(questions);
    console.log(`초기 질문 ${questions.length}개가 등록되었습니다.`);
  }
}
