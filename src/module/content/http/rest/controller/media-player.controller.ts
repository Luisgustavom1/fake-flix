import {
  Controller,
  Get,
  Header,
  HttpStatus,
  NotFoundException,
  Param,
  Req,
  Res,
} from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import type { Request, Response } from 'express';
import { GetStreamingURLUseCase } from '@contentModule/application/use-case/get-streaming-url.use-case';

@Controller('stream')
export class MediaPlayerController {
  constructor(
    private readonly getStreamingUrlUseCase: GetStreamingURLUseCase,
  ) {}

  @Get(':videoId')
  @Header('Content-Type', 'video/mp4')
  async streamVideo(
    @Param('videoId') videoId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const videoUrl = await this.getStreamingUrlUseCase.execute(videoId);
      if (!videoUrl) throw new NotFoundException('Video not found');

      const videoPath = path.join('.', videoUrl);
      const fileSize = fs.statSync(videoPath).size;

      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;
        const file = fs.createReadStream(videoPath, { start, end });

        res.writeHead(HttpStatus.PARTIAL_CONTENT, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': 'video/mp4',
        });

        return file.pipe(res);
      }

      res.writeHead(HttpStatus.OK, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        res.status(HttpStatus.NOT_FOUND).send({
          message: error.message,
          error: 'Video not found',
          statusCode: HttpStatus.NOT_FOUND,
        });
      }
    }
  }
}
