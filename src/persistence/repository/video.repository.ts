import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/prisma-client';
import { VideoEntity } from '@src/core/entity/video.entity';

@Injectable()
export class VideoRepository {
  private readonly model: PrismaService['video'];

  constructor(prisma: PrismaService) {
    this.model = prisma.video;
  }

  async findById(id: string): Promise<VideoEntity | undefined> {
    try {
      const videData = await this.model.findUnique({
        where: { id },
      });

      if (!videData) {
        return;
      }

      return VideoEntity.createFrom(videData);
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

  async clear() {
    try {
      return this.model.deleteMany();
    } catch (e) {
      this.handleAndThrowError(e);
    }
  }
}
