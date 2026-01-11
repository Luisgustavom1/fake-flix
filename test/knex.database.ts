import knex from 'knex';

export const testDbClient = knex({
  client: 'pg',
  searchPath: ['content', 'identity', 'billing', 'public'],
  connection: {
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  },
});
