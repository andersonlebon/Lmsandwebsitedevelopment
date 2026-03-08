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
  unique,
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

export const promotionStatusEnum = pgEnum('promotion_status', [
  'upcoming',
  'active',
  'ended',
]);

export const durationUnitEnum = pgEnum('duration_unit', [
  'days',
  'weeks',
  'months',
  'trimestre',
]);

export const enrollmentStatusEnum = pgEnum('enrollment_status', [
  'pending',   // awaiting admin approval (e.g. after payment)
  'active',
  'completed',
  'dropped',
  'suspended',
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

// ─── Exchange rates (admin-editable; used to convert USD → CDF/RWF on fee structures)
export const exchangeRates = pgTable('exchange_rates', {
  id: uuid('id').primaryKey().defaultRandom(),
  baseCurrency: text('base_currency').notNull().default('USD'),
  targetCurrency: text('target_currency').notNull(), // CDF, RWF
  rate: numeric('rate', { precision: 14, scale: 4 }).notNull(),
  source: text('source').notNull().default('manual'), // 'manual' | 'api'
  updatedAt: timestamptz('updated_at'),
}, (t) => ({
  baseTargetUnique: unique().on(t.baseCurrency, t.targetCurrency),
}));

// ─── Fee structures (reusable: e.g. Inscription, Student card) ───────────
// amount = base price (fixed once saved); amountCdf/amountRwf = auto from platform rates
export const feeStructures = pgTable('fee_structures', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  nameFr: text('name_fr').default(''),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull().default('0'),
  currency: text('currency').notNull().default('USD'),
  amountCdf: numeric('amount_cdf', { precision: 14, scale: 2 }), // converted from USD using platform rate
  amountRwf: numeric('amount_rwf', { precision: 14, scale: 2 }), // converted from USD using platform rate
  type: text('type').notNull().default('one-time'), // one-time | monthly | per-term | annual
  required: boolean('required').default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamptz('created_at'),
  updatedAt: timestamptz('updated_at'),
});

// ─── Program ↔ Fee structure (many-to-many with optional amount override) ─
export const programFees = pgTable('program_fees', {
  id: uuid('id').primaryKey().defaultRandom(),
  programId: uuid('program_id').notNull(),
  feeStructureId: uuid('fee_structure_id').notNull(),
  amountOverride: numeric('amount_override', { precision: 12, scale: 2 }), // if set, use instead of fee_structure.amount
  sortOrder: integer('sort_order').default(0),
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
  fees: jsonb('fees').default([]), // legacy; prefer resolving from program_fees + fee_structures
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

// ─── Promotions (cohorts with start/end dates; can have multiple programs) ─
export const promotions = pgTable('promotions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  nameFr: text('name_fr').default(''),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  durationUnit: durationUnitEnum('duration_unit').notNull().default('months'),
  status: promotionStatusEnum('status').notNull().default('upcoming'),
  maxStudents: integer('max_students').default(30),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamptz('created_at'),
  updatedAt: timestamptz('updated_at'),
});

// ─── Promotion ↔ Program (many-to-many) ──────────────────────────────────
export const promotionPrograms = pgTable('promotion_programs', {
  id: uuid('id').primaryKey().defaultRandom(),
  promotionId: uuid('promotion_id').notNull(),
  programId: uuid('program_id').notNull(),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamptz('created_at'),
  updatedAt: timestamptz('updated_at'),
});

// ─── Enrollments (student in a promotion → program) ─────────────────────
export const enrollments = pgTable('enrollments', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').notNull(),
  programId: uuid('program_id'),
  promotionId: uuid('promotion_id'),
  status: enrollmentStatusEnum('status').notNull().default('pending'),
  enrolledAt: timestamptz('enrolled_at').defaultNow(),
  progress: integer('progress').default(0),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamptz('created_at'),
  updatedAt: timestamptz('updated_at'),
});

// Relations
export const departmentsRelations = relations(departments, ({ many }) => ({
  programs: many(programs),
}));

export const feeStructuresRelations = relations(feeStructures, ({ many }) => ({
  programFees: many(programFees),
}));

export const programFeesRelations = relations(programFees, ({ one }) => ({
  program: one(programs, { fields: [programFees.programId], references: [programs.id] }),
  feeStructure: one(feeStructures, { fields: [programFees.feeStructureId], references: [feeStructures.id] }),
}));

export const programsRelations = relations(programs, ({ one, many }) => ({
  department: one(departments, {
    fields: [programs.departmentId],
    references: [departments.id],
  }),
  promotionPrograms: many(promotionPrograms),
  programFees: many(programFees),
}));

export const promotionProgramsRelations = relations(promotionPrograms, ({ one }) => ({
  promotion: one(promotions, { fields: [promotionPrograms.promotionId], references: [promotions.id] }),
  program: one(programs, { fields: [promotionPrograms.programId], references: [programs.id] }),
}));

export const promotionsRelations = relations(promotions, ({ many }) => ({
  promotionPrograms: many(promotionPrograms),
  enrollments: many(enrollments),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  student: one(profiles, { fields: [enrollments.studentId], references: [profiles.id] }),
  program: one(programs, { fields: [enrollments.programId], references: [programs.id] }),
  promotion: one(promotions, { fields: [enrollments.promotionId], references: [promotions.id] }),
}));
