import { Module } from '@nestjs/common';
import { ContentRepository } from '@contentModule/persistence/repository/content.repository';
import { VideoRepository } from '@contentModule/persistence/repository/video.repository';
import { PersistenceModule } from '@contentModule/persistence/persistence.module';
import { HttpClient } from '@sharedModule/http/client/http.client';
import { ConfigModule } from '@sharedModule/config/config.module';
import { AdminMovieController } from '@contentModule/http/rest/controller/admin-movie.controller';
import { MediaPlayerController } from '@contentModule/http/rest/controller/media-player.controller';
import { ExternalMovieClient } from '@contentModule/http/rest/client/external-movie-rating/external-movie-rating.client';
import { AdminTvShowController } from './http/rest/controller/admin-tv-show-controller';
import { AgeRecommendationService } from './core/service/age-recommendation.service';
import { VideoProfanityFilterService } from './core/service/video-profanity-filter.service';
import { CreateMovieUseCase } from './application/use-case/create-movie.use-case';
import { CreateTvShowEpisodeUseCase } from './application/use-case/create-tv-show-episode.use-case';
import { CreateTvShowUseCase } from './application/use-case/create-tv-show.use-case';
import { GetStreamingURLUseCase } from './application/use-case/get-streaming-url.use-case';
import { VideoProcessorService } from './core/service/video-processor.service';
import { EpisodeLifecycleService } from './core/service/episode-lifecycle.service';
import { VideoSummaryGeneratorAdapter } from './core/adapter/video-summary-generator.adapter.interface';
import { GeminiTextExtractorClient } from '@contentModule/http/rest/client/gemini/gemini-text-extractor.client';
import { VideoTranscriptGeneratorAdapter } from './core/adapter/video-transcript-generator.adapter.interface';
import { VideoAgeRecommendationAdapter } from './core/adapter/video-recommendation.adapter.interface';
import { HttpClientModule } from '@sharedModule/http/client/http.client module';

@Module({
  imports: [PersistenceModule, ConfigModule.forRoot(), HttpClientModule],
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
    HttpClient,

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
  ],
})
export class ContentModule {}
