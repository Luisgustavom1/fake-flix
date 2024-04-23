import { Injectable } from '@nestjs/common';
import { PrismaService } from '@src/persistence/prisma/prisma.service';
import { randomUUID } from 'crypto';

export interface CreateContentData {
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  sizeInKb: number;
}

@Injectable()
export class ContentManagementService {
  constructor(private readonly prismaService: PrismaService) {}

  async createContent(data: CreateContentData) {
    const createdVideo = await this.prismaService.video.create({
      data: {
        id: randomUUID(),
        title: data.title,
        description: data.description,
        url: data.url,
        thumbnailUrl: data.thumbnailUrl,
        sizeInKb: data.sizeInKb,
        duration: 100,
      },
    });
    return createdVideo;
  }
}
