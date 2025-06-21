import { ContentRepository } from '@contentModule/admin/persistence/repository/content.repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import { AppLogger } from '@sharedModule/logger/service/app-logger.service';
import { ContentAgeRecommendationService } from '../service/content-age-recommendation.service';

@Injectable()
export class SetAgeRecommendationForContentUseCase {
  constructor(
    private readonly contentRepository: ContentRepository,
    private readonly ageRecommendationService: ContentAgeRecommendationService,
    private readonly logger: AppLogger,
  ) {}

  async execute(videoId: string, ageRecommendation: number): Promise<void> {
    const content = await this.contentRepository.findContentByVideoId(videoId);
    if (!content) {
      throw new NotFoundException(`Content with video ID ${videoId} not found`);
    }
    this.ageRecommendationService.setAgeRecommendationForContent(
      content,
      ageRecommendation,
    );
    await this.contentRepository.saveMovieOrTvShow(content);
    this.logger.log(
      `Set age recommendation for content with video ID ${videoId} to ${ageRecommendation}`,
    );
  }
}
