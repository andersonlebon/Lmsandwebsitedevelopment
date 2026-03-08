-- Assignment status enum for enrollment progress
CREATE TYPE "assignment_status" AS ENUM('not_started', 'in_progress', 'submitted', 'graded');

-- Enrollment progress: payment, learning, exercises, assessment, assignments
CREATE TABLE IF NOT EXISTS "enrollment_progress" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "enrollment_id" uuid NOT NULL UNIQUE,
  "amount_paid" numeric(12, 2) DEFAULT '0',
  "total_amount" numeric(12, 2) DEFAULT '0',
  "learning_percent" integer DEFAULT 0,
  "exercises_completed" integer DEFAULT 0,
  "exercises_total" integer DEFAULT 0,
  "assessment_score" numeric(6, 2),
  "assessment_max" integer DEFAULT 100,
  "assignment_status" "assignment_status" DEFAULT 'not_started',
  "assignment_score" numeric(6, 2),
  "updated_at" timestamp with time zone DEFAULT now()
);

ALTER TABLE "enrollment_progress" ADD CONSTRAINT "enrollment_progress_enrollment_id_enrollments_id_fk"
  FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

CREATE INDEX IF NOT EXISTS "enrollment_progress_enrollment_id_idx" ON "enrollment_progress" ("enrollment_id");
