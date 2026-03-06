import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  jsonb,
  pgEnum,
  date,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

const timestamptz = (name: string) =>
  timestamp(name, { withTimezone: true }).defaultNow();

// ─── Enums ─────────────────────────────────────────────────────────────
export const userRoleEnum = pgEnum('user_role', ['admin', 'staff', 'student']);
export const programStatusEnum = pgEnum('program_status', [
  'active',
  'archived',
  'draft',
]);

// ─── Departments ────────────────────────────────────────────────────────
export const departments = pgTable('departments', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  nameFr: text('name_fr').notNull().default(''),
  slug: text('slug').notNull().unique(),
  description: text('description').default(''),
  descriptionFr: text('description_fr').default(''),
  icon: text('icon').default(''),
  color: text('color').default('#10b981'),
  headId: uuid('head_id'),
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamptz('created_at'),
  updatedAt: timestamptz('updated_at'),
});

// ─── Profiles (extends auth.users; no FK to auth in Drizzle) ──────────────
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: userRoleEnum('role').notNull().default('student'),
  departmentId: uuid('department_id'),
  phone: text('phone').default(''),
  avatarUrl: text('avatar_url').default(''),
  bio: text('bio').default(''),
  isSuperAdmin: boolean('is_super_admin').default(false),
  isActive: boolean('is_active').default(true),
  emailConfirmed: boolean('email_confirmed').default(false),
  studentIdNumber: text('student_id_number').unique(),
  dateOfBirth: date('date_of_birth'),
  gender: text('gender'),
  address: text('address').default(''),
  emergencyContact: text('emergency_contact').default(''),
  emergencyPhone: text('emergency_phone').default(''),
  specialization: text('specialization').default(''),
  hireDate: date('hire_date'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamptz('created_at'),
  updatedAt: timestamptz('updated_at'),
});

// ─── Programs ───────────────────────────────────────────────────────────
export const programs = pgTable('programs', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  nameFr: text('name_fr').default(''),
  departmentId: uuid('department_id').notNull(),
  description: text('description').default(''),
  descriptionFr: text('description_fr').default(''),
  duration: text('duration').default(''),
  durationMonths: integer('duration_months').default(0),
  level: text('level').default('beginner'),
  maxStudents: integer('max_students').default(30),
  status: programStatusEnum('status').default('active'),
  fees: jsonb('fees').default([]),
  totalFeeUsd: numeric('total_fee_usd', { precision: 10, scale: 2 }).default('0'),
  imageUrl: text('image_url').default(''),
  syllabus: jsonb('syllabus').default([]),
  requirements: text('requirements').default(''),
  requirementsFr: text('requirements_fr').default(''),
  sortOrder: integer('sort_order').default(0),
  createdBy: uuid('created_by'),
  createdAt: timestamptz('created_at'),
  updatedAt: timestamptz('updated_at'),
});

// Relations
export const departmentsRelations = relations(departments, ({ many }) => ({
  programs: many(programs),
}));

export const programsRelations = relations(programs, ({ one }) => ({
  department: one(departments, {
    fields: [programs.departmentId],
    references: [departments.id],
  }),
}));
