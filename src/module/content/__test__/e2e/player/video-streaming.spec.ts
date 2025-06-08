import { HttpStatus, INestApplication } from '@nestjs/common';
import { FILES_DEST } from '@contentModule/http/rest/controller/admin-movie.controller';
import * as fs from 'fs';
import * as request from 'supertest';
import * as nock from 'nock';
import {
  searchKeyword,
  searchMovie,
} from '../../../../../../test/utils/http/rest/client/external-movie-rating';
import { ContentModule } from '@contentModule/content.module';
import { createNestApp } from '@testInfra/test-e2e.setup';
import { testDbClient } from '@testInfra/knex.database';
import { Tables } from '@testInfra/enum/tables';
import { CONTENT_TEST_FIXTURES } from '@contentModule/__test__/constants';
import { videoFactory } from '@contentModule/__test__/factory/video.factory';

describe('VideoController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const nestTestSetup = await createNestApp([ContentModule]);
    app = nestTestSetup.app;
  });

  beforeEach(async () => {
    jest
      .useFakeTimers({ advanceTimers: true })
      .setSystemTime(new Date('2021-01-01'));
  });

  afterEach(async () => {
    await testDbClient(Tables.Video).del();
    await testDbClient(Tables.VideoMetadata).del();
    await testDbClient(Tables.Movie).del();
    await testDbClient(Tables.Content).del();
    nock.cleanAll();
  });

  afterAll(async () => {
    await app.close();
    fs.rmSync(FILES_DEST, { recursive: true, force: true });
  });

  describe('/stream/:videoId', () => {
    it('should streams video', async () => {
      searchKeyword('Sample video').reply(200, {
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

      const sampleVideo = videoFactory.build({
        url: `${CONTENT_TEST_FIXTURES}/sample.mp4`,
      });
      await testDbClient(Tables.Video).insert(sampleVideo);

      const start = 20;
      const fileSize = 1430145;
      const range = `bytes=${start}-${fileSize - 1}`;

      const response = await request(app.getHttpServer())
        .get(`/stream/${sampleVideo.id}`)
        .set('Range', range)
        .expect(HttpStatus.PARTIAL_CONTENT);

      expect(response.headers['content-range']).toBe(
        `bytes ${start}-${fileSize - 1}/${fileSize}`,
      );
      expect(response.headers['accept-ranges']).toBe('bytes');
      expect(response.headers['content-length']).toBe(String(fileSize - start));
      expect(response.headers['content-type']).toBe('video/mp4');
    });

    it('should return 404 when video is not found', async () => {
      await request(app.getHttpServer())
        .get(`/stream/45705b56-a47f-4869-b736-8f6626c940f8`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
