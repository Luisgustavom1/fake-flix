import { z } from 'zod';

export const environmentSchema = z.enum(['test', 'development', 'production']);

export const databaseSchema = z.object({
  host: z.string(),
  port: z.coerce.number(),
  url: z.string().startsWith('postgresql://'),
  username: z.string(),
  password: z.string(),
  database: z.string(),
});

const billingApiSchema = z.object({
  url: z.string(),
});

export const movieDbSchema = z.object({
  apiToken: z.string(),
  url: z.string().url(),
});

const geminiApiSchema = z.object({
  apiKey: z.string(),
  url: z.string().url(),
});

export const configSchema = z.object({
  env: environmentSchema,
  database: databaseSchema,
  movieDb: movieDbSchema,
  billingApi: billingApiSchema,
  port: z.coerce.number().positive().int(),
  geminiApi: geminiApiSchema,
});
