import { DefaultEntity } from '@sharedModule/persistence/typeorm/entity/default.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { Movie } from './movie.entity';
import { Episode } from './episode.entity';
import { VideoMetadata } from './video-metadata.entity';

@Entity({ name: 'Video' })
export class Video extends DefaultEntity<Video> {
  @Column({ type: 'varchar', nullable: false })
  url: string;

  @Column('int')
  sizeInKb: number;

  @Column('int')
  duration: number;

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
}
