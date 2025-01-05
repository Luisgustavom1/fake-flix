import {
  DataSource,
  EntityTarget,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { DefaultEntity } from '../entity/default.entity';

export abstract class DefaultTypeOrmRepository<T extends DefaultEntity<T>> {
  private repository: Repository<T>;

  constructor(
    readonly entity: EntityTarget<T>,
    readonly dataSource: DataSource,
  ) {
    /*
     * We don't extend the Repository class from TypeOrm because we want to have control over the repository instance.
     * This way we can control the access to the repo methods and avoid exposing them to the outside world (typeorm methods).
     * */
    this.repository = dataSource.getRepository(entity);
  }

  async save(entity: T): Promise<T> {
    return await this.repository.save(entity);
  }

  async findOneById(id: string): Promise<T | null> {
    return await this.repository.findOne({
      where: { id } as FindOptionsWhere<T>,
    });
  }
}
