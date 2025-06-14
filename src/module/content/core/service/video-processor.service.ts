import { Injectable } from '@nestjs/common';
import { Video } from '@contentModule/persistence/entity/video.entity';
import { VideoProcessingJobProducer } from '@contentModule/queue/producer/video-processing-job.queue-producer';

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
