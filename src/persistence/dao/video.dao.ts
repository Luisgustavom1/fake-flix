import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';

interface CreateContentData {
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  sizeInKb: number;
}

@Injectable()
export class VideoDAO {
  constructor(private readonly prismaService: PrismaService) {}

  async create(data: CreateContentData) {
    return this.prismaService.video.create({
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
  }
}
