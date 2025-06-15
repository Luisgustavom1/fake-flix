import { Module } from '@nestjs/common';
import { ContentRepository } from '@contentModule/persistence/repository/content.repository';
import { VideoRepository } from '@contentModule/persistence/repository/video.repository';
import { PersistenceModule } from '@contentModule/persistence/content-persistence.module';
import { ConfigModule } from '@sharedModule/config/config.module';
import { AdminMovieController } from '@contentModule/http/rest/controller/admin-movie.controller';
import { MediaPlayerController } from '@contentModule/http/rest/controller/media-player.controller';
import { ExternalMovieClient } from '@contentModule/http/client/external-movie-rating/external-movie-rating.client';
import { AdminTvShowController } from './http/rest/controller/admin-tv-show.controller';
import { AgeRecommendationService } from './core/service/age-recommendation.service';
import { VideoProfanityFilterService } from './core/service/video-profanity-filter.service';
import { CreateMovieUseCase } from './core/use-case/create-movie.use-case';
import { CreateTvShowEpisodeUseCase } from './core/use-case/create-tv-show-episode.use-case';
import { CreateTvShowUseCase } from './core/use-case/create-tv-show.use-case';
import { GetStreamingURLUseCase } from './core/use-case/get-streaming-url.use-case';
import { VideoProcessorService } from './core/service/video-processor.service';
import { EpisodeLifecycleService } from './core/service/episode-lifecycle.service';
import { VideoSummaryGeneratorAdapter } from './core/adapter/video-summary-generator.adapter.interface';
import { GeminiTextExtractorClient } from '@contentModule/http/client/gemini/gemini-text-extractor.client';
import { VideoTranscriptGeneratorAdapter } from './core/adapter/video-transcript-generator.adapter.interface';
import { VideoAgeRecommendationAdapter } from './core/adapter/video-recommendation.adapter.interface';
import { HttpClientModule } from '@sharedModule/http/client/http-client.module';
import { AuthModule } from '@sharedModule/auth/auth.module';
import { LoggerModule } from '@sharedModule/logger/logger.module';
import { BullModule } from '@nestjs/bullmq';
import { QUEUES } from './queue/queue.constant';
import { ConfigService } from '@sharedModule/config/service/config.service';
import { TranscribeVideoUseCase } from './core/use-case/transcribe-video.use-case';
import { VideoSummaryConsumer } from './queue/consumer/video-summary.queue-consumer';
import { VideoAgeRecommendationConsumer } from './queue/consumer/video-age-recommendation.queue-consumer';
import { VideoTranscriptionConsumer } from './queue/consumer/transcribe-video.queue-consumer';
import { VideoProcessingJobProducer } from './queue/producer/video-processing-job.queue-producer';
import { SetVideoAgeRecommendationUseCase } from './core/use-case/set-video-age-recommendation.use-case';
import { GenerateSummaryForVideoUseCase } from './core/use-case/generate-summary-for-video.use-case';

@Module({
  imports: [
    PersistenceModule,
    ConfigModule.forRoot(),
    HttpClientModule,
    AuthModule,
    LoggerModule,
    BullModule.forRootAsync({
      imports: [ConfigModule.forRoot()],
      useFactory: async (configSvc: ConfigService) => ({
        connection: {
          host: configSvc.get('redis.host'),
          port: configSvc.get('redis.port'),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: true,
          removeOnFail: true,
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
    ),
  ],
  controllers: [
    AdminMovieController,
    MediaPlayerController,
    AdminTvShowController,
  ],
  providers: [
    // adapters
    {
      provide: VideoSummaryGeneratorAdapter,
      useClass: GeminiTextExtractorClient,
    },
    {
      provide: VideoTranscriptGeneratorAdapter,
      useClass: GeminiTextExtractorClient,
    },
    {
      provide: VideoAgeRecommendationAdapter,
      useClass: GeminiTextExtractorClient,
    },

    ContentRepository,
    VideoRepository,
    ExternalMovieClient,

    // services
    AgeRecommendationService,
    VideoProfanityFilterService,
    VideoProcessorService,
    EpisodeLifecycleService,

    // use cases
    CreateMovieUseCase,
    CreateTvShowEpisodeUseCase,
    CreateTvShowUseCase,
    GetStreamingURLUseCase,
    TranscribeVideoUseCase,
    SetVideoAgeRecommendationUseCase,
    GenerateSummaryForVideoUseCase,

    // consumers
    VideoSummaryConsumer,
    VideoAgeRecommendationConsumer,
    VideoTranscriptionConsumer,

    // producers
    VideoProcessingJobProducer,
  ],
})
export class ContentModule {}
