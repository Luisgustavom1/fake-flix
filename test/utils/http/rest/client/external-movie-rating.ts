import * as nock from 'nock';

export const searchKeyword = (keyword: string) => {
  return nock('https://api.themoviedb.org/3', {
    encodedQueryParams: true,
    reqheaders: {
      authorization: () => true,
    },
  })
    .defaultReplyHeaders({
      'access-control-allow-origin': '*',
    })
    .get('/search/keyword')
    .query({
      query: keyword,
      page: '1',
    });
};

export const searchMovie = () => {
  return nock('https://api.themoviedb.org/3', {
    encodedQueryParams: true,
    reqheaders: {
      authorization: () => true,
    },
  })
    .defaultReplyHeaders({
      'access-control-allow-origin': '*',
    })
    .get('/discover/movie')
    .query({
      with_keywords: '1',
    });
};

export const mockGenAi = (parts: { text: string }[]) => {
  return nock('https://generativelanguage.googleapis.com')
    .post('/v1beta/models/gemini-2.0-flash:generateContent')
    .query(true) // Match any query parameters
    .reply(200, {
      candidates: [
        {
          content: {
            parts,
          },
          finishReason: 'STOP',
          index: 0,
        },
      ],
    });
};
