import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuestionIdToPendingKnowledge1777800001000
  implements MigrationInterface
{
  name = 'AddQuestionIdToPendingKnowledge1777800001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pending_knowledge" ADD "questionId" character varying(36)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pending_knowledge" DROP COLUMN "questionId"`,
    );
  }
}
