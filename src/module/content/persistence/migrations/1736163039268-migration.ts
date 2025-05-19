import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1736163039268 implements MigrationInterface {
  name = 'Migration1736163039268';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Episode" ADD "tvShowId" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Content" ADD "ageRecommendation" integer`,
    );
    await queryRunner.query(`ALTER TABLE "Episode" DROP COLUMN "title"`);
    await queryRunner.query(
      `ALTER TABLE "Episode" ADD "title" character varying(255) NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "Episode" DROP COLUMN "description"`);
    await queryRunner.query(
      `ALTER TABLE "Episode" ADD "description" text NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "Content" DROP COLUMN "title"`);
    await queryRunner.query(
      `ALTER TABLE "Content" ADD "title" character varying(255) NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "Content" DROP COLUMN "description"`);
    await queryRunner.query(
      `ALTER TABLE "Content" ADD "description" text NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Content" DROP COLUMN "description"`);
    await queryRunner.query(
      `ALTER TABLE "Content" ADD "description" character varying NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "Content" DROP COLUMN "title"`);
    await queryRunner.query(
      `ALTER TABLE "Content" ADD "title" character varying NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "Episode" DROP COLUMN "description"`);
    await queryRunner.query(
      `ALTER TABLE "Episode" ADD "description" character varying NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "Episode" DROP COLUMN "title"`);
    await queryRunner.query(
      `ALTER TABLE "Episode" ADD "title" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Content" DROP COLUMN "ageRecommendation"`,
    );
    await queryRunner.query(`ALTER TABLE "Episode" DROP COLUMN "tvShowId"`);
  }
}
