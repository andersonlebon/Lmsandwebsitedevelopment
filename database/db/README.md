# BTC Database (Drizzle ORM)

Schema and seed live here. The schema mirrors `../btc_schema.sql` for PostgreSQL.

## Setup

1. Set `DATABASE_URL` in `.env` (Postgres connection string, e.g. from Supabase project settings).
2. Apply schema to your DB (choose one):
   - **Push (no migration files):** `npm run db:push`
   - **Generate + migrate:** `npm run db:generate` then `npm run db:migrate`
3. Seed departments: `npm run db:seed`

## Scripts (from repo root)

- `npm run db:generate` – generate migrations from schema
- `npm run db:push` – push schema to DB (dev)
- `npm run db:migrate` – run migrations
- `npm run db:seed` – seed 4 departments (English, Computer, Driving, Sewing)
- `npm run db:studio` – open Drizzle Studio

## Using the local API (fix 401 on program create)

1. Run the Node API: `npm run server` (listens on port 5000).
2. In `.env` set `VITE_API_URL=http://localhost:5000`.
3. Restart the frontend (`npm run dev`). Creating programs will use the local server with the same Supabase JWT; the server uses Drizzle and your Postgres so 401s from the Edge Function are avoided.
