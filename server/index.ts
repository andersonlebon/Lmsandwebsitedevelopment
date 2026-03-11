/**
 * BTC API server — Node + Hono + Drizzle.
 * Use this server to avoid 401s from Edge Function JWT handling.
 * Set VITE_API_URL in .env to point the frontend here (e.g. http://localhost:5000).
 */
import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createClient } from '@supabase/supabase-js';
import { eq, asc, desc, inArray, and, isNull, isNotNull, sql } from 'drizzle-orm';
import { db, programs, departments, profiles, promotions, enrollments, enrollmentProgress, feeStructures, programFees, promotionPrograms, promotionClasses, exchangeRates, learningActivities, activityPromotions, activityClasses, activityItems, activitySubmissions, activitySubmissionResponses, payments, programClasses, studentAttendanceRequests, staffSchedules, lecturerAttendance, lecturerRates, lecturerWallets, lecturerWalletTransactions, certificates, lessons } from '../database/db/index';

const app = new Hono();
// Use same key as frontend when set (no duplicate SUPABASE_URL in .env)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

app.use(
  '*',
  cors({
    origin: '*',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  })
);

// Exchange rates routes first so they are not shadowed by any parametric route
async function getRatesFromDb(): Promise<{ usdToCdf: number | null; usdToRwf: number | null }> {
  try {
    const rows = await db.select().from(exchangeRates).where(eq(exchangeRates.baseCurrency, 'USD'));
    const usdToCdf = rows.find(r => r.targetCurrency === 'CDF');
    const usdToRwf = rows.find(r => r.targetCurrency === 'RWF');
    return {
      usdToCdf: usdToCdf != null && usdToCdf.rate != null ? Number(usdToCdf.rate) : null,
      usdToRwf: usdToRwf != null && usdToRwf.rate != null ? Number(usdToRwf.rate) : null,
    };
  } catch {
    return { usdToCdf: null, usdToRwf: null };
  }
}

app.get('/exchange-rates', async (c) => {
  try {
    const rows = await db.select().from(exchangeRates).where(eq(exchangeRates.baseCurrency, 'USD')).orderBy(asc(exchangeRates.targetCurrency));
    const rates = await getRatesFromDb();
    return c.json({
      rates: rows.map(r => ({
        id: r.id,
        baseCurrency: r.baseCurrency,
        targetCurrency: r.targetCurrency,
        rate: Number(r.rate),
        source: r.source,
        updatedAt: r.updatedAt,
      })),
      usdToCdf: rates.usdToCdf,
      usdToRwf: rates.usdToRwf,
    });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.put('/exchange-rates', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const body = await c.req.json();
    const list = Array.isArray(body.rates) ? body.rates : (body.targetCurrency != null ? [{ targetCurrency: body.targetCurrency, rate: body.rate }] : []);
    for (const item of list) {
      const target = String(item.targetCurrency || '').toUpperCase();
      const rate = Number(item.rate);
      if (!target || Number.isNaN(rate) || rate < 0) continue;
      await db.insert(exchangeRates).values({
        baseCurrency: 'USD',
        targetCurrency: target,
        rate: String(rate),
        source: 'manual',
      }).onConflictDoUpdate({
        target: [exchangeRates.baseCurrency, exchangeRates.targetCurrency],
        set: { rate: String(rate), source: 'manual', updatedAt: new Date() },
      });
    }
    const rows = await db.select().from(exchangeRates).where(eq(exchangeRates.baseCurrency, 'USD')).orderBy(asc(exchangeRates.targetCurrency));
    return c.json({
      rates: rows.map(r => ({
        id: r.id,
        baseCurrency: r.baseCurrency,
        targetCurrency: r.targetCurrency,
        rate: Number(r.rate),
        source: r.source,
        updatedAt: r.updatedAt,
      })),
    });
  } catch (e) {
    console.error('Update exchange rates error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

const EXCHANGE_API_URL = 'https://open.er-api.com/v6/latest/USD';
app.post('/exchange-rates/refresh', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const res = await fetch(EXCHANGE_API_URL);
    if (!res.ok) throw new Error(`Exchange API returned ${res.status}`);
    const data = await res.json() as { conversion_rates?: Record<string, number> };
    const rates = data.conversion_rates || {};
    const cdf = rates.CDF != null ? Number(rates.CDF) : null;
    const rwf = rates.RWF != null ? Number(rates.RWF) : null;
    if (cdf != null && !Number.isNaN(cdf)) {
      await db.insert(exchangeRates).values({
        baseCurrency: 'USD',
        targetCurrency: 'CDF',
        rate: String(cdf),
        source: 'api',
      }).onConflictDoUpdate({
        target: [exchangeRates.baseCurrency, exchangeRates.targetCurrency],
        set: { rate: String(cdf), source: 'api', updatedAt: new Date() },
      });
    }
    if (rwf != null && !Number.isNaN(rwf)) {
      await db.insert(exchangeRates).values({
        baseCurrency: 'USD',
        targetCurrency: 'RWF',
        rate: String(rwf),
        source: 'api',
      }).onConflictDoUpdate({
        target: [exchangeRates.baseCurrency, exchangeRates.targetCurrency],
        set: { rate: String(rwf), source: 'api', updatedAt: new Date() },
      });
    }
    const rows = await db.select().from(exchangeRates).where(eq(exchangeRates.baseCurrency, 'USD')).orderBy(asc(exchangeRates.targetCurrency));
    return c.json({
      rates: rows.map(r => ({
        id: r.id,
        baseCurrency: r.baseCurrency,
        targetCurrency: r.targetCurrency,
        rate: Number(r.rate),
        source: r.source,
        updatedAt: r.updatedAt,
      })),
      refreshed: { CDF: cdf, RWF: rwf },
    });
  } catch (e) {
    console.error('Refresh exchange rates error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function authenticateUser(authHeader: string | undefined): Promise<{ userId: string; role: string } | null> {
  const token = authHeader?.replace(/Bearer\s+/i, '').trim();
  if (!token) return null;
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    if (payload.role === 'anon') return null;
  } catch {
    return null;
  }
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user?.id) return null;
  const [profile] = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, data.user.id));
  const role = profile?.role ?? data.user.user_metadata?.role ?? 'student';
  return { userId: data.user.id, role };
}

async function requireAdmin(c: any): Promise<{ userId: string } | Response> {
  const auth = await authenticateUser(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized - invalid or missing token. Please log out and log back in.' }, 401);
  if (auth.role !== 'admin') return c.json({ error: `Forbidden - admin required (role: ${auth.role})` }, 403);
  return { userId: auth.userId };
}

// GET /me — current user profile (auth required)
app.get('/me', async (c) => {
  try {
    const auth = await authenticateUser(c.req.header('Authorization'));
    if (!auth) return c.json({ error: 'Unauthorized - invalid or missing token' }, 401);

    const rows = await db
      .select({
        id: profiles.id,
        email: profiles.email,
        name: profiles.name,
        role: profiles.role,
        departmentId: profiles.departmentId,
        phone: profiles.phone,
        avatarUrl: profiles.avatarUrl,
        emailConfirmed: profiles.emailConfirmed,
        rollNumber: profiles.rollNumber,
        dateOfBirth: profiles.dateOfBirth,
        gender: profiles.gender,
        address: profiles.address,
        createdAt: profiles.createdAt,
        slug: departments.slug,
      })
      .from(profiles)
      .leftJoin(departments, eq(profiles.departmentId, departments.id))
      .where(eq(profiles.id, auth.userId))
      .limit(1);

    let profileRow = rows[0];
    if (!profileRow) {
      const { data: { user } } = await supabase.auth.admin.getUserById(auth.userId);
      if (!user) return c.json({ error: 'User not found' }, 404);
      const meta = user.user_metadata || {};
      const fallback = {
        id: auth.userId,
        email: user.email || `${auth.userId}@temp.local`,
        name: (meta.name as string) || user.email?.split('@')[0] || 'User',
        role: (meta.role as 'admin' | 'staff' | 'student') || 'student',
        phone: (meta.phone as string) || '',
      };
      await db.insert(profiles).values({
        id: fallback.id,
        email: fallback.email,
        name: fallback.name,
        role: fallback.role,
        phone: fallback.phone,
      }).onConflictDoUpdate({
        target: profiles.id,
        set: { name: fallback.name, role: fallback.role, phone: fallback.phone, updatedAt: new Date() },
      });
      return c.json({
        profile: {
          id: fallback.id,
          email: fallback.email,
          name: fallback.name,
          role: fallback.role,
          phone: fallback.phone,
          email_confirmed_at: user.email_confirmed_at,
        },
      });
    }

    const profile = {
      id: profileRow.id,
      email: profileRow.email,
      name: profileRow.name,
      role: profileRow.role,
      department_id: profileRow.departmentId,
      department: profileRow.slug,
      phone: profileRow.phone ?? '',
      avatar_url: profileRow.avatarUrl ?? '',
      email_confirmed: profileRow.emailConfirmed,
      roll_number: profileRow.rollNumber ?? undefined,
      date_of_birth: profileRow.dateOfBirth ?? undefined,
      gender: profileRow.gender ?? undefined,
      address: profileRow.address ?? '',
      created_at: profileRow.createdAt,
    };
    return c.json({ profile });
  } catch (e) {
    console.error('Get /me error:', e);
    return c.json({ error: `Failed to get profile: ${(e as Error).message}` }, 500);
  }
});

// PATCH /me — update own profile (only allowed fields: name, date_of_birth, phone, address, gender). Roll number, email, id, etc. are not editable.
app.patch('/me', async (c) => {
  try {
    const auth = await authenticateUser(c.req.header('Authorization'));
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);
    const body = await c.req.json().catch(() => ({}));
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name != null && typeof body.name === 'string') updates.name = body.name.trim() || undefined;
    if (body.date_of_birth != null) updates.dateOfBirth = body.date_of_birth === '' ? null : body.date_of_birth;
    if (body.dateOfBirth != null) updates.dateOfBirth = body.dateOfBirth === '' ? null : body.dateOfBirth;
    if (body.phone != null) updates.phone = typeof body.phone === 'string' ? body.phone : undefined;
    if (body.address != null) updates.address = typeof body.address === 'string' ? body.address : undefined;
    if (body.gender != null) updates.gender = body.gender === '' ? null : body.gender;
    if (Object.keys(updates).length <= 1) return c.json({ profile: (await db.select().from(profiles).where(eq(profiles.id, auth.userId)))[0] });
    await db.update(profiles).set(updates as any).where(eq(profiles.id, auth.userId));
    const [updated] = await db.select().from(profiles).where(eq(profiles.id, auth.userId));
    return c.json({
      profile: updated ? {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        phone: updated.phone ?? '',
        roll_number: updated.rollNumber ?? undefined,
        date_of_birth: updated.dateOfBirth ?? undefined,
        gender: updated.gender ?? undefined,
        address: updated.address ?? '',
      } : null,
    });
  } catch (e) {
    console.error('Patch /me error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

// GET /stats — dashboard statistics (no auth required for now; optional: require admin)
app.get('/stats', async (c) => {
  try {
    const [students, staff, programList] = await Promise.all([
      db.select().from(profiles).where(eq(profiles.role, 'student')),
      db.select({ id: profiles.id }).from(profiles).where(inArray(profiles.role, ['admin', 'staff'])),
      db.select({ id: programs.id }).from(programs),
    ]);

    const totalStudents = students.length;
    const totalStaff = staff.length;
    const totalPrograms = programList.length;
    const recentStudents = students.slice(0, 5).map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      created_at: s.createdAt,
    }));

    return c.json({
      totalStudents,
      totalStaff,
      totalCourses: 0,
      totalPrograms,
      totalPayments: 0,
      totalRevenue: 0,
      pendingPayments: 0,
      totalEnrollments: 0,
      recentStudents,
      recentPayments: [],
    });
  } catch (e) {
    console.error('Stats error:', e);
    return c.json({ error: `Failed to get stats: ${(e as Error).message}` }, 500);
  }
});

/** Compute total amount to pay from fees and program duration (months). Monthly/weekly fees are multiplied by duration. */
function computeProgramTotalFees(fees: { amount: number; type?: string }[], durationMonths: number): number {
  let total = 0;
  const months = Math.max(1, durationMonths || 0);
  for (const f of fees) {
    const amt = Number(f.amount) || 0;
    switch (f.type) {
      case 'monthly':
        total += amt * months;
        break;
      case 'annual':
        total += amt * Math.max(1, Math.ceil(months / 12));
        break;
      case 'per-term':
        total += amt * Math.max(1, Math.ceil(months / 3));
        break;
      case 'weekly':
        total += amt * Math.max(1, Math.ceil(months * 4.33));
        break;
      default:
        total += amt; // one-time
        break;
    }
  }
  return Math.round(total * 100) / 100;
}

function programRowToApi(row: any, departmentSlug?: string, resolvedFees?: any[], durationMonths?: number) {
  const fees = resolvedFees !== undefined ? resolvedFees : (row.fees ?? []);
  const duration = durationMonths ?? row.durationMonths ?? row.duration_months ?? 0;
  const totalAmountToPay = computeProgramTotalFees(fees, duration);
  const departmentName = row.deptName ?? row.department?.name;
  const departmentNameFr = row.deptNameFr ?? row.department?.nameFr;
  return {
    id: row.id,
    name: row.name,
    nameFr: row.nameFr ?? row.name_fr ?? '',
    department: departmentSlug ?? row.department?.slug ?? row.department_slug ?? row.slug,
    departmentId: row.departmentId ?? row.department_id,
    departmentName: departmentName ?? undefined,
    departmentNameFr: departmentNameFr ?? undefined,
    description: row.description ?? '',
    descriptionFr: row.descriptionFr ?? row.description_fr ?? '',
    status: row.status ?? 'active',
    fees,
    durationMonths: duration,
    totalAmountToPay,
    createdAt: row.createdAt ?? row.created_at,
    departments: row.department ? { id: row.department.id, name: row.department.name, name_fr: row.department.nameFr, slug: row.department.slug, color: row.department.color } : undefined,
  };
}

/** Resolve fees from program_fees + fee_structures; returns [] if none. */
async function resolveProgramFees(programIds: string[]): Promise<Map<string, any[]>> {
  if (programIds.length === 0) return new Map();
  const rows = await db
    .select({
      pfId: programFees.id,
      programId: programFees.programId,
      amountOverride: programFees.amountOverride,
      sortOrder: programFees.sortOrder,
      fsId: feeStructures.id,
      name: feeStructures.name,
      nameFr: feeStructures.nameFr,
      amount: feeStructures.amount,
      currency: feeStructures.currency,
      type: feeStructures.type,
      required: feeStructures.required,
      fsSortOrder: feeStructures.sortOrder,
    })
    .from(programFees)
    .innerJoin(feeStructures, eq(programFees.feeStructureId, feeStructures.id))
    .where(inArray(programFees.programId, programIds))
    .orderBy(asc(programFees.sortOrder), asc(feeStructures.sortOrder));
  const map = new Map<string, any[]>();
  for (const r of rows) {
    const list = map.get(r.programId) ?? [];
    const amount = r.amountOverride != null ? Number(r.amountOverride) : Number(r.amount);
    list.push({
      id: r.pfId,
      feeStructureId: r.fsId,
      name: r.name ?? '',
      nameFr: r.nameFr ?? '',
      amount,
      currency: r.currency ?? 'USD',
      type: r.type ?? 'one-time',
      required: r.required ?? true,
      order: r.sortOrder ?? r.fsSortOrder ?? 0,
    });
    map.set(r.programId, list);
  }
  return map;
}

// GET /programs
app.get('/programs', async (c) => {
  try {
    const rows = await db
      .select({
        id: programs.id,
        name: programs.name,
        nameFr: programs.nameFr,
        departmentId: programs.departmentId,
        durationMonths: programs.durationMonths,
        description: programs.description,
        descriptionFr: programs.descriptionFr,
        status: programs.status,
        fees: programs.fees,
        createdAt: programs.createdAt,
        slug: departments.slug,
        deptName: departments.name,
        deptNameFr: departments.nameFr,
        deptColor: departments.color,
      })
      .from(programs)
      .leftJoin(departments, eq(programs.departmentId, departments.id))
      .orderBy(asc(programs.sortOrder), asc(programs.name));

    const programIds = rows.map((r) => r.id);
    const feesMap = await resolveProgramFees(programIds);
    const list = rows.map((r) => {
      const resolved = feesMap.get(r.id);
      return programRowToApi(r, r.slug ?? undefined, resolved, r.durationMonths ?? 0);
    });
    return c.json({ programs: list });
  } catch (e) {
    console.error('List programs error:', e);
    return c.json({ error: `Failed to list programs: ${(e as Error).message}` }, 500);
  }
});

// GET /programs/:id
app.get('/programs/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const [row] = await db
      .select({
        id: programs.id,
        name: programs.name,
        nameFr: programs.nameFr,
        departmentId: programs.departmentId,
        durationMonths: programs.durationMonths,
        description: programs.description,
        descriptionFr: programs.descriptionFr,
        status: programs.status,
        fees: programs.fees,
        createdAt: programs.createdAt,
        slug: departments.slug,
        deptName: departments.name,
        deptNameFr: departments.nameFr,
        deptColor: departments.color,
      })
      .from(programs)
      .leftJoin(departments, eq(programs.departmentId, departments.id))
      .where(eq(programs.id, id));

    if (!row) return c.json({ error: 'Program not found' }, 404);
    const resolvedList = (await resolveProgramFees([id])).get(id);
    const fees: any[] = resolvedList ?? (Array.isArray(row.fees) ? row.fees : []);
    return c.json({ program: programRowToApi(row, row.slug ?? undefined, fees, row.durationMonths ?? 0) });
  } catch (e) {
    console.error('Get program error:', e);
    return c.json({ error: `Failed to get program: ${(e as Error).message}` }, 500);
  }
});

// POST /programs
app.post('/programs', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;

    const body = await c.req.json();
    let departmentId: string;
    if (body.departmentId) {
      const [dept] = await db.select().from(departments).where(eq(departments.id, body.departmentId));
      if (!dept) return c.json({ error: `Department not found for id: ${body.departmentId}` }, 400);
      departmentId = dept.id;
    } else if (body.department) {
      const [dept] = await db.select().from(departments).where(eq(departments.slug, body.department));
      if (!dept) return c.json({ error: `Department not found for slug: ${body.department}` }, 400);
      departmentId = dept.id;
    } else {
      return c.json({ error: 'departmentId or department (slug) is required' }, 400);
    }

    const insertPayload = {
      name: body.name ?? '',
      nameFr: body.nameFr ?? body.name_fr ?? '',
      departmentId,
      durationMonths: body.durationMonths != null ? Number(body.durationMonths) : 0,
      description: body.description ?? '',
      descriptionFr: body.descriptionFr ?? body.description_fr ?? '',
      status: (body.status === 'archived' || body.status === 'draft') ? body.status : 'active',
      fees: Array.isArray(body.fees) ? body.fees : [],
      createdBy: admin.userId,
    };

    const [inserted] = await db.insert(programs).values(insertPayload).returning();
    const programId = inserted!.id;
    if (Array.isArray(body.programFees) && body.programFees.length > 0) {
      for (let i = 0; i < body.programFees.length; i++) {
        const item = body.programFees[i];
        if (item?.feeStructureId) {
          await db.insert(programFees).values({
            programId,
            feeStructureId: item.feeStructureId,
            amountOverride: item.amountOverride != null ? String(item.amountOverride) : null,
            sortOrder: i,
          });
        }
      }
    }
    const [withDept] = await db
      .select({
        id: programs.id,
        name: programs.name,
        nameFr: programs.nameFr,
        departmentId: programs.departmentId,
        durationMonths: programs.durationMonths,
        description: programs.description,
        descriptionFr: programs.descriptionFr,
        status: programs.status,
        fees: programs.fees,
        createdAt: programs.createdAt,
        slug: departments.slug,
      })
      .from(programs)
      .leftJoin(departments, eq(programs.departmentId, departments.id))
      .where(eq(programs.id, programId));

    const resolvedList = (await resolveProgramFees([programId])).get(programId);
    const fees: any[] = resolvedList ?? (Array.isArray(withDept!.fees) ? withDept!.fees : []);
    return c.json({ program: programRowToApi(withDept!, withDept!.slug ?? undefined, fees, withDept!.durationMonths ?? 0) });
  } catch (e) {
    console.error('Create program error:', e);
    return c.json({ error: `Failed to create program: ${(e as Error).message}` }, 500);
  }
});

// PUT /programs/:id
app.put('/programs/:id', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;

    const id = c.req.param('id');
    const body = await c.req.json();
    delete body.id;

    let departmentId: string | undefined;
    if (body.departmentId != null) {
      const [dept] = await db.select().from(departments).where(eq(departments.id, body.departmentId));
      if (!dept) return c.json({ error: `Department not found for id: ${body.departmentId}` }, 400);
      departmentId = dept.id;
    } else if (body.department != null) {
      const [dept] = await db.select().from(departments).where(eq(departments.slug, body.department));
      if (!dept) return c.json({ error: `Department not found for slug: ${body.department}` }, 400);
      departmentId = dept.id;
    }

    const updatePayload: Record<string, unknown> = {
      name: body.name,
      nameFr: body.nameFr ?? body.name_fr,
      description: body.description,
      descriptionFr: body.descriptionFr ?? body.description_fr,
      status: body.status,
      fees: Array.isArray(body.fees) ? body.fees : undefined,
      durationMonths: body.durationMonths != null ? Number(body.durationMonths) : undefined,
    };
    if (departmentId) updatePayload.departmentId = departmentId;

    const [updated] = await db
      .update(programs)
      .set(updatePayload as any)
      .where(eq(programs.id, id))
      .returning();

    if (!updated) return c.json({ error: 'Program not found' }, 404);

    if (Array.isArray(body.programFees)) {
      await db.delete(programFees).where(eq(programFees.programId, id));
      for (let i = 0; i < body.programFees.length; i++) {
        const item = body.programFees[i];
        if (item?.feeStructureId) {
          await db.insert(programFees).values({
            programId: id,
            feeStructureId: item.feeStructureId,
            amountOverride: item.amountOverride != null ? String(item.amountOverride) : null,
            sortOrder: i,
          });
        }
      }
    }

    const [withDept] = await db
      .select({
        id: programs.id,
        name: programs.name,
        nameFr: programs.nameFr,
        departmentId: programs.departmentId,
        durationMonths: programs.durationMonths,
        description: programs.description,
        descriptionFr: programs.descriptionFr,
        status: programs.status,
        fees: programs.fees,
        createdAt: programs.createdAt,
        slug: departments.slug,
      })
      .from(programs)
      .leftJoin(departments, eq(programs.departmentId, departments.id))
      .where(eq(programs.id, id));

    const resolvedList = (await resolveProgramFees([id])).get(id);
    const fees: any[] = resolvedList ?? (Array.isArray(withDept!.fees) ? withDept!.fees : []);
    return c.json({ program: programRowToApi(withDept!, withDept!.slug ?? undefined, fees, withDept!.durationMonths ?? 0) });
  } catch (e) {
    console.error('Update program error:', e);
    return c.json({ error: `Failed to update program: ${(e as Error).message}` }, 500);
  }
});

// DELETE /programs/:id
app.delete('/programs/:id', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;

    const id = c.req.param('id');
    await db.delete(programFees).where(eq(programFees.programId, id));
    await db.delete(programs).where(eq(programs.id, id));
    return c.json({ success: true });
  } catch (e) {
    console.error('Delete program error:', e);
    return c.json({ error: `Failed to delete program: ${(e as Error).message}` }, 500);
  }
});

// ──────────────────────────────────────
// PROGRAM CLASSES (time slots per program)
// ──────────────────────────────────────
function slugForCode(s: string, maxLen = 8): string {
  if (!s || typeof s !== 'string') return 'X';
  const slug = s.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
  return (slug || 'X').slice(0, maxLen);
}

async function generateUniqueClassCode(programId: string, name: string | null, startTime: string, daysOfWeek: number[], excludeId?: string): Promise<string> {
  const [prog] = await db.select().from(programs).where(eq(programs.id, programId));
  if (!prog) return `CLASS-${programId.slice(0, 8)}`;
  const [dept] = await db.select().from(departments).where(eq(departments.id, prog.departmentId));
  const deptPart = dept?.slug ? slugForCode(dept.slug, 3) : 'DEP';
  const progPart = slugForCode(prog.name ?? '', 3);
  const timePart = (startTime || '').replace(':', '').slice(0, 2) || '00';
  const classPart = (name && name.trim())
    ? slugForCode(name, 4)
    : (daysOfWeek.length ? `D${daysOfWeek[0]}${timePart}` : `T${timePart}`);
  let code = `${deptPart}-${progPart}-${classPart}`;
  let n = 1;
  while (true) {
    const existing = await db.select({ id: programClasses.id }).from(programClasses).where(eq(programClasses.code, code));
    const taken = existing.length > 0 && (excludeId ? existing.some((r) => r.id !== excludeId) : true);
    if (!taken) return code;
    code = `${deptPart}-${progPart}-${classPart}-${n}`;
    n++;
  }
}

function classRowToApi(row: any) {
  const daysOfWeek = Array.isArray(row.daysOfWeek) ? row.daysOfWeek : (row.dayOfWeek != null ? [row.dayOfWeek] : []);
  return {
    id: row.id,
    programId: row.programId,
    code: row.code ?? undefined,
    name: row.name ?? '',
    startTime: row.startTime,
    endTime: row.endTime,
    dayOfWeek: row.dayOfWeek ?? (daysOfWeek[0] ?? null),
    daysOfWeek,
    room: row.room ?? '',
    sortOrder: row.sortOrder ?? 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

app.get('/classes', async (c) => {
  try {
    const programId = c.req.query('programId');
    const departmentId = c.req.query('departmentId');
    const promotionId = c.req.query('promotionId');
    if (programId && promotionId) {
      const classLinks = await db.select({ classId: promotionClasses.classId }).from(promotionClasses).where(eq(promotionClasses.promotionId, promotionId));
      const promoClassIds = classLinks.map((x) => x.classId);
      if (promoClassIds.length === 0) return c.json({ classes: [] });
      const rows = await db.select().from(programClasses).where(and(eq(programClasses.programId, programId), inArray(programClasses.id, promoClassIds))).orderBy(asc(programClasses.sortOrder), asc(programClasses.startTime));
      return c.json({ classes: rows.map((r) => classRowToApi(r)) });
    }
    if (programId) {
      const rows = await db.select().from(programClasses).where(eq(programClasses.programId, programId)).orderBy(asc(programClasses.sortOrder), asc(programClasses.startTime));
      return c.json({ classes: rows.map((r) => classRowToApi(r)) });
    }
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const conditions: Parameters<typeof and> = [];
    if (departmentId) conditions.push(eq(departments.id, departmentId));
    if (promotionId) {
      const classLinks = await db.select({ classId: promotionClasses.classId }).from(promotionClasses).where(eq(promotionClasses.promotionId, promotionId));
      const promoClassIds = classLinks.map((x) => x.classId);
      if (promoClassIds.length > 0) {
        conditions.push(inArray(programClasses.id, promoClassIds));
      } else {
        const progInPromo = await db.select({ programId: promotionPrograms.programId }).from(promotionPrograms).where(eq(promotionPrograms.promotionId, promotionId));
        const progIds = progInPromo.map((p) => p.programId);
        if (progIds.length === 0) return c.json({ classes: [] });
        conditions.push(inArray(programs.id, progIds));
      }
    }
    const rows = await db
      .select({
        id: programClasses.id,
        programId: programClasses.programId,
        code: programClasses.code,
        name: programClasses.name,
        startTime: programClasses.startTime,
        endTime: programClasses.endTime,
        dayOfWeek: programClasses.dayOfWeek,
        daysOfWeek: programClasses.daysOfWeek,
        room: programClasses.room,
        sortOrder: programClasses.sortOrder,
        progName: programs.name,
        progNameFr: programs.nameFr,
        deptId: departments.id,
        deptName: departments.name,
        deptNameFr: departments.nameFr,
        deptSlug: departments.slug,
      })
      .from(programClasses)
      .innerJoin(programs, eq(programClasses.programId, programs.id))
      .innerJoin(departments, eq(programs.departmentId, departments.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(departments.sortOrder), asc(programs.name), asc(programClasses.sortOrder), asc(programClasses.startTime));
    return c.json({
      classes: rows.map((r) => ({
        ...classRowToApi(r),
        programName: r.progName,
        programNameFr: r.progNameFr,
        departmentId: r.deptId,
        departmentName: r.deptName,
        departmentNameFr: r.deptNameFr,
        departmentSlug: r.deptSlug,
      })),
    });
  } catch (e) {
    console.error('List classes error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.get('/programs/:id/classes', async (c) => {
  try {
    const id = c.req.param('id');
    const rows = await db.select().from(programClasses).where(eq(programClasses.programId, id)).orderBy(asc(programClasses.sortOrder), asc(programClasses.startTime));
    return c.json({ classes: rows.map((r) => classRowToApi(r)) });
  } catch (e) {
    console.error('List program classes error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.post('/classes', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const body = await c.req.json();
    const programId = body.programId ?? body.program_id;
    if (!programId) return c.json({ error: 'programId required' }, 400);
    const [prog] = await db.select().from(programs).where(eq(programs.id, programId));
    if (!prog) return c.json({ error: 'Program not found' }, 404);
    const name = body.name ?? '';
    const startTime = String(body.startTime ?? '');
    const daysOfWeek = Array.isArray(body.daysOfWeek) ? body.daysOfWeek.map((d: unknown) => Number(d)).filter((d: number) => d >= 1 && d <= 7) : [];
    const legacyDay = daysOfWeek.length ? daysOfWeek[0] : null;
    const code = await generateUniqueClassCode(programId, name || null, startTime, daysOfWeek);
    const [inserted] = await db.insert(programClasses).values({
      programId,
      code,
      name,
      startTime,
      endTime: String(body.endTime ?? ''),
      dayOfWeek: legacyDay,
      daysOfWeek: daysOfWeek.length ? daysOfWeek : [],
      room: body.room ?? '',
      sortOrder: body.sortOrder ?? body.sort_order ?? 0,
    }).returning();
    if (!inserted) return c.json({ error: 'Insert failed' }, 500);
    return c.json({ class: classRowToApi(inserted) });
  } catch (e) {
    console.error('Create class error:', e);
    return c.json({ error: `Failed to create class: ${(e as Error).message}` }, 500);
  }
});

app.put('/classes/:id', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const id = c.req.param('id');
    const body = await c.req.json();
    const [existing] = await db.select().from(programClasses).where(eq(programClasses.id, id));
    if (!existing) return c.json({ error: 'Class not found' }, 404);
    const name = body.name !== undefined ? body.name : existing.name;
    const programId = body.programId ?? body.program_id ?? existing.programId;
    const startTime = body.startTime !== undefined ? String(body.startTime) : existing.startTime;
    const daysOfWeek = body.daysOfWeek !== undefined
      ? (Array.isArray(body.daysOfWeek) ? body.daysOfWeek.map((d: unknown) => Number(d)).filter((d: number) => d >= 1 && d <= 7) : [])
      : (Array.isArray((existing as any).daysOfWeek) ? (existing as any).daysOfWeek : (existing.dayOfWeek != null ? [existing.dayOfWeek] : []));
    const legacyDay = daysOfWeek.length ? daysOfWeek[0] : null;
    const codeChanged = name !== existing.name || programId !== existing.programId;
    const code = codeChanged ? await generateUniqueClassCode(programId, name || null, startTime, daysOfWeek) : existing.code;
    await db.update(programClasses).set({
      name,
      programId: body.programId !== undefined ? body.programId : existing.programId,
      code: code ?? undefined,
      startTime,
      endTime: body.endTime !== undefined ? String(body.endTime) : existing.endTime,
      dayOfWeek: legacyDay,
      daysOfWeek: daysOfWeek,
      room: body.room !== undefined ? body.room : existing.room,
      sortOrder: body.sortOrder ?? body.sort_order ?? existing.sortOrder,
      updatedAt: new Date(),
    }).where(eq(programClasses.id, id));
    const [updated] = await db.select().from(programClasses).where(eq(programClasses.id, id));
    return c.json({ class: classRowToApi(updated!) });
  } catch (e) {
    console.error('Update class error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.delete('/classes/:id', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const id = c.req.param('id');
    const result = await db.delete(programClasses).where(eq(programClasses.id, id)).returning({ id: programClasses.id });
    if (result.length === 0) return c.json({ error: 'Class not found' }, 404);
    return c.json({ success: true });
  } catch (e) {
    console.error('Delete class error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

// ──────────────────────────────────────
// FEE STRUCTURES (reusable: Inscription, Student card, etc.)
// Amount is fixed (base currency); amountCdf/amountRwf auto from platform rates.
// ──────────────────────────────────────
function computeConvertedAmounts(amountUsd: number, rates: { usdToCdf: number | null; usdToRwf: number | null }): { amountCdf: string | null; amountRwf: string | null } {
  return {
    amountCdf: rates.usdToCdf != null && !Number.isNaN(rates.usdToCdf) ? String(Math.round(amountUsd * rates.usdToCdf)) : null,
    amountRwf: rates.usdToRwf != null && !Number.isNaN(rates.usdToRwf) ? String(Math.round(amountUsd * rates.usdToRwf)) : null,
  };
}

function feeStructureRowToApi(row: any) {
  return {
    id: row.id,
    name: row.name ?? '',
    nameFr: row.nameFr ?? row.name_fr ?? '',
    amount: Number(row.amount ?? 0),
    currency: row.currency ?? 'USD',
    amountCdf: row.amountCdf != null ? Number(row.amountCdf) : null,
    amountRwf: row.amountRwf != null ? Number(row.amountRwf) : null,
    type: row.type ?? 'one-time',
    required: row.required ?? true,
    sortOrder: row.sortOrder ?? row.sort_order ?? 0,
  };
}

app.get('/fee-structures', async (c) => {
  try {
    const rows = await db.select().from(feeStructures).orderBy(asc(feeStructures.sortOrder), asc(feeStructures.name));
    return c.json({ feeStructures: rows.map(feeStructureRowToApi) });
  } catch (e) {
    console.error('List fee structures error:', e);
    return c.json({ error: `Failed to list fee structures: ${(e as Error).message}` }, 500);
  }
});

app.get('/fee-structures/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const [row] = await db.select().from(feeStructures).where(eq(feeStructures.id, id));
    if (!row) return c.json({ error: 'Fee structure not found' }, 404);
    return c.json({ feeStructure: feeStructureRowToApi(row) });
  } catch (e) {
    console.error('Get fee structure error:', e);
    return c.json({ error: `Failed to get fee structure: ${(e as Error).message}` }, 500);
  }
});

app.post('/fee-structures', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const body = await c.req.json();
    const currency = body.currency ?? 'USD';
    const amount = Number(body.amount ?? 0);
    const rates = await getRatesFromDb();
    const { amountCdf, amountRwf } = currency === 'USD' ? computeConvertedAmounts(amount, rates) : { amountCdf: null, amountRwf: null };
    const [inserted] = await db
      .insert(feeStructures)
      .values({
        name: body.name ?? '',
        nameFr: body.nameFr ?? body.name_fr ?? '',
        amount: String(amount),
        currency,
        amountCdf,
        amountRwf,
        type: body.type ?? 'one-time',
        required: body.required !== false,
        sortOrder: body.sortOrder ?? body.sort_order ?? 0,
      })
      .returning();
    return c.json({ feeStructure: feeStructureRowToApi(inserted!) });
  } catch (e) {
    console.error('Create fee structure error:', e);
    return c.json({ error: `Failed to create fee structure: ${(e as Error).message}` }, 500);
  }
});

app.put('/fee-structures/:id', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const id = c.req.param('id');
    const body = await c.req.json();
    const currency = body.currency ?? 'USD';
    const amount = body.amount != null ? Number(body.amount) : undefined;
    const rates = await getRatesFromDb();
    const { amountCdf, amountRwf } = currency === 'USD' && amount != null ? computeConvertedAmounts(amount, rates) : { amountCdf: undefined, amountRwf: undefined };
    const [updated] = await db
      .update(feeStructures)
      .set({
        name: body.name,
        nameFr: body.nameFr ?? body.name_fr,
        amount: amount != null ? String(amount) : undefined,
        currency: body.currency,
        amountCdf: amountCdf ?? undefined,
        amountRwf: amountRwf ?? undefined,
        type: body.type,
        required: body.required,
        sortOrder: body.sortOrder ?? body.sort_order,
      } as any)
      .where(eq(feeStructures.id, id))
      .returning();
    if (!updated) return c.json({ error: 'Fee structure not found' }, 404);
    return c.json({ feeStructure: feeStructureRowToApi(updated) });
  } catch (e) {
    console.error('Update fee structure error:', e);
    return c.json({ error: `Failed to update fee structure: ${(e as Error).message}` }, 500);
  }
});

app.delete('/fee-structures/:id', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const id = c.req.param('id');
    await db.delete(programFees).where(eq(programFees.feeStructureId, id));
    const result = await db.delete(feeStructures).where(eq(feeStructures.id, id)).returning({ id: feeStructures.id });
    if (result.length === 0) return c.json({ error: 'Fee structure not found' }, 404);
    return c.json({ success: true });
  } catch (e) {
    console.error('Delete fee structure error:', e);
    return c.json({ error: `Failed to delete fee structure: ${(e as Error).message}` }, 500);
  }
});

// ──────────────────────────────────────
// DEPARTMENTS: CRUD
// ──────────────────────────────────────
function departmentRowToApi(row: any) {
  return {
    id: row.id,
    name: row.name,
    name_fr: row.nameFr ?? row.name_fr ?? '',
    slug: row.slug,
    description: row.description ?? '',
    description_fr: row.descriptionFr ?? row.description_fr ?? '',
    icon: row.icon ?? '',
    color: row.color ?? '#10b981',
    head_id: row.headId ?? row.head_id ?? null,
    is_active: row.isActive ?? row.is_active ?? true,
    sort_order: row.sortOrder ?? row.sort_order ?? 0,
    created_at: row.createdAt ?? row.created_at,
    updated_at: row.updatedAt ?? row.updated_at,
  };
}

app.get('/departments', async (c) => {
  try {
    const rows = await db.select().from(departments).orderBy(asc(departments.sortOrder), asc(departments.name));
    return c.json({ departments: rows.map(departmentRowToApi) });
  } catch (e) {
    console.error('List departments error:', e);
    return c.json({ error: `Failed to list departments: ${(e as Error).message}` }, 500);
  }
});

app.get('/departments/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const [row] = await db.select().from(departments).where(eq(departments.id, id));
    if (!row) return c.json({ error: 'Department not found' }, 404);
    return c.json({ department: departmentRowToApi(row) });
  } catch (e) {
    console.error('Get department error:', e);
    return c.json({ error: `Failed to get department: ${(e as Error).message}` }, 500);
  }
});

app.post('/departments', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const body = await c.req.json();
    const [inserted] = await db.insert(departments).values({
      name: body.name ?? '',
      nameFr: body.name_fr ?? body.nameFr ?? '',
      slug: body.slug ?? body.name?.toLowerCase().replace(/\s+/g, '-') ?? '',
      description: body.description ?? '',
      descriptionFr: body.description_fr ?? body.descriptionFr ?? '',
      icon: body.icon ?? '',
      color: body.color ?? '#10b981',
      sortOrder: body.sort_order ?? body.sortOrder ?? 0,
    }).returning();
    if (!inserted) return c.json({ error: 'Insert failed' }, 500);
    return c.json({ department: departmentRowToApi(inserted) });
  } catch (e) {
    console.error('Create department error:', e);
    return c.json({ error: `Failed to create department: ${(e as Error).message}` }, 500);
  }
});

app.put('/departments/:id', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const id = c.req.param('id');
    const body = await c.req.json();
    delete (body as any).id;
    const [updated] = await db.update(departments).set({
      ...(body.name != null && { name: body.name }),
      ...(body.name_fr != null && { nameFr: body.name_fr }),
      ...(body.slug != null && { slug: body.slug }),
      ...(body.description != null && { description: body.description }),
      ...(body.description_fr != null && { descriptionFr: body.description_fr }),
      ...(body.icon != null && { icon: body.icon }),
      ...(body.color != null && { color: body.color }),
      ...(body.sort_order != null && { sortOrder: body.sort_order }),
      updatedAt: new Date(),
    }).where(eq(departments.id, id)).returning();
    if (!updated) return c.json({ error: 'Department not found' }, 404);
    return c.json({ department: departmentRowToApi(updated) });
  } catch (e) {
    console.error('Update department error:', e);
    return c.json({ error: `Failed to update department: ${(e as Error).message}` }, 500);
  }
});

app.delete('/departments/:id', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const id = c.req.param('id');
    await db.delete(departments).where(eq(departments.id, id));
    return c.json({ success: true });
  } catch (e) {
    console.error('Delete department error:', e);
    return c.json({ error: `Failed to delete department: ${(e as Error).message}` }, 500);
  }
});

// ──────────────────────────────────────
// STUDENTS: list + get + update + delete (profiles with role=student)
// ──────────────────────────────────────
function profileRowToApi(row: any, deptSlug?: string) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    department_id: row.departmentId ?? row.department_id,
    department: deptSlug ?? row.slug,
    departments: row.slug ? { name: row.deptName ?? row.name, name_fr: row.deptNameFr ?? row.name_fr, slug: row.slug } : undefined,
    phone: row.phone ?? '',
    student_id_number: row.studentIdNumber ?? row.student_id_number,
    created_at: row.createdAt ?? row.created_at,
  };
}

app.get('/students', async (c) => {
  try {
    const rows = await db
      .select({
        id: profiles.id,
        email: profiles.email,
        name: profiles.name,
        role: profiles.role,
        departmentId: profiles.departmentId,
        phone: profiles.phone,
        studentIdNumber: profiles.studentIdNumber,
        createdAt: profiles.createdAt,
        slug: departments.slug,
        deptName: departments.name,
        deptNameFr: departments.nameFr,
      })
      .from(profiles)
      .leftJoin(departments, eq(profiles.departmentId, departments.id))
      .where(eq(profiles.role, 'student'))
      .orderBy(desc(profiles.createdAt));
    return c.json({ students: rows.map((r) => profileRowToApi(r, r.slug ?? undefined)) });
  } catch (e) {
    console.error('List students error:', e);
    return c.json({ error: `Failed to list students: ${(e as Error).message}` }, 500);
  }
});

app.get('/students/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const [row] = await db
      .select({
        id: profiles.id,
        email: profiles.email,
        name: profiles.name,
        role: profiles.role,
        departmentId: profiles.departmentId,
        phone: profiles.phone,
        studentIdNumber: profiles.studentIdNumber,
        createdAt: profiles.createdAt,
        slug: departments.slug,
        deptName: departments.name,
        deptNameFr: departments.nameFr,
      })
      .from(profiles)
      .leftJoin(departments, eq(profiles.departmentId, departments.id))
      .where(eq(profiles.id, id))
      .limit(1);
    if (!row || row.role !== 'student') return c.json({ error: 'Student not found' }, 404);
    return c.json({ student: profileRowToApi(row, row.slug ?? undefined) });
  } catch (e) {
    console.error('Get student error:', e);
    return c.json({ error: `Failed to get student: ${(e as Error).message}` }, 500);
  }
});

app.put('/students/:id', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const id = c.req.param('id');
    const body = await c.req.json();
    delete (body as any).id;
    delete (body as any).role;
    const [updated] = await db.update(profiles).set({
      ...(body.name != null && { name: body.name }),
      ...(body.email != null && { email: body.email }),
      ...(body.phone != null && { phone: body.phone }),
      updatedAt: new Date(),
    }).where(eq(profiles.id, id)).returning();
    if (!updated) return c.json({ error: 'Student not found' }, 404);
    return c.json({ student: profileRowToApi(updated) });
  } catch (e) {
    console.error('Update student error:', e);
    return c.json({ error: `Failed to update student: ${(e as Error).message}` }, 500);
  }
});

app.delete('/students/:id', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const id = c.req.param('id');
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) throw error;
    await db.delete(profiles).where(eq(profiles.id, id));
    return c.json({ success: true });
  } catch (e) {
    console.error('Delete student error:', e);
    return c.json({ error: `Failed to delete student: ${(e as Error).message}` }, 500);
  }
});

// ──────────────────────────────────────
// STAFF: list (admin + staff)
// ──────────────────────────────────────
app.get('/staff', async (c) => {
  try {
    const rows = await db
      .select({
        id: profiles.id,
        email: profiles.email,
        name: profiles.name,
        role: profiles.role,
        departmentId: profiles.departmentId,
        phone: profiles.phone,
        createdAt: profiles.createdAt,
        slug: departments.slug,
        deptName: departments.name,
        deptNameFr: departments.nameFr,
      })
      .from(profiles)
      .leftJoin(departments, eq(profiles.departmentId, departments.id))
      .where(inArray(profiles.role, ['admin', 'staff']))
      .orderBy(desc(profiles.createdAt));
    return c.json({ staff: rows.map((r) => profileRowToApi(r, r.slug ?? undefined)) });
  } catch (e) {
    console.error('List staff error:', e);
    return c.json({ error: `Failed to list staff: ${(e as Error).message}` }, 500);
  }
});

app.put('/staff/:id', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const id = c.req.param('id');
    const body = await c.req.json();
    delete (body as any).id;
    const [updated] = await db.update(profiles).set({
      ...(body.name != null && { name: body.name }),
      ...(body.email != null && { email: body.email }),
      ...(body.role != null && { role: body.role }),
      ...(body.phone != null && { phone: body.phone }),
      updatedAt: new Date(),
    }).where(eq(profiles.id, id)).returning();
    if (!updated) return c.json({ error: 'Staff not found' }, 404);
    return c.json({ staff: profileRowToApi(updated) });
  } catch (e) {
    console.error('Update staff error:', e);
    return c.json({ error: `Failed to update staff: ${(e as Error).message}` }, 500);
  }
});

app.delete('/staff/:id', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const id = c.req.param('id');
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) throw error;
    await db.delete(profiles).where(eq(profiles.id, id));
    return c.json({ success: true });
  } catch (e) {
    console.error('Delete staff error:', e);
    return c.json({ error: `Failed to delete staff: ${(e as Error).message}` }, 500);
  }
});

// ──────────────────────────────────────
// PROMOTIONS: CRUD + public list (one promotion → many programs)
// ──────────────────────────────────────
function promotionRowToApi(row: any, programsList: any[] = [], classesList: any[] = []) {
  return {
    id: row.id,
    name: row.name,
    nameFr: row.nameFr ?? row.name_fr ?? '',
    programs: programsList,
    classes: classesList,
    startDate: row.startDate ?? row.start_date,
    endDate: row.endDate ?? row.end_date,
    durationUnit: row.durationUnit ?? row.duration_unit ?? 'months',
    status: row.status ?? 'upcoming',
    maxStudents: row.maxStudents ?? row.max_students,
  };
}

/** Classes in each promotion (from promotion_classes). */
async function getPromotionClasses(promotionIds: string[]): Promise<Map<string, any[]>> {
  if (promotionIds.length === 0) return new Map();
  const rows = await db
    .select({
      promotionId: promotionClasses.promotionId,
      classId: programClasses.id,
      className: programClasses.name,
      code: programClasses.code,
      programId: programClasses.programId,
      programName: programs.name,
      programNameFr: programs.nameFr,
      departmentSlug: departments.slug,
      startTime: programClasses.startTime,
      endTime: programClasses.endTime,
      daysOfWeek: programClasses.daysOfWeek,
      dayOfWeek: programClasses.dayOfWeek,
      room: programClasses.room,
    })
    .from(promotionClasses)
    .innerJoin(programClasses, eq(promotionClasses.classId, programClasses.id))
    .innerJoin(programs, eq(programClasses.programId, programs.id))
    .leftJoin(departments, eq(programs.departmentId, departments.id))
    .where(inArray(promotionClasses.promotionId, promotionIds))
    .orderBy(asc(promotionClasses.sortOrder));
  const map = new Map<string, any[]>();
  for (const r of rows) {
    const list = map.get(r.promotionId) ?? [];
    list.push({
      id: r.classId,
      name: r.className,
      code: r.code,
      programId: r.programId,
      programName: r.programName,
      programNameFr: r.programNameFr,
      department: r.departmentSlug ?? '',
      startTime: r.startTime,
      endTime: r.endTime,
      daysOfWeek: Array.isArray(r.daysOfWeek) ? r.daysOfWeek : (r.dayOfWeek != null ? [r.dayOfWeek] : []),
      room: r.room,
    });
    map.set(r.promotionId, list);
  }
  return map;
}

/** Programs in each promotion: derived from promotion_classes (classes' programIds), or fallback to promotion_programs. */
async function getPromotionPrograms(promotionIds: string[]): Promise<Map<string, any[]>> {
  if (promotionIds.length === 0) return new Map();
  const classesByPromo = await getPromotionClasses(promotionIds);
  const programIdsByPromo = new Map<string, Set<string>>();
  for (const [promoId, classes] of classesByPromo) {
    const progIds = new Set<string>();
    for (const c of classes) if (c.programId) progIds.add(c.programId);
    programIdsByPromo.set(promoId, progIds);
  }
  const allProgramIds = [...new Set([...programIdsByPromo.values()].flatMap((s) => [...s]))];
  if (allProgramIds.length > 0) {
    const progRows = await db
      .select({
        id: programs.id,
        name: programs.name,
        nameFr: programs.nameFr,
        slug: departments.slug,
      })
      .from(programs)
      .leftJoin(departments, eq(programs.departmentId, departments.id))
      .where(inArray(programs.id, allProgramIds));
    const feesMap = await resolveProgramFees(allProgramIds);
    const map = new Map<string, any[]>();
    for (const promoId of promotionIds) {
      const progIds = programIdsByPromo.get(promoId);
      if (progIds && progIds.size > 0) {
        const list = [...progIds].map((programId) => {
          const p = progRows.find((r) => r.id === programId);
          const fees = feesMap.get(programId) ?? [];
          return { id: programId, name: p?.name ?? '', nameFr: p?.nameFr ?? '', department: p?.slug ?? '', fees };
        });
        map.set(promoId, list);
      }
    }
    if (map.size > 0) return map;
  }
  const legacyRows = await db
    .select({
      promotionId: promotionPrograms.promotionId,
      programId: programs.id,
      name: programs.name,
      nameFr: programs.nameFr,
      slug: departments.slug,
    })
    .from(promotionPrograms)
    .innerJoin(programs, eq(promotionPrograms.programId, programs.id))
    .leftJoin(departments, eq(programs.departmentId, departments.id))
    .where(inArray(promotionPrograms.promotionId, promotionIds))
    .orderBy(asc(promotionPrograms.sortOrder), asc(programs.name));
  const legacyProgramIds = [...new Set(legacyRows.map((r) => r.programId))];
  const feesMap = await resolveProgramFees(legacyProgramIds);
  const map = new Map<string, any[]>();
  for (const r of legacyRows) {
    const fees = feesMap.get(r.programId) ?? [];
    const list = map.get(r.promotionId) ?? [];
    list.push({ id: r.programId, name: r.name, nameFr: r.nameFr, department: r.slug ?? '', fees });
    map.set(r.promotionId, list);
  }
  return map;
}

app.get('/promotions', async (c) => {
  try {
    const statusFilter = c.req.query('status');
    const rows = await db
      .select({
        id: promotions.id,
        name: promotions.name,
        nameFr: promotions.nameFr,
        startDate: promotions.startDate,
        endDate: promotions.endDate,
        durationUnit: promotions.durationUnit,
        status: promotions.status,
        maxStudents: promotions.maxStudents,
        sortOrder: promotions.sortOrder,
      })
      .from(promotions)
      .orderBy(asc(promotions.startDate), asc(promotions.name));
    const promotionIds = rows.map((r) => r.id);
    const [programsByPromo, classesByPromo] = await Promise.all([getPromotionPrograms(promotionIds), getPromotionClasses(promotionIds)]);
    let list = rows.map((r) => ({
      ...promotionRowToApi(r, programsByPromo.get(r.id) ?? [], classesByPromo.get(r.id) ?? []),
    }));
    if (statusFilter) list = list.filter((p: any) => p.status === statusFilter);
    return c.json({ promotions: list });
  } catch (e) {
    console.error('List promotions error:', e);
    return c.json({ error: `Failed to list promotions: ${(e as Error).message}` }, 500);
  }
});

app.get('/promotions/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const [row] = await db
      .select({
        id: promotions.id,
        name: promotions.name,
        nameFr: promotions.nameFr,
        startDate: promotions.startDate,
        endDate: promotions.endDate,
        durationUnit: promotions.durationUnit,
        status: promotions.status,
        maxStudents: promotions.maxStudents,
        sortOrder: promotions.sortOrder,
      })
      .from(promotions)
      .where(eq(promotions.id, id));
    if (!row) return c.json({ error: 'Promotion not found' }, 404);
    const [programsList, classesList] = await Promise.all([getPromotionPrograms([id]), getPromotionClasses([id])]);
    return c.json({ promotion: promotionRowToApi(row, programsList.get(id) ?? [], classesList.get(id) ?? []) });
  } catch (e) {
    console.error('Get promotion error:', e);
    return c.json({ error: `Failed to get promotion: ${(e as Error).message}` }, 500);
  }
});

app.post('/promotions', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const body = await c.req.json();
    if (!body.name || !body.startDate || !body.endDate) {
      return c.json({ error: 'name, startDate, endDate required' }, 400);
    }
    const classIds = Array.isArray(body.classIds) ? body.classIds : [];
    const [inserted] = await db.insert(promotions).values({
      name: body.name,
      nameFr: body.nameFr ?? body.name_fr ?? '',
      startDate: body.startDate,
      endDate: body.endDate,
      durationUnit: body.durationUnit ?? body.duration_unit ?? 'months',
      status: body.status ?? 'upcoming',
      maxStudents: body.maxStudents ?? 30,
    }).returning();
    if (!inserted) return c.json({ error: 'Insert failed' }, 500);
    for (let i = 0; i < classIds.length; i++) {
      await db.insert(promotionClasses).values({
        promotionId: inserted.id,
        classId: classIds[i],
        sortOrder: i,
      });
    }
    const [programsList, classesList] = await Promise.all([getPromotionPrograms([inserted.id]), getPromotionClasses([inserted.id])]);
    return c.json({ promotion: promotionRowToApi(inserted, programsList.get(inserted.id) ?? [], classesList.get(inserted.id) ?? []) });
  } catch (e) {
    console.error('Create promotion error:', e);
    return c.json({ error: `Failed to create promotion: ${(e as Error).message}` }, 500);
  }
});

app.put('/promotions/:id', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const id = c.req.param('id');
    const body = await c.req.json();
    delete (body as any).id;
    const [updated] = await db.update(promotions).set({
      ...(body.name != null && { name: body.name }),
      ...(body.nameFr != null && { nameFr: body.nameFr }),
      ...(body.startDate != null && { startDate: body.startDate }),
      ...(body.endDate != null && { endDate: body.endDate }),
      ...(body.durationUnit != null && { durationUnit: body.durationUnit }),
      ...(body.status != null && { status: body.status }),
      ...(body.maxStudents != null && { maxStudents: body.maxStudents }),
      updatedAt: new Date(),
    }).where(eq(promotions.id, id)).returning();
    if (!updated) return c.json({ error: 'Promotion not found' }, 404);
    if (Array.isArray(body.classIds)) {
      await db.delete(promotionClasses).where(eq(promotionClasses.promotionId, id));
      for (let i = 0; i < body.classIds.length; i++) {
        await db.insert(promotionClasses).values({
          promotionId: id,
          classId: body.classIds[i],
          sortOrder: i,
        });
      }
    }
    const [programsList, classesList] = await Promise.all([getPromotionPrograms([id]), getPromotionClasses([id])]);
    return c.json({ promotion: promotionRowToApi(updated, programsList.get(id) ?? [], classesList.get(id) ?? []) });
  } catch (e) {
    console.error('Update promotion error:', e);
    return c.json({ error: `Failed to update promotion: ${(e as Error).message}` }, 500);
  }
});

app.delete('/promotions/:id', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const id = c.req.param('id');
    await db.delete(promotionClasses).where(eq(promotionClasses.promotionId, id));
    await db.delete(promotionPrograms).where(eq(promotionPrograms.promotionId, id));
    await db.delete(promotions).where(eq(promotions.id, id));
    return c.json({ success: true });
  } catch (e) {
    console.error('Delete promotion error:', e);
    return c.json({ error: `Failed to delete promotion: ${(e as Error).message}` }, 500);
  }
});

// ──────────────────────────────────────
// ENROLLMENTS: create (student enrolls in promotion) + student roll number on profile (first enrollment only)
// ──────────────────────────────────────
/** Generate unique student roll number: DEPT-YEAR-SEQ (e.g. ENG-2025-001). Assigned once per student on first enrollment. */
async function generateStudentRollNumber(programId: string): Promise<string> {
  const [progRow] = await db
    .select({ deptSlug: departments.slug })
    .from(programs)
    .leftJoin(departments, eq(programs.departmentId, departments.id))
    .where(eq(programs.id, programId));
  const deptCode = (progRow?.deptSlug ?? 'GEN').toUpperCase().replace(/\W/g, '').slice(0, 4) || 'GEN';
  const year = new Date().getFullYear();
  const prefix = `${deptCode}-${year}-`;
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(profiles)
    .where(sql`${profiles.rollNumber} like ${prefix + '%'}`);
  const seq = (countResult[0]?.count ?? 0) + 1;
  return `${prefix}${String(seq).padStart(3, '0')}`;
}

app.post('/enrollments', async (c) => {
  try {
    const auth = await authenticateUser(c.req.header('Authorization'));
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);
    const body = await c.req.json();
    const promotionId = body.promotionId ?? body.promotion_id;
    const programId = body.programId ?? body.program_id;
    if (!promotionId) return c.json({ error: 'promotionId required' }, 400);
    if (!programId) return c.json({ error: 'programId required (choose a program within the promotion)' }, 400);
    const [promo] = await db
      .select({ id: promotions.id, status: promotions.status })
      .from(promotions)
      .where(eq(promotions.id, promotionId));
    if (!promo) return c.json({ error: 'Promotion not found' }, 404);
    if (promo.status !== 'active' && promo.status !== 'upcoming') return c.json({ error: 'Promotion is not open for enrollment' }, 400);
    const programInPromo = await db.select({ classId: promotionClasses.classId }).from(promotionClasses).innerJoin(programClasses, eq(promotionClasses.classId, programClasses.id)).where(and(eq(promotionClasses.promotionId, promotionId), eq(programClasses.programId, programId))).limit(1);
    const programInPromoLegacy = programInPromo.length === 0 ? await db.select().from(promotionPrograms).where(and(eq(promotionPrograms.promotionId, promotionId), eq(promotionPrograms.programId, programId))).limit(1) : [];
    if (programInPromo.length === 0 && programInPromoLegacy.length === 0) return c.json({ error: 'Program is not part of this promotion' }, 400);
    const classId = body.classId ?? body.class_id ?? null;
    if (classId) {
      const [cls] = await db.select().from(programClasses).where(and(eq(programClasses.id, classId), eq(programClasses.programId, programId)));
      if (!cls) return c.json({ error: 'Class not found or does not belong to this program' }, 400);
      const classInPromo = await db.select().from(promotionClasses).where(and(eq(promotionClasses.promotionId, promotionId), eq(promotionClasses.classId, classId))).limit(1);
      if (classInPromo.length === 0) return c.json({ error: 'Class is not part of this promotion' }, 400);
    }
    const existing = await db.select().from(enrollments).where(and(eq(enrollments.studentId, auth.userId), eq(enrollments.promotionId, promotionId), eq(enrollments.programId, programId))).limit(1);
    if (existing.length > 0) return c.json({ error: 'Already enrolled in this promotion for this program' }, 400);
    const [inserted] = await db.insert(enrollments).values({
      studentId: auth.userId,
      programId,
      promotionId: promo.id,
      classId: classId || undefined,
      status: 'pending', // admin approves when payment confirmed; progress is created on approval
    }).returning();
    const [profileRow] = await db.select({ rollNumber: profiles.rollNumber }).from(profiles).where(eq(profiles.id, auth.userId));
    if (inserted && profileRow && !profileRow.rollNumber) {
      try {
        const rollNumber = await generateStudentRollNumber(programId);
        await db.update(profiles).set({ rollNumber, updatedAt: new Date() }).where(eq(profiles.id, auth.userId));
      } catch (err) {
        console.error('Assign roll number to student', auth.userId, err);
      }
    }
    return c.json({ enrollment: inserted });
  } catch (e) {
    console.error('Create enrollment error:', e);
    return c.json({ error: `Failed to create enrollment: ${(e as Error).message}` }, 500);
  }
});

/** Backfill roll numbers for students (profiles) who have enrollments but no roll number (admin only). */
app.post('/enrollments/backfill-roll-numbers', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const enrollmentsWithStudent = await db
      .select({ studentId: enrollments.studentId, programId: enrollments.programId, enrolledAt: enrollments.enrolledAt })
      .from(enrollments)
      .innerJoin(profiles, eq(enrollments.studentId, profiles.id))
      .where(isNull(profiles.rollNumber))
      .orderBy(asc(enrollments.studentId), asc(enrollments.enrolledAt));
    const byStudent = new Map<string, string>();
    for (const row of enrollmentsWithStudent) {
      if (!byStudent.has(row.studentId) && row.programId) {
        byStudent.set(row.studentId, row.programId);
      }
    }
    let updated = 0;
    for (const [studentId, programId] of byStudent) {
      try {
        const rollNumber = await generateStudentRollNumber(programId);
        await db.update(profiles).set({ rollNumber, updatedAt: new Date() }).where(eq(profiles.id, studentId));
        updated++;
      } catch (err) {
        console.error('Backfill roll number for student', studentId, err);
      }
    }
    return c.json({ updated, total: byStudent.size });
  } catch (e) {
    console.error('Backfill roll numbers error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.get('/enrollments/my', async (c) => {
  try {
    const auth = await authenticateUser(c.req.header('Authorization'));
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);
    const rows = await db
      .select({
        id: enrollments.id,
        programId: enrollments.programId,
        promotionId: enrollments.promotionId,
        rollNumber: profiles.rollNumber,
        status: enrollments.status,
        enrolledAt: enrollments.enrolledAt,
        progName: programs.name,
        progNameFr: programs.nameFr,
        durationMonths: programs.durationMonths,
        departmentName: departments.name,
        departmentNameFr: departments.nameFr,
        promoName: promotions.name,
        promoNameFr: promotions.nameFr,
        startDate: promotions.startDate,
        endDate: promotions.endDate,
        amountPaid: enrollmentProgress.amountPaid,
        totalAmount: enrollmentProgress.totalAmount,
        learningPercent: enrollmentProgress.learningPercent,
        exercisesCompleted: enrollmentProgress.exercisesCompleted,
        exercisesTotal: enrollmentProgress.exercisesTotal,
        assessmentScore: enrollmentProgress.assessmentScore,
        assessmentMax: enrollmentProgress.assessmentMax,
        assignmentStatus: enrollmentProgress.assignmentStatus,
        assignmentScore: enrollmentProgress.assignmentScore,
      })
      .from(enrollments)
      .leftJoin(profiles, eq(enrollments.studentId, profiles.id))
      .leftJoin(programs, eq(enrollments.programId, programs.id))
      .leftJoin(departments, eq(programs.departmentId, departments.id))
      .leftJoin(promotions, eq(enrollments.promotionId, promotions.id))
      .leftJoin(enrollmentProgress, eq(enrollments.id, enrollmentProgress.enrollmentId))
      .where(eq(enrollments.studentId, auth.userId));
    const programIds = [...new Set(rows.map((r) => r.programId).filter(Boolean))] as string[];
    const feesMap = await resolveProgramFees(programIds);
    const enrollmentsWithTotal = rows.map((r) => {
      const fees = r.programId ? (feesMap.get(r.programId) ?? []) : [];
      const totalAmountToPay = computeProgramTotalFees(fees, r.durationMonths ?? 0);
      return {
        id: r.id,
        programId: r.programId,
        promotionId: r.promotionId,
        rollNumber: r.rollNumber ?? undefined,
        status: r.status,
        enrolledAt: r.enrolledAt,
        progName: r.progName,
        progNameFr: r.progNameFr,
        departmentName: r.departmentName ?? undefined,
        departmentNameFr: r.departmentNameFr ?? undefined,
        promoName: r.promoName,
        promoNameFr: r.promoNameFr,
        startDate: r.startDate,
        endDate: r.endDate,
        totalAmountToPay,
        progress: {
          amountPaid: r.amountPaid != null ? Number(r.amountPaid) : 0,
          totalAmount: r.totalAmount != null ? Number(r.totalAmount) : totalAmountToPay,
          learningPercent: r.learningPercent ?? 0,
          exercisesCompleted: r.exercisesCompleted ?? 0,
          exercisesTotal: r.exercisesTotal ?? 0,
          assessmentScore: r.assessmentScore != null ? Number(r.assessmentScore) : null,
          assessmentMax: r.assessmentMax ?? 100,
          assignmentStatus: r.assignmentStatus ?? 'not_started',
          assignmentScore: r.assignmentScore != null ? Number(r.assignmentScore) : null,
        },
      };
    });
    return c.json({ enrollments: enrollmentsWithTotal });
  } catch (e) {
    console.error('List my enrollments error:', e);
    return c.json({ error: `Failed to list enrollments: ${(e as Error).message}` }, 500);
  }
});

// GET /enrollments — admin: list all enrollments, optional ?status= & ?promotionId= & ?programId= & ?departmentId=
app.get('/enrollments', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const statusFilter = c.req.query('status');
    const promotionIdFilter = c.req.query('promotionId');
    const programIdFilter = c.req.query('programId');
    const departmentIdFilter = c.req.query('departmentId');
    const departmentSlugFilter = c.req.query('department');
    const baseQuery = db
      .select({
        id: enrollments.id,
        studentId: enrollments.studentId,
        programId: enrollments.programId,
        promotionId: enrollments.promotionId,
        rollNumber: profiles.rollNumber,
        status: enrollments.status,
        enrolledAt: enrollments.enrolledAt,
        studentName: profiles.name,
        studentEmail: profiles.email,
        progName: programs.name,
        progNameFr: programs.nameFr,
        durationMonths: programs.durationMonths,
        promoName: promotions.name,
        promoNameFr: promotions.nameFr,
        startDate: promotions.startDate,
        endDate: promotions.endDate,
        amountPaid: enrollmentProgress.amountPaid,
        totalAmount: enrollmentProgress.totalAmount,
        learningPercent: enrollmentProgress.learningPercent,
        exercisesCompleted: enrollmentProgress.exercisesCompleted,
        exercisesTotal: enrollmentProgress.exercisesTotal,
        assessmentScore: enrollmentProgress.assessmentScore,
        assessmentMax: enrollmentProgress.assessmentMax,
        assignmentStatus: enrollmentProgress.assignmentStatus,
        assignmentScore: enrollmentProgress.assignmentScore,
      })
      .from(enrollments)
      .leftJoin(profiles, eq(enrollments.studentId, profiles.id))
      .leftJoin(programs, eq(enrollments.programId, programs.id))
      .leftJoin(promotions, eq(enrollments.promotionId, promotions.id))
      .leftJoin(departments, eq(programs.departmentId, departments.id))
      .leftJoin(enrollmentProgress, eq(enrollments.id, enrollmentProgress.enrollmentId));
    const conditions: ReturnType<typeof eq>[] = [];
    if (statusFilter) conditions.push(eq(enrollments.status, statusFilter as 'pending' | 'active' | 'completed' | 'dropped' | 'suspended'));
    if (promotionIdFilter) conditions.push(eq(enrollments.promotionId, promotionIdFilter));
    if (programIdFilter) conditions.push(eq(enrollments.programId, programIdFilter));
    if (departmentIdFilter) conditions.push(eq(programs.departmentId, departmentIdFilter));
    if (departmentSlugFilter) conditions.push(eq(departments.slug, departmentSlugFilter));
    const whereClause = conditions.length > 0 ? and(...(conditions as [ReturnType<typeof eq>, ...ReturnType<typeof eq>[]])) : undefined;
    const rows = whereClause
      ? await baseQuery.where(whereClause).orderBy(desc(enrollments.enrolledAt))
      : await baseQuery.orderBy(desc(enrollments.enrolledAt));
    const programIds = [...new Set(rows.map((r) => r.programId).filter(Boolean))] as string[];
    const feesMap = await resolveProgramFees(programIds);
    const list = rows.map((r) => {
      const fees = r.programId ? (feesMap.get(r.programId) ?? []) : [];
      const totalAmountToPay = computeProgramTotalFees(fees, r.durationMonths ?? 0);
      return {
        id: r.id,
        studentId: r.studentId,
        programId: r.programId,
        promotionId: r.promotionId,
        rollNumber: r.rollNumber ?? undefined,
        status: r.status,
        enrolledAt: r.enrolledAt,
        studentName: r.studentName,
        studentEmail: r.studentEmail,
        progName: r.progName,
        progNameFr: r.progNameFr,
        promoName: r.promoName,
        promoNameFr: r.promoNameFr,
        startDate: r.startDate,
        endDate: r.endDate,
        totalAmountToPay,
        progress: {
          amountPaid: r.amountPaid != null ? Number(r.amountPaid) : 0,
          totalAmount: r.totalAmount != null ? Number(r.totalAmount) : totalAmountToPay,
          learningPercent: r.learningPercent ?? 0,
          exercisesCompleted: r.exercisesCompleted ?? 0,
          exercisesTotal: r.exercisesTotal ?? 0,
          assessmentScore: r.assessmentScore != null ? Number(r.assessmentScore) : null,
          assessmentMax: r.assessmentMax ?? 100,
          assignmentStatus: r.assignmentStatus ?? 'not_started',
          assignmentScore: r.assignmentScore != null ? Number(r.assignmentScore) : null,
        },
      };
    });
    return c.json({ enrollments: list });
  } catch (e) {
    console.error('List enrollments error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

// PATCH /enrollments/:id — admin: update status (e.g. approve: set to 'active'); when approved, create progress if missing
app.patch('/enrollments/:id', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const id = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    const status = body.status;
    if (!status || !['pending', 'active', 'completed', 'dropped', 'suspended'].includes(status)) {
      return c.json({ error: 'status must be one of: pending, active, completed, dropped, suspended' }, 400);
    }
    const [updated] = await db
      .update(enrollments)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(enrollments.id, id))
      .returning();
    if (!updated) return c.json({ error: 'Enrollment not found' }, 404);
    if (status === 'active') {
      const [existingProgress] = await db.select().from(enrollmentProgress).where(eq(enrollmentProgress.enrollmentId, id));
      if (!existingProgress && updated.programId) {
        const [prog] = await db.select({ durationMonths: programs.durationMonths }).from(programs).where(eq(programs.id, updated.programId));
        const fees = await resolveProgramFees([updated.programId!]).then(m => m.get(updated.programId!) ?? []);
        const totalAmount = computeProgramTotalFees(fees, prog?.durationMonths ?? 0);
        await db.insert(enrollmentProgress).values({
          enrollmentId: id,
          totalAmount: String(totalAmount),
        });
      }
    }
    return c.json({ enrollment: updated });
  } catch (e) {
    console.error('Update enrollment error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

// GET /enrollments/:id/progress — student (own) or admin
app.get('/enrollments/:id/progress', async (c) => {
  try {
    const auth = await authenticateUser(c.req.header('Authorization'));
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);
    const id = c.req.param('id');
    const [en] = await db.select({ id: enrollments.id, studentId: enrollments.studentId }).from(enrollments).where(eq(enrollments.id, id));
    if (!en) return c.json({ error: 'Enrollment not found' }, 404);
    const isAdmin = auth.role === 'admin';
    if (!isAdmin && en.studentId !== auth.userId) return c.json({ error: 'Forbidden' }, 403);
    const [prog] = await db.select().from(enrollmentProgress).where(eq(enrollmentProgress.enrollmentId, id));
    if (!prog) return c.json({ progress: null }, 200);
    return c.json({
      progress: {
        amountPaid: Number(prog.amountPaid ?? 0),
        totalAmount: Number(prog.totalAmount ?? 0),
        learningPercent: prog.learningPercent ?? 0,
        exercisesCompleted: prog.exercisesCompleted ?? 0,
        exercisesTotal: prog.exercisesTotal ?? 0,
        assessmentScore: prog.assessmentScore != null ? Number(prog.assessmentScore) : null,
        assessmentMax: prog.assessmentMax ?? 100,
        assignmentStatus: prog.assignmentStatus ?? 'not_started',
        assignmentScore: prog.assignmentScore != null ? Number(prog.assignmentScore) : null,
        updatedAt: prog.updatedAt,
      },
    });
  } catch (e) {
    console.error('Get enrollment progress error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

// PATCH /enrollments/:id/progress — admin (or staff) updates progress
app.patch('/enrollments/:id/progress', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const id = c.req.param('id');
    const [en] = await db.select({ id: enrollments.id }).from(enrollments).where(eq(enrollments.id, id));
    if (!en) return c.json({ error: 'Enrollment not found' }, 404);
    const body = await c.req.json().catch(() => ({}));
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof body.amountPaid === 'number') updates.amountPaid = String(body.amountPaid);
    if (typeof body.totalAmount === 'number') updates.totalAmount = String(body.totalAmount);
    if (typeof body.learningPercent === 'number') updates.learningPercent = body.learningPercent;
    if (typeof body.exercisesCompleted === 'number') updates.exercisesCompleted = body.exercisesCompleted;
    if (typeof body.exercisesTotal === 'number') updates.exercisesTotal = body.exercisesTotal;
    if (body.assessmentScore !== undefined) updates.assessmentScore = body.assessmentScore == null ? null : String(body.assessmentScore);
    if (typeof body.assessmentMax === 'number') updates.assessmentMax = body.assessmentMax;
    if (['not_started', 'in_progress', 'submitted', 'graded'].includes(body.assignmentStatus)) updates.assignmentStatus = body.assignmentStatus;
    if (body.assignmentScore !== undefined) updates.assignmentScore = body.assignmentScore == null ? null : String(body.assignmentScore);
    const [existing] = await db.select().from(enrollmentProgress).where(eq(enrollmentProgress.enrollmentId, id));
    if (!existing) {
      await db.insert(enrollmentProgress).values({ enrollmentId: id, ...updates });
    } else {
      await db.update(enrollmentProgress).set(updates as any).where(eq(enrollmentProgress.enrollmentId, id));
    }
    const [prog] = await db.select().from(enrollmentProgress).where(eq(enrollmentProgress.enrollmentId, id));
    return c.json({
      progress: prog ? {
        amountPaid: Number(prog.amountPaid ?? 0),
        totalAmount: Number(prog.totalAmount ?? 0),
        learningPercent: prog.learningPercent ?? 0,
        exercisesCompleted: prog.exercisesCompleted ?? 0,
        exercisesTotal: prog.exercisesTotal ?? 0,
        assessmentScore: prog.assessmentScore != null ? Number(prog.assessmentScore) : null,
        assessmentMax: prog.assessmentMax ?? 100,
        assignmentStatus: prog.assignmentStatus ?? 'not_started',
        assignmentScore: prog.assignmentScore != null ? Number(prog.assignmentScore) : null,
        updatedAt: prog.updatedAt,
      } : null,
    });
  } catch (e) {
    console.error('Update enrollment progress error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

// GET /enrollments/:id/activities — student (own enrollment): list activities assigned to promotion OR to enrollment's class
app.get('/enrollments/:id/activities', async (c) => {
  try {
    const auth = await authenticateUser(c.req.header('Authorization'));
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);
    const id = c.req.param('id');
    const [en] = await db.select({ id: enrollments.id, studentId: enrollments.studentId, promotionId: enrollments.promotionId, classId: enrollments.classId }).from(enrollments).where(eq(enrollments.id, id));
    if (!en) return c.json({ error: 'Enrollment not found' }, 404);
    if (en.studentId !== auth.userId) return c.json({ error: 'Forbidden' }, 403);
    const activityRows: { id: string; type: any; title: string | null; titleFr: string | null; description: string | null; descriptionFr: string | null; maxScore: any; requiresSubmission: boolean | null }[] = [];
    if (en.promotionId) {
      const fromPromo = await db.select({
        id: learningActivities.id,
        type: learningActivities.type,
        title: learningActivities.title,
        titleFr: learningActivities.titleFr,
        description: learningActivities.description,
        descriptionFr: learningActivities.descriptionFr,
        maxScore: learningActivities.maxScore,
        requiresSubmission: learningActivities.requiresSubmission,
      }).from(activityPromotions)
        .innerJoin(learningActivities, eq(activityPromotions.activityId, learningActivities.id))
        .where(eq(activityPromotions.promotionId, en.promotionId));
      activityRows.push(...fromPromo);
    }
    if (en.classId) {
      const fromClass = await db.select({
        id: learningActivities.id,
        type: learningActivities.type,
        title: learningActivities.title,
        titleFr: learningActivities.titleFr,
        description: learningActivities.description,
        descriptionFr: learningActivities.descriptionFr,
        maxScore: learningActivities.maxScore,
        requiresSubmission: learningActivities.requiresSubmission,
      }).from(activityClasses)
        .innerJoin(learningActivities, eq(activityClasses.activityId, learningActivities.id))
        .where(eq(activityClasses.classId, en.classId));
      const seen = new Set(activityRows.map((r) => r.id));
      for (const r of fromClass) if (!seen.has(r.id)) { seen.add(r.id); activityRows.push(r); }
    }
    const activityIds = activityRows.map((r) => r.id);
    const submissions = activityIds.length === 0 ? [] : await db.select({
      activityId: activitySubmissions.activityId,
      status: activitySubmissions.status,
      score: activitySubmissions.score,
      maxScore: activitySubmissions.maxScore,
      submittedAt: activitySubmissions.submittedAt,
    }).from(activitySubmissions).where(and(eq(activitySubmissions.enrollmentId, id), inArray(activitySubmissions.activityId, activityIds)));
    const subByActivity = new Map(submissions.map((s) => [s.activityId, s]));
    const activities = activityRows
      .sort((a, b) => (a.title || '').localeCompare(b.title || ''))
      .map((r) => {
        const sub = subByActivity.get(r.id);
        return {
          id: r.id,
          type: r.type,
          title: r.title,
          titleFr: r.titleFr,
          description: r.description ?? undefined,
          descriptionFr: r.descriptionFr ?? undefined,
          maxScore: r.maxScore != null ? Number(r.maxScore) : undefined,
          requiresSubmission: r.requiresSubmission ?? false,
          submission: sub ? { status: sub.status, score: sub.score != null ? Number(sub.score) : null, maxScore: sub.maxScore != null ? Number(sub.maxScore) : null, submittedAt: sub.submittedAt } : null,
        };
      });
    return c.json({ activities });
  } catch (e) {
    console.error('Enrollment activities error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

// ──────────────────────────────────────
// LEARNING ACTIVITIES (exercises, assessments, assignments)
// ──────────────────────────────────────
app.get('/learning-activities', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const programId = c.req.query('programId');
    const promotionId = c.req.query('promotionId');
    const type = c.req.query('type');
    let query = db.select({
      id: learningActivities.id,
      type: learningActivities.type,
      title: learningActivities.title,
      titleFr: learningActivities.titleFr,
      description: learningActivities.description,
      programId: learningActivities.programId,
      requiresSubmission: learningActivities.requiresSubmission,
      maxScore: learningActivities.maxScore,
      createdAt: learningActivities.createdAt,
      progName: programs.name,
      progNameFr: programs.nameFr,
    }).from(learningActivities).leftJoin(programs, eq(learningActivities.programId, programs.id)).orderBy(desc(learningActivities.createdAt));
    const rows = await query;
    let list = rows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      titleFr: r.titleFr,
      description: r.description,
      programId: r.programId,
      programName: r.progName,
      programNameFr: r.progNameFr,
      requiresSubmission: r.requiresSubmission,
      maxScore: r.maxScore != null ? Number(r.maxScore) : 0,
      createdAt: r.createdAt,
    }));
    if (programId) list = list.filter((a) => a.programId === programId);
    if (type) list = list.filter((a) => a.type === type);
    if (promotionId) {
      const assigned = await db.select({ activityId: activityPromotions.activityId }).from(activityPromotions).where(eq(activityPromotions.promotionId, promotionId));
      const ids = new Set(assigned.map((a) => a.activityId));
      list = list.filter((a) => ids.has(a.id!));
    }
    return c.json({ activities: list });
  } catch (e) {
    console.error('List learning activities error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.post('/learning-activities', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const body = await c.req.json();
    const [inserted] = await db.insert(learningActivities).values({
      type: (body.type || 'exercise') as 'exercise' | 'assessment' | 'assignment',
      title: body.title || 'Untitled',
      titleFr: body.titleFr ?? '',
      description: body.description ?? '',
      descriptionFr: body.descriptionFr ?? '',
      instructions: body.instructions ?? '',
      instructionsFr: body.instructionsFr ?? '',
      programId: body.programId || null,
      createdBy: (admin as any).userId,
      requiresSubmission: !!body.requiresSubmission,
      maxScore: body.maxScore != null ? String(body.maxScore) : '0',
      sortOrder: body.sortOrder ?? 0,
    }).returning();
    return c.json({ activity: inserted });
  } catch (e) {
    console.error('Create learning activity error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.get('/learning-activities/:id', async (c) => {
  try {
    const auth = await authenticateUser(c.req.header('Authorization'));
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);
    const id = c.req.param('id');
    const [act] = await db.select().from(learningActivities).where(eq(learningActivities.id, id));
    if (!act) return c.json({ error: 'Activity not found' }, 404);
    const isAdmin = auth.role === 'admin';
    if (!isAdmin) {
      const myEnrollments = await db.select({ promotionId: enrollments.promotionId, classId: enrollments.classId }).from(enrollments).where(eq(enrollments.studentId, auth.userId));
      const myPromoIds = new Set(myEnrollments.map((e) => e.promotionId).filter(Boolean));
      const myClassIds = new Set(myEnrollments.map((e) => e.classId).filter(Boolean));
      const assignedPromo = await db.select({ promotionId: activityPromotions.promotionId }).from(activityPromotions).where(eq(activityPromotions.activityId, id));
      const assignedClass = await db.select({ classId: activityClasses.classId }).from(activityClasses).where(eq(activityClasses.activityId, id));
      const hasAccess = assignedPromo.some((a) => myPromoIds.has(a.promotionId)) || assignedClass.some((a) => myClassIds.has(a.classId));
      if (!hasAccess) return c.json({ error: 'You do not have access to this activity' }, 403);
    }
    const items = await db.select().from(activityItems).where(eq(activityItems.activityId, id)).orderBy(asc(activityItems.sortOrder));
    const promoLinks = await db.select({ promotionId: activityPromotions.promotionId }).from(activityPromotions).where(eq(activityPromotions.activityId, id));
    const [prog] = act.programId ? await db.select({ name: programs.name, nameFr: programs.nameFr }).from(programs).where(eq(programs.id, act.programId)) : [null];
    const payload: Record<string, unknown> = {
      activity: {
        ...act,
        maxScore: act.maxScore != null ? Number(act.maxScore) : 0,
        programName: prog?.name,
        programNameFr: prog?.nameFr,
      },
      items: items.map((i) => ({
        ...i,
        maxScore: i.maxScore != null ? Number(i.maxScore) : 1,
      })),
    };
    if (isAdmin) (payload as any).promotionIds = promoLinks.map((p) => p.promotionId);
    return c.json(payload);
  } catch (e) {
    console.error('Get learning activity error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.put('/learning-activities/:id', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const id = c.req.param('id');
    const body = await c.req.json();
    const [updated] = await db.update(learningActivities).set({
      type: body.type ?? undefined,
      title: body.title ?? undefined,
      titleFr: body.titleFr ?? undefined,
      description: body.description ?? undefined,
      descriptionFr: body.descriptionFr ?? undefined,
      instructions: body.instructions ?? undefined,
      instructionsFr: body.instructionsFr ?? undefined,
      programId: body.programId !== undefined ? body.programId : undefined,
      requiresSubmission: body.requiresSubmission !== undefined ? body.requiresSubmission : undefined,
      maxScore: body.maxScore !== undefined ? String(body.maxScore) : undefined,
      sortOrder: body.sortOrder ?? undefined,
      updatedAt: new Date(),
    }).where(eq(learningActivities.id, id)).returning();
    if (!updated) return c.json({ error: 'Activity not found' }, 404);
    return c.json({ activity: updated });
  } catch (e) {
    console.error('Update learning activity error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.delete('/learning-activities/:id', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const id = c.req.param('id');
    const subIds = await db.select({ id: activitySubmissions.id }).from(activitySubmissions).where(eq(activitySubmissions.activityId, id));
    if (subIds.length > 0) {
      await db.delete(activitySubmissionResponses).where(inArray(activitySubmissionResponses.submissionId, subIds.map((s) => s.id)));
    }
    await db.delete(activitySubmissions).where(eq(activitySubmissions.activityId, id));
    await db.delete(activityItems).where(eq(activityItems.activityId, id));
    await db.delete(activityPromotions).where(eq(activityPromotions.activityId, id));
    await db.delete(activityClasses).where(eq(activityClasses.activityId, id));
    const result = await db.delete(learningActivities).where(eq(learningActivities.id, id)).returning({ id: learningActivities.id });
    if (result.length === 0) return c.json({ error: 'Activity not found' }, 404);
    return c.json({ success: true });
  } catch (e) {
    console.error('Delete learning activity error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.get('/learning-activities/:id/items', async (c) => {
  try {
    const auth = await authenticateUser(c.req.header('Authorization'));
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);
    const id = c.req.param('id');
    if (auth.role !== 'admin') {
      const myEnrollments = await db.select({ promotionId: enrollments.promotionId, classId: enrollments.classId }).from(enrollments).where(eq(enrollments.studentId, auth.userId));
      const myPromoIds = new Set(myEnrollments.map((e) => e.promotionId).filter(Boolean));
      const myClassIds = new Set(myEnrollments.map((e) => e.classId).filter(Boolean));
      const assignedPromo = await db.select({ promotionId: activityPromotions.promotionId }).from(activityPromotions).where(eq(activityPromotions.activityId, id));
      const assignedClass = await db.select({ classId: activityClasses.classId }).from(activityClasses).where(eq(activityClasses.activityId, id));
      const hasAccess = assignedPromo.some((a) => myPromoIds.has(a.promotionId)) || assignedClass.some((a) => myClassIds.has(a.classId));
      if (!hasAccess) return c.json({ error: 'Forbidden' }, 403);
    }
    const items = await db.select().from(activityItems).where(eq(activityItems.activityId, id)).orderBy(asc(activityItems.sortOrder));
    return c.json({ items: items.map((i) => ({ ...i, maxScore: i.maxScore != null ? Number(i.maxScore) : 1 })) });
  } catch (e) {
    console.error('List activity items error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.post('/learning-activities/:id/items', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const id = c.req.param('id');
    const body = await c.req.json();
    const [inserted] = await db.insert(activityItems).values({
      activityId: id,
      sortOrder: body.sortOrder ?? 0,
      itemType: (body.itemType || 'theoretical') as any,
      questionText: body.questionText ?? '',
      questionTextFr: body.questionTextFr ?? '',
      options: Array.isArray(body.options) ? body.options : [],
      correctAnswer: body.correctAnswer ?? null,
      mediaUrl: body.mediaUrl ?? null,
      mediaType: body.mediaType ?? null,
      maxScore: body.maxScore != null ? String(body.maxScore) : '1',
      metadata: body.metadata ?? {},
    }).returning();
    return c.json({ item: { ...inserted, maxScore: inserted.maxScore != null ? Number(inserted.maxScore) : 1 } });
  } catch (e) {
    console.error('Create activity item error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.put('/learning-activities/:activityId/items/:itemId', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const activityId = c.req.param('activityId');
    const itemId = c.req.param('itemId');
    const body = await c.req.json();
    const [updated] = await db.update(activityItems).set({
      sortOrder: body.sortOrder ?? undefined,
      itemType: body.itemType ?? undefined,
      questionText: body.questionText ?? undefined,
      questionTextFr: body.questionTextFr ?? undefined,
      options: body.options !== undefined ? body.options : undefined,
      correctAnswer: body.correctAnswer !== undefined ? body.correctAnswer : undefined,
      mediaUrl: body.mediaUrl !== undefined ? body.mediaUrl : undefined,
      mediaType: body.mediaType ?? undefined,
      maxScore: body.maxScore !== undefined ? String(body.maxScore) : undefined,
      metadata: body.metadata !== undefined ? body.metadata : undefined,
      updatedAt: new Date(),
    }).where(and(eq(activityItems.id, itemId), eq(activityItems.activityId, activityId))).returning();
    if (!updated) return c.json({ error: 'Item not found' }, 404);
    return c.json({ item: { ...updated, maxScore: updated.maxScore != null ? Number(updated.maxScore) : 1 } });
  } catch (e) {
    console.error('Update activity item error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.delete('/learning-activities/:activityId/items/:itemId', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const activityId = c.req.param('activityId');
    const itemId = c.req.param('itemId');
    const result = await db.delete(activityItems).where(and(eq(activityItems.id, itemId), eq(activityItems.activityId, activityId))).returning({ id: activityItems.id });
    if (result.length === 0) return c.json({ error: 'Item not found' }, 404);
    return c.json({ success: true });
  } catch (e) {
    console.error('Delete activity item error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.get('/learning-activities/:id/promotions', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const id = c.req.param('id');
    const rows = await db.select({ promotionId: activityPromotions.promotionId }).from(activityPromotions).where(eq(activityPromotions.activityId, id));
    return c.json({ promotionIds: rows.map((r) => r.promotionId) });
  } catch (e) {
    console.error('List activity promotions error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.post('/learning-activities/:id/promotions', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const id = c.req.param('id');
    const body = await c.req.json();
    const promotionIds = Array.isArray(body.promotionIds) ? body.promotionIds : (body.promotionId ? [body.promotionId] : []);
    for (const promotionId of promotionIds) {
      await db.insert(activityPromotions).values({
        activityId: id,
        promotionId,
        assignedBy: (admin as any).userId,
      }).onConflictDoNothing({ target: [activityPromotions.activityId, activityPromotions.promotionId] });
    }
    const rows = await db.select({ promotionId: activityPromotions.promotionId }).from(activityPromotions).where(eq(activityPromotions.activityId, id));
    return c.json({ promotionIds: rows.map((r) => r.promotionId) });
  } catch (e) {
    console.error('Assign activity to promotions error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.delete('/learning-activities/:id/promotions/:promotionId', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const id = c.req.param('id');
    const promotionId = c.req.param('promotionId');
    await db.delete(activityPromotions).where(and(eq(activityPromotions.activityId, id), eq(activityPromotions.promotionId, promotionId)));
    return c.json({ success: true });
  } catch (e) {
    console.error('Unassign activity from promotion error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.get('/learning-activities/:id/classes', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const id = c.req.param('id');
    const rows = await db.select({ classId: activityClasses.classId }).from(activityClasses).where(eq(activityClasses.activityId, id));
    return c.json({ classIds: rows.map((r) => r.classId) });
  } catch (e) {
    console.error('List activity classes error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.post('/learning-activities/:id/classes', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const id = c.req.param('id');
    const body = await c.req.json();
    const classIds = Array.isArray(body.classIds) ? body.classIds : (body.classId ? [body.classId] : []);
    for (const classId of classIds) {
      await db.insert(activityClasses).values({
        activityId: id,
        classId,
        assignedBy: (admin as any).userId,
      }).onConflictDoNothing({ target: [activityClasses.activityId, activityClasses.classId] });
    }
    const rows = await db.select({ classId: activityClasses.classId }).from(activityClasses).where(eq(activityClasses.activityId, id));
    return c.json({ classIds: rows.map((r) => r.classId) });
  } catch (e) {
    console.error('Assign activity to classes error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.delete('/learning-activities/:id/classes/:classId', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const id = c.req.param('id');
    const classId = c.req.param('classId');
    await db.delete(activityClasses).where(and(eq(activityClasses.activityId, id), eq(activityClasses.classId, classId)));
    return c.json({ success: true });
  } catch (e) {
    console.error('Unassign activity from class error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.get('/activity-submissions', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const activityId = c.req.query('activityId');
    const status = c.req.query('status');
    const rows = await db.select({
      id: activitySubmissions.id,
      enrollmentId: activitySubmissions.enrollmentId,
      activityId: activitySubmissions.activityId,
      status: activitySubmissions.status,
      submittedAt: activitySubmissions.submittedAt,
      score: activitySubmissions.score,
      maxScore: activitySubmissions.maxScore,
      feedback: activitySubmissions.feedback,
      studentName: profiles.name,
      studentEmail: profiles.email,
      activityTitle: learningActivities.title,
    }).from(activitySubmissions)
      .leftJoin(enrollments, eq(activitySubmissions.enrollmentId, enrollments.id))
      .leftJoin(profiles, eq(enrollments.studentId, profiles.id))
      .leftJoin(learningActivities, eq(activitySubmissions.activityId, learningActivities.id))
      .orderBy(desc(activitySubmissions.submittedAt));
    let list = rows.map((r) => ({
      id: r.id,
      enrollmentId: r.enrollmentId,
      activityId: r.activityId,
      status: r.status,
      submittedAt: r.submittedAt,
      score: r.score != null ? Number(r.score) : null,
      maxScore: r.maxScore != null ? Number(r.maxScore) : null,
      feedback: r.feedback,
      studentName: (r as any).studentName,
      studentEmail: (r as any).studentEmail,
      activityTitle: (r as any).activityTitle,
    }));
    if (activityId) list = list.filter((s) => s.activityId === activityId);
    if (status) list = list.filter((s) => s.status === status);
    return c.json({ submissions: list });
  } catch (e) {
    console.error('List activity submissions error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.get('/activity-submissions/my', async (c) => {
  try {
    const auth = await authenticateUser(c.req.header('Authorization'));
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);
    const myEnrollments = await db.select({ id: enrollments.id }).from(enrollments).where(eq(enrollments.studentId, auth.userId));
    const enrollmentIds = myEnrollments.map((e) => e.id);
    if (enrollmentIds.length === 0) return c.json({ submissions: [] });
    const rows = await db.select({
      id: activitySubmissions.id,
      enrollmentId: activitySubmissions.enrollmentId,
      activityId: activitySubmissions.activityId,
      status: activitySubmissions.status,
      submittedAt: activitySubmissions.submittedAt,
      score: activitySubmissions.score,
      maxScore: activitySubmissions.maxScore,
      title: learningActivities.title,
      titleFr: learningActivities.titleFr,
    }).from(activitySubmissions)
      .leftJoin(learningActivities, eq(activitySubmissions.activityId, learningActivities.id))
      .where(inArray(activitySubmissions.enrollmentId, enrollmentIds));
    return c.json({
      submissions: rows.map((r) => ({
        id: r.id,
        enrollmentId: r.enrollmentId,
        activityId: r.activityId,
        status: r.status,
        submittedAt: r.submittedAt,
        score: r.score != null ? Number(r.score) : null,
        maxScore: r.maxScore != null ? Number(r.maxScore) : null,
        title: r.title,
        titleFr: r.titleFr,
      })),
    });
  } catch (e) {
    console.error('List my submissions error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.post('/activity-submissions', async (c) => {
  try {
    const auth = await authenticateUser(c.req.header('Authorization'));
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);
    const body = await c.req.json();
    const enrollmentId = body.enrollmentId;
    const activityId = body.activityId;
    if (!enrollmentId || !activityId) return c.json({ error: 'enrollmentId and activityId required' }, 400);
    const [en] = await db.select().from(enrollments).where(and(eq(enrollments.id, enrollmentId), eq(enrollments.studentId, auth.userId)));
    if (!en) return c.json({ error: 'Enrollment not found or not yours' }, 404);
    const existing = await db.select().from(activitySubmissions).where(and(eq(activitySubmissions.enrollmentId, enrollmentId), eq(activitySubmissions.activityId, activityId))).limit(1);
    if (existing.length > 0) return c.json({ error: 'Already have a submission for this activity' }, 400);
    const [inserted] = await db.insert(activitySubmissions).values({
      enrollmentId,
      activityId,
      status: 'draft',
    }).returning();
    return c.json({ submission: inserted });
  } catch (e) {
    console.error('Create submission error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.patch('/activity-submissions/:id', async (c) => {
  try {
    const auth = await authenticateUser(c.req.header('Authorization'));
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);
    const id = c.req.param('id');
    const body = await c.req.json();
    const [sub] = await db.select().from(activitySubmissions).where(eq(activitySubmissions.id, id));
    if (!sub) return c.json({ error: 'Submission not found' }, 404);
    const isAdmin = auth.role === 'admin';
    if (isAdmin) {
      await db.update(activitySubmissions).set({
        status: (body.status || sub.status) as any,
        score: body.score !== undefined ? String(body.score) : sub.score,
        maxScore: body.maxScore !== undefined ? String(body.maxScore) : sub.maxScore,
        feedback: body.feedback !== undefined ? body.feedback : sub.feedback,
        gradedBy: auth.userId,
        gradedAt: body.status === 'graded' ? new Date() : sub.gradedAt,
        updatedAt: new Date(),
      }).where(eq(activitySubmissions.id, id));
    } else {
      if (sub.enrollmentId) {
        const [en] = await db.select().from(enrollments).where(eq(enrollments.id, sub.enrollmentId));
        if (en?.studentId !== auth.userId) return c.json({ error: 'Forbidden' }, 403);
      }
      if (body.status === 'submitted') {
        await db.update(activitySubmissions).set({
          status: 'submitted',
          submittedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(activitySubmissions.id, id));
      }
    }
    const [updated] = await db.select().from(activitySubmissions).where(eq(activitySubmissions.id, id));
    if (updated?.enrollmentId && (updated.status === 'submitted' || updated.status === 'graded')) {
      const [act] = await db.select({ type: learningActivities.type }).from(learningActivities).where(eq(learningActivities.id, updated.activityId));
      const [existingProg] = await db.select().from(enrollmentProgress).where(eq(enrollmentProgress.enrollmentId, updated.enrollmentId));
      const score = updated.score != null ? Number(updated.score) : null;
      const maxScore = updated.maxScore != null ? Number(updated.maxScore) : null;
      if (act?.type === 'exercise') {
        const exercisesCompleted = (existingProg?.exercisesCompleted ?? 0) + 1;
        const exercisesTotal = Math.max(existingProg?.exercisesTotal ?? 0, exercisesCompleted);
        const updates: Record<string, unknown> = { exercisesCompleted, exercisesTotal, updatedAt: new Date() };
        if (existingProg) await db.update(enrollmentProgress).set(updates as any).where(eq(enrollmentProgress.enrollmentId, updated.enrollmentId));
        else await db.insert(enrollmentProgress).values({ enrollmentId: updated.enrollmentId, ...updates });
      } else if (act?.type === 'assessment' && score != null && maxScore != null) {
        const updates: Record<string, unknown> = { assessmentScore: String(score), assessmentMax: maxScore, updatedAt: new Date() };
        if (existingProg) await db.update(enrollmentProgress).set(updates as any).where(eq(enrollmentProgress.enrollmentId, updated.enrollmentId));
        else await db.insert(enrollmentProgress).values({ enrollmentId: updated.enrollmentId, ...updates });
      } else if (act?.type === 'assignment') {
        const updates: Record<string, unknown> = {
          assignmentStatus: updated.status === 'graded' ? 'graded' : 'submitted',
          updatedAt: new Date(),
        };
        if (score != null) (updates as any).assignmentScore = String(score);
        if (existingProg) await db.update(enrollmentProgress).set(updates as any).where(eq(enrollmentProgress.enrollmentId, updated.enrollmentId));
        else await db.insert(enrollmentProgress).values({ enrollmentId: updated.enrollmentId, ...updates });
      }
    }
    return c.json({ submission: updated });
  } catch (e) {
    console.error('Update submission error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

// ──────────────────────────────────────
// PORTAL: calendar day (classes + activities for a date)
// ──────────────────────────────────────
app.get('/portal/calendar/day', async (c) => {
  try {
    const auth = await authenticateUser(c.req.header('Authorization'));
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);
    const dateStr = c.req.query('date');
    if (!dateStr) return c.json({ error: 'date (YYYY-MM-DD) required' }, 400);
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return c.json({ error: 'Invalid date' }, 400);
    const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay();
    const myEnrollments = await db.select({
      id: enrollments.id,
      programId: enrollments.programId,
      classId: enrollments.classId,
      promotionId: enrollments.promotionId,
    }).from(enrollments).where(and(eq(enrollments.studentId, auth.userId), sql`${enrollments.status} IN ('active', 'pending')`));
    const classIds = myEnrollments.map((e) => e.classId).filter(Boolean) as string[];
    const classesToday: any[] = [];
    if (classIds.length > 0) {
      const rows = await db.select({
        id: programClasses.id,
        programId: programClasses.programId,
        name: programClasses.name,
        startTime: programClasses.startTime,
        endTime: programClasses.endTime,
        room: programClasses.room,
        dayOfWeek: programClasses.dayOfWeek,
        daysOfWeek: programClasses.daysOfWeek,
        progName: programs.name,
        progNameFr: programs.nameFr,
      }).from(programClasses)
        .innerJoin(programs, eq(programClasses.programId, programs.id))
        .where(inArray(programClasses.id, classIds));
      for (const r of rows) {
        const days: number[] = Array.isArray(r.daysOfWeek) && (r.daysOfWeek as number[]).length > 0
          ? (r.daysOfWeek as number[])
          : (r.dayOfWeek != null ? [r.dayOfWeek] : []);
        if (!days.includes(dayOfWeek)) continue;
        const enr = myEnrollments.find((e) => e.classId === r.id);
        if (enr) classesToday.push({ ...r, enrollmentId: enr.id });
      }
    }
    const activityIdsFromClass = new Set<string>();
    for (const classId of classIds) {
      const ac = await db.select({ activityId: activityClasses.activityId }).from(activityClasses).where(eq(activityClasses.classId, classId));
      ac.forEach((a) => activityIdsFromClass.add(a.activityId));
    }
    const promotionIds = myEnrollments.map((e) => e.promotionId).filter(Boolean) as string[];
    for (const promoId of promotionIds) {
      const ap = await db.select({ activityId: activityPromotions.activityId }).from(activityPromotions).where(eq(activityPromotions.promotionId, promoId));
      ap.forEach((a) => activityIdsFromClass.add(a.activityId));
    }
    const activitiesList = activityIdsFromClass.size === 0 ? [] : await db.select({
      id: learningActivities.id,
      type: learningActivities.type,
      title: learningActivities.title,
      titleFr: learningActivities.titleFr,
    }).from(learningActivities).where(inArray(learningActivities.id, [...activityIdsFromClass]));
    return c.json({ date: dateStr, dayOfWeek, classes: classesToday, activities: activitiesList });
  } catch (e) {
    console.error('Calendar day error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

// Portal: student week calendar (slots like admin board; student can only leave comment per day)
app.get('/portal/calendar/week', async (c) => {
  try {
    const auth = await authenticateUser(c.req.header('Authorization'));
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);
    const weekStart = c.req.query('weekStart');
    if (!weekStart) return c.json({ error: 'weekStart (YYYY-MM-DD) required' }, 400);
    const myEnrollments = await db.select({
      id: enrollments.id,
      classId: enrollments.classId,
      programId: enrollments.programId,
      promotionId: enrollments.promotionId,
    }).from(enrollments).where(and(eq(enrollments.studentId, auth.userId), sql`${enrollments.status} IN ('active', 'pending')`));
    const classIds = myEnrollments.map((e) => e.classId).filter(Boolean) as string[];
    if (classIds.length === 0) return c.json({ weekStart, slots: [] });
    const classesRows = await db
      .select({
        id: programClasses.id,
        name: programClasses.name,
        code: programClasses.code,
        programId: programClasses.programId,
        programName: programs.name,
        programNameFr: programs.nameFr,
        startTime: programClasses.startTime,
        endTime: programClasses.endTime,
        dayOfWeek: programClasses.dayOfWeek,
        daysOfWeek: programClasses.daysOfWeek,
        room: programClasses.room,
      })
      .from(programClasses)
      .innerJoin(programs, eq(programClasses.programId, programs.id))
      .where(inArray(programClasses.id, classIds))
      .orderBy(asc(programClasses.sortOrder), asc(programClasses.startTime));
    const schedulesRows = await db
      .select({
        classId: staffSchedules.classId,
        dayOfWeek: staffSchedules.dayOfWeek,
        startTime: staffSchedules.startTime,
        staffId: staffSchedules.staffId,
        staffName: profiles.name,
      })
      .from(staffSchedules)
      .leftJoin(profiles, eq(staffSchedules.staffId, profiles.id))
      .where(eq(staffSchedules.weekStart, weekStart));
    const scheduleByKey = new Map<string, { staffId: string; staffName: string | null }>();
    for (const s of schedulesRows) {
      const key = `${s.classId}-${s.dayOfWeek}-${s.startTime}`;
      scheduleByKey.set(key, { staffId: s.staffId, staffName: s.staffName });
    }
    const slots: any[] = [];
    for (const cl of classesRows) {
      const days: number[] = Array.isArray(cl.daysOfWeek) && (cl.daysOfWeek as number[]).length > 0
        ? (cl.daysOfWeek as number[])
        : (cl.dayOfWeek != null ? [cl.dayOfWeek] : []);
      const enr = myEnrollments.find((e) => e.classId === cl.id);
      if (!enr) continue;
      for (const dayOfWeek of days) {
        const key = `${cl.id}-${dayOfWeek}-${cl.startTime}`;
        const sched = scheduleByKey.get(key);
        slots.push({
          classId: cl.id,
          classCode: cl.code ?? undefined,
          className: cl.name,
          programId: cl.programId,
          programName: cl.programName,
          programNameFr: cl.programNameFr,
          dayOfWeek,
          startTime: cl.startTime,
          endTime: cl.endTime,
          room: cl.room,
          enrollmentId: enr.id,
          staffId: sched?.staffId ?? null,
          staffName: sched?.staffName ?? null,
        });
      }
    }
    return c.json({ weekStart, slots });
  } catch (e) {
    console.error('Portal calendar week error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

// Student: my attendance requests for a date (to show status/comment in calendar)
app.get('/portal/attendance-requests/me', async (c) => {
  try {
    const auth = await authenticateUser(c.req.header('Authorization'));
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);
    const dateStr = c.req.query('date');
    if (!dateStr) return c.json({ error: 'date (YYYY-MM-DD) required' }, 400);
    const rows = await db.select().from(studentAttendanceRequests)
      .where(and(eq(studentAttendanceRequests.studentId, auth.userId), eq(studentAttendanceRequests.requestDate, dateStr)))
      .orderBy(desc(studentAttendanceRequests.requestedAt));
    return c.json({ requests: rows });
  } catch (e) {
    console.error('Portal attendance requests me error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

// ──────────────────────────────────────
// STUDENT ATTENDANCE (request with location; teacher approves/rejects)
// ──────────────────────────────────────
app.post('/attendance-requests', async (c) => {
  try {
    const auth = await authenticateUser(c.req.header('Authorization'));
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);
    const body = await c.req.json();
    const enrollmentId = body.enrollmentId;
    const classId = body.classId;
    const teacherId = body.teacherId;
    if (!enrollmentId || !classId || !teacherId) return c.json({ error: 'enrollmentId, classId and teacherId required' }, 400);
    const [en] = await db.select().from(enrollments).where(and(eq(enrollments.id, enrollmentId), eq(enrollments.studentId, auth.userId)));
    if (!en) return c.json({ error: 'Enrollment not found' }, 404);
    const requestDate = body.requestDate || new Date().toISOString().slice(0, 10);
    const [inserted] = await db.insert(studentAttendanceRequests).values({
      studentId: auth.userId,
      enrollmentId,
      classId,
      teacherId,
      latitude: body.latitude != null ? String(body.latitude) : null,
      longitude: body.longitude != null ? String(body.longitude) : null,
      address: body.address || null,
      requestDate,
      comment: body.comment ?? null,
      status: 'pending',
    }).returning();
    return c.json({ request: inserted });
  } catch (e) {
    console.error('Create attendance request error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.get('/attendance-requests/for-teacher', async (c) => {
  try {
    const auth = await authenticateUser(c.req.header('Authorization'));
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);
    const teacherId = c.req.query('teacherId') || auth.userId;
    if (auth.role !== 'admin' && auth.userId !== teacherId) return c.json({ error: 'Forbidden' }, 403);
    const rows = await db.select().from(studentAttendanceRequests)
      .where(and(eq(studentAttendanceRequests.teacherId, teacherId), eq(studentAttendanceRequests.status, 'pending')))
      .orderBy(desc(studentAttendanceRequests.requestedAt));
    return c.json({ requests: rows });
  } catch (e) {
    console.error('List attendance requests error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.patch('/attendance-requests/:id', async (c) => {
  try {
    const auth = await authenticateUser(c.req.header('Authorization'));
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);
    const id = c.req.param('id');
    const body = await c.req.json();
    const [req] = await db.select().from(studentAttendanceRequests).where(eq(studentAttendanceRequests.id, id));
    if (!req) return c.json({ error: 'Not found' }, 404);
    if (req.teacherId !== auth.userId && auth.role !== 'admin') return c.json({ error: 'Forbidden' }, 403);
    const status = body.status === 'approved' || body.status === 'rejected' ? body.status : req.status;
    await db.update(studentAttendanceRequests).set({
      status,
      reviewedBy: auth.userId,
      reviewedAt: new Date(),
      rejectReason: body.rejectReason ?? req.rejectReason,
    }).where(eq(studentAttendanceRequests.id, id));
    const [updated] = await db.select().from(studentAttendanceRequests).where(eq(studentAttendanceRequests.id, id));
    return c.json({ request: updated });
  } catch (e) {
    console.error('Update attendance request error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

// Staff: my schedule for the week (so teacher can take attendance per slot)
app.get('/staff/my-schedule/week', async (c) => {
  try {
    const auth = await authenticateUser(c.req.header('Authorization'));
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);
    const weekStart = c.req.query('weekStart');
    if (!weekStart) return c.json({ error: 'weekStart (YYYY-MM-DD) required' }, 400);
    const rows = await db
      .select({
        id: staffSchedules.id,
        classId: staffSchedules.classId,
        dayOfWeek: staffSchedules.dayOfWeek,
        startTime: staffSchedules.startTime,
        endTime: staffSchedules.endTime,
        room: staffSchedules.room,
        lessonTitle: staffSchedules.lessonTitle,
        className: programClasses.name,
        classCode: programClasses.code,
        programName: programs.name,
        programNameFr: programs.nameFr,
      })
      .from(staffSchedules)
      .innerJoin(programClasses, eq(staffSchedules.classId, programClasses.id))
      .innerJoin(programs, eq(programClasses.programId, programs.id))
      .where(and(eq(staffSchedules.staffId, auth.userId), eq(staffSchedules.weekStart, weekStart)))
      .orderBy(asc(staffSchedules.dayOfWeek), asc(staffSchedules.startTime));
    return c.json({ weekStart, slots: rows });
  } catch (e) {
    console.error('Staff my schedule week error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

// Staff: get session for taking attendance (enrolled students + their request status for that date)
app.get('/staff/attendance/session', async (c) => {
  try {
    const auth = await authenticateUser(c.req.header('Authorization'));
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);
    const classId = c.req.query('classId');
    const attendanceDate = c.req.query('attendanceDate') || c.req.query('date');
    if (!classId || !attendanceDate) return c.json({ error: 'classId and attendanceDate (YYYY-MM-DD) required' }, 400);
    const d = new Date(attendanceDate);
    if (isNaN(d.getTime())) return c.json({ error: 'Invalid date' }, 400);
    const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay();
    const mon = new Date(d); mon.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1));
    const weekStart = mon.toISOString().slice(0, 10);
    const [schedule] = await db.select().from(staffSchedules).where(and(
      eq(staffSchedules.staffId, auth.userId),
      eq(staffSchedules.classId, classId),
      eq(staffSchedules.weekStart, weekStart),
      eq(staffSchedules.dayOfWeek, dayOfWeek),
    )).limit(1);
    if (!schedule && auth.role !== 'admin') return c.json({ error: 'You are not scheduled for this class on this date' }, 403);
    const enrolled = await db.select({
      enrollmentId: enrollments.id,
      studentId: enrollments.studentId,
      studentName: profiles.name,
      studentEmail: profiles.email,
    }).from(enrollments).innerJoin(profiles, eq(enrollments.studentId, profiles.id))
      .where(and(eq(enrollments.classId, classId), sql`${enrollments.status} IN ('active', 'pending')`));
    const requestRows = await db.select().from(studentAttendanceRequests)
      .where(and(eq(studentAttendanceRequests.classId, classId), eq(studentAttendanceRequests.requestDate, attendanceDate)));
    const byStudent = new Map(requestRows.map((r) => [r.studentId, r]));
    const students = enrolled.map((e) => ({
      enrollmentId: e.enrollmentId,
      studentId: e.studentId,
      name: e.studentName,
      email: e.studentEmail,
      requestId: byStudent.get(e.studentId)?.id,
      requestStatus: byStudent.get(e.studentId)?.status ?? null,
      comment: byStudent.get(e.studentId)?.comment ?? null,
    }));
    return c.json({ classId, attendanceDate, scheduleId: schedule?.id, students });
  } catch (e) {
    console.error('Staff attendance session error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

// Staff: scan student QR to mark present (creates or updates attendance request as approved)
app.post('/staff/attendance/scan', async (c) => {
  try {
    const auth = await authenticateUser(c.req.header('Authorization'));
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);
    const body = await c.req.json();
    const { studentId, enrollmentId, classId, requestDate } = body;
    if (!studentId || !enrollmentId || !classId || !requestDate) return c.json({ error: 'studentId, enrollmentId, classId, requestDate required' }, 400);
    const d = new Date(requestDate);
    if (isNaN(d.getTime())) return c.json({ error: 'Invalid date' }, 400);
    const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay();
    const mon = new Date(d); mon.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1));
    const weekStart = mon.toISOString().slice(0, 10);
    const [schedule] = await db.select().from(staffSchedules).where(and(
      eq(staffSchedules.staffId, auth.userId),
      eq(staffSchedules.classId, classId),
      eq(staffSchedules.weekStart, weekStart),
      eq(staffSchedules.dayOfWeek, dayOfWeek),
    )).limit(1);
    if (!schedule && auth.role !== 'admin') return c.json({ error: 'You are not scheduled for this class on this date' }, 403);
    const [en] = await db.select().from(enrollments).where(and(eq(enrollments.id, enrollmentId), eq(enrollments.studentId, studentId), eq(enrollments.classId, classId)));
    if (!en) return c.json({ error: 'Enrollment not found' }, 404);
    const [existing] = await db.select().from(studentAttendanceRequests).where(and(
      eq(studentAttendanceRequests.studentId, studentId),
      eq(studentAttendanceRequests.classId, classId),
      eq(studentAttendanceRequests.requestDate, requestDate)
    )).limit(1);
    if (existing) {
      await db.update(studentAttendanceRequests).set({ status: 'approved', reviewedBy: auth.userId, reviewedAt: new Date() }).where(eq(studentAttendanceRequests.id, existing.id));
      const [updated] = await db.select().from(studentAttendanceRequests).where(eq(studentAttendanceRequests.id, existing.id));
      return c.json({ request: updated, created: false });
    }
    const [inserted] = await db.insert(studentAttendanceRequests).values({
      studentId,
      enrollmentId,
      classId,
      teacherId: auth.userId,
      requestDate,
      status: 'approved',
    }).returning();
    return c.json({ request: inserted, created: true });
  } catch (e) {
    console.error('Staff attendance scan error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

// ──────────────────────────────────────
// LESSONS (admin creates; used when assigning lecturer to a class slot)
// ──────────────────────────────────────
app.get('/lessons', async (c) => {
  try {
    const auth = await authenticateUser(c.req.header('Authorization'));
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);
    const programId = c.req.query('programId');
    const rows = await db
      .select({
        id: lessons.id,
        title: lessons.title,
        titleFr: lessons.titleFr,
        description: lessons.description,
        descriptionFr: lessons.descriptionFr,
        content: lessons.content,
        contentFr: lessons.contentFr,
        contentMedia: lessons.contentMedia,
        programId: lessons.programId,
        sortOrder: lessons.sortOrder,
        programName: programs.name,
        programNameFr: programs.nameFr,
      })
      .from(lessons)
      .leftJoin(programs, eq(lessons.programId, programs.id))
      .orderBy(asc(lessons.sortOrder), asc(lessons.title));
    let list = rows.map((r) => ({
      id: r.id,
      title: r.title,
      titleFr: r.titleFr,
      description: r.description,
      descriptionFr: r.descriptionFr,
      content: r.content,
      contentFr: r.contentFr,
      contentMedia: r.contentMedia ?? [],
      programId: r.programId,
      sortOrder: r.sortOrder,
      programName: r.programName,
      programNameFr: r.programNameFr,
    }));
    if (programId) list = list.filter((l) => l.programId === programId);
    return c.json({ lessons: list });
  } catch (e) {
    console.error('Lessons list error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.post('/lessons', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const body = await c.req.json();
    const [inserted] = await db.insert(lessons).values({
      title: body.title,
      titleFr: body.titleFr ?? null,
      description: body.description ?? null,
      descriptionFr: body.descriptionFr ?? null,
      content: body.content ?? null,
      contentFr: body.contentFr ?? null,
      contentMedia: Array.isArray(body.contentMedia) ? body.contentMedia : [],
      programId: body.programId ?? null,
      sortOrder: body.sortOrder ?? 0,
    }).returning();
    return c.json({ lesson: inserted });
  } catch (e) {
    console.error('Create lesson error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.put('/lessons/:id', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const id = c.req.param('id');
    const body = await c.req.json();
    await db.update(lessons).set({
      title: body.title ?? undefined,
      titleFr: body.titleFr !== undefined ? body.titleFr : undefined,
      description: body.description !== undefined ? body.description : undefined,
      descriptionFr: body.descriptionFr !== undefined ? body.descriptionFr : undefined,
      content: body.content !== undefined ? body.content : undefined,
      contentFr: body.contentFr !== undefined ? body.contentFr : undefined,
      contentMedia: body.contentMedia !== undefined ? (Array.isArray(body.contentMedia) ? body.contentMedia : []) : undefined,
      programId: body.programId !== undefined ? body.programId : undefined,
      sortOrder: body.sortOrder !== undefined ? body.sortOrder : undefined,
      updatedAt: new Date(),
    }).where(eq(lessons.id, id));
    const [updated] = await db.select().from(lessons).where(eq(lessons.id, id));
    if (!updated) return c.json({ error: 'Lesson not found' }, 404);
    return c.json({ lesson: updated });
  } catch (e) {
    console.error('Update lesson error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.delete('/lessons/:id', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const id = c.req.param('id');
    const result = await db.delete(lessons).where(eq(lessons.id, id)).returning({ id: lessons.id });
    if (result.length === 0) return c.json({ error: 'Lesson not found' }, 404);
    return c.json({ success: true });
  } catch (e) {
    console.error('Delete lesson error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

// ──────────────────────────────────────
// STAFF SCHEDULES (admin assigns staff to classes per week)
// ──────────────────────────────────────
app.get('/staff-schedules', async (c) => {
  try {
    const auth = await authenticateUser(c.req.header('Authorization'));
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);
    const weekStart = c.req.query('weekStart');
    const staffId = c.req.query('staffId');
    const conditions: Parameters<typeof and> = [];
    if (weekStart) conditions.push(eq(staffSchedules.weekStart, weekStart));
    if (staffId) conditions.push(eq(staffSchedules.staffId, staffId));
    const rows = await db.select().from(staffSchedules)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(staffSchedules.weekStart), asc(staffSchedules.dayOfWeek), asc(staffSchedules.startTime));
    return c.json({ schedules: rows });
  } catch (e) {
    console.error('Staff schedules list error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

/** Week calendar: all program classes as slots, with optional staff assignment for the given week. Filter by departmentId, programId, promotionId, or classId to reduce overlap. */
app.get('/staff-schedules/week', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const weekStart = c.req.query('weekStart');
    const departmentId = c.req.query('departmentId');
    const programId = c.req.query('programId');
    const promotionId = c.req.query('promotionId');
    const classId = c.req.query('classId');
    if (!weekStart) return c.json({ error: 'weekStart (YYYY-MM-DD) required' }, 400);
    const conditions: Parameters<typeof and> = [];
    if (departmentId) conditions.push(eq(programs.departmentId, departmentId));
    if (programId) conditions.push(eq(programClasses.programId, programId));
    if (classId) conditions.push(eq(programClasses.id, classId));
    if (promotionId) {
      const classLinks = await db.select({ classId: promotionClasses.classId }).from(promotionClasses).where(eq(promotionClasses.promotionId, promotionId));
      const promoClassIds = classLinks.map((x) => x.classId);
      if (promoClassIds.length > 0) {
        conditions.push(inArray(programClasses.id, promoClassIds));
      } else {
        const progInPromo = await db.select({ programId: promotionPrograms.programId }).from(promotionPrograms).where(eq(promotionPrograms.promotionId, promotionId));
        const progIds = progInPromo.map((p) => p.programId);
        if (progIds.length === 0) return c.json({ weekStart, slots: [] });
        conditions.push(inArray(programClasses.programId, progIds));
      }
    }
    const classesRows = await db
      .select({
        id: programClasses.id,
        code: programClasses.code,
        name: programClasses.name,
        programId: programClasses.programId,
        programName: programs.name,
        programNameFr: programs.nameFr,
        startTime: programClasses.startTime,
        endTime: programClasses.endTime,
        dayOfWeek: programClasses.dayOfWeek,
        daysOfWeek: programClasses.daysOfWeek,
        room: programClasses.room,
      })
      .from(programClasses)
      .innerJoin(programs, eq(programClasses.programId, programs.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(programClasses.sortOrder), asc(programClasses.startTime));
    const schedulesRows = await db
      .select({
        id: staffSchedules.id,
        staffId: staffSchedules.staffId,
        classId: staffSchedules.classId,
        dayOfWeek: staffSchedules.dayOfWeek,
        startTime: staffSchedules.startTime,
        endTime: staffSchedules.endTime,
        lessonId: staffSchedules.lessonId,
        lessonTitle: staffSchedules.lessonTitle,
        staffName: profiles.name,
        lessonName: lessons.title,
        lessonNameFr: lessons.titleFr,
      })
      .from(staffSchedules)
      .leftJoin(profiles, eq(staffSchedules.staffId, profiles.id))
      .leftJoin(lessons, eq(staffSchedules.lessonId, lessons.id))
      .where(eq(staffSchedules.weekStart, weekStart));
    const scheduleByKey = new Map<string, typeof schedulesRows[0]>();
    for (const s of schedulesRows) {
      const key = `${s.classId}-${s.dayOfWeek}-${s.startTime}`;
      scheduleByKey.set(key, s);
    }
    const slots: any[] = [];
    for (const cl of classesRows) {
      const days: number[] = Array.isArray(cl.daysOfWeek) && (cl.daysOfWeek as number[]).length > 0
        ? (cl.daysOfWeek as number[])
        : (cl.dayOfWeek != null ? [cl.dayOfWeek] : []);
      for (const dayOfWeek of days) {
        const key = `${cl.id}-${dayOfWeek}-${cl.startTime}`;
        const schedule = scheduleByKey.get(key);
        const lessonDisplay = schedule?.lessonTitle ?? schedule?.lessonName ?? schedule?.lessonNameFr ?? null;
        slots.push({
          classId: cl.id,
          classCode: cl.code ?? undefined,
          className: cl.name,
          programId: cl.programId,
          programName: cl.programName,
          programNameFr: cl.programNameFr,
          dayOfWeek,
          startTime: cl.startTime,
          endTime: cl.endTime,
          room: cl.room,
          scheduleId: schedule?.id ?? null,
          staffId: schedule?.staffId ?? null,
          staffName: schedule?.staffName ?? null,
          lessonId: schedule?.lessonId ?? null,
          lessonTitle: lessonDisplay,
        });
      }
    }
    slots.sort((a, b) => a.dayOfWeek - b.dayOfWeek || String(a.startTime).localeCompare(String(b.startTime)));
    return c.json({ weekStart, slots });
  } catch (e) {
    console.error('Staff schedules week error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.post('/staff-schedules', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const body = await c.req.json();
    const classId = body.classId;
    const weekStart = body.weekStart;
    if (!classId || !weekStart) return c.json({ error: 'classId and weekStart required' }, 400);
    const [classRow] = await db.select().from(programClasses).where(eq(programClasses.id, classId));
    if (!classRow) return c.json({ error: 'Class not found' }, 404);
    const days = Array.isArray((classRow as any).daysOfWeek) && (classRow as any).daysOfWeek.length
      ? (classRow as any).daysOfWeek
      : (classRow.dayOfWeek != null ? [classRow.dayOfWeek] : [1]);
    const dayOfWeek = body.dayOfWeek != null ? Number(body.dayOfWeek) : Number(days[0]);
    const startTime = String(classRow.startTime);
    const endTime = String(classRow.endTime);
    const room = classRow.room ?? null;
    const [inserted] = await db.insert(staffSchedules).values({
      staffId: body.staffId,
      classId,
      weekStart,
      dayOfWeek,
      startTime,
      endTime,
      room,
      lessonId: body.lessonId ?? null,
      lessonTitle: body.lessonTitle ?? null,
      createdBy: (admin as any).userId,
    }).returning();
    return c.json({ schedule: inserted });
  } catch (e) {
    console.error('Create staff schedule error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.patch('/staff-schedules/:id', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const id = c.req.param('id');
    const body = await c.req.json();
    const updates: Record<string, unknown> = {};
    if (body.staffId != null) updates.staffId = body.staffId;
    if (body.lessonId !== undefined) updates.lessonId = body.lessonId || null;
    if (body.lessonTitle !== undefined) updates.lessonTitle = body.lessonTitle || null;
    if (Object.keys(updates).length === 0) return c.json({ error: 'No fields to update' }, 400);
    await db.update(staffSchedules).set(updates as any).where(eq(staffSchedules.id, id));
    const [updated] = await db.select().from(staffSchedules).where(eq(staffSchedules.id, id));
    return c.json({ schedule: updated });
  } catch (e) {
    console.error('Update staff schedule error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.delete('/staff-schedules/:id', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const id = c.req.param('id');
    await db.delete(staffSchedules).where(eq(staffSchedules.id, id));
    return c.json({ success: true });
  } catch (e) {
    console.error('Delete staff schedule error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

// ──────────────────────────────────────
// LECTURER ATTENDANCE (staff submits; admin approves → wallet credit)
// ──────────────────────────────────────
app.get('/lecturer-attendance', async (c) => {
  try {
    const auth = await authenticateUser(c.req.header('Authorization'));
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);
    const status = c.req.query('status');
    let rows = await db.select().from(lecturerAttendance).orderBy(desc(lecturerAttendance.attendanceDate));
    if (auth.role === 'staff') rows = rows.filter((r) => r.staffId === auth.userId);
    if (status) rows = rows.filter((r) => r.status === status);
    const allStudentIds = new Set<string>();
    for (const r of rows) {
      const ids = Array.isArray((r as any).presentStudentIds) ? (r as any).presentStudentIds : [];
      ids.forEach((id: string) => allStudentIds.add(id));
    }
    let profileMap = new Map<string, { name: string }>();
    if (allStudentIds.size > 0) {
      const profilesList = await db.select({ id: profiles.id, name: profiles.name }).from(profiles).where(inArray(profiles.id, [...allStudentIds]));
      profilesList.forEach((p) => profileMap.set(p.id, { name: p.name || '' }));
    }
    const attendances = rows.map((r) => {
      const ids = Array.isArray((r as any).presentStudentIds) ? (r as any).presentStudentIds as string[] : [];
      const presentStudentNames = ids.map((id) => profileMap.get(id)?.name || id?.slice(0, 8) || '');
      return { ...r, presentStudentNames };
    });
    return c.json({ attendances });
  } catch (e) {
    console.error('Lecturer attendance list error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.post('/lecturer-attendance', async (c) => {
  try {
    const auth = await authenticateUser(c.req.header('Authorization'));
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);
    const body = await c.req.json();
    const presentStudentIds = Array.isArray(body.presentStudentIds) ? body.presentStudentIds : [];
    const [inserted] = await db.insert(lecturerAttendance).values({
      staffId: auth.userId,
      scheduleId: body.scheduleId ?? null,
      classId: body.classId,
      attendanceDate: body.attendanceDate || new Date().toISOString().slice(0, 10),
      presentStudentIds: presentStudentIds,
      status: 'pending',
    }).returning();
    return c.json({ attendance: inserted });
  } catch (e) {
    console.error('Submit lecturer attendance error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.patch('/lecturer-attendance/:id/approve', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const id = c.req.param('id');
    const [att] = await db.select().from(lecturerAttendance).where(eq(lecturerAttendance.id, id));
    if (!att) return c.json({ error: 'Not found' }, 404);
    if (att.status !== 'pending') return c.json({ error: 'Already processed' }, 400);
    await db.update(lecturerAttendance).set({ status: 'approved', approvedBy: (admin as any).userId, approvedAt: new Date() }).where(eq(lecturerAttendance.id, id));
    const [rateRow] = await db.select().from(lecturerRates).where(eq(lecturerRates.staffId, att.staffId)).limit(1);
    const amount = rateRow ? Number(rateRow.rateAmount) : 0;
    if (amount > 0) {
      const [wallet] = await db.select().from(lecturerWallets).where(eq(lecturerWallets.staffId, att.staffId));
      if (wallet) {
        const newBalance = Number(wallet.balance ?? 0) + amount;
        await db.update(lecturerWallets).set({ balance: String(newBalance), updatedAt: new Date() }).where(eq(lecturerWallets.id, wallet.id));
        await db.insert(lecturerWalletTransactions).values({ walletId: wallet.id, amount: String(amount), type: 'attendance_credit', referenceId: id });
      } else {
        const [created] = await db.insert(lecturerWallets).values({ staffId: att.staffId, balance: String(amount), updatedAt: new Date() }).returning();
        if (created) await db.insert(lecturerWalletTransactions).values({ walletId: created.id, amount: String(amount), type: 'attendance_credit', referenceId: id });
      }
    }
    const [updated] = await db.select().from(lecturerAttendance).where(eq(lecturerAttendance.id, id));
    return c.json({ attendance: updated });
  } catch (e) {
    console.error('Approve lecturer attendance error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.patch('/lecturer-attendance/:id/reject', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const id = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    await db.update(lecturerAttendance).set({ status: 'rejected', rejectReason: body.rejectReason ?? null }).where(eq(lecturerAttendance.id, id));
    const [updated] = await db.select().from(lecturerAttendance).where(eq(lecturerAttendance.id, id));
    return c.json({ attendance: updated });
  } catch (e) {
    console.error('Reject lecturer attendance error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

// ──────────────────────────────────────
// LECTURER RATES (admin sets rate per class for staff)
// ──────────────────────────────────────
app.get('/lecturer-rates', async (c) => {
  try {
    const auth = await authenticateUser(c.req.header('Authorization'));
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);
    const staffId = c.req.query('staffId');
    const rows = staffId
      ? await db.select().from(lecturerRates).where(eq(lecturerRates.staffId, staffId))
      : await db.select().from(lecturerRates);
    return c.json({ rates: rows });
  } catch (e) {
    console.error('Lecturer rates list error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.post('/lecturer-rates', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const body = await c.req.json();
    const [inserted] = await db.insert(lecturerRates).values({
      staffId: body.staffId,
      rateAmount: String(body.rateAmount ?? 0),
      currency: body.currency ?? 'USD',
      rateType: body.rateType ?? 'per_class',
      description: body.description ?? null,
    }).returning();
    return c.json({ rate: inserted });
  } catch (e) {
    console.error('Create lecturer rate error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

// ──────────────────────────────────────
// LECTURER WALLET (staff view balance; request advance; admin process)
// ──────────────────────────────────────
app.get('/lecturer-wallet/my', async (c) => {
  try {
    const auth = await authenticateUser(c.req.header('Authorization'));
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);
    const [wallet] = await db.select().from(lecturerWallets).where(eq(lecturerWallets.staffId, auth.userId));
    const transactions = wallet
      ? await db.select().from(lecturerWalletTransactions).where(eq(lecturerWalletTransactions.walletId, wallet.id)).orderBy(desc(lecturerWalletTransactions.createdAt))
      : [];
    return c.json({
      wallet: wallet ? { balance: Number(wallet.balance), currency: wallet.currency } : { balance: 0, currency: 'USD' },
      transactions: transactions.map((t) => ({ ...t, amount: Number(t.amount) })),
    });
  } catch (e) {
    console.error('Lecturer wallet error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.post('/lecturer-wallet/advance-request', async (c) => {
  try {
    const auth = await authenticateUser(c.req.header('Authorization'));
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);
    const body = await c.req.json();
    const amount = Number(body.amount ?? 0);
    if (amount <= 0) return c.json({ error: 'Invalid amount' }, 400);
    const [wallet] = await db.select().from(lecturerWallets).where(eq(lecturerWallets.staffId, auth.userId));
    if (!wallet) return c.json({ error: 'No wallet' }, 400);
    const balance = Number(wallet.balance ?? 0);
    if (amount > balance) return c.json({ error: 'Insufficient balance' }, 400);
    await db.update(lecturerWallets).set({ balance: String(balance - amount), updatedAt: new Date() }).where(eq(lecturerWallets.id, wallet.id));
    const [tx] = await db.insert(lecturerWalletTransactions).values({
      walletId: wallet.id,
      amount: String(-amount),
      type: 'advance',
      description: body.description || 'Advance request',
    }).returning();
    return c.json({ transaction: tx });
  } catch (e) {
    console.error('Advance request error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

// ──────────────────────────────────────
// CERTIFICATES (admin generates for promotion/program)
// ──────────────────────────────────────
app.get('/certificates', async (c) => {
  try {
    const auth = await authenticateUser(c.req.header('Authorization'));
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);
    const promotionId = c.req.query('promotionId');
    const programId = c.req.query('programId');
    let rows = await db.select().from(certificates);
    if (promotionId) rows = rows.filter((r) => r.promotionId === promotionId);
    if (programId) rows = rows.filter((r) => r.programId === programId);
    return c.json({ certificates: rows });
  } catch (e) {
    console.error('Certificates list error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.post('/certificates/generate', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const body = await c.req.json();
    const promotionId = body.promotionId;
    const programId = body.programId;
    if (!promotionId || !programId) return c.json({ error: 'promotionId and programId required' }, 400);
    const enrolled = await db.select({
      studentId: enrollments.studentId,
      id: enrollments.id,
      programId: enrollments.programId,
    }).from(enrollments).where(and(eq(enrollments.promotionId, promotionId), eq(enrollments.programId, programId), sql`${enrollments.status} = 'active'`));
    const existing = await db.select({ studentId: certificates.studentId }).from(certificates).where(and(eq(certificates.promotionId, promotionId), eq(certificates.programId, programId)));
    const existingIds = new Set(existing.map((e) => e.studentId));
    const toCreate = enrolled.filter((e) => !existingIds.has(e.studentId));
    for (const e of toCreate) {
      const code = `BTC-${programId.slice(0, 8)}-${promotionId.slice(0, 8)}-${e.studentId.slice(0, 8)}-${Date.now().toString(36)}`;
      await db.insert(certificates).values({
        studentId: e.studentId,
        programId,
        promotionId,
        enrollmentId: e.id,
        certificateCode: code,
      });
    }
    const all = await db.select().from(certificates).where(and(eq(certificates.promotionId, promotionId), eq(certificates.programId, programId)));
    return c.json({ generated: toCreate.length, certificates: all });
  } catch (e) {
    console.error('Generate certificates error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

// ──────────────────────────────────────
// PAYMENTS: create, list, my, approve, reject (receipt upload to Supabase Storage)
// ──────────────────────────────────────
const PAYMENT_RECEIPTS_BUCKET = 'payment-receipts';

/** Upload base64 data URL to Supabase Storage; returns public URL or null on failure. */
async function uploadReceiptToStorage(userId: string, dataUrl: string, fileName: string): Promise<string | null> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const contentType = match[1].trim() || 'image/jpeg';
  const base64 = match[2];
  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64, 'base64');
  } catch {
    return null;
  }
  const ext = (fileName && /\.(jpe?g|png|gif|webp)$/i.test(fileName)) ? fileName.replace(/.*\./i, '') : 'jpg';
  const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabaseAdmin.storage.from(PAYMENT_RECEIPTS_BUCKET).upload(path, buffer, {
    contentType,
    upsert: false,
  });
  if (error) {
    console.error('Supabase storage upload error:', error);
    return null;
  }
  const { data: urlData } = supabaseAdmin.storage.from(PAYMENT_RECEIPTS_BUCKET).getPublicUrl(data.path);
  return urlData?.publicUrl ?? null;
}

function paymentRowToApi(row: any) {
  return {
    id: row.id,
    studentId: row.studentId,
    enrollmentId: row.enrollmentId,
    programId: row.programId,
    amount: Number(row.amount ?? 0),
    currency: row.currency ?? 'USD',
    method: row.method,
    status: row.status,
    receiptUrl: row.receiptUrl,
    receiptImage: row.receiptUrl,
    transactionRef: row.transactionRef,
    feeId: row.feeId,
    feeName: row.feeName,
    description: row.description,
    metadata: row.metadata ?? {},
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

app.get('/payments', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const rows = await db
      .select({
        id: payments.id,
        studentId: payments.studentId,
        enrollmentId: payments.enrollmentId,
        programId: payments.programId,
        amount: payments.amount,
        currency: payments.currency,
        method: payments.method,
        status: payments.status,
        receiptUrl: payments.receiptUrl,
        transactionRef: payments.transactionRef,
        feeId: payments.feeId,
        feeName: payments.feeName,
        description: payments.description,
        metadata: payments.metadata,
        createdAt: payments.createdAt,
        updatedAt: payments.updatedAt,
        rejectReason: payments.rejectReason,
        studentName: profiles.name,
        studentEmail: profiles.email,
        programName: programs.name,
        programNameFr: programs.nameFr,
        deptSlug: departments.slug,
      })
      .from(payments)
      .leftJoin(profiles, eq(payments.studentId, profiles.id))
      .leftJoin(programs, eq(payments.programId, programs.id))
      .leftJoin(departments, eq(programs.departmentId, departments.id))
      .orderBy(desc(payments.createdAt));
    const list = rows.map((r) => {
      const base = paymentRowToApi(r);
      return {
        ...base,
        studentName: r.studentName ?? '',
        studentEmail: r.studentEmail ?? '',
        programName: r.programName ?? '',
        programNameFr: r.programNameFr ?? '',
        department: r.deptSlug ?? '',
        rejectionReason: r.rejectReason ?? '',
        transactionId: r.transactionRef ?? '',
      };
    });
    return c.json({ payments: list });
  } catch (e) {
    console.error('List payments error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.get('/payments/my', async (c) => {
  try {
    const auth = await authenticateUser(c.req.header('Authorization'));
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);
    const rows = await db.select().from(payments).where(eq(payments.studentId, auth.userId)).orderBy(desc(payments.createdAt));
    return c.json({ payments: rows.map(paymentRowToApi) });
  } catch (e) {
    console.error('My payments error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.post('/payments', async (c) => {
  try {
    const auth = await authenticateUser(c.req.header('Authorization'));
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);
    const body = await c.req.json();
    const amount = Number(body.amount ?? 0);
    const programId = body.programId ?? null;
    const method = String(body.method ?? 'manual');
    if (!amount || amount <= 0) return c.json({ error: 'Invalid amount' }, 400);

    // Student can only pay for a program they are enrolled in
    if (programId) {
      const [enrollment] = await db.select({ id: enrollments.id }).from(enrollments).where(and(eq(enrollments.studentId, auth.userId), eq(enrollments.programId, programId))).limit(1);
      if (!enrollment) return c.json({ error: 'You can only pay for programs you are enrolled in.' }, 403);
    }

    let receiptUrl: string | null = null;
    if (method === 'manual' && body.receiptImage) {
      receiptUrl = await uploadReceiptToStorage(auth.userId, body.receiptImage, body.receiptFileName || 'receipt.jpg');
      if (!receiptUrl) return c.json({ error: 'Failed to upload receipt. Ensure Supabase bucket "payment-receipts" exists and is public.' }, 500);
    }

    const [inserted] = await db.insert(payments).values({
      studentId: auth.userId,
      enrollmentId: body.enrollmentId ?? null,
      programId: programId || null,
      amount: String(amount),
      currency: String(body.currency ?? 'USD'),
      method,
      status: method === 'manual' ? 'pending_approval' : (body.status === 'completed' ? 'completed' : 'pending_approval'),
      receiptUrl,
      transactionRef: body.transactionId ?? body.transactionRef ?? null,
      feeId: body.feeId ?? null,
      feeName: body.feeName ?? null,
      description: body.description ?? null,
      metadata: typeof body.metadata === 'object' ? body.metadata : {},
    }).returning();
    if (!inserted) return c.json({ error: 'Failed to create payment' }, 500);
    return c.json({ payment: paymentRowToApi(inserted) });
  } catch (e) {
    console.error('Create payment error:', e);
    return c.json({ error: `Failed to create payment: ${(e as Error).message}` }, 500);
  }
});

app.put('/payments/:id/approve', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const id = c.req.param('id');
    const [row] = await db.select().from(payments).where(eq(payments.id, id));
    if (!row) return c.json({ error: 'Payment not found' }, 404);
    if (row.status !== 'pending_approval') return c.json({ error: 'Payment is not pending approval' }, 400);
    await db.update(payments).set({
      status: 'completed',
      approvedAt: new Date(),
      approvedBy: admin.userId,
      updatedAt: new Date(),
    }).where(eq(payments.id, id));
    const [updated] = await db.select().from(payments).where(eq(payments.id, id));
    if (updated?.enrollmentId) {
      const [existingProgress] = await db.select().from(enrollmentProgress).where(eq(enrollmentProgress.enrollmentId, updated.enrollmentId));
      const currentAmount = existingProgress ? Number(existingProgress.amountPaid ?? 0) : 0;
      const newAmount = currentAmount + Number(updated.amount);
      if (existingProgress) {
        await db.update(enrollmentProgress).set({ amountPaid: String(newAmount), updatedAt: new Date() }).where(eq(enrollmentProgress.enrollmentId, updated.enrollmentId));
      } else {
        await db.insert(enrollmentProgress).values({ enrollmentId: updated.enrollmentId, amountPaid: String(newAmount), totalAmount: '0', updatedAt: new Date() });
      }
    }
    return c.json({ payment: paymentRowToApi(updated!) });
  } catch (e) {
    console.error('Approve payment error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.put('/payments/:id/reject', async (c) => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const id = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    const [row] = await db.select().from(payments).where(eq(payments.id, id));
    if (!row) return c.json({ error: 'Payment not found' }, 404);
    if (row.status !== 'pending_approval') return c.json({ error: 'Payment is not pending approval' }, 400);
    await db.update(payments).set({
      status: 'rejected',
      rejectedAt: new Date(),
      rejectReason: body.reason ?? body.rejectReason ?? null,
      updatedAt: new Date(),
    }).where(eq(payments.id, id));
    const [updated] = await db.select().from(payments).where(eq(payments.id, id));
    return c.json({ payment: paymentRowToApi(updated!) });
  } catch (e) {
    console.error('Reject payment error:', e);
    return c.json({ error: (e as Error).message }, 500);
  }
});

// ──────────────────────────────────────
// COURSES / CONTACT
// ──────────────────────────────────────
app.get('/courses', async (c) => c.json({ courses: [] }));
app.post('/contact', async (c) => {
  try {
    await c.req.json().catch(() => ({}));
    return c.json({ success: true });
  } catch {
    return c.json({ success: true });
  }
});

// ──────────────────────────────────────
// DB-CHECK & SEED-ADMIN (Setup page)
// ──────────────────────────────────────
app.get('/db-check', async (c) => {
  try {
    await db.select().from(profiles).limit(0);
    await db.select().from(departments).limit(0);
    await db.select().from(programs).limit(0);
    return c.json({ status: 'ok', tables: { profiles: true, departments: true, programs: true }, message: 'All tables accessible' });
  } catch (e) {
    console.error('DB check failed:', e);
    return c.json({ status: 'error', error: (e as Error).message }, 500);
  }
});

app.post('/seed-admin', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const password = body?.password;
    const SUPER_ADMIN_EMAIL = body?.email ?? 'buyananderson@gmail.com';

    const [existing] = await db.select().from(profiles).where(eq(profiles.email, SUPER_ADMIN_EMAIL)).limit(1);
    if (existing) {
      if (password && password.length >= 6) {
        await supabase.auth.admin.updateUserById(existing.id, { password });
      }
      await supabase.auth.admin.updateUserById(existing.id, { user_metadata: { name: existing.name, role: 'admin' } });
      return c.json({ success: true, message: 'Super admin already exists', email: SUPER_ADMIN_EMAIL });
    }

    if (!password || password.length < 6) {
      return c.json({ needsPassword: true, message: 'Password required (min 6 characters)' });
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: SUPER_ADMIN_EMAIL,
      password,
      user_metadata: { name: 'Anderson Buyan', role: 'admin' },
      email_confirm: true,
    });
    if (error) return c.json({ error: error.message }, 400);
    const userId = data.user.id;
    await db.insert(profiles).values({
      id: userId,
      email: SUPER_ADMIN_EMAIL,
      name: 'Anderson Buyan',
      role: 'admin',
      isSuperAdmin: true,
    }).onConflictDoUpdate({ target: profiles.id, set: { role: 'admin', isSuperAdmin: true, updatedAt: new Date() } });
    return c.json({ success: true, email: SUPER_ADMIN_EMAIL, message: 'Super admin created' });
  } catch (e) {
    console.error('Seed admin error:', e);
    return c.json({ error: `Failed to seed admin: ${(e as Error).message}` }, 500);
  }
});

// ──────────────────────────────────────
// REGISTER-PROFILE & SIGNUP
// ──────────────────────────────────────
app.post('/register-profile', async (c) => {
  try {
    const body = await c.req.json();
    const { id, email, name, role, department, phone } = body;
    if (!id || !email) return c.json({ error: 'Missing required fields: id, email' }, 400);

    let departmentId: string | null = null;
    if (department) {
      const [dept] = await db.select().from(departments).where(eq(departments.slug, department)).limit(1);
      if (dept) departmentId = dept.id;
    }
    await db.insert(profiles).values({
      id,
      email,
      name: name || email.split('@')[0],
      role: 'student',
      departmentId,
      phone: phone || '',
    }).onConflictDoUpdate({ target: profiles.id, set: { name: name || email.split('@')[0], phone: phone || '', updatedAt: new Date() } });
    return c.json({ success: true, profile: { id, email, name, role: 'student', department_id: departmentId, phone } });
  } catch (e) {
    console.error('Register profile error:', e);
    return c.json({ error: `Failed to register profile: ${(e as Error).message}` }, 500);
  }
});

app.post('/signup', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, role, phone, department } = body;
    if (!email || !password || !name || !role) {
      return c.json({ error: 'Missing required fields: email, password, name, role' }, 400);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role, department, phone },
      email_confirm: true,
    });
    if (error) return c.json({ error: error.message }, 400);
    const userId = data.user.id;

    let departmentId: string | null = null;
    if (department) {
      const [dept] = await db.select().from(departments).where(eq(departments.slug, department)).limit(1);
      if (!dept) {
        const [byName] = await db.select().from(departments).where(eq(departments.name, department)).limit(1);
        if (byName) departmentId = byName.id;
      } else departmentId = dept.id;
    }

    await db.insert(profiles).values({
      id: userId,
      email,
      name,
      role,
      departmentId,
      phone: phone || '',
    }).onConflictDoUpdate({ target: profiles.id, set: { name, role, departmentId, phone: phone || '', updatedAt: new Date() } });
    return c.json({ success: true, userId, profile: { id: userId, email, name, role, department_id: departmentId, phone } });
  } catch (e) {
    console.error('Signup error:', e);
    return c.json({ error: `Failed to signup: ${(e as Error).message}` }, 500);
  }
});

// Health for proxy/dev
app.get('/health', (c) => c.json({ status: 'ok', server: 'drizzle' }));

const port = Number(process.env.PORT) || 5000;
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`BTC API (Drizzle) listening on http://localhost:${info.port}`);
});
