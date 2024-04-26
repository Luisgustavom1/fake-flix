import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContentEntity } from '@src/core/entity/content.entity';
import { Prisma } from '@prisma/prisma-client';
import { MovieEntity } from '@src/core/entity/movie.entity';
import { VideoEntity } from '@src/core/entity/video.entity';
import { ThumbnailEntity } from '@src/core/entity/thumbnail.entity';

const contentInclude = Prisma.validator<Prisma.ContentInclude>()({
  Movie: {
    include: { Video: true, Thumbnail: true },
  },
});

@Injectable()
export class ContentRepository {
  private readonly model: PrismaService['content'];

  constructor(prisma: PrismaService) {
    this.model = prisma.content;
  }

  async create(content: ContentEntity): Promise<ContentEntity> {
    try {
      const movie = content.getMedia();
      if (!movie) {
        throw new Error('Movie not found');
      }
      const video = movie.getVideo();

      await this.model.create({
        data: {
          id: content.getId(),
          title: content.getTitle(),
          description: content.getDescription(),
          type: content.getType(),
          createdAt: content.getCreatedAt(),
          updatedAt: content.getUpdatedAt(),
          Movie: {
            create: {
              id: movie.getId(),
              createdAt: movie.getCreatedAt(),
              updatedAt: movie.getUpdatedAt(),
              Video: {
                create: video.serialize(),
              },
              Thumbnail: {
                create: movie.getThumbnail()?.serialize(),
              },
            },
          },
        },
      });

      return content;
    } catch (e) {
      this.handleAndThrowError(e);
    }
  }

  async findById(id: string): Promise<ContentEntity | undefined> {
    try {
      const content = await this.model.findUnique({
        where: { id },
        include: {
          Movie: {
            include: { Video: true, Thumbnail: true },
          },
        },
      });

      if (!content) {
        return;
      }

      return this.mapToEntity(content);
    } catch (e) {
      this.handleAndThrowError(e);
    }
  }

  private mapToEntity<
    T extends Prisma.ContentGetPayload<{
      include: typeof contentInclude;
    }>,
  >(content: T): ContentEntity {
    if (!content.Movie) {
      throw new Error('Content not found');
    }
    const contentEntity = ContentEntity.createFrom({
      id: content.id,
      title: content.title,
      description: content.description,
      type: content.type,
      createdAt: new Date(content.createdAt),
      updatedAt: new Date(content.updatedAt),
    });

    if (this.isMovie(content) && content.Movie.Video) {
      const video = VideoEntity.createFrom({
        id: content.Movie.Video.id,
        url: content.Movie.Video.url,
        duration: content.Movie.Video.duration,
        sizeInKb: content.Movie.Video.sizeInKb,
        createdAt: new Date(content.Movie.Video.createdAt),
        updatedAt: new Date(content.Movie.Video.updatedAt),
      });

      contentEntity.addMedia(
        MovieEntity.createFrom({
          id: content.Movie.id,
          video,
          createdAt: new Date(content.Movie.createdAt),
          updatedAt: new Date(content.Movie.updatedAt),
        }),
      );

      if (content.Movie.Thumbnail) {
        const thumbnail = ThumbnailEntity.createFrom({
          id: content.Movie.Thumbnail.id,
          url: content.Movie.Thumbnail.url,
          createdAt: new Date(content.Movie.Thumbnail.createdAt),
          updatedAt: new Date(content.Movie.Thumbnail.updatedAt),
        });

        contentEntity.getMedia()?.addThumbnail(thumbnail);
      }
    }

    return contentEntity;
  }

  private isMovie(content: unknown): content is Prisma.ContentGetPayload<{
    include: {
      Movie: {
        include: { Video: true };
      };
    };
  }> {
    if (typeof content === 'object' && content !== null && 'Movie' in content) {
      return true;
    }

    return false;
  }

  private extractErrorMessage(error: unknown): string {
    if (
      error instanceof Error ||
      error instanceof Prisma.PrismaClientValidationError
    ) {
      return error.message;
    }

    return 'An error occurred';
  }

  protected handleAndThrowError(error: unknown): void {
    throw new Error(this.extractErrorMessage(error));
  }

  async clear() {
    try {
      return this.model.deleteMany();
    } catch (e) {
      this.handleAndThrowError(e);
    }
  }
}
