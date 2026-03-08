CREATE TYPE "public"."activity_item_type" AS ENUM('multiple_choice', 'theoretical', 'video', 'audio', 'listening', 'reading', 'true_false', 'matching', 'fill_blank');--> statement-breakpoint
CREATE TYPE "public"."activity_type" AS ENUM('exercise', 'assessment', 'assignment');--> statement-breakpoint
CREATE TYPE "public"."assignment_status" AS ENUM('not_started', 'in_progress', 'submitted', 'graded');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending_approval', 'completed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('draft', 'submitted', 'graded');--> statement-breakpoint
CREATE TABLE "activity_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0,
	"item_type" "activity_item_type" NOT NULL,
	"question_text" text NOT NULL,
	"question_text_fr" text DEFAULT '',
	"options" jsonb DEFAULT '[]'::jsonb,
	"correct_answer" jsonb,
	"media_url" text,
	"media_type" text,
	"max_score" numeric(6, 2) DEFAULT '1',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "activity_promotions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"promotion_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0,
	"assigned_at" timestamp with time zone DEFAULT now(),
	"assigned_by" uuid,
	CONSTRAINT "activity_promotions_activity_id_promotion_id_unique" UNIQUE("activity_id","promotion_id")
);
--> statement-breakpoint
CREATE TABLE "activity_submission_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"activity_item_id" uuid NOT NULL,
	"response" jsonb,
	"score" numeric(6, 2),
	"feedback" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "activity_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"activity_id" uuid NOT NULL,
	"status" "submission_status" DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now(),
	"score" numeric(8, 2),
	"max_score" numeric(8, 2),
	"feedback" text,
	"graded_by" uuid,
	"graded_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "enrollment_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"amount_paid" numeric(12, 2) DEFAULT '0',
	"total_amount" numeric(12, 2) DEFAULT '0',
	"learning_percent" integer DEFAULT 0,
	"exercises_completed" integer DEFAULT 0,
	"exercises_total" integer DEFAULT 0,
	"assessment_score" numeric(6, 2),
	"assessment_max" integer DEFAULT 100,
	"assignment_status" "assignment_status" DEFAULT 'not_started',
	"assignment_score" numeric(6, 2),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "enrollment_progress_enrollment_id_unique" UNIQUE("enrollment_id")
);
--> statement-breakpoint
CREATE TABLE "learning_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "activity_type" NOT NULL,
	"title" text NOT NULL,
	"title_fr" text DEFAULT '',
	"description" text DEFAULT '',
	"description_fr" text DEFAULT '',
	"instructions" text DEFAULT '',
	"instructions_fr" text DEFAULT '',
	"program_id" uuid,
	"created_by" uuid,
	"requires_submission" boolean DEFAULT false,
	"max_score" numeric(8, 2) DEFAULT '0',
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"enrollment_id" uuid,
	"program_id" uuid,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"method" text NOT NULL,
	"status" "payment_status" DEFAULT 'pending_approval' NOT NULL,
	"receipt_url" text,
	"transaction_ref" text,
	"fee_id" text,
	"fee_name" text,
	"description" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"approved_at" timestamp with time zone DEFAULT now(),
	"approved_by" uuid,
	"rejected_at" timestamp with time zone DEFAULT now(),
	"reject_reason" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
