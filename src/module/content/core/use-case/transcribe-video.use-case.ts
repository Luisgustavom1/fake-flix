import { Inject, Injectable } from '@nestjs/common';
import { VideoTranscriptGeneratorAdapter } from '../adapter/video-transcript-generator.adapter.interface';
import { VideoMetadataRepository } from '@contentModule/persistence/repository/video-metadata.repository';
import { AppLogger } from '@sharedModule/logger/service/app-logger.service';
import { Video } from '@contentModule/persistence/entity/video.entity';
import { VideoMetadata } from '@contentModule/persistence/entity/video-metadata.entity';

@Injectable()
export class TranscribeVideoUseCase {
  constructor(
    @Inject(VideoTranscriptGeneratorAdapter)
    private readonly videoTranscriptionGenerator: VideoTranscriptGeneratorAdapter,
    private readonly videoMetadataRepository: VideoMetadataRepository,
    private readonly logger: AppLogger,
  ) {}

  public async execute(video: Video): Promise<void> {
    const transcript =
      await this.videoTranscriptionGenerator.generateTranscript(video.url);
    if (!transcript) {
      throw new Error(
        `Failed to generate transcript for video with ID ${video.id}`,
      );
    }
    this.logger.log(`Generated transcript for video ID ${video.id}`, {
      transcript,
      videoId: video.id,
    });

    const metadata = await this.videoMetadataRepository.findOne({
      where: { video },
    });

    if (metadata) {
      metadata.transcript = transcript;
      await this.videoMetadataRepository.save(metadata);
      return;
    }

    const newMetadata = new VideoMetadata({
      transcript,
      video,
    });

    await this.videoMetadataRepository.save(newMetadata);
  }
}
