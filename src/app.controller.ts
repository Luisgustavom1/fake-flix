import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import * as path from 'path';
import * as fs from 'fs'
import { PrismaService } from './prisma.service';
import type { Request, Response } from 'express';

export const FILES_DEST = "./uploads";

@Controller()
export class AppController {
  constructor(
    private readonly prismaService: PrismaService,
  ) {}

  @Get("/")
  getHello() {
    return 'Hello World!';
  }

  @Post('video')
  @HttpCode(HttpStatus.CREATED)
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
  ) {
    const videoFile = files.video?.[0];
    const thumbnailFile = files.thumbnail?.[0];

    if (!videoFile || !thumbnailFile) {
      throw new BadRequestException('Video and thumbnail are required');
    }

    return await this.prismaService.video.create({
      data: {
        id: randomUUID(),
        title: body.title,
        description: body.description,
        url: videoFile.path,
        thumbnailUrl: thumbnailFile.path,
        sizeInKb: videoFile.size,
        duration: 100,
      }
    });
  }

  @Get('stream/:videoId')
  @Header('Content-Type', 'video/mp4')
  async streamVideo(
    @Param('videoId') videoId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const video = await this.prismaService.video.findUnique({
      where: {
        id: videoId,
      }
    })

    if (!video) throw new NotFoundException('Video not found');

    const videoPath = path.join('.', video.url);
    const fileSize = fs.statSync(videoPath).size;

    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      const file = fs.createReadStream(videoPath, { start, end })

      res.writeHead(HttpStatus.PARTIAL_CONTENT, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      })

      return file.pipe(res);
    }

    res.writeHead(HttpStatus.OK, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    });
  }
}
