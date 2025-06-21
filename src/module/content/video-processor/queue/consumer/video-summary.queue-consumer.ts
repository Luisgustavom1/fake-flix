import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { QUEUES } from '../../../shared/queue/queue.constant';
import { OnApplicationShutdown } from '@nestjs/common';
import { AppLogger } from '@sharedModule/logger/service/app-logger.service';
import { Job } from 'bullmq';
import { VideoProcessingJob } from '../../../shared/queue/queue.types';
import { VideoRepository } from '@contentModule/shared/persistence/repository/video.repository';
import { GenerateSummaryForVideoUseCase } from '@contentModule/video-processor/core/use-case/generate-summary-for-video.use-case';

@Processor(QUEUES.VIDEO_SUMMARY)
export class VideoSummaryConsumer
  extends WorkerHost
  implements OnApplicationShutdown
{
  constructor(
    private readonly videoRepository: VideoRepository,
    private readonly logger: AppLogger,
    private generateSummaryForVideoUseCase: GenerateSummaryForVideoUseCase,
  ) {
    super();
  }

  async process(job: Job<VideoProcessingJob, void>) {
    this.logger.log(
      `Processing video summary for video ID: ${job.data.videoId}`,
    );

    try {
      const video = await this.videoRepository.findOneById(job.data.videoId, [
        'metadata',
      ]);
      if (!video) {
        this.logger.warn(`Video not found for ID: ${job.data.videoId}`);
        return;
      }

      await this.generateSummaryForVideoUseCase.execute(video);
    } catch (error) {
      this.logger.error('Error processing summary:', {
        error,
        videoId: job.data.videoId,
      });
      throw new Error(
        `Failed to process summary for video ID ${job.data.videoId}`,
      );
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job failed for video ID: ${job.data.videoId}`, {
      error,
      job,
    });
  }

  async onApplicationShutdown() {
    await this.worker.close(true);
  }
}
