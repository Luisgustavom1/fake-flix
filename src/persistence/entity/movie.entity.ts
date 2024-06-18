import { DefaultEntity } from '@src/infra/module/typeorm/entity/default.entity';
import { Entity, JoinColumn, OneToOne } from 'typeorm';
import { Content } from './content.entity';
import { Thumbnail } from './thumbnail.entity';
import { Video } from './video.entity';

@Entity({ name: 'Movie' })
export class Movie extends DefaultEntity<Movie> {
  @OneToOne(() => Video, (video) => video.movie, {
    cascade: true,
  })
  video: Video;

  @OneToOne(() => Content, (content) => content.movie)
  @JoinColumn()
  content: Content
  @OneToOne(() => Thumbnail, {
    cascade: true,
  })
  thumbnail: Thumbnail;
}
