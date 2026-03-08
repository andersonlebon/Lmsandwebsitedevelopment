CREATE TYPE "public"."duration_unit" AS ENUM('days', 'weeks', 'months', 'trimestre');--> statement-breakpoint
CREATE TYPE "public"."enrollment_status" AS ENUM('active', 'completed', 'dropped', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."promotion_status" AS ENUM('upcoming', 'active', 'ended');--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"program_id" uuid,
	"promotion_id" uuid,
	"status" "enrollment_status" DEFAULT 'active' NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now(),
	"progress" integer DEFAULT 0,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"name" text NOT NULL,
	"name_fr" text DEFAULT '',
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"duration_unit" "duration_unit" DEFAULT 'months' NOT NULL,
	"status" "promotion_status" DEFAULT 'upcoming' NOT NULL,
	"max_students" integer DEFAULT 30,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
