import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Content } from '@contentModule/persistence/entity/content.entity';
import { DefaultTypeOrmRepository } from '@sharedModule/persistence/typeorm/repository/default-typeorm.repository';

@Injectable()
export class ContentRepository extends DefaultTypeOrmRepository<Content> {
  constructor(@Inject(DataSource) readonly dataSource: DataSource) {
    super(Content, dataSource);
  }
}
