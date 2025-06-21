import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DefaultTypeOrmRepository } from '@sharedModule/persistence/typeorm/repository/default-typeorm.repository';
import { InjectDataSource } from '@nestjs/typeorm';
import { Movie } from '@contentModule/shared/persistence/entity/movie.entity';

@Injectable()
export class MovieRepository extends DefaultTypeOrmRepository<Movie> {
  constructor(
    @InjectDataSource('content')
    private readonly dataSource: DataSource,
  ) {
    super(Movie, dataSource.manager);
  }
}
