ALTER TABLE "enrollments" ADD COLUMN "roll_number" text;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_roll_number_unique" UNIQUE("roll_number");