import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DefaultTypeOrmRepository } from '@sharedModule/persistence/typeorm/repository/default-typeorm.repository';
import { Movie } from '@contentModule/persistence/entity/movie.entity';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class MovieRepository extends DefaultTypeOrmRepository<Movie> {
  constructor(
    @InjectDataSource('content')
    private readonly dataSource: DataSource,
  ) {
    super(Movie, dataSource.manager);
  }
}
