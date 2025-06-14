import { ConfigException } from '../exception/config.exception';
import { configSchema } from './config.schema';
import { Config } from './config.type';

export const factory = (): Config => {
  const result = configSchema.safeParse({
    env: process.env.NODE_ENV,
    port: process.env.PORT,
    database: {
      host: process.env.DATABASE_HOST,
      port: process.env.DATABASE_PORT,
      url: process.env.DATABASE_URL,
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
    },
    movieDb: {
      apiToken: process.env.MOVIE_DB_API_TOKEN,
      url: process.env.MOVIE_DB_URL,
    },
    billingApi: {
      url: process.env.BILLING_API_URL,
    },
    geminiApi: {
      url: process.env.GEMINI_API_URL,
      apiKey: process.env.GEMINI_API_KEY,
    },
    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    },
  });

  if (result.success) {
    return result.data;
  }

  throw new ConfigException(
    `Invalid application configuration: ${result.error.message}`,
  );
};
