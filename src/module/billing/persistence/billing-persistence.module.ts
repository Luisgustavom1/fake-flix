import { Module } from '@nestjs/common';
import { PlanRepository } from '@billingModule/persistence/repository/plan.repository';
import { SubscriptionRepository } from '@billingModule/persistence/repository/subscription.repository';
import { TypeOrmPersistenceModule } from '@sharedModule/persistence/typeorm/typeorm-persistence.module';
import { ConfigService } from '@sharedModule/config/service/config.service';
import { dataSourceOptionsFactory } from './typeorm-datasource.factory';
import { ConfigModule } from '@sharedModule/config/config.module';

@Module({
  imports: [
    TypeOrmPersistenceModule.forRoot({
      imports: [ConfigModule.forRoot()],
      name: 'billing',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return dataSourceOptionsFactory(configService);
      },
    }),
  ],
  providers: [PlanRepository, SubscriptionRepository],
  exports: [PlanRepository, SubscriptionRepository],
})
export class BillingPersistenceModule {}
