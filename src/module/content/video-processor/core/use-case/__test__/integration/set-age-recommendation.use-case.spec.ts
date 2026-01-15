import { contentFactory } from '@contentModule/shared/__test__/factory/content.factory';
import { videoFactory } from '@contentModule/shared/__test__/factory/video.factory';
import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { testDbClient } from '@testInfra/knex.database';
import { createNestApp } from '@testInfra/test-e2e.setup';
import * as nock from 'nock';
import { Tables } from '@testInfra/enum/tables.enum';
import { CONTENT_TEST_FIXTURES } from '@contentModule/shared/__test__/test.constants';
import { movieFactory } from '@contentModule/shared/__test__/factory/movie.factory';
import { videoMetadataFactory } from '@contentModule/shared/__test__/factory/video-metadata.factory';
import { SetAgeRecommendationUseCase } from '../../set-age-recommendation.use-case';
import { Video } from '@contentModule/shared/persistence/entity/video.entity';
import { ContentVideoProcessorModule } from '@contentModule/video-processor/content-video-processor.module';

describe('SetAgeRecommendationUseCase', () => {
  let module: TestingModule;
  let app: INestApplication;
  let setAgeRecommendationUseCase: SetAgeRecommendationUseCase;

  beforeAll(async () => {
    const nestTestSetup = await createNestApp([ContentVideoProcessorModule]);
    app = nestTestSetup.app;
    module = nestTestSetup.module;
    setAgeRecommendationUseCase = module.get<SetAgeRecommendationUseCase>(
      SetAgeRecommendationUseCase,
    );
  });

  afterEach(async () => {
    await testDbClient(Tables.VideoMetadata).del();

    await testDbClient(Tables.Video).del();
    await testDbClient(Tables.Movie).del();
    await testDbClient(Tables.Thumbnail).del();
    await testDbClient(Tables.Content).del();

    nock.cleanAll();
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
    await module.close();
  });

  it('analyzes the age recomendation for the video and updates the content', async () => {
    const content = contentFactory.build({
      ageRecommendation: 10,
    });
    const movie = movieFactory.build({
      contentId: content.id,
    });
    const video = videoFactory.build({
      url: `${CONTENT_TEST_FIXTURES}/sample.mp4`,
      movieId: movie.id,
    });
    const videoMetadata = videoMetadataFactory.build({
      videoId: video.id,
    });
    await testDbClient('Content').insert(content);
    await testDbClient('Movie').insert(movie);
    await testDbClient('Video').insert(video);
    await testDbClient('VideoMetadata').insert(videoMetadata);

    nock('https://generativelanguage.googleapis.com')
      .post('/v1beta/models/gemini-2.0-flash:generateContent')
      .query(true) // Match any query parameters
      .reply(200, {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    ageRating: 12,
                    explanation:
                      'The video contains mild language and thematic elements appropriate for viewers 12 and above.',
                    categories: ['language', 'thematic elements'],
                  }),
                },
              ],
            },
            finishReason: 'STOP',
            index: 0,
          },
        ],
      });

    const videoEntity = new Video(video);

    await setAgeRecommendationUseCase.execute(videoEntity);
    const updatedVideoMetadata = await testDbClient('VideoMetadata')
      .where({ videoId: video.id })
      .first();

    expect(updatedVideoMetadata).toBeDefined();
    expect(updatedVideoMetadata.ageRatingCategories).toEqual([
      'language',
      'thematic elements',
    ]);
    expect(updatedVideoMetadata.ageRating).toEqual(12);
    expect(updatedVideoMetadata.ageRatingExplanation).toEqual(
      'The video contains mild language and thematic elements appropriate for viewers 12 and above.',
    );
  });
});
