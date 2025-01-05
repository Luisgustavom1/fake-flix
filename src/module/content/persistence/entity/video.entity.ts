import { DefaultEntity } from '@contentModule/infra/module/typeorm/entity/default.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { Movie } from './movie.entity';
import { Episode } from './episode.entity';

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
}
