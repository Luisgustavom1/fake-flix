import { DynamicModule } from '@nestjs/common';
import { TypeOrmPersistenceModule } from '@sharedModule/persistence/typeorm/typeorm-persistence';
import { Content } from './entity/content.entity';
import { Movie } from './entity/movie.entity';
import { Thumbnail } from './entity/thumbnail.entity';
import { Video } from './entity/video.entity';
import { TvShow } from './entity/tv-show.entity';
import { Episode } from './entity/episode.entity';
import { ContentRepository } from './repository/content.repository';
import { MovieRepository } from './repository/movie.repository';
import { VideoRepository } from './repository/video.repository';
import { EpisodeRepository } from './repository/episode.repository';
import { DataSource } from 'typeorm';

export class PersistenceModule {
  static forRoot(opts?: { migrations?: string[] }): DynamicModule {
    const { migrations } = opts || {};
    return {
      module: PersistenceModule,
      imports: [
        TypeOrmPersistenceModule.forRoot({
          migrations,
          entities: [Content, Movie, Thumbnail, Video, TvShow, Episode],
        }),
      ],
      providers: [
        {
          provide: ContentRepository,
          useFactory: (ds: DataSource) => {
            return new ContentRepository(ds.manager);
          },
          inject: [DataSource],
        },
        {
          provide: MovieRepository,
          useFactory: (ds: DataSource) => {
            return new MovieRepository(ds.manager);
          },
          inject: [DataSource],
        },
        {
          provide: VideoRepository,
          useFactory: (ds: DataSource) => {
            return new VideoRepository(ds.manager);
          },
          inject: [DataSource],
        },
        {
          provide: EpisodeRepository,
          useFactory: (ds: DataSource) => {
            return new EpisodeRepository(ds.manager);
          },
          inject: [DataSource],
        },
      ],
      exports: [
        ContentRepository,
        MovieRepository,
        VideoRepository,
        EpisodeRepository,
      ],
    };
  }
}
