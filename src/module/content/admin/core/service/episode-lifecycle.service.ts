import { Episode } from '@contentModule/shared/persistence/entity/episode.entity';
import { EpisodeRepository } from '@contentModule/admin/persistence/repository/episode.repository';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class EpisodeLifecycleService {
  constructor(private readonly episodeRepository: EpisodeRepository) {}

  async checkEpisodeConstraintOrThrow(episode: Episode): Promise<void> {
    const episodeWithSameSeasonAndNumber =
      await this.episodeRepository.existsBy({
        season: episode.season,
        number: episode.number,
        tvShowId: episode.tvShow.id,
      });
    if (episodeWithSameSeasonAndNumber) {
      throw new BadRequestException(
        `Episode with season ${episode.season} and number ${episode.number} already exists`,
      );
    }

    const lastEpisode =
      await this.episodeRepository.findLastEpisodeByTvShowAndSeason(
        episode.tvShow.id,
        episode.season,
      );
    if (lastEpisode && lastEpisode.number + 1 !== episode.number) {
      throw new BadRequestException(
        `Episode number should be ${lastEpisode.number + 1}`,
      );
    }
  }
}
