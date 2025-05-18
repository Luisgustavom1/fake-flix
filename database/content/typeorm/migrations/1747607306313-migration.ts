import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1747607306313 implements MigrationInterface {
    name = 'Migration1747607306313'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "VideoMetadata" DROP CONSTRAINT "FK_6a50216632999696db0bf861f2a"`);
        await queryRunner.query(`ALTER TABLE "VideoMetadata" RENAME COLUMN "video_id" TO "videoId"`);
        await queryRunner.query(`ALTER TABLE "VideoMetadata" ADD CONSTRAINT "FK_678d67fbd94f3a4f4c57a0507b0" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "VideoMetadata" DROP CONSTRAINT "FK_678d67fbd94f3a4f4c57a0507b0"`);
        await queryRunner.query(`ALTER TABLE "VideoMetadata" RENAME COLUMN "videoId" TO "video_id"`);
        await queryRunner.query(`ALTER TABLE "VideoMetadata" ADD CONSTRAINT "FK_6a50216632999696db0bf861f2a" FOREIGN KEY ("video_id") REFERENCES "Video"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
