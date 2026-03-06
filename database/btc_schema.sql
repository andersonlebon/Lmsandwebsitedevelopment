-- ============================================================
-- BTC (Brotherly Training Center) - Full PostgreSQL Schema
-- ============================================================
-- Run this in Supabase Dashboard > SQL Editor
-- This creates all tables, indexes, RLS policies, triggers,
-- and seeds the 4 BTC departments.
-- ============================================================

-- ──────────────────────────────────────
-- 0. EXTENSIONS
-- ──────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ──────────────────────────────────────
-- 1. CUSTOM TYPES (ENUMS)
-- ──────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'staff', 'student');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'dropped', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending_approval', 'completed', 'rejected', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_mode AS ENUM ('cash', 'airtel_money', 'orange_money', 'mobile_money', 'visa_card');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE currency_code AS ENUM ('USD', 'CDF', 'RWF');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE program_status AS ENUM ('active', 'archived', 'draft');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE contact_status AS ENUM ('unread', 'read', 'replied', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ──────────────────────────────────────
-- 2. HELPER: auto-update updated_at
-- ──────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────
-- 3. DEPARTMENTS
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL UNIQUE,
  name_fr       TEXT NOT NULL DEFAULT '',
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT DEFAULT '',
  description_fr TEXT DEFAULT '',
  icon          TEXT DEFAULT '',
  color         TEXT DEFAULT '#10b981',
  head_id       UUID,                    -- FK to profiles, added after profiles table
  is_active     BOOLEAN DEFAULT TRUE,
  sort_order    INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────
-- 4. PROFILES (extends Supabase auth.users)
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  role            user_role NOT NULL DEFAULT 'student',
  department_id   UUID REFERENCES departments(id) ON DELETE SET NULL,
  phone           TEXT DEFAULT '',
  avatar_url      TEXT DEFAULT '',
  bio             TEXT DEFAULT '',
  is_super_admin  BOOLEAN DEFAULT FALSE,
  is_active       BOOLEAN DEFAULT TRUE,
  email_confirmed BOOLEAN DEFAULT FALSE,
  -- Student-specific fields
  student_id_number TEXT UNIQUE,         -- e.g. BTC-2026-0001
  date_of_birth   DATE,
  gender          TEXT CHECK (gender IN ('male', 'female', 'other')),
  address         TEXT DEFAULT '',
  emergency_contact TEXT DEFAULT '',
  emergency_phone TEXT DEFAULT '',
  -- Staff-specific fields
  specialization  TEXT DEFAULT '',
  hire_date       DATE,
  -- Metadata
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_department ON profiles(department_id);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_student_id ON profiles(student_id_number) WHERE student_id_number IS NOT NULL;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Now add FK for department head
ALTER TABLE departments
  ADD CONSTRAINT fk_departments_head
  FOREIGN KEY (head_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- ──────────────────────────────────────
-- 5. PROGRAMS (with embedded fees as JSONB)
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS programs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  name_fr         TEXT DEFAULT '',
  department_id   UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  description     TEXT DEFAULT '',
  description_fr  TEXT DEFAULT '',
  duration        TEXT DEFAULT '',        -- e.g. "3 months", "6 months"
  duration_months INT DEFAULT 0,
  level           TEXT DEFAULT 'beginner', -- beginner, intermediate, advanced
  max_students    INT DEFAULT 30,
  status          program_status DEFAULT 'active',
  -- Fee structure: array of {id, name, name_fr, amount, currency, type, description}
  -- type: "registration", "tuition", "material", "exam", "certificate", "other"
  fees            JSONB DEFAULT '[]',
  total_fee_usd   DECIMAL(10,2) DEFAULT 0,
  -- Metadata
  image_url       TEXT DEFAULT '',
  syllabus        JSONB DEFAULT '[]',
  requirements    TEXT DEFAULT '',
  requirements_fr TEXT DEFAULT '',
  sort_order      INT DEFAULT 0,
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_programs_department ON programs(department_id);
CREATE INDEX idx_programs_status ON programs(status);

CREATE TRIGGER programs_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────
-- 6. COURSES (individual classes within programs)
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  name_fr         TEXT DEFAULT '',
  code            TEXT UNIQUE,            -- e.g. ENG-101, CS-201
  department_id   UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  program_id      UUID REFERENCES programs(id) ON DELETE SET NULL,
  instructor_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  description     TEXT DEFAULT '',
  description_fr  TEXT DEFAULT '',
  credits         INT DEFAULT 0,
  max_students    INT DEFAULT 30,
  -- Schedule
  schedule        JSONB DEFAULT '{}',     -- { days: ["Mon","Wed"], startTime: "08:00", endTime: "10:00", room: "A1" }
  start_date      DATE,
  end_date        DATE,
  -- Status
  is_active       BOOLEAN DEFAULT TRUE,
  is_published    BOOLEAN DEFAULT FALSE,
  -- Content
  image_url       TEXT DEFAULT '',
  materials       JSONB DEFAULT '[]',     -- Array of {id, title, type, url}
  syllabus_weeks  JSONB DEFAULT '[]',     -- Array of {week, topic, description}
  -- Metadata
  metadata        JSONB DEFAULT '{}',
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_courses_department ON courses(department_id);
CREATE INDEX idx_courses_program ON courses(program_id);
CREATE INDEX idx_courses_instructor ON courses(instructor_id);

CREATE TRIGGER courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────
-- 7. ENROLLMENTS
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id      UUID REFERENCES programs(id) ON DELETE SET NULL,
  course_id       UUID REFERENCES courses(id) ON DELETE SET NULL,
  status          enrollment_status DEFAULT 'active',
  enrolled_at     TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  dropped_at      TIMESTAMPTZ,
  progress        INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  grade           TEXT DEFAULT '',
  notes           TEXT DEFAULT '',
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  -- A student can only enroll once per program/course combo
  UNIQUE(student_id, program_id, course_id)
);

CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_program ON enrollments(program_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);

CREATE TRIGGER enrollments_updated_at
  BEFORE UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────
-- 8. PAYMENTS
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id        UUID REFERENCES programs(id) ON DELETE SET NULL,
  enrollment_id     UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  -- Payment details
  amount            DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  currency          currency_code NOT NULL DEFAULT 'USD',
  payment_mode      payment_mode NOT NULL DEFAULT 'cash',
  status            payment_status NOT NULL DEFAULT 'pending_approval',
  -- Fee item reference (matches fee id in program.fees JSONB)
  fee_item_id       TEXT DEFAULT '',
  fee_item_name     TEXT DEFAULT '',
  -- Receipt/proof
  receipt_url       TEXT DEFAULT '',
  transaction_ref   TEXT DEFAULT '',       -- mobile money or card transaction reference
  -- Approval workflow
  approved_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at       TIMESTAMPTZ,
  rejected_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  rejected_at       TIMESTAMPTZ,
  rejection_reason  TEXT DEFAULT '',
  -- Metadata
  description       TEXT DEFAULT '',
  notes             TEXT DEFAULT '',
  metadata          JSONB DEFAULT '{}',
  paid_at           TIMESTAMPTZ DEFAULT NOW(),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_program ON payments(program_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_mode ON payments(payment_mode);
CREATE INDEX idx_payments_created ON payments(created_at DESC);

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────
-- 9. ATTENDANCE
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  status          attendance_status NOT NULL DEFAULT 'present',
  check_in_time   TIME,
  check_out_time  TIME,
  notes           TEXT DEFAULT '',
  marked_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  -- One record per student per course per day
  UNIQUE(student_id, course_id, date)
);

CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_course ON attendance(course_id);
CREATE INDEX idx_attendance_date ON attendance(date DESC);

CREATE TRIGGER attendance_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────
-- 10. CERTIFICATES
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS certificates (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id        UUID REFERENCES programs(id) ON DELETE SET NULL,
  course_id         UUID REFERENCES courses(id) ON DELETE SET NULL,
  certificate_number TEXT UNIQUE NOT NULL,  -- e.g. BTC-CERT-2026-0001
  title             TEXT NOT NULL,
  title_fr          TEXT DEFAULT '',
  description       TEXT DEFAULT '',
  grade             TEXT DEFAULT '',
  issue_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date       DATE,
  pdf_url           TEXT DEFAULT '',
  is_valid          BOOLEAN DEFAULT TRUE,
  issued_by         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_certificates_student ON certificates(student_id);
CREATE INDEX idx_certificates_number ON certificates(certificate_number);

CREATE TRIGGER certificates_updated_at
  BEFORE UPDATE ON certificates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────
-- 11. CONTACT MESSAGES
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT DEFAULT '',
  subject         TEXT DEFAULT '',
  message         TEXT NOT NULL,
  status          contact_status DEFAULT 'unread',
  replied_at      TIMESTAMPTZ,
  replied_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reply_text      TEXT DEFAULT '',
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contacts_status ON contact_messages(status);
CREATE INDEX idx_contacts_created ON contact_messages(created_at DESC);

CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON contact_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────
-- 12. NOTIFICATIONS
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  message         TEXT NOT NULL,
  type            TEXT DEFAULT 'info',    -- info, success, warning, error, payment, enrollment
  is_read         BOOLEAN DEFAULT FALSE,
  link            TEXT DEFAULT '',        -- Optional deep link
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE NOT is_read;

-- ──────────────────────────────────────
-- 13. SETTINGS (generic key-value for app config)
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_settings (
  key             TEXT PRIMARY KEY,
  value           JSONB NOT NULL DEFAULT '{}',
  description     TEXT DEFAULT '',
  updated_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────
-- 14. STUDENT ID SEQUENCE (auto-increment for student IDs)
-- ──────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS student_id_seq START 1;

CREATE OR REPLACE FUNCTION generate_student_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'student' AND NEW.student_id_number IS NULL THEN
    NEW.student_id_number := 'BTC-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(nextval('student_id_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_student_id
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION generate_student_id();

-- ──────────────────────────────────────
-- 15. CERTIFICATE NUMBER SEQUENCE
-- ──────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS cert_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_cert_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.certificate_number IS NULL OR NEW.certificate_number = '' THEN
    NEW.certificate_number := 'BTC-CERT-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(nextval('cert_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_cert_number
  BEFORE INSERT ON certificates
  FOR EACH ROW EXECUTE FUNCTION generate_cert_number();

-- ──────────────────────────────────────
-- 16. AUTO-CREATE PROFILE ON AUTH SIGNUP
-- ──────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, role, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if present, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ──────────────────────────────────────
-- 17. ROW LEVEL SECURITY (RLS)
-- ──────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Helper: Check if user is admin
CREATE OR REPLACE FUNCTION is_admin(uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = uid AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: Check if user is staff (teachers, coordinators, etc.)
CREATE OR REPLACE FUNCTION is_staff_member(uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = uid AND role = 'staff');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: Check if user is admin or staff
CREATE OR REPLACE FUNCTION is_admin_or_staff(uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = uid AND (role = 'admin' OR role = 'staff'));
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── PROFILES ──
-- Users can read their own profile; admin/staff can read all
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_select_admin_staff" ON profiles
  FOR SELECT USING (is_admin_or_staff(auth.uid()));
-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);
-- Admins can update any profile
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (is_admin(auth.uid()));
-- Admins can insert (for creating staff/students)
CREATE POLICY "profiles_insert_admin" ON profiles
  FOR INSERT WITH CHECK (is_admin(auth.uid()) OR auth.uid() = id);
-- Service role bypass (for trigger)
CREATE POLICY "profiles_service_insert" ON profiles
  FOR INSERT WITH CHECK (TRUE);

-- ── DEPARTMENTS ──
-- Everyone can read departments (public info)
CREATE POLICY "departments_select_all" ON departments
  FOR SELECT USING (TRUE);
-- Only admins can modify
CREATE POLICY "departments_insert_admin" ON departments
  FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "departments_update_admin" ON departments
  FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "departments_delete_admin" ON departments
  FOR DELETE USING (is_admin(auth.uid()));

-- ── PROGRAMS ──
-- Everyone can read active programs (public course catalog)
CREATE POLICY "programs_select_all" ON programs
  FOR SELECT USING (TRUE);
-- Only admins can modify
CREATE POLICY "programs_insert_admin" ON programs
  FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "programs_update_admin" ON programs
  FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "programs_delete_admin" ON programs
  FOR DELETE USING (is_admin(auth.uid()));

-- ── COURSES ──
-- Everyone can read published courses
CREATE POLICY "courses_select_all" ON courses
  FOR SELECT USING (TRUE);
-- Admin and staff can modify
CREATE POLICY "courses_insert_admin_staff" ON courses
  FOR INSERT WITH CHECK (is_admin_or_staff(auth.uid()));
CREATE POLICY "courses_update_admin_staff" ON courses
  FOR UPDATE USING (is_admin_or_staff(auth.uid()));
CREATE POLICY "courses_delete_admin" ON courses
  FOR DELETE USING (is_admin(auth.uid()));

-- ── ENROLLMENTS ──
-- Students see their own; admin/staff sees all
CREATE POLICY "enrollments_select_own" ON enrollments
  FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "enrollments_select_admin_staff" ON enrollments
  FOR SELECT USING (is_admin_or_staff(auth.uid()));
-- Students can create their own enrollment
CREATE POLICY "enrollments_insert_own" ON enrollments
  FOR INSERT WITH CHECK (auth.uid() = student_id OR is_admin(auth.uid()));
-- Admin/staff can update enrollments
CREATE POLICY "enrollments_update_admin_staff" ON enrollments
  FOR UPDATE USING (is_admin_or_staff(auth.uid()));

-- ── PAYMENTS ──
-- Students see their own; admin/staff sees all
CREATE POLICY "payments_select_own" ON payments
  FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "payments_select_admin_staff" ON payments
  FOR SELECT USING (is_admin_or_staff(auth.uid()));
-- Students can create their own payments
CREATE POLICY "payments_insert_own" ON payments
  FOR INSERT WITH CHECK (auth.uid() = student_id OR is_admin(auth.uid()));
-- Admins can update (approve/reject)
CREATE POLICY "payments_update_admin" ON payments
  FOR UPDATE USING (is_admin(auth.uid()));

-- ── ATTENDANCE ──
-- Students see their own; admin/staff sees all
CREATE POLICY "attendance_select_own" ON attendance
  FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "attendance_select_admin_staff" ON attendance
  FOR SELECT USING (is_admin_or_staff(auth.uid()));
-- Admin/staff can insert/update attendance
CREATE POLICY "attendance_insert_admin_staff" ON attendance
  FOR INSERT WITH CHECK (is_admin_or_staff(auth.uid()));
CREATE POLICY "attendance_update_admin_staff" ON attendance
  FOR UPDATE USING (is_admin_or_staff(auth.uid()));

-- ── CERTIFICATES ──
-- Students see their own; admin/staff sees all
CREATE POLICY "certificates_select_own" ON certificates
  FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "certificates_select_admin_staff" ON certificates
  FOR SELECT USING (is_admin_or_staff(auth.uid()));
-- Admins can manage
CREATE POLICY "certificates_insert_admin" ON certificates
  FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "certificates_update_admin" ON certificates
  FOR UPDATE USING (is_admin(auth.uid()));

-- ── CONTACT MESSAGES ──
-- Anyone can insert (public contact form)
CREATE POLICY "contacts_insert_public" ON contact_messages
  FOR INSERT WITH CHECK (TRUE);
-- Only admin/staff can read
CREATE POLICY "contacts_select_admin_staff" ON contact_messages
  FOR SELECT USING (is_admin_or_staff(auth.uid()));
-- Admin/staff can update (mark as read, reply)
CREATE POLICY "contacts_update_admin_staff" ON contact_messages
  FOR UPDATE USING (is_admin_or_staff(auth.uid()));

-- ── NOTIFICATIONS ──
-- Users see their own
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (auth.uid() = user_id);
-- System/admins can insert
CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (is_admin(auth.uid()) OR auth.uid() = user_id);
-- Users can update their own (mark as read)
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ── APP SETTINGS ──
-- Admin/staff can read
CREATE POLICY "settings_select_admin_staff" ON app_settings
  FOR SELECT USING (is_admin_or_staff(auth.uid()));
-- Admins can modify
CREATE POLICY "settings_insert_admin" ON app_settings
  FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "settings_update_admin" ON app_settings
  FOR UPDATE USING (is_admin(auth.uid()));

-- ──────────────────────────────────────
-- 18. VIEWS (useful aggregations)
-- ──────────────────────────────────────

-- Student overview with enrollment count and payment totals
CREATE OR REPLACE VIEW student_overview AS
SELECT
  p.id,
  p.email,
  p.name,
  p.student_id_number,
  p.phone,
  p.is_active,
  d.name AS department_name,
  COUNT(DISTINCT e.id) AS enrollment_count,
  COALESCE(SUM(CASE WHEN pay.status = 'completed' THEN pay.amount ELSE 0 END), 0) AS total_paid,
  COUNT(DISTINCT CASE WHEN pay.status = 'pending_approval' THEN pay.id END) AS pending_payments,
  p.created_at
FROM profiles p
LEFT JOIN departments d ON p.department_id = d.id
LEFT JOIN enrollments e ON e.student_id = p.id
LEFT JOIN payments pay ON pay.student_id = p.id
WHERE p.role = 'student'
GROUP BY p.id, p.email, p.name, p.student_id_number, p.phone, p.is_active, d.name, p.created_at;

-- Revenue summary by department
CREATE OR REPLACE VIEW department_revenue AS
SELECT
  d.id AS department_id,
  d.name AS department_name,
  COUNT(DISTINCT pay.id) AS payment_count,
  COALESCE(SUM(CASE WHEN pay.status = 'completed' AND pay.currency = 'USD' THEN pay.amount ELSE 0 END), 0) AS revenue_usd,
  COALESCE(SUM(CASE WHEN pay.status = 'completed' AND pay.currency = 'CDF' THEN pay.amount ELSE 0 END), 0) AS revenue_cdf,
  COUNT(DISTINCT CASE WHEN pay.status = 'pending_approval' THEN pay.id END) AS pending_count
FROM departments d
LEFT JOIN programs prog ON prog.department_id = d.id
LEFT JOIN payments pay ON pay.program_id = prog.id
GROUP BY d.id, d.name;

-- Monthly revenue trend
CREATE OR REPLACE VIEW monthly_revenue AS
SELECT
  DATE_TRUNC('month', pay.created_at) AS month,
  pay.currency,
  SUM(pay.amount) AS total,
  COUNT(*) AS transaction_count
FROM payments pay
WHERE pay.status = 'completed'
GROUP BY DATE_TRUNC('month', pay.created_at), pay.currency
ORDER BY month DESC;

-- ──────────────────────────────────────
-- 19. SEED DATA: BTC Departments
-- ──────────────────────────────────────
INSERT INTO departments (name, name_fr, slug, description, description_fr, icon, color, sort_order) VALUES
  ('English', 'Anglais', 'english',
   'English language courses from beginner to advanced',
   'Cours d''anglais du niveau debutant au niveau avance',
   'Languages', '#3b82f6', 1),
  ('Computer Science', 'Informatique', 'computer-science',
   'Computer literacy, programming, and IT skills',
   'Alphabetisation informatique, programmation et competences IT',
   'Monitor', '#8b5cf6', 2),
  ('Driving', 'Auto-Ecole', 'driving',
   'Professional driving training and licensing',
   'Formation de conduite professionnelle et permis de conduire',
   'Car', '#f59e0b', 3),
  ('Sewing', 'Couture', 'sewing',
   'Fashion design, tailoring, and textile arts',
   'Design de mode, couture et arts textiles',
   'Scissors', '#ec4899', 4)
ON CONFLICT (slug) DO NOTHING;

-- ──────────────────────────────────────
-- 20. SEED DATA: Default app settings
-- ──────────────────────────────────────
INSERT INTO app_settings (key, value, description) VALUES
  ('school_info', '{
    "name": "Brotherly Training Center",
    "name_fr": "Centre de Formation Fraternelle",
    "abbreviation": "BTC",
    "address": "Goma, North Kivu, DRC",
    "phone": "+243 XXX XXX XXX",
    "email": "info@btcgoma.com",
    "website": "https://btcgoma.com"
  }'::jsonb, 'School contact and identity information'),
  ('academic_year', '{
    "current": "2025-2026",
    "start_date": "2025-09-01",
    "end_date": "2026-07-31"
  }'::jsonb, 'Current academic year configuration'),
  ('payment_config', '{
    "currencies": ["USD", "CDF", "RWF"],
    "default_currency": "USD",
    "payment_modes": ["cash", "airtel_money", "orange_money", "mobile_money", "visa_card"],
    "auto_approve_digital": true,
    "require_receipt_for_cash": true
  }'::jsonb, 'Payment system configuration')
ON CONFLICT (key) DO NOTHING;

-- ──────────────────────────────────────
-- 21. STORAGE BUCKETS (run separately if needed)
-- ──────────────────────────────────────
-- Note: Storage buckets must be created via the Supabase Dashboard
-- or via the Storage API. Create these buckets:
--   - btc-avatars        (profile photos)
--   - btc-receipts       (payment receipt uploads)
--   - btc-certificates   (generated certificate PDFs)
--   - btc-materials      (course materials)

-- ──────────────────────────────────────
-- DONE! Schema ready for BTC LMS.
-- ──────────────────────────────────────

-- Quick verification query (run after schema creation):
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
-- ORDER BY table_name;
