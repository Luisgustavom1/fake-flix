import * as nock from 'nock';

export const searchKeyword = (keyword: string) => {
  return nock('https://api.themoviedb.org/3', {
    encodedQueryParams: true,
    reqheaders: {
      authorization: () => true
    }
  }).defaultReplyHeaders({
    'access-control-allow-origin': '*'
  }).get('/search/keyword').query({
    query: keyword, 
    page : '1',
  })
}

export const searchMovie = () => {
  return nock('https://api.themoviedb.org/3', {
    encodedQueryParams: true,
    reqheaders: {
      authorization: () => true
    }
  }).defaultReplyHeaders({
    'access-control-allow-origin': '*'
  }).get('/discover/movie').query({
    with_keywords: '1',
  })
}