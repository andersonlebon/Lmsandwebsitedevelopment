-- Link learning activities (exercises, assessments, assignments) to class events (staff_schedules)
-- so they belong to the schedule slot assigned to the teacher by admin, not to promotion/class.
CREATE TABLE IF NOT EXISTS "activity_staff_schedules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "activity_id" uuid NOT NULL REFERENCES "learning_activities"("id") ON DELETE CASCADE,
  "schedule_id" uuid NOT NULL REFERENCES "staff_schedules"("id") ON DELETE CASCADE,
  "sort_order" integer DEFAULT 0,
  "assigned_at" timestamptz DEFAULT now(),
  "assigned_by" uuid REFERENCES "profiles"("id") ON DELETE SET NULL,
  CONSTRAINT "activity_staff_schedules_activity_id_schedule_id_unique" UNIQUE("activity_id", "schedule_id")
);

CREATE INDEX IF NOT EXISTS "activity_staff_schedules_activity_id_idx" ON "activity_staff_schedules" ("activity_id");
CREATE INDEX IF NOT EXISTS "activity_staff_schedules_schedule_id_idx" ON "activity_staff_schedules" ("schedule_id");
