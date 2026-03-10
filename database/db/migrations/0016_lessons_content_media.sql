-- Optional media items per lesson (audio, video, pdf, link) for admin review
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "content_media" jsonb DEFAULT '[]';
