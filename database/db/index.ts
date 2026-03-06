import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
console.log('connectionString', connectionString);
if (!connectionString || typeof connectionString !== 'string') {
  throw new Error('DATABASE_URL is not set or not a string. Add it to .env (see .env.example).');
}

const pool = new Pool({
  connectionString,
});

export const db = drizzle(pool);
export * from './schema';
