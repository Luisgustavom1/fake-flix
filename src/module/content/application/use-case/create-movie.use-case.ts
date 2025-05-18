import { Injectable } from '@nestjs/common';
import { Movie } from '@contentModule/persistence/entity/movie.entity';
import { Video } from '@contentModule/persistence/entity/video.entity';
import { Thumbnail } from '@contentModule/persistence/entity/thumbnail.entity';
import { ExternalMovieClient } from '@contentModule/http/rest/client/external-movie-rating/external-movie-rating.client';
import { AgeRecommendationService } from '@contentModule/core/service/age-recommendation.service';
import { MovieContentModel } from '@contentModule/core/model/movie-content.model';
import { ContentRepository } from '@contentModule/persistence/repository/content.repository';
import { VideoProcessorService } from '@contentModule/core/service/video-processor.service';

export interface CreateMovieData {
  title: string;
  description: string;
  videoUrl: string;
  sizeInKb: number;
  thumbnailUrl?: string;
}

@Injectable()
export class CreateMovieUseCase {
  constructor(
    private readonly externalMovieRatingClient: ExternalMovieClient,
    private readonly videoProcessorService: VideoProcessorService,
    private readonly contentRepository: ContentRepository,
    private readonly ageRecommendationService: AgeRecommendationService,
  ) {}

  async execute(createMovieData: CreateMovieData) {
    const externalRating = await this.externalMovieRatingClient.getRating(
      createMovieData.title,
    );

    const content = new MovieContentModel({
      title: createMovieData.title,
      description: createMovieData.description,
      ageRecommendation: null,
      movie: new Movie({
        externalRating,
        video: new Video({
          url: createMovieData.videoUrl,
          sizeInKb: createMovieData.sizeInKb,
        }),
      }),
    });

    if (createMovieData.thumbnailUrl) {
      content.movie.thumbnail = new Thumbnail({
        url: createMovieData.thumbnailUrl,
      });
    }

    await Promise.all([
      this.videoProcessorService.processMetadataAndModeration(
        content.movie.video,
      ),
      this.ageRecommendationService.setAgeRecommendationForContent(content),
    ]);

    return await this.contentRepository.saveMovie(content);
  }
}
