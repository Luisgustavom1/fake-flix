import { Module } from '@nestjs/common';
import { ContentManagementService } from '@contentModule/core/service/content-management.service';
import { MediaPlayerService } from '@contentModule/core/service/media-player.service';
import { ContentRepository } from '@contentModule/persistence/repository/content.repository';
import { VideoRepository } from '@contentModule/persistence/repository/video.repository';
import { PersistenceModule } from '@contentModule/persistence/persistence.module';
import { HttpClient } from '@sharedModule/http/client/http.client';
import { ConfigModule } from '@sharedModule/config/config.module';
import { VideoUploadController } from '@contentModule/http/rest/controller/video-upload.controller';
import { MediaPlayerController } from '@contentModule/http/rest/controller/media-player.controller';
import { ExternalMovieClient } from '@contentModule/http/rest/client/external-movie-rating/external-movie-rating.client';

@Module({
  imports: [PersistenceModule.forRoot(), ConfigModule.forRoot()],
  controllers: [VideoUploadController, MediaPlayerController],
  providers: [
    ContentManagementService,
    MediaPlayerService,
    ContentRepository,
    VideoRepository,
    ExternalMovieClient,
    HttpClient,
  ],
})
export class ContentModule {}