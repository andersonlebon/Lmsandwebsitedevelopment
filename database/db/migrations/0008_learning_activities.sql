-- Learning activities: exercises, assessments, assignments
CREATE TYPE "activity_type" AS ENUM('exercise', 'assessment', 'assignment');
CREATE TYPE "activity_item_type" AS ENUM(
  'multiple_choice', 'theoretical', 'video', 'audio', 'listening', 'reading',
  'true_false', 'matching', 'fill_blank'
);
CREATE TYPE "submission_status" AS ENUM('draft', 'submitted', 'graded');

CREATE TABLE IF NOT EXISTS "learning_activities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "type" "activity_type" NOT NULL,
  "title" text NOT NULL,
  "title_fr" text DEFAULT '',
  "description" text DEFAULT '',
  "description_fr" text DEFAULT '',
  "instructions" text DEFAULT '',
  "instructions_fr" text DEFAULT '',
  "program_id" uuid,
  "created_by" uuid,
  "requires_submission" boolean DEFAULT false,
  "max_score" numeric(8, 2) DEFAULT '0',
  "sort_order" integer DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone
);

ALTER TABLE "learning_activities" ADD CONSTRAINT "learning_activities_program_id_programs_id_fk"
  FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "learning_activities" ADD CONSTRAINT "learning_activities_created_by_profiles_id_fk"
  FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

CREATE TABLE IF NOT EXISTS "activity_promotions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "activity_id" uuid NOT NULL,
  "promotion_id" uuid NOT NULL,
  "sort_order" integer DEFAULT 0,
  "assigned_at" timestamp with time zone DEFAULT now(),
  "assigned_by" uuid,
  CONSTRAINT "activity_promotions_activity_id_promotion_id_unique" UNIQUE("activity_id", "promotion_id")
);

ALTER TABLE "activity_promotions" ADD CONSTRAINT "activity_promotions_activity_id_learning_activities_id_fk"
  FOREIGN KEY ("activity_id") REFERENCES "public"."learning_activities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "activity_promotions" ADD CONSTRAINT "activity_promotions_promotion_id_promotions_id_fk"
  FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "activity_promotions" ADD CONSTRAINT "activity_promotions_assigned_by_profiles_id_fk"
  FOREIGN KEY ("assigned_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

CREATE TABLE IF NOT EXISTS "activity_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "activity_id" uuid NOT NULL,
  "sort_order" integer DEFAULT 0,
  "item_type" "activity_item_type" NOT NULL,
  "question_text" text NOT NULL,
  "question_text_fr" text DEFAULT '',
  "options" jsonb DEFAULT '[]',
  "correct_answer" jsonb,
  "media_url" text,
  "media_type" text,
  "max_score" numeric(6, 2) DEFAULT '1',
  "metadata" jsonb DEFAULT '{}',
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone
);

ALTER TABLE "activity_items" ADD CONSTRAINT "activity_items_activity_id_learning_activities_id_fk"
  FOREIGN KEY ("activity_id") REFERENCES "public"."learning_activities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

CREATE TABLE IF NOT EXISTS "activity_submissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "enrollment_id" uuid NOT NULL,
  "activity_id" uuid NOT NULL,
  "status" "submission_status" NOT NULL DEFAULT 'draft',
  "submitted_at" timestamp with time zone,
  "score" numeric(8, 2),
  "max_score" numeric(8, 2),
  "feedback" text,
  "graded_by" uuid,
  "graded_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone
);

ALTER TABLE "activity_submissions" ADD CONSTRAINT "activity_submissions_enrollment_id_enrollments_id_fk"
  FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "activity_submissions" ADD CONSTRAINT "activity_submissions_activity_id_learning_activities_id_fk"
  FOREIGN KEY ("activity_id") REFERENCES "public"."learning_activities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "activity_submissions" ADD CONSTRAINT "activity_submissions_graded_by_profiles_id_fk"
  FOREIGN KEY ("graded_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

CREATE TABLE IF NOT EXISTS "activity_submission_responses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "submission_id" uuid NOT NULL,
  "activity_item_id" uuid NOT NULL,
  "response" jsonb,
  "score" numeric(6, 2),
  "feedback" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone
);

ALTER TABLE "activity_submission_responses" ADD CONSTRAINT "activity_submission_responses_submission_id_activity_submissions_id_fk"
  FOREIGN KEY ("submission_id") REFERENCES "public"."activity_submissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "activity_submission_responses" ADD CONSTRAINT "activity_submission_responses_activity_item_id_activity_items_id_fk"
  FOREIGN KEY ("activity_item_id") REFERENCES "public"."activity_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

CREATE INDEX IF NOT EXISTS "learning_activities_program_id_idx" ON "learning_activities" ("program_id");
CREATE INDEX IF NOT EXISTS "activity_promotions_activity_id_idx" ON "activity_promotions" ("activity_id");
CREATE INDEX IF NOT EXISTS "activity_promotions_promotion_id_idx" ON "activity_promotions" ("promotion_id");
CREATE INDEX IF NOT EXISTS "activity_items_activity_id_idx" ON "activity_items" ("activity_id");
CREATE INDEX IF NOT EXISTS "activity_submissions_enrollment_id_idx" ON "activity_submissions" ("enrollment_id");
CREATE INDEX IF NOT EXISTS "activity_submissions_activity_id_idx" ON "activity_submissions" ("activity_id");
CREATE INDEX IF NOT EXISTS "activity_submission_responses_submission_id_idx" ON "activity_submission_responses" ("submission_id");
