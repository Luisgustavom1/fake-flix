import { Injectable } from '@nestjs/common';
import { TvShowContentModel } from '../model/tv-show-content.model';
import { MovieContentModel } from '../model/movie-content.model';

@Injectable()
export class ContentAgeRecommendationService {
  async setAgeRecommendationForContent(
    content: TvShowContentModel | MovieContentModel,
    latestAgeRating: number,
  ) {
    /**
     * Age recommendation for the whole content is based on the highest
     * age recommendation of the videos
     * If the content has an age recommendation, it will be replaced
     */
    if (!content.ageRecommendation && latestAgeRating) {
      content.ageRecommendation = latestAgeRating;
      return;
    }

    if (
      content.ageRecommendation &&
      latestAgeRating &&
      latestAgeRating > content.ageRecommendation
    ) {
      content.ageRecommendation = latestAgeRating;
      return;
    }
  }
}
