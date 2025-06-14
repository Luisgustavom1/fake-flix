import { Injectable } from '@nestjs/common';
import { TvShowContentModel } from '../model/tv-show-content.model';
import { MovieContentModel } from '../model/movie-content.model';
import { VideoMetadata } from '@contentModule/persistence/entity/video-metadata.entity';

@Injectable()
export class AgeRecommendationService {
  async setAgeRecommendationForContent(
    content: TvShowContentModel | MovieContentModel,
    latestVideoMetadata: VideoMetadata,
  ) {
    /**
     * Age recommendation for the whole content is based on the highest
     * age recommendation of the videos
     * If the content has an age recommendation, it will be replaced
     */
    if (!content.ageRecommendation && latestVideoMetadata.ageRating) {
      content.ageRecommendation = latestVideoMetadata.ageRating;
      return;
    }

    if (
      content.ageRecommendation &&
      latestVideoMetadata.ageRating &&
      latestVideoMetadata.ageRating > content.ageRecommendation
    ) {
      content.ageRecommendation = latestVideoMetadata.ageRating;
      return;
    }
  }
}
