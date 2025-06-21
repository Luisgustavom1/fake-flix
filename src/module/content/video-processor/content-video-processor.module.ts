import { ContentSharedModule } from '@contentModule/shared/content-shared.module';
import { ContentSharedPersistenceModule } from '@contentModule/shared/persistence/content-shared-persistence.module';
import { VideoAgeRecommendationAdapter } from '@contentModule/video-processor/core/adapter/video-recommendation.adapter.interface';
import { VideoSummaryGeneratorAdapter } from '@contentModule/video-processor/core/adapter/video-summary-generator.adapter.interface';
import { VideoTranscriptGeneratorAdapter } from '@contentModule/video-processor/core/adapter/video-transcript-generator.adapter.interface';
import { GenerateSummaryForVideoUseCase } from '@contentModule/video-processor/core/use-case/generate-summary-for-video.use-case';
import { TranscribeVideoUseCase } from '@contentModule/video-processor/core/use-case/transcribe-video.use-case';
import { GeminiTextExtractorClient } from '@contentModule/video-processor/http/client/gemini/gemini-text-extractor.client';
import { VideoMetadataRepository } from '@contentModule/video-processor/persistence/repository/video-metadata.repository';
import { VideoAgeRecommendationConsumer } from '@contentModule/video-processor/queue/consumer/video-age-recommendation.queue-consumer';
import { VideoSummaryConsumer } from '@contentModule/video-processor/queue/consumer/video-summary.queue-consumer';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@sharedModule/config/config.module';
import { HttpClientModule } from '@sharedModule/http/client/http-client.module';
import { LoggerModule } from '@sharedModule/logger/logger.module';
import { VideoTranscriptionConsumer } from '@contentModule/video-processor/queue/consumer/transcribe-video.queue-consumer';
import { SetVideoAgeRecommendationUseCase } from '@contentModule/video-processor/core/use-case/set-video-age-recommendation.use-case';

@Module({
  imports: [
    ContentSharedPersistenceModule,
    LoggerModule,
    HttpClientModule,
    ContentSharedModule,
    ConfigModule.forRoot(),
  ],
  providers: [
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
    VideoAgeRecommendationConsumer,
    VideoSummaryConsumer,
    VideoTranscriptionConsumer,
    GenerateSummaryForVideoUseCase,
    SetVideoAgeRecommendationUseCase,
    TranscribeVideoUseCase,
    VideoMetadataRepository,
  ],
})
export class ContentVideoProcessorModule {}
