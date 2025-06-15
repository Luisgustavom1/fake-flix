import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1749948493704 implements MigrationInterface {
  name = 'Migration1749948493704';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "VideoMetadata" ADD "version" integer NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "VideoMetadata" DROP COLUMN "version"`,
    );
  }
}
