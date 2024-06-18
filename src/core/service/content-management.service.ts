import { Injectable } from '@nestjs/common';
import { ContentRepository } from '@src/persistence/repository/content.repository';
import { Content } from '@src/persistence/entity/content.entity'
import { ContentType } from '../entity/content-type.enum';
import { Movie } from '@src/persistence/entity/movie.entity';
import { Video } from '@src/persistence/entity/video.entity';
import { Thumbnail } from '@src/persistence/entity/thumbnail.entity';

export interface CreateMovieData {
  title: string;
  description: string;
  url: string;
  sizeInKb: number;
  thumbnailUrl?: string;
}

@Injectable()
export class ContentManagementService {
  constructor(
    private readonly contentRepository: ContentRepository,
  ) {}

  async createMovie(createMovieData: CreateMovieData) {
    const contentEntity = new Content({
      title: createMovieData.title,
      description: createMovieData.description,
      type: ContentType.MOVIE,
      movie: new Movie({
        video: new Video({
          url: createMovieData.url,
          duration: 10,
          sizeInKb: createMovieData.sizeInKb,
        })
      }),
    });

    if (createMovieData.thumbnailUrl) {
      contentEntity.movie.thumbnail = new Thumbnail({
        url: createMovieData.thumbnailUrl,
      });
    }

    const content = await this.contentRepository.save(contentEntity);
    
    return content;
  }
}
