import { NestFactory } from '@nestjs/core';
import { PersistenceModule } from '../../src/module/content/persistence/persistence.module';
import { TypeOrmMigrationService } from '../../src/module/content/infra/module/typeorm/service/typeorm-migration.service';
import { ConfigService } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';
import { createPostgresDatabase } from 'typeorm-extension';

const createDataBaseModule = async () => {
  return await NestFactory.createApplicationContext(
    PersistenceModule.forRoot({
      migrations: [__dirname + '/migrations/*'],
    }),
  );
};

export const migrate = async () => {
  const migrationModule = await createDataBaseModule();
  migrationModule.init();
  const configService = migrationModule.get<ConfigService>(ConfigService);
  const options = {
    type: 'postgres',
    ...configService.get('database'),
  } as DataSourceOptions;
  await createPostgresDatabase({
    ifNotExist: true,
    options,
  });
  await migrationModule.get(TypeOrmMigrationService).migrate();
};

export const getDataSource = async () => {
  const migrationModule = await createDataBaseModule();
  return migrationModule.get(TypeOrmMigrationService).getDataSource();
};
