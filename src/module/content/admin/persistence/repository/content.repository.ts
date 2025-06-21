import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DefaultTypeOrmRepository } from '@sharedModule/persistence/typeorm/repository/default-typeorm.repository';
import { Episode } from '../../../shared/persistence/entity/episode.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { ContentType } from '@contentModule/shared/core/enum/content-type.enum';
import { Content } from '@contentModule/shared/persistence/entity/content.entity';
import { TvShowContentModel } from '@contentModule/admin/core/model/tv-show-content.model';
import { MovieContentModel } from '@contentModule/admin/core/model/movie-content.model';

@Injectable()
export class ContentRepository extends DefaultTypeOrmRepository<Content> {
  constructor(
    @InjectDataSource('content')
    private readonly dataSource: DataSource,
  ) {
    super(Content, dataSource.manager);
  }

  async saveMovieOrTvShow(
    entity: TvShowContentModel,
  ): Promise<TvShowContentModel>;
  async saveMovieOrTvShow(
    entity: MovieContentModel,
  ): Promise<MovieContentModel>;
  async saveMovieOrTvShow(
    entity: MovieContentModel | TvShowContentModel,
  ): Promise<MovieContentModel | TvShowContentModel>;
  async saveMovieOrTvShow(entity: MovieContentModel | TvShowContentModel) {
    if (entity.type === ContentType.MOVIE) {
      return this.saveMovie(entity as MovieContentModel);
    }
    if (entity.type === ContentType.TV_SHOW) {
      return this.saveTvShow(entity as TvShowContentModel);
    }
    throw new Error(`content type ${(entity as any).type} not found`);
  }

  async saveMovie(entity: MovieContentModel): Promise<MovieContentModel> {
    const content = new Content({
      id: entity.id,
      title: entity.title,
      description: entity.description,
      type: entity.type,
      movie: entity.movie,
      ageRecommendation: entity.ageRecommendation,
    });

    await super.save(content);

    return this.mapToMovieContentModel(content);
  }

  async saveTvShow(entity: TvShowContentModel): Promise<TvShowContentModel> {
    const episodes = entity.tvShow.episodes;
    const content = new Content({
      id: entity.id,
      title: entity.title,
      description: entity.description,
      type: entity.type,
      tvShow: entity.tvShow,
      ageRecommendation: entity.ageRecommendation,
    });

    await this.entityManager.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.getRepository(Content).save(content);
      // saves the relations
      if (Array.isArray(episodes) && episodes.length > 0) {
        await transactionalEntityManager.getRepository(Episode).save(episodes);
      }
    });

    return this.mapToTvShowContentModel(content);
  }

  async findTvShowContentById(
    id: string,
    relations: string[],
  ): Promise<TvShowContentModel | null> {
    const content = await super.findOneById(id, relations);

    //Ensure the content is the type tvShow
    if (!content || !content.tvShow) {
      return null;
    }

    return this.mapToTvShowContentModel(content);
  }

  async findContentByVideoId(
    videoId: string,
  ): Promise<TvShowContentModel | MovieContentModel | null> {
    const content = await this.entityManager
      .createQueryBuilder(Content, 'content')
      .leftJoinAndSelect('content.movie', 'movie')
      .leftJoinAndSelect('movie.video', 'movieVideo')
      .leftJoinAndSelect('content.tvShow', 'tvShow')
      .leftJoinAndSelect('tvShow.episodes', 'episode')
      .leftJoinAndSelect('episode.video', 'episodeVideo')
      .where('movieVideo.id = :videoId OR episodeVideo.id = :videoId', {
        videoId,
      })
      .getOne();

    if (!content || (!content.movie && !content.tvShow)) {
      return null;
    }

    if (content.movie) {
      return this.mapToMovieContentModel(content);
    }

    if (content.tvShow) {
      return this.mapToTvShowContentModel(content);
    }

    return null;
  }

  private mapToMovieContentModel(content: Content): MovieContentModel {
    return new MovieContentModel({
      id: content.id,
      title: content.title,
      description: content.description,
      ageRecommendation: content.ageRecommendation,
      movie: content.movie!,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
      deletedAt: content.deletedAt,
    });
  }

  private mapToTvShowContentModel(content: Content): TvShowContentModel {
    return new TvShowContentModel({
      id: content.id,
      title: content.title,
      description: content.description,
      ageRecommendation: content.ageRecommendation,
      tvShow: content.tvShow!,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
      deletedAt: content.deletedAt,
    });
  }
}
