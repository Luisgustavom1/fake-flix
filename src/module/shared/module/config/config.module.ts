import { DynamicModule } from '@nestjs/common';
import {
  ConfigModuleOptions,
  // eslint-disable-next-line no-restricted-imports
  ConfigModule as NestConfigModule,
} from '@nestjs/config';
import { ConfigService } from './service/config.service';
import { factory } from './util/config.factory';

export class ConfigModule {
  static forRoot(options?: ConfigModuleOptions): DynamicModule {
    return {
      module: ConfigModule,
      imports: [
        NestConfigModule.forRoot({
          ...options,
          expandVariables: true,
          load: options?.load ? [factory, ...options.load] : [factory],
        }),
      ],
      providers: [ConfigService],
      exports: [ConfigService],
    };
  }
}
