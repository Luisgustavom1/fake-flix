import { DefaultEntity } from '@src/infra/module/typeorm/entity/default.entity';
import { Column, Entity, JoinColumn, ManyToMany, OneToOne } from 'typeorm';
import { TvShow } from './tv-show.entity';
import { Thumbnail } from './thumbnail.entity';
import { Video } from './video.entity';

@Entity({ name: 'Episode' })
export class Episode extends DefaultEntity<Episode> {
  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  season: number;

  @Column()
  episode: number;

  @ManyToMany(() => TvShow, (tvShow) => tvShow.episodes)
  tvShow: TvShow;

  @OneToOne(() => Thumbnail)
  @JoinColumn()
  thumbnail: Thumbnail;

  @OneToOne(() => Video, (video) => video.episode)
  video: Video;
}
