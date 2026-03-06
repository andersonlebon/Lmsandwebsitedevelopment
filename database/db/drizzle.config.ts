import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './database/db/schema.ts',
  out: './database/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
});
