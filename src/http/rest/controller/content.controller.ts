import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import * as path from 'path';
import type { Request } from 'express';
import { ContentManagementService } from '@src/core/service/content-management.service';
import { MediaPlayerService } from '@src/core/service/media-player.service';
import { RestResponseInterceptor } from '../interceptor/rest-response.interceptor';
import { CreateVideoResponseDTO } from '../dto/response/create-video-response-dto';

export const FILES_DEST = './uploads';

@Controller()
export class ContentController {
  constructor(
    private readonly contentManagementService: ContentManagementService,
    private readonly mediaPlayerService: MediaPlayerService,
  ) {}

  @Post('video')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(new RestResponseInterceptor(CreateVideoResponseDTO))
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'thumbnail', maxCount: 1 },
        { name: 'video', maxCount: 1 },
      ],
      {
        dest: FILES_DEST,
        storage: diskStorage({
          destination: FILES_DEST,
          filename: (_req, file, cb) => {
            return cb(
              null,
              `${Date.now()}-${randomUUID()}-${path.extname(file.originalname)}`,
            );
          },
        }),
        fileFilter: (_req, file, cb) => {
          if (file.mimetype !== 'video/mp4' && file.mimetype !== 'image/jpeg') {
            return cb(new BadRequestException('Invalid file type'), false);
          }
          return cb(null, true);
        },
      },
    ),
  )
  async uploadVideo(
    @Req() _req: Request,
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
      video?: Express.Multer.File[];
    },
    @Body() body: { title: string; description: string },
  ): Promise<CreateVideoResponseDTO> {
    const videoFile = files.video?.[0];
    const thumbnailFile = files.thumbnail?.[0];

    if (!videoFile || !thumbnailFile) {
      throw new BadRequestException('Video and thumbnail are required');
    }

    const newContent = await this.contentManagementService.createContent({
      title: body.title,
      description: body.description,
      url: videoFile.path,
      thumbnailUrl: thumbnailFile.path,
      sizeInKb: videoFile.size,
    });

    const video = newContent.getMedia()?.getVideo();
    if (!video) {
      throw new BadRequestException('Video must be present');
    }

    return {
      id: video.getId(),
      title: newContent.getTitle(),
      description: newContent.getDescription(),
      url: video.getUrl(),
      createdAt: newContent.getCreatedAt(),
      updatedAt: newContent.getUpdatedAt(),
    };
  }
}
