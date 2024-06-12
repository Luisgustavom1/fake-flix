import { Injectable } from '@nestjs/common';
import { ContentRepository } from '@src/persistence/repository/content.repository';
import { ContentEntity, ContentType } from '../entity/content.entity';
import { MovieEntity } from '../entity/movie.entity';
import { VideoEntity } from '../entity/video.entity';
import { ThumbnailEntity } from '../entity/thumbnail.entity';
import { ConfigService } from '@src/infra/module/config/service/config.service';

export interface CreateContentData {
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  sizeInKb: number;
}

@Injectable()
export class ContentManagementService {
  constructor(
    private readonly contentRepository: ContentRepository,
    private readonly config: ConfigService,
  ) {}

  async createContent(data: CreateContentData) {
    const video = VideoEntity.createNew({
      url: data.url,
      sizeInKb: data.sizeInKb,
      duration: 100,
    });
    const thumbnail = ThumbnailEntity.createNew({
      url: data.thumbnailUrl,
    });
    const media = MovieEntity.createNew({
      video,
      thumbnail,
    });
    const content = ContentEntity.createNew({
      title: data.title,
      description: data.description,
      type: ContentType.MOVIE,
      media,
    });

    await this.contentRepository.create(content);
    return content;
  }
}
