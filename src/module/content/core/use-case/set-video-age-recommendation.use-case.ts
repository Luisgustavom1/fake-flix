import { Video } from '@contentModule/persistence/entity/video.entity';
import { Inject, Injectable } from '@nestjs/common';
import {
  AgeRecommendationSchema,
  VideoAgeRecommendationAdapter,
} from '../adapter/video-recommendation.adapter.interface';
import { AppLogger } from '@sharedModule/logger/service/app-logger.service';
import { VideoMetadata } from '@contentModule/persistence/entity/video-metadata.entity';
import { VideoMetadataRepository } from '@contentModule/persistence/repository/video-metadata.repository';
import { ContentRepository } from '@contentModule/persistence/repository/content.repository';
import { runInTransaction } from 'typeorm-transactional';
import { AgeRecommendationService } from '../service/age-recommendation.service';

@Injectable()
export class SetVideoAgeRecommendationUseCase {
  constructor(
    @Inject(VideoAgeRecommendationAdapter)
    private readonly videoAgeRecommendationAdapter: VideoAgeRecommendationAdapter,
    private readonly videoMetadataRepository: VideoMetadataRepository,
    private readonly contentRepository: ContentRepository,
    private readonly contentAgeRecommendationSvc: AgeRecommendationService,
    private logger: AppLogger,
  ) {}

  public async execute(video: Video) {
    const ageRecommendation =
      await this.videoAgeRecommendationAdapter.getAgeRecommendation(video.url);
    if (!ageRecommendation) {
      throw new Error(
        `Failed to get age recommendation for video ID ${video.id}`,
      );
    }
    this.logger.log(`age recommendation for video ID ${video.id}`, {
      ageRecommendation,
      videoId: video.id,
    });

    const metadata = await this.getAndPopulateMetadata(
      video,
      ageRecommendation,
    );

    const content = await this.contentRepository.findContentByVideoId(video.id);
    if (!content) {
      throw new Error(`Content not found for video ID ${video.id}`);
    }

    await runInTransaction(
      async () => {
        await this.videoMetadataRepository.save(metadata);
        this.contentAgeRecommendationSvc.setAgeRecommendationForContent(
          content,
          metadata,
        );
        await this.contentRepository.saveMovieOrTvShow(content);
      },
      {
        connectionName: 'content',
      },
    );
  }

  private async getAndPopulateMetadata(
    video: Video,
    ageRecommendation: AgeRecommendationSchema,
  ): Promise<VideoMetadata> {
    const metadata = await this.videoMetadataRepository.findOne({
      where: { video },
    });

    if (metadata) {
      metadata.ageRating = ageRecommendation?.ageRating;
      metadata.ageRatingExplanation = ageRecommendation.explanation;
      metadata.ageRatingCategories = ageRecommendation.categories;
      return metadata;
    }

    return new VideoMetadata({
      ageRating: ageRecommendation?.ageRating,
      ageRatingExplanation: ageRecommendation.explanation,
      ageRatingCategories: ageRecommendation.categories,
      video,
    });
  }
}
