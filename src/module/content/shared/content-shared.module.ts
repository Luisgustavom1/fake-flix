import { QUEUES } from '@contentModule/shared/queue/queue.constant';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@sharedModule/config/config.module';
import { ConfigService } from '@sharedModule/config/service/config.service';
import { ContentSharedPersistenceModule } from './persistence/content-shared-persistence.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule.forRoot()],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      {
        name: QUEUES.VIDEO_AGE_RECOMMENDATION,
      },
      {
        name: QUEUES.VIDEO_SUMMARY,
      },
      {
        name: QUEUES.VIDEO_TRANSCRIPT,
      },
      {
        name: QUEUES.CONTENT_AGE_RECOMMENDATION,
      },
    ),
    ContentSharedPersistenceModule,
  ],
  exports: [ContentSharedPersistenceModule, BullModule],
})
export class ContentSharedModule {}
