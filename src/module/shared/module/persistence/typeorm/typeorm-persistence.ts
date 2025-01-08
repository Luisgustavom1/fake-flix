import { DynamicModule } from '@nestjs/common';
import { DefaultEntity } from './entity/default.entity';
import { ConfigModule } from '../../config/config.module';
import { ConfigService } from '../../config/service/config.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmMigrationService } from './service/typeorm-migration.service';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';

interface ForRootOptions {
  migrations?: string[];
  entities?: Array<typeof DefaultEntity>;
}

export class TypeOrmPersistenceModule {
  static forRoot(options: ForRootOptions): DynamicModule {
    return {
      module: TypeOrmPersistenceModule,
      imports: [
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule.forRoot()],
          inject: [ConfigService],
          useFactory: async (configService: ConfigService) => {
            return {
              type: 'postgres',
              logging: true,
              autoLoadEntities: false,
              synchronize: false,
              migrationsTableName: 'typeorm_migrations',
              // types are infered by the compiler and zod
              ...configService.get('database'),
              ...options,
            };
          },
          async dataSourceFactory(options) {
            if (!options) {
              throw new Error('Invalid options passed');
            }

            return addTransactionalDataSource(new DataSource(options));
          },
        }),
      ],
      providers: [TypeOrmMigrationService],
      exports: [TypeOrmMigrationService],
    };
  }
}
