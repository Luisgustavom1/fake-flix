import { Injectable } from '@nestjs/common';
import { HttpClient } from '@contentModule/infra/http/client/http.client';
import { ConfigService } from '@sharedModule/config/service/config.service';

interface ApiResponse<T extends Record<string, any>> {
  results: Array<T>;
}

@Injectable()
export class ExternalMovieClient {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly configService: ConfigService,
  ) {}

  async getRating(title: string): Promise<number | undefined> {
    const keywordId = await this.stringToKeywordId(title);
    if (!keywordId) return;

    const apiResponse = await this.fetch<{ vote_average: number }>(
      `discover/movie?with_keywords=${keywordId}`,
    );

    return apiResponse.results[0]?.vote_average;
  }

  private async stringToKeywordId(
    keyword: string,
  ): Promise<string | undefined> {
    const apiResponse = await this.fetch<{ id: string }>(
      `search/keyword?query=${encodeURI(keyword)}&page=1`,
    );
    return apiResponse.results[0]?.id;
  }

  private async fetch<T extends Record<string, any>>(
    path: string,
  ): Promise<ApiResponse<T>> {
    const movieDpApiToken = this.configService.get('movieDb').apiToken;
    const movieDbApiUrl = this.configService.get('movieDb').url;
    const url = `${movieDbApiUrl}/${path}`;
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${movieDpApiToken}`,
      },
    };

    return this.httpClient.get<ApiResponse<T>>(url, options);
  }
}
