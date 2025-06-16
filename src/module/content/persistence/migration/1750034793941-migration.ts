import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1750034793941 implements MigrationInterface {
  name = 'Migration1750034793941';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "VideoMetadata" ALTER COLUMN "duration" SET DEFAULT '1'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "VideoMetadata" ALTER COLUMN "duration" DROP DEFAULT`,
    );
  }
}
