import {
  AgeRecommendationSchema,
  VideoAgeRecommendationAdapter,
} from '@contentModule/core/adapter/video-recommendation.adapter.interface';
import { VideoSummaryGeneratorAdapter } from '@contentModule/core/adapter/video-summary-generator.adapter.interface';
import { VideoTranscriptGeneratorAdapter } from '@contentModule/core/adapter/video-transcript-generator.adapter.interface';
import { ConfigService } from '@sharedModule/config/service/config.service';
import { GoogleGenAI, Type } from '@google/genai';

import * as fs from 'fs';
import { Injectable } from '@nestjs/common';

const defaultResponseSchema = {
  type: Type.OBJECT,
  properties: {
    responseText: { type: Type.STRING },
  },
};

@Injectable()
export class GeminiTextExtractorClient
  implements
    VideoSummaryGeneratorAdapter,
    VideoTranscriptGeneratorAdapter,
    VideoAgeRecommendationAdapter
{
  constructor(private readonly configService: ConfigService) {}

  async generateTranscript(videoUrl: string): Promise<string> {
    const response = await this.performRequest<{ responseText: string }>(
      videoUrl,
      'Please generate a transcript of the video. Please include the speaker names and timestamps.',
    );

    return response.responseText;
  }

  async generateSummary(videoUrl: string): Promise<string> {
    const response = await this.performRequest<{ responseText: string }>(
      videoUrl,
      'Please summarize the video in 3 sentences.',
    );

    return response.responseText;
  }

  async getAgeRecommendation(
    videoUrl: string,
  ): Promise<AgeRecommendationSchema> {
    const response = await this.performRequest<AgeRecommendationSchema>(
      videoUrl,
      'Please analyze this video and provide: an integer "ageRating" between 0-18, an "explanation" of why this rating is appropriate, and a "categories" array with content categories (violence, language, etc). Return results in JSON format matching the defined schema.',
      {
        type: Type.OBJECT,
        properties: {
          ageRating: { type: Type.NUMBER },
          explanation: { type: Type.STRING },
          categories: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
    );

    return response;
  }

  private async performRequest<T>(
    videoUrl: string,
    prompt: string,
    responseSchema: Record<string, any> = defaultResponseSchema,
  ): Promise<T> {
    const ai = new GoogleGenAI({
      apiKey: this.configService.get('geminiApi.apiKey'),
    });

    const base64VideoFile = fs.readFileSync(videoUrl, {
      encoding: 'base64',
    });

    const contents = [
      {
        inlineData: {
          mimeType: 'video/mp4',
          data: base64VideoFile,
        },
      },
      {
        text: prompt,
      },
    ];

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema,
      },
    });

    if (result.text) {
      return JSON.parse(result.text);
    }

    throw new Error('No response from Gemini');
  }
}
