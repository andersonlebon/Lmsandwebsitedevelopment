-- Lessons table (content to teach in a class session)
CREATE TABLE IF NOT EXISTS "lessons" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "title_fr" text DEFAULT '',
  "description" text,
  "description_fr" text,
  "program_id" uuid,
  "sort_order" integer DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone
);

-- Add lesson_id to staff_schedules; keep lesson_title for free text
ALTER TABLE "staff_schedules" ADD COLUMN IF NOT EXISTS "lesson_id" uuid REFERENCES "lessons"("id");
-- Remove activity_id if it exists (we use lessons now)
ALTER TABLE "staff_schedules" DROP COLUMN IF EXISTS "activity_id";
