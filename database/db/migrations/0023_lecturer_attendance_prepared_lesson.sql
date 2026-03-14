-- Lecturer can record what lesson they prepared/taught for that class day (admin sees it when reviewing)
ALTER TABLE "lecturer_attendance" ADD COLUMN IF NOT EXISTS "prepared_lesson" text DEFAULT '';
