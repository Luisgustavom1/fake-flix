import { getDataSource } from "./typeorm-migration-helper";

const prepareDataSourceForMigration = async () => {
  const dataSource = await getDataSource();

  await dataSource.destroy();
  return dataSource;
}

export default prepareDataSourceForMigration();