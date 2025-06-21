import { DefaultEntity } from '@sharedModule/persistence/typeorm/entity/default.entity';
import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { Thumbnail } from './thumbnail.entity';
import { Episode } from '@contentModule/shared/persistence/entity/episode.entity';
import { Content } from '@contentModule/shared/persistence/entity/content.entity';

@Entity({ name: 'TvShow' })
export class TvShow extends DefaultEntity<TvShow> {
  @OneToMany(() => Episode, (episode) => episode.tvShow)
  episodes: Episode[];

  @OneToOne(() => Content, (content) => content.tvShow)
  @JoinColumn()
  content: Content;

  @Column({ type: 'uuid', nullable: false })
  contentId: string;

  @OneToOne(() => Thumbnail, {
    cascade: true,
  })
  @JoinColumn()
  thumbnail: Thumbnail;
}
