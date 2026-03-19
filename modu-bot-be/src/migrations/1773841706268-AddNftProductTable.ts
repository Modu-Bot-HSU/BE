import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNftProductTable1773841706268 implements MigrationInterface {
    name = 'AddNftProductTable1773841706268'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "nft_products" ("id" SERIAL NOT NULL, "index" integer NOT NULL, "name" character varying NOT NULL, "description" text, "price" character varying NOT NULL DEFAULT '20', "imageUrl" character varying NOT NULL, "metadataUrl" character varying NOT NULL, "isSold" boolean NOT NULL DEFAULT false, "txHash" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "owner_id" uuid, CONSTRAINT "UQ_0e60ac102b14c77c1ad92e17348" UNIQUE ("index"), CONSTRAINT "PK_10c53aedcf3f68e23eb344dd6c6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "nft_products" ADD CONSTRAINT "FK_abf50b23b4fd4b9ee29b4de9a67" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "nft_products" DROP CONSTRAINT "FK_abf50b23b4fd4b9ee29b4de9a67"`);
        await queryRunner.query(`DROP TABLE "nft_products"`);
    }

}
