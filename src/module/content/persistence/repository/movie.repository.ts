import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DefaultTypeOrmRepository } from '@sharedModule/persistence/typeorm/repository/default-typeorm.repository';
import { Movie } from '@contentModule/persistence/entity/movie.entity';

@Injectable()
export class MovieRepository extends DefaultTypeOrmRepository<Movie> {
  constructor(@Inject(DataSource) readonly dataSource: DataSource) {
    super(Movie, dataSource);
  }
}
