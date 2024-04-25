import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContentEntity } from '@src/core/entity/content.entity';
import { Prisma } from '@prisma/prisma-client';

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
}
