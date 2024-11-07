import { DrizzlePostgresModule } from '@knaadh/nestjs-drizzle-postgres';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@sharedModule/config/config.module';
import { ConfigService } from '@sharedModule/config/service/config.service';

@Module({})
export class DrizzlePersistenceModule {
  static forRoot(schema: Record<string, any> = {}): DynamicModule {
    return {
      module: DrizzlePersistenceModule,
      imports: [
        DrizzlePostgresModule.registerAsync({
          tag: 'DB_POSTGRES',
          imports: [ConfigModule.forRoot()],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            postgres: {
              url: configService.get('database').url,
            },
            config: { schema: { ...schema }, logger: false },
          }),
        }),
      ],
    };
  }
}
