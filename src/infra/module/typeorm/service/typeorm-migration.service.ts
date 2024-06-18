import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

export class TypeOrmMigrationService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource
  ) {}

  async migrate() {
    const pendingMigrations = await this.dataSource.showMigrations();
    if (pendingMigrations) {
      const appliedMigrations = await this.dataSource.runMigrations();
      console.log('Applied migrations:', appliedMigrations);
    }
  }

  async getDataSource() {
    return this.dataSource;
  }

  async revert() {
    const pendingMigrations = await this.dataSource.showMigrations();
    if (pendingMigrations) {
      const revertedMigrations = await this.dataSource.undoLastMigration();
      console.log('Reverted migrations:', revertedMigrations);
    }
  }
}