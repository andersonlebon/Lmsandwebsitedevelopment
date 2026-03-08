ALTER TYPE "public"."enrollment_status" ADD VALUE 'pending' BEFORE 'active';--> statement-breakpoint
ALTER TABLE "enrollments" ALTER COLUMN "status" SET DEFAULT 'pending';