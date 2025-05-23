import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1731272057707 implements MigrationInterface {
  name = 'Migration1731272057707';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "Thumbnail" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP DEFAULT now(), "url" character varying NOT NULL, CONSTRAINT "PK_29cfea45a44edc72c599d42037f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "Movie" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP DEFAULT now(), "externalRating" double precision, "contentId" uuid, CONSTRAINT "REL_c155b5944bdd1e260a4ae79bc8" UNIQUE ("contentId"), CONSTRAINT "PK_56d58b76292b87125c5ec8bdde0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "Video" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP DEFAULT now(), "url" character varying NOT NULL, "sizeInKb" integer NOT NULL, "duration" integer NOT NULL, "movieId" uuid, "episodeId" uuid, CONSTRAINT "REL_46efd1060cb7a7c545b06120d1" UNIQUE ("movieId"), CONSTRAINT "REL_ce049b6bf5d3e5aee0f3dbd8dc" UNIQUE ("episodeId"), CONSTRAINT "PK_2a23c3da7a2fc570b1696191b87" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "Episode" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP DEFAULT now(), "title" character varying NOT NULL, "description" character varying NOT NULL, "season" integer NOT NULL, "number" integer NOT NULL, "thumbnailId" uuid, CONSTRAINT "REL_7153938ad76137550256fd3b40" UNIQUE ("thumbnailId"), CONSTRAINT "PK_c61e604db606b512a70c676a5f1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "TvShow" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP DEFAULT now(), "contentId" uuid, "thumbnailId" uuid, CONSTRAINT "REL_b6ac53aff4b7200e4b01ca43a9" UNIQUE ("contentId"), CONSTRAINT "REL_e4e17f7e4fbf10e4bcd61aa8e5" UNIQUE ("thumbnailId"), CONSTRAINT "PK_0ecc486b5a7a0f90f5857634ed9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."Content_type_enum" AS ENUM('MOVIE', 'TV_SHOW')`,
    );
    await queryRunner.query(
      `CREATE TABLE "Content" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP DEFAULT now(), "type" "public"."Content_type_enum" NOT NULL, "title" character varying NOT NULL, "description" character varying NOT NULL, CONSTRAINT "PK_7cb78a77f6c66cb6ea6f4316a5c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "Movie" ADD CONSTRAINT "FK_c155b5944bdd1e260a4ae79bc82" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Video" ADD CONSTRAINT "FK_46efd1060cb7a7c545b06120d14" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Video" ADD CONSTRAINT "FK_ce049b6bf5d3e5aee0f3dbd8dc0" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Episode" ADD CONSTRAINT "FK_7153938ad76137550256fd3b40a" FOREIGN KEY ("thumbnailId") REFERENCES "Thumbnail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "TvShow" ADD CONSTRAINT "FK_b6ac53aff4b7200e4b01ca43a9c" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "TvShow" ADD CONSTRAINT "FK_e4e17f7e4fbf10e4bcd61aa8e59" FOREIGN KEY ("thumbnailId") REFERENCES "Thumbnail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "TvShow" DROP CONSTRAINT "FK_e4e17f7e4fbf10e4bcd61aa8e59"`,
    );
    await queryRunner.query(
      `ALTER TABLE "TvShow" DROP CONSTRAINT "FK_b6ac53aff4b7200e4b01ca43a9c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Episode" DROP CONSTRAINT "FK_7153938ad76137550256fd3b40a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Video" DROP CONSTRAINT "FK_ce049b6bf5d3e5aee0f3dbd8dc0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Video" DROP CONSTRAINT "FK_46efd1060cb7a7c545b06120d14"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Movie" DROP CONSTRAINT "FK_c155b5944bdd1e260a4ae79bc82"`,
    );
    await queryRunner.query(`DROP TABLE "Content"`);
    await queryRunner.query(`DROP TYPE "public"."Content_type_enum"`);
    await queryRunner.query(`DROP TABLE "TvShow"`);
    await queryRunner.query(`DROP TABLE "Episode"`);
    await queryRunner.query(`DROP TABLE "Video"`);
    await queryRunner.query(`DROP TABLE "Movie"`);
    await queryRunner.query(`DROP TABLE "Thumbnail"`);
  }
}
