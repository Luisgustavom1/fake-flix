import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { QUEUES } from '../../../shared/queue/queue.constant';
import { Queue } from 'bullmq';
import { AppLogger } from '@sharedModule/logger/service/app-logger.service';
import { VideoProcessingJob } from '../../../shared/queue/queue.types';
import { Video } from '@contentModule/shared/persistence/entity/video.entity';

@Injectable()
export class VideoProcessingJobProducer {
  constructor(
    @InjectQueue(QUEUES.VIDEO_AGE_RECOMMENDATION)
    private videoRecommendationQueue: Queue,
    @InjectQueue(QUEUES.VIDEO_TRANSCRIPT)
    private videoTranscriptQueue: Queue,
    @InjectQueue(QUEUES.VIDEO_SUMMARY)
    private videoSummaryQueue: Queue,
    private readonly logger: AppLogger,
  ) {}

  private createVideoProcessingJob(video: Video): VideoProcessingJob {
    return {
      videoId: video.id,
      videoUrl: video.url,
    };
  }

  async processRecommendation(video: Video) {
    this.logger.log(
      `queueing video recommendation job for video ID: ${video.id}`,
    );
    const job = await this.videoRecommendationQueue.add(
      'process',
      this.createVideoProcessingJob(video),
    );

    this.logger.log(
      `queued video recommendation job with ID: ${job.id} for video ID: ${video.id}`,
    );
    return job.id;
  }

  async processTranscript(video: Video) {
    this.logger.log(`queueing video transcript job for video ID: ${video.id}`);

    const job = await this.videoTranscriptQueue.add(
      'process',
      this.createVideoProcessingJob(video),
    );

    this.logger.log(
      `queued video transcript job with ID: ${job.id} for video ID: ${video.id}`,
    );
    return job.id;
  }

  async processSummary(video: Video) {
    this.logger.log(`queueing video summary job for video ID: ${video.id}`);

    const job = await this.videoSummaryQueue.add(
      'process',
      this.createVideoProcessingJob(video),
    );

    this.logger.log(
      `queued video summary job with ID: ${job.id} for video ID: ${video.id}`,
    );
    return job.id;
  }
}
