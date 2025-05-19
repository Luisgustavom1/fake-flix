import { Module } from '@nestjs/common';
import { TypeOrmPersistenceModule } from '@sharedModule/persistence/typeorm/typeorm-persistence.module';
import { dataSourceOptionsFactory } from './typeorm-datasource.factory';
import { UserRepository } from './repository/user.repository';
import { ConfigService } from '@sharedModule/config/service/config.service';
import { ConfigModule } from '@sharedModule/config/config.module';

@Module({
  imports: [
    TypeOrmPersistenceModule.forRoot({
      name: 'identity',
      imports: [ConfigModule.forRoot()],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return dataSourceOptionsFactory(configService);
      },
    }),
  ],
  providers: [UserRepository],
  exports: [UserRepository],
})
export class IdentityPersistenceModule {}
