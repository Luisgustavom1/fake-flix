import { Inject, Injectable } from '@nestjs/common';
import { VideoDAO } from '../dao/video.dao.interface';

export interface CreateContentData {
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  sizeInKb: number;
}

@Injectable()
export class ContentManagementService {
  constructor(@Inject(VideoDAO) private readonly videoDao: VideoDAO) {}

  async createContent(data: CreateContentData) {
    const createdVideo = await this.videoDao.create(data);
    return createdVideo;
  }
}
