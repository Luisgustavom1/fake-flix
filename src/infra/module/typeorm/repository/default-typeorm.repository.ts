import { DataSource, EntityTarget, ObjectLiteral, Repository } from 'typeorm';

export abstract class DefaultTypeOrmRepository<T extends ObjectLiteral> {
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

  /*
   * Used only in tests to clear the database
   */
  async clear(): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('This method should only be used in tests');
    }
    const entities = await this.repository.find();
    await this.repository.remove(entities);
  }
}
