-- Rename student_id to profile_id in student_attendance_requests so querying/joining with profiles is explicit
ALTER TABLE "student_attendance_requests" RENAME COLUMN "student_id" TO "profile_id";
