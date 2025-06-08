import { Movie } from '@contentModule/persistence/entity/movie.entity';
import { WithOptional } from '@sharedLibs/core/model/default.model';
import { randomUUID } from 'crypto';
import { ContentType } from '../enum/content-type.enum';

export class MovieContentModel {
  id: string;
  title: string;
  description: string;
  type: ContentType.MOVIE;
  movie: Movie;
  ageRecommendation: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  constructor(
    data: Omit<
      WithOptional<
        MovieContentModel,
        'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
      >,
      'type'
    >,
  ) {
    Object.assign(this, {
      ...data,
      id: data.id ? data.id : randomUUID(),
      //encapsulates the creation
      type: ContentType.MOVIE,
      createdAt: data.createdAt || Date.now(),
      updatedAt: data.updatedAt || Date.now(),
      deletedAt: data.deletedAt,
      movie: data.movie,
    });
  }
}
