import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1750035109748 implements MigrationInterface {
  name = 'Migration1750035109748';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "VideoMetadata" ALTER COLUMN "transcript" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "VideoMetadata" ALTER COLUMN "transcript" SET NOT NULL`,
    );
  }
}
