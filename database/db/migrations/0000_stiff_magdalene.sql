CREATE TYPE "public"."program_status" AS ENUM('active', 'archived', 'draft');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'staff', 'student');--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_fr" text DEFAULT '' NOT NULL,
	"slug" text NOT NULL,
	"description" text DEFAULT '',
	"description_fr" text DEFAULT '',
	"icon" text DEFAULT '',
	"color" text DEFAULT '#10b981',
	"head_id" uuid,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "departments_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" "user_role" DEFAULT 'student' NOT NULL,
	"department_id" uuid,
	"phone" text DEFAULT '',
	"avatar_url" text DEFAULT '',
	"bio" text DEFAULT '',
	"is_super_admin" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"email_confirmed" boolean DEFAULT false,
	"student_id_number" text,
	"date_of_birth" date,
	"gender" text,
	"address" text DEFAULT '',
	"emergency_contact" text DEFAULT '',
	"emergency_phone" text DEFAULT '',
	"specialization" text DEFAULT '',
	"hire_date" date,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "profiles_email_unique" UNIQUE("email"),
	CONSTRAINT "profiles_student_id_number_unique" UNIQUE("student_id_number")
);
--> statement-breakpoint
CREATE TABLE "programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_fr" text DEFAULT '',
	"department_id" uuid NOT NULL,
	"description" text DEFAULT '',
	"description_fr" text DEFAULT '',
	"duration" text DEFAULT '',
	"duration_months" integer DEFAULT 0,
	"level" text DEFAULT 'beginner',
	"max_students" integer DEFAULT 30,
	"status" "program_status" DEFAULT 'active',
	"fees" jsonb DEFAULT '[]'::jsonb,
	"total_fee_usd" numeric(10, 2) DEFAULT '0',
	"image_url" text DEFAULT '',
	"syllabus" jsonb DEFAULT '[]'::jsonb,
	"requirements" text DEFAULT '',
	"requirements_fr" text DEFAULT '',
	"sort_order" integer DEFAULT 0,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
