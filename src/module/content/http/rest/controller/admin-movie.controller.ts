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
import { RestResponseInterceptor } from '../interceptor/rest-response.interceptor';
import { CreateVideoResponseDTO } from '../dto/response/create-video-response-dto';
import { CreateMovieUseCase } from '@contentModule/application/use-case/create-movie.use-case';

export const FILES_DEST = './uploads';
const MAX_THUMBNAIL_SIZE = 1024 * 1024 * 10; // 10MB
const MAX_VIDEO_FILE_SIZE = 1024 * 1024 * 1024; // 1GB

@Controller('admin')
export class AdminMovieController {
  constructor(private readonly createMovieUseCase: CreateMovieUseCase) {}

  @Post('movie')
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
  async uploadMovie(
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

    if (videoFile.size > MAX_VIDEO_FILE_SIZE) {
      throw new BadRequestException('Video file is too large');
    }

    if (thumbnailFile.size > MAX_THUMBNAIL_SIZE) {
      throw new BadRequestException('Thumbnail file is too large');
    }

    const newContent = await this.createMovieUseCase.execute({
      title: body.title,
      description: body.description,
      videoUrl: videoFile.path,
      thumbnailUrl: thumbnailFile.path,
      sizeInKb: videoFile.size,
    });

    return {
      id: newContent.id,
      title: newContent.title,
      description: newContent.description,
      url: newContent.movie.video.url,
      thumbnailUrl: newContent.movie.thumbnail?.url,
      sizeInKb: newContent.movie.video.sizeInKb,
      duration: newContent.movie.video.metadata.duration,
      createdAt: newContent.createdAt,
      updatedAt: newContent.updatedAt,
    };
  }
}
