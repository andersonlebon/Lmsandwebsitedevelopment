-- Add lesson/course fields to staff_schedules
ALTER TABLE "staff_schedules" ADD COLUMN IF NOT EXISTS "lesson_title" text;
ALTER TABLE "staff_schedules" ADD COLUMN IF NOT EXISTS "activity_id" uuid;
