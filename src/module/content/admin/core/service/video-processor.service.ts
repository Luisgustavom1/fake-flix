import { Injectable } from '@nestjs/common';
import { VideoProcessingJobProducer } from '@contentModule/admin/queue/producer/video-processing-job.queue-producer';
import { Video } from '@contentModule/shared/persistence/entity/video.entity';

export interface CreateMovieData {
  title: string;
  description: string;
  videoUrl: string;
  sizeInKb: number;
  thumbnailUrl?: string;
}

@Injectable()
export class VideoProcessorService {
  constructor(
    private readonly videoProcessingJobQueueProducer: VideoProcessingJobProducer,
  ) {}

  async processMetadataAndModeration(video: Video) {
    return Promise.all([
      this.videoProcessingJobQueueProducer.processRecommendation(video),
      this.videoProcessingJobQueueProducer.processTranscript(video),
      this.videoProcessingJobQueueProducer.processSummary(video),
    ]);
  }
}
