import { DefaultEntity } from '@sharedModule/persistence/typeorm/entity/default.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { Thumbnail } from './thumbnail.entity';
import { Video } from './video.entity';
import { Content } from '@contentModule/shared/persistence/entity/content.entity';

@Entity({ name: 'Movie' })
export class Movie extends DefaultEntity<Movie> {
  @OneToOne(() => Video, (video) => video.movie, {
    cascade: true,
  })
  video: Video;

  @OneToOne(() => Content, (content) => content.movie)
  @JoinColumn()
  content: Content;

  @Column({ type: 'float', nullable: true })
  externalRating: number | null;

  @OneToOne(() => Thumbnail, {
    cascade: true,
  })
  thumbnail: Thumbnail;

  @Column({ type: 'uuid', nullable: true })
  contentId: string | null;
}
