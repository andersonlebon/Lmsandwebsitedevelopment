import 'dotenv/config';
import { db } from './index';
import { departments, exchangeRates } from './schema';

const seedDepartments = [
  {
    name: 'English',
    nameFr: 'Anglais',
    slug: 'english',
    description:
      'English language courses from beginner to advanced',
    descriptionFr:
      "Cours d'anglais du niveau debutant au niveau avance",
    icon: 'Languages',
    color: '#3b82f6',
    sortOrder: 1,
  },
  {
    name: 'Computer Science',
    nameFr: 'Informatique',
    slug: 'computer',
    description:
      'Computer literacy, programming, and IT skills',
    descriptionFr:
      'Alphabetisation informatique, programmation et competences IT',
    icon: 'Monitor',
    color: '#8b5cf6',
    sortOrder: 2,
  },
  {
    name: 'Driving',
    nameFr: 'Auto-Ecole',
    slug: 'driving',
    description:
      'Professional driving training and licensing',
    descriptionFr:
      'Formation de conduite professionnelle et permis de conduire',
    icon: 'Car',
    color: '#f59e0b',
    sortOrder: 3,
  },
  {
    name: 'Sewing',
    nameFr: 'Couture',
    slug: 'sewing',
    description:
      'Fashion design, tailoring, and textile arts',
    descriptionFr:
      'Design de mode, couture et arts textiles',
    icon: 'Scissors',
    color: '#ec4899',
    sortOrder: 4,
  },
];

async function seed() {
  await db.insert(departments).values(seedDepartments).onConflictDoNothing({
    target: departments.slug,
  });
  console.log('Seeded 4 departments.');

  await db.insert(exchangeRates).values([
    { baseCurrency: 'USD', targetCurrency: 'CDF', rate: '2500', source: 'manual' },
    { baseCurrency: 'USD', targetCurrency: 'RWF', rate: '1300', source: 'manual' },
  ]).onConflictDoNothing({
    target: [exchangeRates.baseCurrency, exchangeRates.targetCurrency],
  });
  console.log('Seeded exchange rates (USD→CDF, USD→RWF).');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
