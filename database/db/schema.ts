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

export const assignmentStatusEnum = pgEnum('assignment_status', [
  'not_started',
  'in_progress',
  'submitted',
  'graded',
]);

export const activityTypeEnum = pgEnum('activity_type', ['exercise', 'assessment', 'assignment']);
export const activityItemTypeEnum = pgEnum('activity_item_type', [
  'multiple_choice', 'theoretical', 'video', 'audio', 'listening', 'reading',
  'true_false', 'matching', 'fill_blank',
]);
export const submissionStatusEnum = pgEnum('submission_status', ['draft', 'submitted', 'graded']);

export const paymentStatusEnum = pgEnum('payment_status', ['pending_approval', 'completed', 'rejected']);

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

// ─── Program classes (time slots per program, e.g. "6:00 to 7:30")
export const programClasses = pgTable('program_classes', {
  id: uuid('id').primaryKey().defaultRandom(),
  programId: uuid('program_id').notNull(),
  name: text('name').default(''),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  dayOfWeek: integer('day_of_week'),
  room: text('room').default(''),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamptz('created_at').defaultNow(),
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

// ─── Enrollments (student in a promotion → program, optional class) ─────
export const enrollments = pgTable('enrollments', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').notNull(),
  programId: uuid('program_id'),
  promotionId: uuid('promotion_id'),
  classId: uuid('class_id'),
  rollNumber: text('roll_number').unique(),
  status: enrollmentStatusEnum('status').notNull().default('pending'),
  enrolledAt: timestamptz('enrolled_at').defaultNow(),
  progress: integer('progress').default(0),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamptz('created_at'),
  updatedAt: timestamptz('updated_at'),
});

// ─── Learning activities (exercises, assessments, assignments) ─────────────
export const learningActivities = pgTable('learning_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: activityTypeEnum('type').notNull(),
  title: text('title').notNull(),
  titleFr: text('title_fr').default(''),
  description: text('description').default(''),
  descriptionFr: text('description_fr').default(''),
  instructions: text('instructions').default(''),
  instructionsFr: text('instructions_fr').default(''),
  programId: uuid('program_id'),
  createdBy: uuid('created_by'),
  requiresSubmission: boolean('requires_submission').default(false),
  maxScore: numeric('max_score', { precision: 8, scale: 2 }).default('0'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamptz('created_at').defaultNow(),
  updatedAt: timestamptz('updated_at'),
});

export const activityPromotions = pgTable('activity_promotions', {
  id: uuid('id').primaryKey().defaultRandom(),
  activityId: uuid('activity_id').notNull(),
  promotionId: uuid('promotion_id').notNull(),
  sortOrder: integer('sort_order').default(0),
  assignedAt: timestamptz('assigned_at').defaultNow(),
  assignedBy: uuid('assigned_by'),
}, (t) => ({
  activityPromoUnique: unique().on(t.activityId, t.promotionId),
}));

export const activityItems = pgTable('activity_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  activityId: uuid('activity_id').notNull(),
  sortOrder: integer('sort_order').default(0),
  itemType: activityItemTypeEnum('item_type').notNull(),
  questionText: text('question_text').notNull(),
  questionTextFr: text('question_text_fr').default(''),
  options: jsonb('options').default([]),
  correctAnswer: jsonb('correct_answer'),
  mediaUrl: text('media_url'),
  mediaType: text('media_type'),
  maxScore: numeric('max_score', { precision: 6, scale: 2 }).default('1'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamptz('created_at').defaultNow(),
  updatedAt: timestamptz('updated_at'),
});

export const activitySubmissions = pgTable('activity_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  enrollmentId: uuid('enrollment_id').notNull(),
  activityId: uuid('activity_id').notNull(),
  status: submissionStatusEnum('status').notNull().default('draft'),
  submittedAt: timestamptz('submitted_at'),
  score: numeric('score', { precision: 8, scale: 2 }),
  maxScore: numeric('max_score', { precision: 8, scale: 2 }),
  feedback: text('feedback'),
  gradedBy: uuid('graded_by'),
  gradedAt: timestamptz('graded_at'),
  createdAt: timestamptz('created_at').defaultNow(),
  updatedAt: timestamptz('updated_at'),
});

export const activitySubmissionResponses = pgTable('activity_submission_responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  submissionId: uuid('submission_id').notNull(),
  activityItemId: uuid('activity_item_id').notNull(),
  response: jsonb('response'),
  score: numeric('score', { precision: 6, scale: 2 }),
  feedback: text('feedback'),
  createdAt: timestamptz('created_at').defaultNow(),
  updatedAt: timestamptz('updated_at'),
});

// ─── Payments (student payments; manual = upload receipt, status pending_approval until admin approves)
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').notNull(),
  enrollmentId: uuid('enrollment_id'),
  programId: uuid('program_id'),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  method: text('method').notNull(), // manual | airtel | orange | mobile | visa
  status: paymentStatusEnum('status').notNull().default('pending_approval'),
  receiptUrl: text('receipt_url'),
  transactionRef: text('transaction_ref'),
  feeId: text('fee_id'),
  feeName: text('fee_name'),
  description: text('description'),
  metadata: jsonb('metadata').default({}),
  approvedAt: timestamptz('approved_at'),
  approvedBy: uuid('approved_by'),
  rejectedAt: timestamptz('rejected_at'),
  rejectReason: text('reject_reason'),
  createdAt: timestamptz('created_at').defaultNow(),
  updatedAt: timestamptz('updated_at'),
});

// ─── Enrollment progress (per-enrollment: payment, learning, exercises, assessment, assignments)
export const enrollmentProgress = pgTable('enrollment_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  enrollmentId: uuid('enrollment_id').notNull().unique(),
  amountPaid: numeric('amount_paid', { precision: 12, scale: 2 }).default('0'),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).default('0'),
  learningPercent: integer('learning_percent').default(0),
  exercisesCompleted: integer('exercises_completed').default(0),
  exercisesTotal: integer('exercises_total').default(0),
  assessmentScore: numeric('assessment_score', { precision: 6, scale: 2 }),
  assessmentMax: integer('assessment_max').default(100),
  assignmentStatus: assignmentStatusEnum('assignment_status').default('not_started'),
  assignmentScore: numeric('assignment_score', { precision: 6, scale: 2 }),
  updatedAt: timestamptz('updated_at').defaultNow(),
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
  programClasses: many(programClasses),
  learningActivities: many(learningActivities),
}));

export const programClassesRelations = relations(programClasses, ({ one }) => ({
  program: one(programs, { fields: [programClasses.programId], references: [programs.id] }),
}));

export const learningActivitiesRelations = relations(learningActivities, ({ one, many }) => ({
  program: one(programs, { fields: [learningActivities.programId], references: [programs.id] }),
  creator: one(profiles, { fields: [learningActivities.createdBy], references: [profiles.id] }),
  activityPromotions: many(activityPromotions),
  items: many(activityItems),
  submissions: many(activitySubmissions),
}));

export const activityPromotionsRelations = relations(activityPromotions, ({ one }) => ({
  activity: one(learningActivities, { fields: [activityPromotions.activityId], references: [learningActivities.id] }),
  promotion: one(promotions, { fields: [activityPromotions.promotionId], references: [promotions.id] }),
}));

export const activityItemsRelations = relations(activityItems, ({ one }) => ({
  activity: one(learningActivities, { fields: [activityItems.activityId], references: [learningActivities.id] }),
}));

export const activitySubmissionsRelations = relations(activitySubmissions, ({ one, many }) => ({
  enrollment: one(enrollments, { fields: [activitySubmissions.enrollmentId], references: [enrollments.id] }),
  activity: one(learningActivities, { fields: [activitySubmissions.activityId], references: [learningActivities.id] }),
  grader: one(profiles, { fields: [activitySubmissions.gradedBy], references: [profiles.id] }),
  responses: many(activitySubmissionResponses),
}));

export const activitySubmissionResponsesRelations = relations(activitySubmissionResponses, ({ one }) => ({
  submission: one(activitySubmissions, { fields: [activitySubmissionResponses.submissionId], references: [activitySubmissions.id] }),
  activityItem: one(activityItems, { fields: [activitySubmissionResponses.activityItemId], references: [activityItems.id] }),
}));

export const promotionProgramsRelations = relations(promotionPrograms, ({ one }) => ({
  promotion: one(promotions, { fields: [promotionPrograms.promotionId], references: [promotions.id] }),
  program: one(programs, { fields: [promotionPrograms.programId], references: [programs.id] }),
}));

export const promotionsRelations = relations(promotions, ({ many }) => ({
  promotionPrograms: many(promotionPrograms),
  enrollments: many(enrollments),
  activityPromotions: many(activityPromotions),
}));

export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
  student: one(profiles, { fields: [enrollments.studentId], references: [profiles.id] }),
  program: one(programs, { fields: [enrollments.programId], references: [programs.id] }),
  promotion: one(promotions, { fields: [enrollments.promotionId], references: [promotions.id] }),
  class: one(programClasses, { fields: [enrollments.classId], references: [programClasses.id] }),
  progressRecord: one(enrollmentProgress),
  activitySubmissions: many(activitySubmissions),
}));

export const enrollmentProgressRelations = relations(enrollmentProgress, ({ one }) => ({
  enrollment: one(enrollments, { fields: [enrollmentProgress.enrollmentId], references: [enrollments.id] }),
}));

