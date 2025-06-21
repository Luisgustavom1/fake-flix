import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DefaultTypeOrmRepository } from '@sharedModule/persistence/typeorm/repository/default-typeorm.repository';
import { InjectDataSource } from '@nestjs/typeorm';
import { Video } from '@contentModule/shared/persistence/entity/video.entity';

@Injectable()
export class VideoRepository extends DefaultTypeOrmRepository<Video> {
  constructor(
    @InjectDataSource('content')
    private readonly dataSource: DataSource,
  ) {
    super(Video, dataSource.manager);
  }
}
