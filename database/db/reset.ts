/**
 * Reset database: drop public schema and recreate from scratch, then push schema and seed.
 * Run from repo root: npm run db:reset
 */
import 'dotenv/config';
import { Client } from 'pg';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

const connectionString = process.env.DATABASE_URL;
if (!connectionString || typeof connectionString !== 'string') {
  console.error('DATABASE_URL is not set. Add it to .env (see .env.example).');
  process.exit(1);
}

async function reset() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Dropping public schema (all tables, enums, etc.)...');
    await client.query('DROP SCHEMA IF EXISTS public CASCADE;');
    await client.query('CREATE SCHEMA public;');
    await client.query('GRANT ALL ON SCHEMA public TO public;');
    console.log('Schema reset. Applying current schema (db:push)...');
  } finally {
    await client.end();
  }

  const push = spawnSync('npm', ['run', 'db:push'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
  });
  if (push.status !== 0) {
    console.error('db:push failed.');
    process.exit(push.status ?? 1);
  }

  console.log('Seeding departments and initial data (db:seed)...');
  const seed = spawnSync('npm', ['run', 'db:seed'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
  });
  if (seed.status !== 0) {
    console.error('db:seed failed.');
    process.exit(seed.status ?? 1);
  }

  console.log('Database reset complete. You can run the server and test from scratch.');
}

reset().catch((e) => {
  console.error(e);
  process.exit(1);
});
