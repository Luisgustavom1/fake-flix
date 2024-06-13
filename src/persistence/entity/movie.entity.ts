import { DefaultEntity } from '@src/infra/module/typeorm/entity/default.entity';
import { Entity, OneToOne } from 'typeorm';
import { Content } from './content.entity';
import { Thumbnail } from './thumbnail.entity';
import { Video } from './video.entity';

@Entity({ name: 'Movie' })
export class Movie extends DefaultEntity<Movie> {
  @OneToOne(() => Video, (video) => video.movie, {
    cascade: true,
  })
  video: Video;

  @OneToOne(() => Content, (content) => content.movie, {
    cascade: true,
  })
  content: Content;

  @OneToOne(() => Thumbnail, {
    cascade: true,
  })
  thumbnail: Thumbnail;
}
