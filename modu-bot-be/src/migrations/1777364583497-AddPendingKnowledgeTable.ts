import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPendingKnowledgeTable1777364583497 implements MigrationInterface {
    name = 'AddPendingKnowledgeTable1777364583497'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."pending_knowledge_type_enum" AS ENUM('CREATE', 'UPDATE', 'DELETE')`);
        await queryRunner.query(`CREATE TYPE "public"."pending_knowledge_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED')`);
        await queryRunner.query(`CREATE TABLE "pending_knowledge" ("id" character varying(36) NOT NULL, "type" "public"."pending_knowledge_type_enum" NOT NULL, "status" "public"."pending_knowledge_status_enum" NOT NULL DEFAULT 'PENDING', "knowledgeId" character varying(36), "submittedByWallet" character varying(42) NOT NULL, "category" character varying(50) NOT NULL, "content" text NOT NULL, "originalQuestion" text, "rejectReason" text, "approvedBy" character varying, "approvedAt" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "submitted_by_user_id" uuid NOT NULL, CONSTRAINT "PK_c85336bd1df996a10e4f1dc8e42" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "pending_knowledge" ADD CONSTRAINT "FK_a58665189936847e35deeb55394" FOREIGN KEY ("submitted_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pending_knowledge" DROP CONSTRAINT "FK_a58665189936847e35deeb55394"`);
        await queryRunner.query(`DROP TABLE "pending_knowledge"`);
        await queryRunner.query(`DROP TYPE "public"."pending_knowledge_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."pending_knowledge_type_enum"`);
    }

}
