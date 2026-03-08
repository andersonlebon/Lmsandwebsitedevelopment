import 'dotenv/config';
import { eq, and, asc } from 'drizzle-orm';
import { db } from './index';
import {
  departments,
  exchangeRates,
  feeStructures,
  programFees,
  programs,
  programClasses,
  promotions,
  promotionPrograms,
  learningActivities,
  activityItems,
  activityPromotions,
} from './schema';

const seedDepartments = [
  {
    name: 'English',
    nameFr: 'Anglais',
    slug: 'english',
    description: 'English language courses from beginner to advanced',
    descriptionFr: "Cours d'anglais du niveau debutant au niveau avance",
    icon: 'Languages',
    color: '#3b82f6',
    sortOrder: 1,
  },
  {
    name: 'Computer Science',
    nameFr: 'Informatique',
    slug: 'computer',
    description: 'Computer literacy, programming, and IT skills',
    descriptionFr: 'Alphabetisation informatique, programmation et competences IT',
    icon: 'Monitor',
    color: '#8b5cf6',
    sortOrder: 2,
  },
  {
    name: 'Driving',
    nameFr: 'Auto-Ecole',
    slug: 'driving',
    description: 'Professional driving training and licensing',
    descriptionFr: 'Formation de conduite professionnelle et permis de conduire',
    icon: 'Car',
    color: '#f59e0b',
    sortOrder: 3,
  },
  {
    name: 'Sewing',
    nameFr: 'Couture',
    slug: 'sewing',
    description: 'Fashion design, tailoring, and textile arts',
    descriptionFr: 'Design de mode, couture et arts textiles',
    icon: 'Scissors',
    color: '#ec4899',
    sortOrder: 4,
  },
];

const seedFeeStructures = [
  { name: 'Inscription', nameFr: 'Inscription', amount: '50', currency: 'USD', type: 'one-time', required: true, sortOrder: 1 },
  { name: 'Student Card', nameFr: 'Carte d\'étudiant', amount: '10', currency: 'USD', type: 'one-time', required: true, sortOrder: 2 },
  { name: 'Monthly Tuition', nameFr: 'Frais mensuels', amount: '30', currency: 'USD', type: 'monthly', required: true, sortOrder: 3 },
];

async function seed() {
  // ─── Departments ─────────────────────────────────────────────────────
  await db.insert(departments).values(seedDepartments).onConflictDoNothing({
    target: departments.slug,
  });
  const deptRows = await db.select({ id: departments.id, slug: departments.slug }).from(departments).orderBy(asc(departments.sortOrder));
  const deptBySlug: Record<string, string> = {};
  for (const d of deptRows) deptBySlug[d.slug] = d.id;
  console.log('Seeded departments:', Object.keys(deptBySlug).length);

  // ─── Exchange rates ──────────────────────────────────────────────────
  await db.insert(exchangeRates).values([
    { baseCurrency: 'USD', targetCurrency: 'CDF', rate: '2500', source: 'manual' },
    { baseCurrency: 'USD', targetCurrency: 'RWF', rate: '1300', source: 'manual' },
  ]).onConflictDoNothing({
    target: [exchangeRates.baseCurrency, exchangeRates.targetCurrency],
  });
  console.log('Seeded exchange rates (USD→CDF, USD→RWF).');

  // ─── Fee structures (only if none exist) ───────────────────────────────
  const existingFees = await db.select({ id: feeStructures.id }).from(feeStructures).limit(1);
  if (existingFees.length === 0) {
    await db.insert(feeStructures).values(seedFeeStructures);
  }
  const feeRows = await db.select({ id: feeStructures.id, name: feeStructures.name }).from(feeStructures).orderBy(asc(feeStructures.sortOrder));
  const feeByName: Record<string, string> = {};
  for (const f of feeRows) if (!feeByName[f.name]) feeByName[f.name] = f.id;
  console.log('Fee structures:', Object.keys(feeByName).length);

  // ─── Programs (one or two per department) ─────────────────────────────
  const seedPrograms: Array<{ name: string; nameFr: string; departmentSlug: string; durationMonths: number; level: string; sortOrder: number }> = [
    { name: 'Beginner English', nameFr: 'Anglais Débutant', departmentSlug: 'english', durationMonths: 6, level: 'beginner', sortOrder: 1 },
    { name: 'Intermediate English', nameFr: 'Anglais Intermédiaire', departmentSlug: 'english', durationMonths: 6, level: 'intermediate', sortOrder: 2 },
    { name: 'Introduction to Programming', nameFr: 'Introduction à la programmation', departmentSlug: 'computer', durationMonths: 4, level: 'beginner', sortOrder: 1 },
    { name: 'Web Development Basics', nameFr: 'Bases du développement web', departmentSlug: 'computer', durationMonths: 3, level: 'beginner', sortOrder: 2 },
    { name: 'Driving Theory & Practice', nameFr: 'Théorie et pratique de la conduite', departmentSlug: 'driving', durationMonths: 2, level: 'beginner', sortOrder: 1 },
    { name: 'Fashion & Tailoring', nameFr: 'Mode et couture', departmentSlug: 'sewing', durationMonths: 6, level: 'beginner', sortOrder: 1 },
  ];

  const programIds: string[] = [];
  for (const p of seedPrograms) {
    const deptId = deptBySlug[p.departmentSlug];
    if (!deptId) continue;
    const [existing] = await db.select({ id: programs.id }).from(programs).where(and(eq(programs.name, p.name), eq(programs.departmentId, deptId))).limit(1);
    if (existing) {
      programIds.push(existing.id);
      continue;
    }
    const [inserted] = await db.insert(programs).values({
      name: p.name,
      nameFr: p.nameFr,
      departmentId: deptId,
      durationMonths: p.durationMonths,
      level: p.level,
      status: 'active',
      sortOrder: p.sortOrder,
    }).returning({ id: programs.id });
    if (inserted) programIds.push(inserted.id);
  }
  console.log('Seeded programs:', programIds.length);

  // ─── Program fees (link each program to Inscription, Student Card, Monthly) ─
  const inscriptionId = feeByName['Inscription'];
  const studentCardId = feeByName['Student Card'];
  const monthlyId = feeByName['Monthly Tuition'];
  if (inscriptionId && studentCardId && monthlyId) {
    for (const programId of programIds) {
      const existing = await db.select({ id: programFees.id }).from(programFees).where(eq(programFees.programId, programId)).limit(1);
      if (existing.length > 0) continue;
      await db.insert(programFees).values([
        { programId, feeStructureId: inscriptionId, sortOrder: 1 },
        { programId, feeStructureId: studentCardId, sortOrder: 2 },
        { programId, feeStructureId: monthlyId, sortOrder: 3 },
      ]);
    }
    console.log('Seeded program_fees for', programIds.length, 'programs.');
  }

  // ─── Program classes (time slots per program) ─────────────────────────
  const classSlots = [
    { startTime: '08:00', endTime: '10:00', dayOfWeek: 1, name: 'Mon 8h-10h', room: 'Room A' },
    { startTime: '14:00', endTime: '16:00', dayOfWeek: 3, name: 'Wed 14h-16h', room: 'Room B' },
    { startTime: '10:00', endTime: '12:00', dayOfWeek: 5, name: 'Fri 10h-12h', room: 'Room A' },
  ];
  for (const programId of programIds) {
    const existing = await db.select({ id: programClasses.id }).from(programClasses).where(eq(programClasses.programId, programId)).limit(1);
    if (existing.length > 0) continue;
    await db.insert(programClasses).values(
      classSlots.map((s, i) => ({
        programId,
        name: s.name,
        startTime: s.startTime,
        endTime: s.endTime,
        dayOfWeek: s.dayOfWeek,
        room: s.room,
        sortOrder: i + 1,
      }))
    );
  }
  console.log('Seeded program_classes for', programIds.length, 'programs.');

  // ─── Promotions (cohorts) ────────────────────────────────────────────
  const seedPromotions = [
    { name: '2025 Q1', nameFr: '2025 T1', startDate: '2025-01-06', endDate: '2025-06-30', status: 'active' as const },
    { name: '2025 Q2', nameFr: '2025 T2', startDate: '2025-07-01', endDate: '2025-12-19', status: 'upcoming' as const },
  ];
  const promotionIds: string[] = [];
  for (const promo of seedPromotions) {
    const [existing] = await db.select({ id: promotions.id }).from(promotions).where(eq(promotions.name, promo.name)).limit(1);
    if (existing) {
      promotionIds.push(existing.id);
      continue;
    }
    const [inserted] = await db.insert(promotions).values({
      name: promo.name,
      nameFr: promo.nameFr,
      startDate: promo.startDate,
      endDate: promo.endDate,
      durationUnit: 'months',
      status: promo.status,
    }).returning({ id: promotions.id });
    if (inserted) promotionIds.push(inserted.id);
  }
  console.log('Seeded promotions:', promotionIds.length);

  // ─── Promotion ↔ Program (link promotions to programs) ────────────────
  for (const promotionId of promotionIds) {
    const existing = await db.select({ id: promotionPrograms.id }).from(promotionPrograms).where(eq(promotionPrograms.promotionId, promotionId)).limit(1);
    if (existing.length > 0) continue;
    for (let i = 0; i < programIds.length; i++) {
      await db.insert(promotionPrograms).values({
        promotionId,
        programId: programIds[i],
        sortOrder: i + 1,
      });
    }
  }
  console.log('Seeded promotion_programs.');

  // ─── Learning activities: exercises, assessments, assignments ──────────
  // Use first 3 programs for activities (English Beginner, English Intermediate, Intro to Programming)
  const programIdsForActivities = programIds.slice(0, 3);
  const firstPromoId = promotionIds[0];
  if (!firstPromoId) {
    console.log('No promotion found; skipping learning activities.');
  } else {
    for (const programId of programIdsForActivities) {
      // Exercise 1 — multiple choice / true_false
      const [ex1] = await db.insert(learningActivities).values({
        type: 'exercise',
        title: 'Vocabulary Check',
        titleFr: 'Contrôle de vocabulaire',
        description: 'Quick quiz on basic vocabulary.',
        programId,
        requiresSubmission: false,
        maxScore: '10',
        sortOrder: 1,
      }).returning({ id: learningActivities.id });
      if (ex1) {
        await db.insert(activityItems).values([
          { activityId: ex1.id, sortOrder: 1, itemType: 'true_false', questionText: 'The word "hello" is a greeting.', questionTextFr: 'Le mot "hello" est une salutation.', correctAnswer: true, maxScore: '1' },
          { activityId: ex1.id, sortOrder: 2, itemType: 'multiple_choice', questionText: 'What is the opposite of "hot"?', questionTextFr: 'Quel est le contraire de "chaud"?', options: ['cold', 'warm', 'cool', 'freeze'], correctAnswer: 0, maxScore: '1' },
          { activityId: ex1.id, sortOrder: 3, itemType: 'multiple_choice', questionText: 'Choose the correct article: ___ apple.', questionTextFr: 'Choisissez l\'article correct : ___ pomme.', options: ['a', 'an', 'the', '—'], correctAnswer: 1, maxScore: '1' },
        ]);
        await db.insert(activityPromotions).values({ activityId: ex1.id, promotionId: firstPromoId, sortOrder: 1 }).onConflictDoNothing();
      }

      // Assessment — scored quiz
      const [assess] = await db.insert(learningActivities).values({
        type: 'assessment',
        title: 'Module 1 Assessment',
        titleFr: 'Évaluation module 1',
        description: 'End-of-module assessment.',
        programId,
        requiresSubmission: true,
        maxScore: '20',
        sortOrder: 2,
      }).returning({ id: learningActivities.id });
      if (assess) {
        await db.insert(activityItems).values([
          { activityId: assess.id, sortOrder: 1, itemType: 'multiple_choice', questionText: 'Which sentence is correct?', questionTextFr: 'Quelle phrase est correcte?', options: ['He go to school.', 'He goes to school.', 'He going to school.'], correctAnswer: 1, maxScore: '5' },
          { activityId: assess.id, sortOrder: 2, itemType: 'true_false', questionText: 'English has 26 letters in the alphabet.', questionTextFr: 'L\'anglais a 26 lettres dans l\'alphabet.', correctAnswer: true, maxScore: '5' },
          { activityId: assess.id, sortOrder: 3, itemType: 'theoretical', questionText: 'Write a short paragraph (3–4 sentences) introducing yourself.', questionTextFr: 'Écrivez un court paragraphe (3–4 phrases) pour vous présenter.', maxScore: '10' },
        ]);
        await db.insert(activityPromotions).values({ activityId: assess.id, promotionId: firstPromoId, sortOrder: 2 }).onConflictDoNothing();
      }

      // Assignment — submission required
      const [assign] = await db.insert(learningActivities).values({
        type: 'assignment',
        title: 'Written Assignment 1',
        titleFr: 'Devoir écrit 1',
        description: 'Submit your written work for grading.',
        programId,
        requiresSubmission: true,
        maxScore: '25',
        sortOrder: 3,
      }).returning({ id: learningActivities.id });
      if (assign) {
        await db.insert(activityItems).values([
          { activityId: assign.id, sortOrder: 1, itemType: 'theoretical', questionText: 'Describe your daily routine in 150–200 words.', questionTextFr: 'Décrivez votre routine quotidienne en 150–200 mots.', maxScore: '25' },
        ]);
        await db.insert(activityPromotions).values({ activityId: assign.id, promotionId: firstPromoId, sortOrder: 3 }).onConflictDoNothing();
      }
    }
    console.log('Seeded learning_activities (exercises, assessments, assignments) and activity_items, activity_promotions.');
  }

  console.log('Seed completed.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
