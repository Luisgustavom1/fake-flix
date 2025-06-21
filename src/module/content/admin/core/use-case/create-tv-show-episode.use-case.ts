import { Injectable, NotFoundException } from '@nestjs/common';
import { VideoProcessorService } from '@contentModule/admin/core/service/video-processor.service';
import { CreateEpisodeRequestDto } from '@contentModule/admin/http/rest/dto/request/create-episode-request.dto';
import { EpisodeLifecycleService } from '@contentModule/admin/core/service/episode-lifecycle.service';
import { AppLogger } from '@sharedModule/logger/service/app-logger.service';
import { ContentRepository } from '@contentModule/admin/persistence/repository/content.repository';
import { Episode } from '@contentModule/shared/persistence/entity/episode.entity';
import { Video } from '@contentModule/shared/persistence/entity/video.entity';

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
    private readonly videoProcessorService: VideoProcessorService,
    private readonly logger: AppLogger,
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

    episode.video = video;
    content.tvShow.episodes = [episode];

    await this.contentRepository.saveTvShow(content);

    this.logger.log(`created episode for TV Show`, {
      episodeId: episode.id,
      tvShowId: content.tvShow.id,
    });

    await this.videoProcessorService.processMetadataAndModeration(video);

    return episode;
  }
}
