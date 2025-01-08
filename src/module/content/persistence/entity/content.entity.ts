import { ContentType } from '@contentModule/core/entity/content-type.enum';
import { DefaultEntity } from '@sharedModule/persistence/typeorm/entity/default.entity';
import { Column, Entity, OneToOne } from 'typeorm';
import { TvShow } from './tv-show.entity';
import { Movie } from './movie.entity';

@Entity({ name: 'Content' })
export class Content extends DefaultEntity<Content> {
  @Column({ nullable: false, type: 'enum', enum: ContentType })
  type: ContentType;

  @Column({ type: 'varchar', nullable: false, length: 255 })
  title: string;

  @Column({ type: 'text', nullable: false })
  description: string;

  @Column({ type: 'int', nullable: true })
  ageRecommendation: number | null;

  @OneToOne(() => Movie, (movie) => movie.content, {
    cascade: true,
  })
  movie?: Movie;

  @OneToOne(() => TvShow, (tvShow) => tvShow.content, {
    cascade: true,
  })
  tvShow?: TvShow;
}
