import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1747610752566 implements MigrationInterface {
    name = 'Migration1747610752566'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Video" DROP COLUMN "duration"`);
        await queryRunner.query(`ALTER TABLE "VideoMetadata" ADD "duration" integer NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "VideoMetadata" DROP COLUMN "duration"`);
        await queryRunner.query(`ALTER TABLE "Video" ADD "duration" integer NOT NULL`);
    }

}
