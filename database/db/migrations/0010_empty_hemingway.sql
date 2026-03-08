-- Roll number on student (profiles), not on enrollments. DROP IF EXISTS so migration works even when enrollments.roll_number was never added.
ALTER TABLE "enrollments" DROP CONSTRAINT IF EXISTS "enrollments_roll_number_unique";--> statement-breakpoint
ALTER TABLE "enrollments" DROP COLUMN IF EXISTS "roll_number";--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "roll_number" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_roll_number_unique" UNIQUE("roll_number");