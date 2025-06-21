import { DefaultEntity } from '@sharedModule/persistence/typeorm/entity/default.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { Movie } from './movie.entity';
import { VideoMetadata } from './video-metadata.entity';
import { Episode } from '@contentModule/shared/persistence/entity/episode.entity';

@Entity({ name: 'Video' })
export class Video extends DefaultEntity<Video> {
  @Column({ type: 'varchar', nullable: false })
  url: string;

  @Column('int')
  sizeInKb: number;

  @OneToOne(() => Movie, (movie) => movie.video)
  @JoinColumn()
  movie: Movie;

  @OneToOne(() => Episode, (episode) => episode.video)
  @JoinColumn()
  episode: Episode;

  @OneToOne(() => VideoMetadata, (metadata) => metadata.video, {
    cascade: true,
  })
  metadata: VideoMetadata;

  @Column({ type: 'uuid', nullable: true })
  movieId: string;
}
