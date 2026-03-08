CREATE TABLE "program_classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"name" text DEFAULT '',
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"day_of_week" integer,
	"room" text DEFAULT '',
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "class_id" uuid;