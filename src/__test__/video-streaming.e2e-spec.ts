import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FILES_DEST } from '@src/http/rest/controller/content.controller';
import { AppModule } from '@src/app.module';
import * as fs from 'fs';
import * as request from 'supertest';
import { VideoRepository } from '@src/persistence/repository/video.repository';
import { ContentManagementService } from '@src/core/service/content-management.service';

describe('VideoController (e2e)', () => {
  let module: TestingModule;
  let app: INestApplication;
  let videoRepository: VideoRepository;
  let contentManagementService: ContentManagementService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    videoRepository = module.get<VideoRepository>(VideoRepository);
    contentManagementService = module.get<ContentManagementService>(
      ContentManagementService,
    );
  });

  beforeEach(async () => {
    jest
      .useFakeTimers({ advanceTimers: true })
      .setSystemTime(new Date('2021-01-01'));
  });

  afterEach(async () => {
    await videoRepository.clear();
  });

  afterAll(async () => {
    await app.close();
    fs.rmSync(FILES_DEST, { recursive: true, force: true });
  });

  describe('/stream/:videoId', () => {
    it('should streams video', async () => {
      const sampleVideo = await contentManagementService.createContent({
        title: 'Sample video',
        description: 'Sample description',
        url: './test/fixtures/sample.mp4',
        thumbnailUrl: './test/fixtures/sample.jpg',
        sizeInKb: 1430145,
      });

      const start = 20;
      const fileSize = 1430145;
      const range = `bytes=${start}-${fileSize - 1}`;

      const video = sampleVideo.getMedia().getVideo();
      const response = await request(app.getHttpServer())
        .get(`/stream/${video.getId()}`)
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
