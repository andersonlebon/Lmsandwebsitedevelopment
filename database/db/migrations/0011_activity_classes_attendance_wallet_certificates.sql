-- Activity ↔ Class (assign activities to class)
CREATE TABLE IF NOT EXISTS "activity_classes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "activity_id" uuid NOT NULL,
  "class_id" uuid NOT NULL,
  "sort_order" integer DEFAULT 0,
  "assigned_at" timestamp with time zone DEFAULT now(),
  "assigned_by" uuid,
  UNIQUE("activity_id", "class_id")
);

-- Student attendance requests (location + teacher; lecturer approves)
CREATE TABLE IF NOT EXISTS "student_attendance_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid NOT NULL,
  "enrollment_id" uuid NOT NULL,
  "class_id" uuid NOT NULL,
  "teacher_id" uuid NOT NULL,
  "requested_at" timestamp with time zone DEFAULT now(),
  "latitude" numeric(10, 6),
  "longitude" numeric(10, 6),
  "address" text,
  "status" text DEFAULT 'pending' NOT NULL,
  "reviewed_by" uuid,
  "reviewed_at" timestamp with time zone,
  "reject_reason" text,
  "request_date" date NOT NULL,
  "created_at" timestamp with time zone DEFAULT now()
);

-- Staff schedules (admin assigns staff to classes per week)
CREATE TABLE IF NOT EXISTS "staff_schedules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "staff_id" uuid NOT NULL,
  "class_id" uuid NOT NULL,
  "week_start" date NOT NULL,
  "day_of_week" integer NOT NULL,
  "start_time" text NOT NULL,
  "end_time" text NOT NULL,
  "room" text,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now()
);

-- Lecturer attendance (staff marks presence; admin approves)
CREATE TABLE IF NOT EXISTS "lecturer_attendance" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "staff_id" uuid NOT NULL,
  "schedule_id" uuid,
  "class_id" uuid NOT NULL,
  "attendance_date" date NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "submitted_at" timestamp with time zone DEFAULT now(),
  "approved_by" uuid,
  "approved_at" timestamp with time zone,
  "reject_reason" text,
  "created_at" timestamp with time zone DEFAULT now()
);

-- Lecturer rate (admin sets rate per class)
CREATE TABLE IF NOT EXISTS "lecturer_rates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "staff_id" uuid NOT NULL,
  "rate_amount" numeric(10, 2) NOT NULL,
  "currency" text DEFAULT 'USD' NOT NULL,
  "rate_type" text DEFAULT 'per_class' NOT NULL,
  "description" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone
);

-- Lecturer wallet
CREATE TABLE IF NOT EXISTS "lecturer_wallets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "staff_id" uuid NOT NULL UNIQUE,
  "balance" numeric(12, 2) DEFAULT '0' NOT NULL,
  "currency" text DEFAULT 'USD' NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "lecturer_wallet_transactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "wallet_id" uuid NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "type" text NOT NULL,
  "reference_id" uuid,
  "description" text,
  "created_at" timestamp with time zone DEFAULT now()
);

-- Certificates
CREATE TABLE IF NOT EXISTS "certificates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid NOT NULL,
  "program_id" uuid NOT NULL,
  "promotion_id" uuid NOT NULL,
  "enrollment_id" uuid,
  "issued_at" timestamp with time zone DEFAULT now(),
  "certificate_code" text UNIQUE,
  "pdf_url" text,
  "metadata" jsonb DEFAULT '{}',
  "created_at" timestamp with time zone DEFAULT now()
);
