import { Injectable, NotFoundException } from '@nestjs/common';
import { Video } from '@contentModule/persistence/entity/video.entity';
import { AgeRecommendationService } from '@contentModule/core/service/age-recommendation.service';
import { ContentRepository } from '@contentModule/persistence/repository/content.repository';
import { VideoProcessorService } from '@contentModule/core/service/video-processor.service';
import { CreateEpisodeRequestDto } from '@contentModule/http/rest/dto/request/create-episode-request.dto';
import { Episode } from '@contentModule/persistence/entity/episode.entity';
import { EpisodeLifecycleService } from '@contentModule/core/service/episode-lifecycle.service';

export interface CreateMovieData {
  title: string;
  description: string;
  videoUrl: string;
  sizeInKb: number;
  thumbnailUrl?: string;
}

@Injectable()
export class CreateTvShowEpisodeUseCase {
  constructor(
    private readonly contentRepository: ContentRepository,
    private readonly episodeLifecycleService: EpisodeLifecycleService,
    private readonly ageRecommendationService: AgeRecommendationService,
    private readonly videoProcessorService: VideoProcessorService,
  ) {}

  async execute(
    contentId: string,
    episodeData: CreateEpisodeRequestDto & {
      videoUrl: string;
      videoSizeInKb: number;
    },
  ): Promise<Episode> {
    const content = await this.contentRepository.findTvShowContentById(
      contentId,
      ['tvShow'],
    );
    if (!content?.tvShow) {
      throw new NotFoundException(
        `TV Show with content id ${contentId} not found`,
      );
    }

    const episode = new Episode({
      title: episodeData.title,
      description: episodeData.description,
      season: episodeData.season,
      number: episodeData.number,
      tvShow: content.tvShow,
      tvShowId: content.tvShow.id,
    });

    await this.episodeLifecycleService.checkEpisodeConstraintOrThrow(episode);

    const video = new Video({
      url: episodeData.videoUrl,
      sizeInKb: episodeData.videoSizeInKb,
    });

    await Promise.all([
      this.ageRecommendationService.setAgeRecommendationForContent(content),
      this.videoProcessorService.processMetadataAndSecurity(video),
    ]);

    episode.video = video;
    content.tvShow.episodes = [episode];

    await this.contentRepository.saveTvShow(content);

    return episode;
  }
}
