import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1750034713248 implements MigrationInterface {
  name = 'Migration1750034713248';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "VideoMetadata" DROP CONSTRAINT "FK_678d67fbd94f3a4f4c57a0507b0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "VideoMetadata" ALTER COLUMN "videoId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "VideoMetadata" ADD CONSTRAINT "FK_678d67fbd94f3a4f4c57a0507b0" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "VideoMetadata" DROP CONSTRAINT "FK_678d67fbd94f3a4f4c57a0507b0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "VideoMetadata" ALTER COLUMN "videoId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "VideoMetadata" ADD CONSTRAINT "FK_678d67fbd94f3a4f4c57a0507b0" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
