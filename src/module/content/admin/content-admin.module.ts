import { EpisodeLifecycleService } from '@contentModule/admin/core/service/episode-lifecycle.service';
import { VideoProcessorService } from '@contentModule/admin/core/service/video-processor.service';
import { CreateMovieUseCase } from '@contentModule/admin/core/use-case/create-movie.use-case';
import { CreateTvShowEpisodeUseCase } from '@contentModule/admin/core/use-case/create-tv-show-episode.use-case';
import { CreateTvShowUseCase } from '@contentModule/admin/core/use-case/create-tv-show.use-case';
import { ExternalMovieClient } from '@contentModule/admin/http/client/external-movie-rating/external-movie-rating.client';
import { AdminMovieController } from '@contentModule/admin/http/rest/controller/admin-movie.controller';
import { AdminTvShowController } from '@contentModule/admin/http/rest/controller/admin-tv-show.controller';
import { ContentRepository } from '@contentModule/admin/persistence/repository/content.repository';
import { EpisodeRepository } from '@contentModule/admin/persistence/repository/episode.repository';
import { VideoProcessingJobProducer } from '@contentModule/admin/queue/producer/video-processing-job.queue-producer';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@sharedModule/config/config.module';
import { HttpClientModule } from '@sharedModule/http/client/http-client.module';
import { LoggerModule } from '@sharedModule/logger/logger.module';
import { ContentAgeRecommendationService } from '@contentModule/admin/core/service/content-age-recommendation.service';
import { SetVideoAgeRecommendationUseCase } from '@contentModule/video-processor/core/use-case/set-video-age-recommendation.use-case';
import { ContentSharedModule } from '@contentModule/shared/content-shared.module';

@Module({
  imports: [
    ContentSharedModule,
    LoggerModule,
    HttpClientModule,
    ConfigModule.forRoot(),
  ],
  providers: [
    ExternalMovieClient,
    CreateTvShowEpisodeUseCase,
    ContentAgeRecommendationService,
    EpisodeLifecycleService,
    VideoProcessorService,
    CreateMovieUseCase,
    CreateTvShowEpisodeUseCase,
    CreateMovieUseCase,
    CreateTvShowUseCase,
    VideoProcessingJobProducer,
    SetVideoAgeRecommendationUseCase,
    ContentRepository,
    EpisodeRepository,
  ],
  controllers: [AdminMovieController, AdminTvShowController],
})
export class ContentAdminModule {}
