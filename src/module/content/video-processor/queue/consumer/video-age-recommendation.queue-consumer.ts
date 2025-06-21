import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { QUEUES } from '../../../shared/queue/queue.constant';
import { NotFoundException, OnApplicationShutdown } from '@nestjs/common';
import { AppLogger } from '@sharedModule/logger/service/app-logger.service';
import { Job } from 'bullmq';
import { VideoProcessingJob } from '../../../shared/queue/queue.types';
import { VideoRepository } from '@contentModule/shared/persistence/repository/video.repository';
import { SetAgeRecommendationUseCase } from '@contentModule/video-processor/core/use-case/set-age-recommendation.use-case';

@Processor(QUEUES.VIDEO_AGE_RECOMMENDATION)
export class VideoAgeRecommendationConsumer
  extends WorkerHost
  implements OnApplicationShutdown
{
  constructor(
    private readonly videoRepository: VideoRepository,
    private readonly setAgeRecommendationUseCase: SetAgeRecommendationUseCase,
    private readonly logger: AppLogger,
  ) {
    super();
  }

  async onApplicationShutdown() {
    await this.worker.close(true);
  }

  async process(job: Job<VideoProcessingJob, void>) {
    const data = job.data;
    this.logger.log(
      `Processing video age recommendation for video ID: ${data.videoId}`,
    );

    const video = await this.videoRepository.findOneById(data.videoId);
    if (!video) {
      throw new NotFoundException(
        `Video with ID ${job.data.videoId} not found`,
      );
    }

    try {
      await this.setAgeRecommendationUseCase.execute(video);
    } catch (error) {
      this.logger.error(
        `Failed to process video age recommendation for video ID: ${data.videoId}`,
        { error, videoId: data.videoId },
      );
      throw new Error(
        `Failed to process age recommendation for video ID ${data.videoId}`,
      ); // rethrow to ensure job failure is handled
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job failed for video ID: ${job.data.videoId}`, {
      error,
      job,
    });
  }
}
