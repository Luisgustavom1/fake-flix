import { Module } from '@nestjs/common';
import { ContentManagementService } from '@contentModule/core/service/content-management.service';
import { MediaPlayerService } from '@contentModule/core/service/media-player.service';
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
import { VideoMetadataService } from './core/service/video-metadata.service';
import { VideoProfanityFilterService } from './core/service/video-profanity-filter.service';

@Module({
  imports: [PersistenceModule.forRoot(), ConfigModule.forRoot()],
  controllers: [
    AdminMovieController,
    MediaPlayerController,
    AdminTvShowController,
  ],
  providers: [
    ContentManagementService,
    MediaPlayerService,
    ContentRepository,
    VideoRepository,
    ExternalMovieClient,
    HttpClient,
    AgeRecommendationService,
    VideoMetadataService,
    VideoProfanityFilterService,
  ],
})
export class ContentModule {}
