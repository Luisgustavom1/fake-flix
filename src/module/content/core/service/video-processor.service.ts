import { Injectable } from '@nestjs/common';
import { Movie } from '@contentModule/persistence/entity/movie.entity';
import { Video } from '@contentModule/persistence/entity/video.entity';
import { Thumbnail } from '@contentModule/persistence/entity/thumbnail.entity';
import { ExternalMovieClient } from '@contentModule/http/rest/client/external-movie-rating/external-movie-rating.client';
import { AgeRecommendationService } from '@contentModule/core/service/age-recommendation.service';
import { MovieContentModel } from '@contentModule/core/model/movie-content.model';
import { ContentRepository } from '@contentModule/persistence/repository/content.repository';
import { VideoMetadataService } from './video-metadata.service';
import { VideoProfanityFilterService } from './video-profanity-filter.service';

export interface CreateMovieData {
  title: string;
  description: string;
  videoUrl: string;
  sizeInKb: number;
  thumbnailUrl?: string;
}

@Injectable()
export class VideoProcessorService {
  constructor(
    private readonly videoMetadataProvider: VideoMetadataService,
    private readonly videoProfanityService: VideoProfanityFilterService,
  ) {}

  async processMetadataAndSecurity(video: Video) {
    await Promise.all([
      this.videoMetadataProvider.setVideoDuration(video),
      this.videoProfanityService.filterProfanity(video),
    ]);
  }
}
