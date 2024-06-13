import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DefaultTypeOrmRepository } from '@src/infra/module/typeorm/repository/default-typeorm.repository';
import { Movie } from '@src/persistence/entity/movie.entity';

@Injectable()
export class MovieRepository extends DefaultTypeOrmRepository<Movie> {
  constructor(@Inject(DataSource) readonly dataSource: DataSource) {
    super(Movie, dataSource);
  }
}
