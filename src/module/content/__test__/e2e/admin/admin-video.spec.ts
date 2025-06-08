import { HttpStatus, INestApplication } from '@nestjs/common';
import { FILES_DEST } from '@contentModule/http/rest/controller/admin-movie.controller';
import * as fs from 'fs';
import * as request from 'supertest';
import * as nock from 'nock';
import {
  mockGenAi,
  searchKeyword,
  searchMovie,
} from '../../../../../../test/utils/external-movie-rating.utils';
import { ContentModule } from '@contentModule/content.module';
import { createNestApp } from '@testInfra/test-e2e.setup';
import { testDbClient } from '@testInfra/knex.database';
import { Tables } from '@testInfra/enum/tables.enum';
import { CONTENT_TEST_FIXTURES } from '@contentModule/__test__/test.constants';
import { MovieRepository } from '@contentModule/persistence/repository/movie.repository';

describe('VideoUploadController (e2e)', () => {
  let app: INestApplication;
  let movieRepo: MovieRepository;

  beforeAll(async () => {
    const nestTestSetup = await createNestApp([ContentModule]);
    app = nestTestSetup.app;
    movieRepo = app.get(MovieRepository);
  });

  beforeEach(async () => {
    jest
      .useFakeTimers({ advanceTimers: true })
      .setSystemTime(new Date('2021-01-01'));
  });

  afterEach(async () => {
    await testDbClient(Tables.VideoMetadata).del();
    await testDbClient(Tables.Video).del();
    await testDbClient(Tables.Movie).del();
    await testDbClient(Tables.Content).del();
    nock.cleanAll();
  });

  afterAll(async () => {
    await app.close();
    fs.rmSync(FILES_DEST, { recursive: true, force: true });
  });

  describe('POST /admin/movie', () => {
    it('should upload a movie', async () => {
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

      mockGenAi([
        {
          text: JSON.stringify({
            responseText: 'This is a test video summary.',
          }),
        },
      ]);

      mockGenAi([
        {
          text: JSON.stringify({
            responseText: 'This is a test video transcript.',
          }),
        },
      ]);

      mockGenAi([
        {
          text: JSON.stringify({
            ageRating: 12,
            explanation:
              'The video contains mild language and thematic elements appropriate for viewers 12 and above.',
            categories: ['language', 'thematic elements'],
          }),
        },
      ]);

      const response = await request(app.getHttpServer())
        .post('/admin/movie')
        .attach('thumbnail', `${CONTENT_TEST_FIXTURES}/sample.jpg`)
        .attach('video', `${CONTENT_TEST_FIXTURES}/sample.mp4`)
        .field('title', expectedVideo.title)
        .field('description', expectedVideo.description)
        .expect(HttpStatus.CREATED)
        .expect((response) => {
          expect(response.body).toMatchObject({
            ...expectedVideo,
            url: expect.stringContaining('mp4'),
          });
        });

      const movie = await movieRepo.find({
        where: {
          contentId: response.body.id,
        },
        relations: ['video', 'video.metadata', 'content'],
      });

      if (!movie) {
        throw new Error('Movie not found');
      }

      expect(movie).toBeDefined();
      expect(movie.content.title).toBe(expectedVideo.title);
      expect(movie.content.description).toBe(expectedVideo.description);
      expect(movie.video.url).toBeDefined();
      expect(movie.video.metadata.ageRating).toBe(12);
      expect(movie.video.metadata.ageRatingExplanation).toBe(
        'The video contains mild language and thematic elements appropriate for viewers 12 and above.',
      );
      expect(movie.video.metadata.ageRatingCategories).toEqual([
        'language',
        'thematic elements',
      ]);
    });

    it('throws an error when the thumbnail is not provided', async () => {
      await request(app.getHttpServer())
        .post('/admin/movie')
        .attach('video', `${CONTENT_TEST_FIXTURES}/sample.mp4`)
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
        .post('/admin/movie')
        .attach('video', `${CONTENT_TEST_FIXTURES}/sample.mp3`)
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
