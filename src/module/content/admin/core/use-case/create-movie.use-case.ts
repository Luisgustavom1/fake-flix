import { Injectable } from '@nestjs/common';
import { ExternalMovieClient } from '@contentModule/admin/http/client/external-movie-rating/external-movie-rating.client';
import { VideoProcessorService } from '@contentModule/admin/core/service/video-processor.service';
import { ContentRepository } from '@contentModule/admin/persistence/repository/content.repository';
import { MovieContentModel } from '../model/movie-content.model';
import { Movie } from '@contentModule/shared/persistence/entity/movie.entity';
import { Video } from '@contentModule/shared/persistence/entity/video.entity';
import { Thumbnail } from '@contentModule/shared/persistence/entity/thumbnail.entity';

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

    await this.videoProcessorService.processMetadataAndModeration(
      content.movie.video,
    );

    return await this.contentRepository.saveMovie(content);
  }
}
