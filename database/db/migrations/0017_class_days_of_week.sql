-- One class = one record; calendar events are derived from days_of_week
ALTER TABLE "program_classes" ADD COLUMN IF NOT EXISTS "days_of_week" jsonb DEFAULT '[]';
-- Backfill: existing rows with day_of_week become single-day class
UPDATE "program_classes" SET "days_of_week" = jsonb_build_array("day_of_week")
WHERE "day_of_week" IS NOT NULL AND (COALESCE("days_of_week", '[]'::jsonb) = '[]'::jsonb);
