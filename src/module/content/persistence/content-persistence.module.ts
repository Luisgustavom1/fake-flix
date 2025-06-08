import { Module } from '@nestjs/common';
import { TypeOrmPersistenceModule } from '@sharedModule/persistence/typeorm/typeorm-persistence.module';
import { ContentRepository } from './repository/content.repository';
import { MovieRepository } from './repository/movie.repository';
import { VideoRepository } from './repository/video.repository';
import { EpisodeRepository } from './repository/episode.repository';
import { ConfigService } from '@sharedModule/config/service/config.service';
import { dataSourceOptionsFactory } from './typeorm-datasource.factory';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';
import { ConfigModule } from '@sharedModule/config/config.module';

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
  providers: [
    ContentRepository,
    MovieRepository,
    VideoRepository,
    EpisodeRepository,
  ],
  exports: [
    ContentRepository,
    MovieRepository,
    VideoRepository,
    EpisodeRepository,
  ],
})
export class PersistenceModule {}
