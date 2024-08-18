import { Injectable } from '@nestjs/common';
import { VideoNotFoundException } from '../exception/video-not-found.exception';
import { VideoRepository } from '@contentModule/persistence/repository/video.repository';

@Injectable()
export class MediaPlayerService {
  constructor(private readonly videoRepository: VideoRepository) {}

  async prepareStreaming(videoId: string) {
    const video = await this.videoRepository.findOneById(videoId);

    if (!video) {
      throw new VideoNotFoundException(videoId);
    }

    return video.url;
  }
}
