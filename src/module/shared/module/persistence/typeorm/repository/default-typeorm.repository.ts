import {
  EntityManager,
  EntityTarget,
  FindOneOptions,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { DefaultEntity } from '../entity/default.entity';

export abstract class DefaultTypeOrmRepository<T extends DefaultEntity<T>> {
  private repository: Repository<T>;

  constructor(
    readonly entity: EntityTarget<T>,
    readonly entityManager: EntityManager,
  ) {
    /*
     * We don't extend the Repository class from TypeOrm because we want to have control over the repository instance.
     * This way we can control the access to the repo methods and avoid exposing them to the outside world (typeorm methods).
     * */
    this.repository = entityManager.getRepository(entity);
  }

  async save(entity: T): Promise<T> {
    return await this.repository.save(entity);
  }

  async findOneById(id: string, relations?: string[]): Promise<T | null> {
    return this.repository.findOne({
      where: { id } as FindOptionsWhere<T>,
      relations,
    });
  }

  async find(options: FindOneOptions<T>): Promise<T | null> {
    return this.repository.findOne(options);
  }

  async exists(id: string): Promise<boolean> {
    return this.repository.exists({
      where: { id } as FindOptionsWhere<T>,
    });
  }

  async existsBy(properties: FindOptionsWhere<T>): Promise<boolean> {
    return this.repository.exists({
      where: properties,
    });
  }
}
