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
import { eq, asc, desc, inArray } from 'drizzle-orm';
import { db, programs, departments, profiles } from '../database/db/index';

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
      created_at: profileRow.createdAt,
    };
    return c.json({ profile });
  } catch (e) {
    console.error('Get /me error:', e);
    return c.json({ error: `Failed to get profile: ${(e as Error).message}` }, 500);
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

function programRowToApi(row: any, departmentSlug?: string) {
  return {
    id: row.id,
    name: row.name,
    nameFr: row.nameFr ?? row.name_fr ?? '',
    department: departmentSlug ?? row.department?.slug ?? row.department_slug,
    description: row.description ?? '',
    descriptionFr: row.descriptionFr ?? row.description_fr ?? '',
    status: row.status ?? 'active',
    fees: row.fees ?? [],
    createdAt: row.createdAt ?? row.created_at,
    departments: row.department ? { id: row.department.id, name: row.department.name, name_fr: row.department.nameFr, slug: row.department.slug, color: row.department.color } : undefined,
  };
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

    const list = rows.map((r) => programRowToApi(r, r.slug ?? undefined));
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
    return c.json({ program: programRowToApi(row, row.slug ?? undefined) });
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
    const departmentSlug = body.department; // frontend sends slug: english | computer | driving | sewing
    if (!departmentSlug) return c.json({ error: 'department (slug) is required' }, 400);

    const [dept] = await db.select().from(departments).where(eq(departments.slug, departmentSlug));
    if (!dept) return c.json({ error: `Department not found for slug: ${departmentSlug}` }, 400);

    const insertPayload = {
      name: body.name ?? '',
      nameFr: body.nameFr ?? body.name_fr ?? '',
      departmentId: dept.id,
      description: body.description ?? '',
      descriptionFr: body.descriptionFr ?? body.description_fr ?? '',
      status: (body.status === 'archived' || body.status === 'draft') ? body.status : 'active',
      fees: Array.isArray(body.fees) ? body.fees : [],
      createdBy: admin.userId,
    };

    const [inserted] = await db.insert(programs).values(insertPayload).returning();
    const [withDept] = await db
      .select({
        id: programs.id,
        name: programs.name,
        nameFr: programs.nameFr,
        departmentId: programs.departmentId,
        description: programs.description,
        descriptionFr: programs.descriptionFr,
        status: programs.status,
        fees: programs.fees,
        createdAt: programs.createdAt,
        slug: departments.slug,
      })
      .from(programs)
      .leftJoin(departments, eq(programs.departmentId, departments.id))
      .where(eq(programs.id, inserted!.id));

    return c.json({ program: programRowToApi(withDept!, withDept!.slug ?? undefined) });
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
    if (body.department != null) {
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
    };
    if (departmentId) updatePayload.departmentId = departmentId;

    const [updated] = await db
      .update(programs)
      .set(updatePayload as any)
      .where(eq(programs.id, id))
      .returning();

    if (!updated) return c.json({ error: 'Program not found' }, 404);

    const [withDept] = await db
      .select({
        id: programs.id,
        name: programs.name,
        nameFr: programs.nameFr,
        departmentId: programs.departmentId,
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

    return c.json({ program: programRowToApi(withDept!, withDept!.slug ?? undefined) });
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
    await db.delete(programs).where(eq(programs.id, id));
    return c.json({ success: true });
  } catch (e) {
    console.error('Delete program error:', e);
    return c.json({ error: `Failed to delete program: ${(e as Error).message}` }, 500);
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
// COURSES / PAYMENTS / CONTACT: stubs (no tables in Drizzle yet)
// ──────────────────────────────────────
app.get('/courses', async (c) => c.json({ courses: [] }));
app.get('/payments', async (c) => c.json({ payments: [] }));
app.get('/payments/my', async (c) => c.json({ payments: [] }));
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
