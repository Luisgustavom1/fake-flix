import { NestFactory } from '@nestjs/core';
import { ConfigModule } from '@sharedModule/config/config.module';
import { ConfigService } from '@sharedModule/config/service/config.service';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { dataSourceOptionsFactory } from '@contentModule/shared/persistence/typeorm-datasource.factory';
config();

const getDataSource = async () => {
  const configModule = await NestFactory.createApplicationContext(
    ConfigModule.forRoot(),
  );
  const configService = configModule.get<ConfigService>(ConfigService);
  return new DataSource(dataSourceOptionsFactory(configService));
};

export default getDataSource();
