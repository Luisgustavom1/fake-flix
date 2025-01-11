import { Injectable } from '@nestjs/common';
import { TvShowContentModel } from '../model/tv-show-content.model';
import { MovieContentModel } from '../model/movie-content.model';

@Injectable()
export class AgeRecommendationService {
  async setAgeRecommendationForContent(
    content: TvShowContentModel | MovieContentModel,
  ) {
    content.ageRecommendation = 18;
  }
}
