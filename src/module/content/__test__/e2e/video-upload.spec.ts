import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { FILES_DEST } from '@contentModule/http/rest/controller/video-upload.controller';
import * as fs from 'fs';
import * as request from 'supertest';
import { VideoRepository } from '@contentModule/persistence/repository/video.repository';
import { ContentRepository } from '@contentModule/persistence/repository/content.repository';
import { MovieRepository } from '@contentModule/persistence/repository/movie.repository';
import * as nock from 'nock';
import {
  searchKeyword,
  searchMovie,
} from '../../../../../test/utils/http/rest/client/external-movie-rating';
import { ContentModule } from '@contentModule/content.module';
import { createNestApp } from '@testInfra/test-e2e.setup';

describe('VideoUploadController (e2e)', () => {
  let module: TestingModule;
  let app: INestApplication;
  let videoRepository: VideoRepository;
  let contentRepository: ContentRepository;
  let movieRepository: MovieRepository;

  beforeAll(async () => {
    const nestTestSetup = await createNestApp([ContentModule]);
    app = nestTestSetup.app;
    module = nestTestSetup.module;

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
    nock.cleanAll();
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

      searchKeyword(expectedVideo.title).reply(200, {
        results: [
          {
            id: '1',
          },
        ],
      });

      searchMovie().reply(200, {
        results: [
          {
            vote_average: 8.5,
          },
        ],
      });

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
