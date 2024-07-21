// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './drizzle/schema.ts',
  dialect: 'mysql',
  dbCredentials: {
    host: 'localhost',
    port: 3307,
    user: 'mj',
    password: 'alswp',
    database: 'test',
  },
  verbose: true,
  strict: true,
});
