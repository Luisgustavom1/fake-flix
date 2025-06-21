import { Module } from '@nestjs/common';
import { TypeOrmPersistenceModule } from '@sharedModule/persistence/typeorm/typeorm-persistence.module';
import { ConfigService } from '@sharedModule/config/service/config.service';
import { dataSourceOptionsFactory } from './typeorm-datasource.factory';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';
import { ConfigModule } from '@sharedModule/config/config.module';
import { VideoRepository } from './repository/video.repository';

@Module({
  imports: [
    TypeOrmPersistenceModule.forRoot({
      imports: [ConfigModule.forRoot()],
      name: 'content',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return dataSourceOptionsFactory(configService);
      },
      dataSourceFactory: async (options) => {
        if (!options) {
          throw new Error('Invalid options passed');
        }
        return addTransactionalDataSource({
          name: options.name,
          dataSource: new DataSource(options),
        });
      },
    }),
  ],
  providers: [VideoRepository],
  exports: [VideoRepository],
})
export class ContentSharedPersistenceModule {}
