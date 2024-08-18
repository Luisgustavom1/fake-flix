import { DynamicModule } from "@nestjs/common";
import { DefaultEntity } from "./entity/default.entity";
import { ConfigModule } from "../config/config.module";
import { ConfigService } from "../config/service/config.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TypeOrmMigrationService } from "./service/typeorm-migration.service";

interface ForRootOptions {
  migrations?: string[];
  entities?: Array<typeof DefaultEntity>
}

export class TypeOrmPersistenceModule {
  static forRoot(options: ForRootOptions): DynamicModule {
    return {
      module: TypeOrmPersistenceModule,
      imports: [
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule.forRoot()],
          inject: [ConfigService],
          useFactory: async (...args: any[]) => {
            const configService: ConfigService = args.find(arg => arg instanceof ConfigService);

            return {
              type: 'postgres',
              logging: false,
              autoLoadEntities: false,
              synchronize: false,
              migrationsTableName: 'typeorm_migrations',
              // types are infered by the compiler and zod
              ...configService.get('database'),
              ...options,
            }
          }
        })
      ],
      providers: [TypeOrmMigrationService],
      exports: [TypeOrmMigrationService]
    }
  }
}