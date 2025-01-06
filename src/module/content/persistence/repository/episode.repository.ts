import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DefaultTypeOrmRepository } from '@sharedModule/persistence/typeorm/repository/default-typeorm.repository';
import { Episode } from '../entity/episode.entity';

@Injectable()
export class EpisodeRepository extends DefaultTypeOrmRepository<Episode> {
  constructor(@Inject(DataSource) readonly dataSource: DataSource) {
    super(Episode, dataSource);
  }

  async findLastEpisodeByTvShowAndSeason(
    tvShowId: string,
    season: number,
  ): Promise<Episode | null> {
    return this.find({
      where: {
        tvShowId,
        season,
      },
      order: {
        number: 'DESC',
      },
    });
  }
}
