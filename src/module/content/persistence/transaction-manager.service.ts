import { Inject, Injectable, Scope } from '@nestjs/common';
import { ContentRepository } from './repository/content.repository';
import { EpisodeRepository } from './repository/episode.repository';
import { DataSource } from 'typeorm';

@Injectable({ scope: Scope.TRANSIENT })
export class TransactionManagerService {
  transactionalContentRepository: ContentRepository;
  transactionalEpisodeRepository: EpisodeRepository;

  constructor(@Inject(DataSource) readonly dataSource: DataSource) {}

  async executeWithinTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.dataSource.transaction(async (trx) => {
      this.transactionalContentRepository = new ContentRepository(trx);
      this.transactionalEpisodeRepository = new EpisodeRepository(trx);

      return work();
    });
  }
}
