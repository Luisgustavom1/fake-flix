import { Video } from '@contentModule/persistence/entity/video.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class VideoMetadataService {
  async setVideoDuration(video: Video): Promise<void> {
    video.duration = 10;
  }
}
