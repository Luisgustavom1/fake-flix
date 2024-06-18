import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FILES_DEST } from '@src/http/rest/controller/video-upload.controller';
import { AppModule } from '@src/app.module';
import * as fs from 'fs';
import * as request from 'supertest';
import { VideoRepository } from '@src/persistence/repository/video.repository';
import { ContentRepository } from '@src/persistence/repository/content.repository';
import { MovieRepository } from '@src/persistence/repository/movie.repository';

describe('VideoUploadController (e2e)', () => {
  let module: TestingModule;
  let app: INestApplication;
  let videoRepository: VideoRepository;
  let contentRepository: ContentRepository;
  let movieRepository: MovieRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    videoRepository = module.get<VideoRepository>(VideoRepository);
    contentRepository = module.get<ContentRepository>(ContentRepository);
    movieRepository = module.get<MovieRepository>(MovieRepository);
  });

  beforeEach(async () => {
    jest
      .useFakeTimers({ advanceTimers: true })
      .setSystemTime(new Date('2021-01-01'));
  });

  afterEach(async () => {
    await videoRepository.clear();
    await movieRepository.clear();
    await contentRepository.clear();
  });

  afterAll(async () => {
    await app.close();
    fs.rmSync(FILES_DEST, { recursive: true, force: true });
  });

  describe('POST /video', () => {
    it('should upload a video', async () => {
      const expectedVideo = {
        title: 'Test video',
        description: 'Test description',
        url: 'uploads/video.mp4',
      };

      await request(app.getHttpServer())
        .post('/video')
        .attach('thumbnail', './test/fixtures/sample.jpg')
        .attach('video', './test/fixtures/sample.mp4')
        .field('title', expectedVideo.title)
        .field('description', expectedVideo.description)
        .expect(HttpStatus.CREATED)
        .expect((response) => {
          expect(response.body).toMatchObject({
            ...expectedVideo,
            url: expect.stringContaining('mp4'),
          });
        });
    });

    it('throws an error when the thumbnail is not provided', async () => {
      await request(app.getHttpServer())
        .post('/video')
        .attach('video', './test/fixtures/sample.mp4')
        .field('title', 'Test video')
        .field('description', 'Test description')
        .expect(HttpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body).toMatchObject({
            message: 'Video and thumbnail are required',
            error: 'Bad Request',
            statusCode: 400,
          });
        });
    });

    it('does not allow non mp4 files', async () => {
      await request(app.getHttpServer())
        .post('/video')
        .attach('video', './test/fixtures/sample.mp3')
        .field('title', 'Test video')
        .field('description', 'Test description')
        .expect(HttpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body).toMatchObject({
            message: 'Invalid file type',
            error: 'Bad Request',
            statusCode: 400,
          });
        });
    });
  });
});
