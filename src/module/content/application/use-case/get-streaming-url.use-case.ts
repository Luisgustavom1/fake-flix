import { VideoNotFoundException } from '@contentModule/core/exception/video-not-found.exception';
import { VideoRepository } from '@contentModule/persistence/repository/video.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GetStreamingURLUseCase {
  constructor(private readonly videoRepository: VideoRepository) {}

  async execute(videoId: string): Promise<string> {
    const video = await this.videoRepository.findOneById(videoId);
    if (!video) {
      throw new VideoNotFoundException(`video with id ${videoId} not found`);
    }
    return video.url;
  }
}
