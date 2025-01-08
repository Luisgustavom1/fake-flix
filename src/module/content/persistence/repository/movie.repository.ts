import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { DefaultTypeOrmRepository } from '@sharedModule/persistence/typeorm/repository/default-typeorm.repository';
import { Movie } from '@contentModule/persistence/entity/movie.entity';

@Injectable()
export class MovieRepository extends DefaultTypeOrmRepository<Movie> {
  constructor(readonly entityManager: EntityManager) {
    super(Movie, entityManager);
  }
}
