import { DefaultEntity } from '@sharedModule/persistence/typeorm/entity/default.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { TvShow } from './tv-show.entity';
import { Thumbnail } from './thumbnail.entity';
import { Video } from './video.entity';

@Entity({ name: 'Episode' })
export class Episode extends DefaultEntity<Episode> {
  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column('text')
  description: string;

  @Column({ type: 'int', nullable: false })
  season: number;

  @Column({ type: 'int', nullable: false })
  number: number;

  @Column({ type: 'uuid', nullable: false })
  tvShowId: string;

  @OneToOne(() => Thumbnail)
  @JoinColumn()
  thumbnail: Thumbnail | null;

  @ManyToOne(() => TvShow, (tvShow) => tvShow.episodes)
  tvShow: TvShow;

  @OneToOne(() => Video, (video) => video.episode, {
    cascade: true,
  })
  video: Video;
}
