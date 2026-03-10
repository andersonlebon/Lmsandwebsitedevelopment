-- Add lesson content fields
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "content" text DEFAULT '';
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "content_fr" text DEFAULT '';
