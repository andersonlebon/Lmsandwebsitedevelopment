-- Student can leave a comment when submitting attendance
ALTER TABLE "student_attendance_requests" ADD COLUMN IF NOT EXISTS "comment" text DEFAULT '';

-- Lecturer submission includes list of student IDs who participated (for admin review and payroll)
ALTER TABLE "lecturer_attendance" ADD COLUMN IF NOT EXISTS "present_student_ids" jsonb DEFAULT '[]';
