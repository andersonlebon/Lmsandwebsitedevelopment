import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import postgres from "npm:postgres@3.4.5";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper: get Supabase admin client (service role — bypasses RLS)
function adminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  );
}

// Helper: authenticate request and return user id + role
async function authenticateUser(c: any): Promise<{ userId: string; role: string } | null> {
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  if (!accessToken) {
    console.log('authenticateUser: no Authorization header');
    return null;
  }

  // The publicAnonKey is a project-level API key, NOT a user JWT.
  // If the caller fell back to publicAnonKey, we can't identify a user.
  // Check by attempting to decode — anon keys don't have a 'sub' claim with a UUID.
  try {
    const payloadB64 = accessToken.split('.')[1];
    if (payloadB64) {
      const payload = JSON.parse(atob(payloadB64));
      // Anon keys have role='anon' and no real user sub
      if (payload.role === 'anon') {
        console.log('authenticateUser: received anon key, not a user token');
        return null;
      }
    }
  } catch { /* not a valid JWT, let getUser handle it */ }

  const supabase = adminClient();
  try {
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error) {
      console.log('authenticateUser: getUser error:', error.message);
      return null;
    }
    const user = data?.user;
    if (!user?.id) {
      console.log('authenticateUser: no user in getUser response');
      return null;
    }
    // Get role from profiles table
    const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profileError) {
      console.log('authenticateUser: profile lookup failed:', profileError.message, '— falling back to user_metadata');
    }
    const role = profile?.role || user.user_metadata?.role || 'student';
    console.log('authenticateUser: success — userId:', user.id, 'role:', role, 'source:', profile?.role ? 'profiles_table' : 'user_metadata');
    return { userId: user.id, role };
  } catch (e) {
    console.log('authenticateUser: exception:', e);
    return null;
  }
}

// Helper: require admin role
async function requireAdmin(c: any): Promise<{ userId: string } | Response> {
  const auth = await authenticateUser(c);
  if (!auth) return c.json({ error: 'Unauthorized - invalid or missing token. Please log out and log back in.' }, 401);
  if (auth.role !== 'admin') return c.json({ error: `Forbidden - admin access required (your role: ${auth.role})` }, 403);
  return { userId: auth.userId };
}

// Helper: require admin or staff
async function requireAdminOrStaff(c: any): Promise<{ userId: string; role: string } | Response> {
  const auth = await authenticateUser(c);
  if (!auth) return c.json({ error: 'Unauthorized - invalid or missing token. Please log out and log back in.' }, 401);
  if (auth.role !== 'admin' && auth.role !== 'staff') return c.json({ error: `Forbidden - admin/staff access required (your role: ${auth.role})` }, 403);
  return { userId: auth.userId, role: auth.role };
}

// ──────────────────────────────────────
// HEALTH CHECK
// ──────────────────────────────────────
app.get("/make-server-36dfb453/health", (c) => {
  return c.json({ status: "ok", version: "2.0-postgres" });
});

// ──────────────────────────────────────
// DEEP DIAGNOSTIC: Test env vars + DB connection
// ──────────────────────────────────────
app.get("/make-server-36dfb453/debug", async (c) => {
  const diagnostics: Record<string, any> = {};

  // 1. Check environment variables
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  diagnostics.env = {
    SUPABASE_URL: url ? `set (${url.substring(0, 30)}...)` : 'MISSING',
    SUPABASE_SERVICE_ROLE_KEY: key ? `set (${key.substring(0, 20)}...)` : 'MISSING',
  };

  if (!url || !key) {
    return c.json({ status: 'error', message: 'Missing environment variables', diagnostics });
  }

  // 2. Try creating the client and querying departments
  try {
    const supabase = createClient(url, key);
    const { data, error, status, statusText } = await supabase
      .from('departments')
      .select('id, name')
      .limit(3);

    diagnostics.departmentsQuery = {
      success: !error,
      status,
      statusText,
      error: error ? { message: error.message, code: error.code, details: error.details, hint: error.hint } : null,
      rowCount: data?.length ?? 0,
      sample: data?.map((d: any) => d.name) || [],
    };
  } catch (e) {
    diagnostics.departmentsQuery = { success: false, exception: e.message };
  }

  // 3. Try querying profiles
  try {
    const supabase = createClient(url, key);
    const { data, error, status } = await supabase
      .from('profiles')
      .select('id, name, role')
      .limit(3);

    diagnostics.profilesQuery = {
      success: !error,
      status,
      error: error ? { message: error.message, code: error.code, details: error.details, hint: error.hint } : null,
      rowCount: data?.length ?? 0,
      sample: data?.map((p: any) => `${p.name} (${p.role})`) || [],
    };
  } catch (e) {
    diagnostics.profilesQuery = { success: false, exception: e.message };
  }

  // 4. Try querying a view
  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from('student_overview')
      .select('*')
      .limit(1);

    diagnostics.viewQuery = {
      success: !error,
      error: error ? { message: error.message, code: error.code, hint: error.hint } : null,
      rowCount: data?.length ?? 0,
    };
  } catch (e) {
    diagnostics.viewQuery = { success: false, exception: e.message };
  }

  const allOk = diagnostics.departmentsQuery?.success && diagnostics.profilesQuery?.success;
  return c.json({
    status: allOk ? 'ok' : 'error',
    message: allOk ? 'Database connection working' : 'Database queries failing — check details',
    diagnostics,
  });
});

// ──────────────────────────────────────
// DB CHECK: Verify Postgres tables exist
// ──────────────────────────────────────
app.get("/make-server-36dfb453/db-check", async (c) => {
  try {
    const supabase = adminClient();
    const tables = ['profiles', 'departments', 'programs', 'courses', 'enrollments', 'payments', 'attendance', 'certificates', 'contact_messages', 'notifications', 'app_settings'];
    const results: Record<string, boolean> = {};
    for (const table of tables) {
      const { error } = await supabase.from(table).select('*').limit(0);
      results[table] = !error;
    }
    const allOk = Object.values(results).every(Boolean);
    return c.json({ status: allOk ? 'ok' : 'partial', tables: results, message: allOk ? 'All tables accessible' : 'Some tables are missing — run btc_schema.sql in Supabase SQL Editor' });
  } catch (e) {
    console.log('DB check failed:', e.message);
    return c.json({ status: 'error', error: e.message }, 500);
  }
});

// ──────────────────────────────────────
// SEED: Create super admin on first launch
// ──────────────────────────────────────
app.post("/make-server-36dfb453/seed-admin", async (c) => {
  try {
    const SUPER_ADMIN_EMAIL = 'buyananderson@gmail.com';
    const supabase = adminClient();
    const dbUrl = Deno.env.get('SUPABASE_DB_URL');

    const body = await c.req.json().catch(() => ({}));
    const { password } = body;

    // ── Step 1: Check if admin profile already exists ──
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('email', SUPER_ADMIN_EMAIL)
      .single();

    if (existingProfile) {
      if (existingProfile.role !== 'admin') {
        await supabase.from('profiles').update({ role: 'admin', is_super_admin: true }).eq('id', existingProfile.id);
      }
      // Always ensure user_metadata has role: admin for frontend fallback
      await supabase.auth.admin.updateUserById(existingProfile.id, {
        user_metadata: { name: 'Anderson Buyan', role: 'admin' },
      });
      if (password && password.length >= 6) {
        await supabase.auth.admin.updateUserById(existingProfile.id, { password });
        return c.json({ success: true, message: 'Super admin already exists — password updated & role synced', email: SUPER_ADMIN_EMAIL });
      }
      return c.json({ success: true, message: 'Super admin already exists — role synced', email: SUPER_ADMIN_EMAIL });
    }

    // ── Step 2: Check if auth user exists without profile ──
    const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const existingAuthUser = users?.find((u: any) => u.email === SUPER_ADMIN_EMAIL);

    if (existingAuthUser) {
      console.log('Found auth user without profile, syncing...');
      // Always update user_metadata to include role: admin so frontend fallback works
      await supabase.auth.admin.updateUserById(existingAuthUser.id, {
        user_metadata: { name: 'Anderson Buyan', role: 'admin' },
        email_confirm: true,
      });
      if (password && password.length >= 6) {
        await supabase.auth.admin.updateUserById(existingAuthUser.id, { password });
      }
      // Insert profile via direct Postgres (bypasses RLS)
      if (dbUrl) {
        const sql = postgres(dbUrl, { max: 1 });
        try {
          await sql`
            INSERT INTO profiles (id, email, name, role, is_super_admin)
            VALUES (${existingAuthUser.id}, ${SUPER_ADMIN_EMAIL}, 'Anderson Buyan', 'admin', true)
            ON CONFLICT (id) DO UPDATE SET role = 'admin', is_super_admin = true, updated_at = NOW()
          `;
        } finally { await sql.end().catch(() => {}); }
      } else {
        await supabase.from('profiles').upsert({ id: existingAuthUser.id, email: SUPER_ADMIN_EMAIL, name: 'Anderson Buyan', role: 'admin', is_super_admin: true }, { onConflict: 'id' });
      }
      return c.json({ success: true, email: SUPER_ADMIN_EMAIL, message: 'Super admin account synced!' });
    }

    // ── Step 3: Need password ──
    if (!password || password.length < 6) {
      return c.json({ needsPassword: true, message: 'Password required (min 6 characters)' });
    }

    // ── Step 4: Fix trigger + create user ──
    // The handle_new_user() trigger on auth.users is failing, which causes
    // "Database error creating new user". Fix it via direct Postgres first.
    if (dbUrl) {
      console.log('Using direct Postgres to fix trigger and create admin...');
      const sql = postgres(dbUrl, { max: 1 });
      try {
        // Step 4a: Recreate trigger function with EXCEPTION handler so it can never crash createUser
        await sql`
          CREATE OR REPLACE FUNCTION handle_new_user()
          RETURNS TRIGGER AS $fn$
          BEGIN
            INSERT INTO profiles (id, email, name, role, phone)
            VALUES (
              NEW.id,
              NEW.email,
              COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
              'student',
              COALESCE(NEW.raw_user_meta_data->>'phone', '')
            )
            ON CONFLICT (id) DO UPDATE SET
              email = EXCLUDED.email,
              name = COALESCE(EXCLUDED.name, profiles.name),
              updated_at = NOW();
            RETURN NEW;
          EXCEPTION WHEN OTHERS THEN
            RAISE LOG 'handle_new_user trigger failed for %: %', NEW.email, SQLERRM;
            RETURN NEW;
          END;
          $fn$ LANGUAGE plpgsql SECURITY DEFINER
        `;
        console.log('Trigger function fixed with EXCEPTION handler');

        // Step 4b: Now try createUser — trigger should not crash anymore
        const { data, error } = await supabase.auth.admin.createUser({
          email: SUPER_ADMIN_EMAIL,
          password,
          user_metadata: { name: 'Anderson Buyan', role: 'admin' },
          email_confirm: true,
        });

        if (error) {
          console.log('createUser still failed after trigger fix:', error.message);
          // Nuclear option: disable trigger, create user, insert profile, re-enable
          console.log('Disabling trigger for user creation...');
          await sql`ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created`;

          const { data: d2, error: e2 } = await supabase.auth.admin.createUser({
            email: SUPER_ADMIN_EMAIL,
            password,
            user_metadata: { name: 'Anderson Buyan', role: 'admin' },
            email_confirm: true,
          });

          // Always re-enable trigger
          await sql`ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created`.catch((re) => {
            console.log('Warning: failed to re-enable trigger:', re.message);
          });

          if (e2) {
            console.log('createUser failed even with trigger disabled:', e2.message);
            return c.json({ error: `Failed to create admin: ${e2.message}` }, 400);
          }

          const userId = d2.user.id;
          // Manually insert profile since trigger was disabled
          await sql`
            INSERT INTO profiles (id, email, name, role, is_super_admin)
            VALUES (${userId}, ${SUPER_ADMIN_EMAIL}, 'Anderson Buyan', 'admin', true)
            ON CONFLICT (id) DO UPDATE SET role = 'admin', is_super_admin = true, updated_at = NOW()
          `;
          console.log(`Super admin created (trigger-bypass): ${SUPER_ADMIN_EMAIL}`);
          return c.json({ success: true, email: SUPER_ADMIN_EMAIL, message: 'Super admin account created successfully!' });
        }

        // createUser succeeded — trigger created a 'student' profile, upgrade to admin
        const userId = data.user.id;
        await sql`
          UPDATE profiles SET role = 'admin', is_super_admin = true, name = 'Anderson Buyan', updated_at = NOW()
          WHERE id = ${userId}
        `;
        console.log(`Super admin created: ${SUPER_ADMIN_EMAIL}`);
        return c.json({ success: true, email: SUPER_ADMIN_EMAIL, message: 'Super admin account created successfully!' });

      } catch (pgErr) {
        console.log('Postgres seed-admin error:', pgErr.message, pgErr);
        return c.json({ error: `Seed admin Postgres error: ${pgErr.message}` }, 500);
      } finally {
        await sql.end().catch(() => {});
      }
    }

    // ── Fallback: no SUPABASE_DB_URL — try createUser directly ──
    console.log('No SUPABASE_DB_URL — attempting createUser without trigger fix...');
    const { data, error } = await supabase.auth.admin.createUser({
      email: SUPER_ADMIN_EMAIL,
      password,
      user_metadata: { name: 'Anderson Buyan', role: 'admin' },
      email_confirm: true,
    });

    if (error) {
      return c.json({
        error: `Failed to create admin: ${error.message}`,
        hint: 'Set the SUPABASE_DB_URL secret so the server can fix the broken trigger automatically, OR run this SQL in Supabase SQL Editor: CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$ BEGIN INSERT INTO profiles (id, email, name, role, phone) VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>$$name$$, split_part(NEW.email, $$@$$, 1)), $$student$$, COALESCE(NEW.raw_user_meta_data->>$$phone$$, $$$$)) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = COALESCE(EXCLUDED.name, profiles.name), updated_at = NOW(); RETURN NEW; EXCEPTION WHEN OTHERS THEN RETURN NEW; END; $$ LANGUAGE plpgsql SECURITY DEFINER;'
      }, 400);
    }

    await supabase.from('profiles').upsert({
      id: data.user.id, email: SUPER_ADMIN_EMAIL, name: 'Anderson Buyan', role: 'admin', is_super_admin: true,
    }, { onConflict: 'id' });

    return c.json({ success: true, email: SUPER_ADMIN_EMAIL, message: 'Super admin account created successfully!' });
  } catch (e) {
    console.log('Seed admin exception:', e);
    return c.json({ error: `Seed admin failed: ${e.message}` }, 500);
  }
});

// ──────────────────────────────────────
// AUTH: Signup (admin-created users — auto-confirmed)
// ──────────────────────────────────────
app.post("/make-server-36dfb453/signup", async (c) => {
  try {
    const { email, password, name, role, phone, department } = await c.req.json();

    if (!email || !password || !name || !role) {
      return c.json({ error: 'Missing required fields: email, password, name, role' }, 400);
    }

    const supabase = adminClient();

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role, department, phone },
      email_confirm: true,
    });

    if (error) {
      console.log('Signup error creating user:', error.message);
      return c.json({ error: error.message }, 400);
    }

    const userId = data.user.id;

    // Find department_id by name if provided
    let department_id = null;
    if (department) {
      const { data: dept } = await supabase.from('departments').select('id').or(`name.eq.${department},slug.eq.${department}`).single();
      department_id = dept?.id || null;
    }

    // Update profile (trigger already created a basic one)
    await supabase.from('profiles').upsert({
      id: userId,
      email,
      name,
      role,
      department_id,
      phone: phone || '',
    }, { onConflict: 'id' });

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();

    console.log(`User created successfully: ${email} (${role})`);
    return c.json({ success: true, userId, profile });
  } catch (e) {
    console.log('Signup exception:', e);
    return c.json({ error: `Signup failed: ${e.message}` }, 500);
  }
});

// ──────────────────────────────────────
// REGISTER PROFILE: Store profile for student self-registration
// ──────────────────────────────────────
app.post("/make-server-36dfb453/register-profile", async (c) => {
  try {
    const { id, email, name, role, department, phone } = await c.req.json();
    if (!id || !email) {
      return c.json({ error: 'Missing required fields: id, email' }, 400);
    }

    const supabase = adminClient();

    // Find department_id
    let department_id = null;
    if (department) {
      const { data: dept } = await supabase.from('departments').select('id').or(`name.eq.${department},slug.eq.${department}`).single();
      department_id = dept?.id || null;
    }

    // Upsert profile — trigger may have already created it
    await supabase.from('profiles').upsert({
      id,
      email,
      name: name || email.split('@')[0],
      role: 'student', // Only allow student for self-registration
      department_id,
      phone: phone || '',
      email_confirmed: false,
    }, { onConflict: 'id' });

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).single();

    console.log(`Profile pre-registered for ${email} (student)`);
    return c.json({ success: true, profile });
  } catch (e) {
    console.log('Register profile error:', e);
    return c.json({ error: `Failed to register profile: ${e.message}` }, 500);
  }
});

// ──────────────────────────────────────
// AUTH: Get current user profile (/me)
// ──────────────────────────────────────
app.get("/make-server-36dfb453/me", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (!auth) return c.json({ error: 'Unauthorized - invalid or missing token' }, 401);

    const supabase = adminClient();
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*, departments!department_id(name, name_fr, slug)')
      .eq('id', auth.userId)
      .single();

    if (error || !profile) {
      // Try to create from auth user metadata as fallback
      const { data: { user } } = await supabase.auth.admin.getUserById(auth.userId);
      if (!user) return c.json({ error: 'User not found' }, 404);
      const meta = user.user_metadata || {};
      const fallbackProfile = {
        id: auth.userId,
        email: user.email || '',
        name: meta.name || user.email?.split('@')[0] || 'User',
        role: meta.role || 'student',
        phone: meta.phone || '',
      };
      await supabase.from('profiles').upsert({ ...fallbackProfile }, { onConflict: 'id' });
      return c.json({ profile: fallbackProfile });
    }

    return c.json({ profile });
  } catch (e) {
    console.log('Get profile exception:', e);
    return c.json({ error: `Failed to get profile: ${e.message}` }, 500);
  }
});

// ──────────────────────────────────────
// AUTH: Update user profile (/me)
// ──────────────────────────────────────
app.put("/make-server-36dfb453/me", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);

    const updates = await c.req.json();
    // Don't allow users to change their own role or id
    delete updates.id;
    delete updates.role;
    delete updates.is_super_admin;

    const supabase = adminClient();
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', auth.userId)
      .select('*')
      .single();

    if (error) {
      console.log('Update profile error:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ profile });
  } catch (e) {
    console.log('Update profile error:', e);
    return c.json({ error: `Failed to update profile: ${e.message}` }, 500);
  }
});

// ──────────────────────────────────────
// STUDENTS: List / Get / Update / Delete
// ──────────────────────────────────────
app.get("/make-server-36dfb453/students", async (c) => {
  try {
    const supabase = adminClient();
    const { data: students, error } = await supabase
      .from('profiles')
      .select('*, departments!department_id(name, name_fr, slug)')
      .eq('role', 'student')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return c.json({ students: students || [] });
  } catch (e) {
    console.log('List students error:', e);
    return c.json({ error: `Failed to list students: ${e.message}` }, 500);
  }
});

app.get("/make-server-36dfb453/students/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const supabase = adminClient();
    const { data: student, error } = await supabase
      .from('profiles')
      .select('*, departments!department_id(name, name_fr, slug)')
      .eq('id', id)
      .eq('role', 'student')
      .single();

    if (error || !student) return c.json({ error: 'Student not found' }, 404);
    return c.json({ student });
  } catch (e) {
    console.log('Get student error:', e);
    return c.json({ error: `Failed to get student: ${e.message}` }, 500);
  }
});

app.put("/make-server-36dfb453/students/:id", async (c) => {
  try {
    const admin = await requireAdmin(c);
    if ('json' in admin) return admin;

    const id = c.req.param('id');
    const updates = await c.req.json();
    delete updates.id;
    delete updates.role;

    const supabase = adminClient();
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select('*').single();
    if (error) throw error;
    return c.json({ student: data });
  } catch (e) {
    console.log('Update student error:', e);
    return c.json({ error: `Failed to update student: ${e.message}` }, 500);
  }
});

app.delete("/make-server-36dfb453/students/:id", async (c) => {
  try {
    const admin = await requireAdmin(c);
    if ('json' in admin) return admin;

    const id = c.req.param('id');
    const supabase = adminClient();
    // Delete auth user (cascades to profile)
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) throw error;
    return c.json({ success: true });
  } catch (e) {
    console.log('Delete student error:', e);
    return c.json({ error: `Failed to delete student: ${e.message}` }, 500);
  }
});

// ──────────────────────────────────────
// STAFF: List all staff (admin + staff role)
// ──────────────────────────────────────
app.get("/make-server-36dfb453/staff", async (c) => {
  try {
    const supabase = adminClient();
    const { data: staff, error } = await supabase
      .from('profiles')
      .select('*, departments!department_id(name, name_fr, slug)')
      .in('role', ['admin', 'staff'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return c.json({ staff: staff || [] });
  } catch (e) {
    console.log('List staff error:', e);
    return c.json({ error: `Failed to list staff: ${e.message}` }, 500);
  }
});

app.put("/make-server-36dfb453/staff/:id", async (c) => {
  try {
    const admin = await requireAdmin(c);
    if ('json' in admin) return admin;

    const id = c.req.param('id');
    const updates = await c.req.json();
    delete updates.id;

    const supabase = adminClient();
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select('*').single();
    if (error) throw error;
    return c.json({ staff: data });
  } catch (e) {
    console.log('Update staff error:', e);
    return c.json({ error: `Failed to update staff: ${e.message}` }, 500);
  }
});

app.delete("/make-server-36dfb453/staff/:id", async (c) => {
  try {
    const admin = await requireAdmin(c);
    if ('json' in admin) return admin;

    const id = c.req.param('id');
    const supabase = adminClient();
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) throw error;
    return c.json({ success: true });
  } catch (e) {
    console.log('Delete staff error:', e);
    return c.json({ error: `Failed to delete staff: ${e.message}` }, 500);
  }
});

// ──────────────────────────────────────
// DEPARTMENTS: CRUD
// ──────────────────────────────────────
app.get("/make-server-36dfb453/departments", async (c) => {
  try {
    const supabase = adminClient();
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return c.json({ departments: data || [] });
  } catch (e) {
    console.log('List departments error:', e);
    return c.json({ error: `Failed to list departments: ${e.message}` }, 500);
  }
});

app.get("/make-server-36dfb453/departments/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const supabase = adminClient();
    const { data, error } = await supabase.from('departments').select('*').eq('id', id).single();
    if (error || !data) return c.json({ error: 'Department not found' }, 404);
    return c.json({ department: data });
  } catch (e) {
    console.log('Get department error:', e);
    return c.json({ error: `Failed to get department: ${e.message}` }, 500);
  }
});

app.post("/make-server-36dfb453/departments", async (c) => {
  try {
    const admin = await requireAdmin(c);
    if ('json' in admin) return admin;

    const dept = await c.req.json();
    const supabase = adminClient();
    const { data, error } = await supabase.from('departments').insert(dept).select('*').single();
    if (error) throw error;
    return c.json({ department: data });
  } catch (e) {
    console.log('Create department error:', e);
    return c.json({ error: `Failed to create department: ${e.message}` }, 500);
  }
});

app.put("/make-server-36dfb453/departments/:id", async (c) => {
  try {
    const admin = await requireAdmin(c);
    if ('json' in admin) return admin;

    const id = c.req.param('id');
    const updates = await c.req.json();
    delete updates.id;

    const supabase = adminClient();
    const { data, error } = await supabase.from('departments').update(updates).eq('id', id).select('*').single();
    if (error) throw error;
    return c.json({ department: data });
  } catch (e) {
    console.log('Update department error:', e);
    return c.json({ error: `Failed to update department: ${e.message}` }, 500);
  }
});

app.delete("/make-server-36dfb453/departments/:id", async (c) => {
  try {
    const admin = await requireAdmin(c);
    if ('json' in admin) return admin;

    const id = c.req.param('id');
    const supabase = adminClient();
    const { error } = await supabase.from('departments').delete().eq('id', id);
    if (error) throw error;
    return c.json({ success: true });
  } catch (e) {
    console.log('Delete department error:', e);
    return c.json({ error: `Failed to delete department: ${e.message}` }, 500);
  }
});

// ──────────────────────────────────────
// PROGRAMS & FEES: Full CRUD
// ──────────────────────────────────────
app.get("/make-server-36dfb453/programs", async (c) => {
  try {
    const supabase = adminClient();
    const { data, error } = await supabase
      .from('programs')
      .select('*, departments(id, name, name_fr, slug, color)')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return c.json({ programs: data || [] });
  } catch (e) {
    console.log('List programs error:', e);
    return c.json({ error: `Failed to list programs: ${e.message}` }, 500);
  }
});

app.get("/make-server-36dfb453/programs/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const supabase = adminClient();
    const { data, error } = await supabase
      .from('programs')
      .select('*, departments(id, name, name_fr, slug, color)')
      .eq('id', id)
      .single();

    if (error || !data) return c.json({ error: 'Program not found' }, 404);
    return c.json({ program: data });
  } catch (e) {
    console.log('Get program error:', e);
    return c.json({ error: `Failed to get program: ${e.message}` }, 500);
  }
});

app.post("/make-server-36dfb453/programs", async (c) => {
  try {
    const admin = await requireAdmin(c);
    if ('json' in admin) return admin;

    const program = await c.req.json();
    const supabase = adminClient();
    const { data, error } = await supabase
      .from('programs')
      .insert({
        ...program,
        fees: program.fees || [],
        status: program.status || 'active',
        created_by: admin.userId,
      })
      .select('*, departments(id, name, name_fr, slug, color)')
      .single();

    if (error) throw error;
    return c.json({ program: data });
  } catch (e) {
    console.log('Create program error:', e);
    return c.json({ error: `Failed to create program: ${e.message}` }, 500);
  }
});

app.put("/make-server-36dfb453/programs/:id", async (c) => {
  try {
    const admin = await requireAdmin(c);
    if ('json' in admin) return admin;

    const id = c.req.param('id');
    const updates = await c.req.json();
    delete updates.id;

    const supabase = adminClient();
    const { data, error } = await supabase
      .from('programs')
      .update(updates)
      .eq('id', id)
      .select('*, departments(id, name, name_fr, slug, color)')
      .single();

    if (error) throw error;
    return c.json({ program: data });
  } catch (e) {
    console.log('Update program error:', e);
    return c.json({ error: `Failed to update program: ${e.message}` }, 500);
  }
});

app.delete("/make-server-36dfb453/programs/:id", async (c) => {
  try {
    const admin = await requireAdmin(c);
    if ('json' in admin) return admin;

    const id = c.req.param('id');
    const supabase = adminClient();
    const { error } = await supabase.from('programs').delete().eq('id', id);
    if (error) throw error;
    return c.json({ success: true });
  } catch (e) {
    console.log('Delete program error:', e);
    return c.json({ error: `Failed to delete program: ${e.message}` }, 500);
  }
});

// ──────────────────────────────────────
// COURSES: Full CRUD
// ──────────────────────────────────────
app.get("/make-server-36dfb453/courses", async (c) => {
  try {
    const supabase = adminClient();
    const { data, error } = await supabase
      .from('courses')
      .select('*, departments(id, name, name_fr, slug, color), programs(id, name, name_fr), instructor:profiles!courses_instructor_id_fkey(id, name, email)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return c.json({ courses: data || [] });
  } catch (e) {
    console.log('List courses error:', e);
    return c.json({ error: `Failed to list courses: ${e.message}` }, 500);
  }
});

app.get("/make-server-36dfb453/courses/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const supabase = adminClient();
    const { data, error } = await supabase
      .from('courses')
      .select('*, departments(id, name, name_fr, slug, color), programs(id, name, name_fr), instructor:profiles!courses_instructor_id_fkey(id, name, email)')
      .eq('id', id)
      .single();

    if (error || !data) return c.json({ error: 'Course not found' }, 404);
    return c.json({ course: data });
  } catch (e) {
    console.log('Get course error:', e);
    return c.json({ error: `Failed to get course: ${e.message}` }, 500);
  }
});

app.post("/make-server-36dfb453/courses", async (c) => {
  try {
    const staffAuth = await requireAdminOrStaff(c);
    if ('json' in staffAuth) return staffAuth;

    const course = await c.req.json();
    const supabase = adminClient();
    const { data, error } = await supabase
      .from('courses')
      .insert({ ...course, created_by: staffAuth.userId })
      .select('*')
      .single();

    if (error) throw error;
    return c.json({ course: data });
  } catch (e) {
    console.log('Create course error:', e);
    return c.json({ error: `Failed to create course: ${e.message}` }, 500);
  }
});

app.put("/make-server-36dfb453/courses/:id", async (c) => {
  try {
    const staffAuth = await requireAdminOrStaff(c);
    if ('json' in staffAuth) return staffAuth;

    const id = c.req.param('id');
    const updates = await c.req.json();
    delete updates.id;

    const supabase = adminClient();
    const { data, error } = await supabase.from('courses').update(updates).eq('id', id).select('*').single();
    if (error) throw error;
    return c.json({ course: data });
  } catch (e) {
    console.log('Update course error:', e);
    return c.json({ error: `Failed to update course: ${e.message}` }, 500);
  }
});

app.delete("/make-server-36dfb453/courses/:id", async (c) => {
  try {
    const admin = await requireAdmin(c);
    if ('json' in admin) return admin;

    const id = c.req.param('id');
    const supabase = adminClient();
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) throw error;
    return c.json({ success: true });
  } catch (e) {
    console.log('Delete course error:', e);
    return c.json({ error: `Failed to delete course: ${e.message}` }, 500);
  }
});

// ──────────────────────────────────────
// ENROLLMENTS: List / My / Create / Update
// ──────────────────────────────────────
app.get("/make-server-36dfb453/enrollments", async (c) => {
  try {
    const supabase = adminClient();
    const { data, error } = await supabase
      .from('enrollments')
      .select('*, student:profiles!enrollments_student_id_fkey(id, name, email, student_id_number), programs(id, name, name_fr), courses(id, name, name_fr)')
      .order('enrolled_at', { ascending: false });

    if (error) throw error;
    return c.json({ enrollments: data || [] });
  } catch (e) {
    console.log('List enrollments error:', e);
    return c.json({ error: `Failed to list enrollments: ${e.message}` }, 500);
  }
});

app.get("/make-server-36dfb453/enrollments/my", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);

    const supabase = adminClient();
    const { data, error } = await supabase
      .from('enrollments')
      .select('*, programs(id, name, name_fr, fees, departments(name, name_fr, slug, color)), courses(id, name, name_fr)')
      .eq('student_id', auth.userId)
      .order('enrolled_at', { ascending: false });

    if (error) throw error;
    return c.json({ enrollments: data || [] });
  } catch (e) {
    console.log('My enrollments error:', e);
    return c.json({ error: `Failed to get enrollments: ${e.message}` }, 500);
  }
});

app.post("/make-server-36dfb453/enrollments", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);

    const enrollment = await c.req.json();
    const supabase = adminClient();
    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        student_id: enrollment.student_id || auth.userId,
        program_id: enrollment.program_id || null,
        course_id: enrollment.course_id || null,
        status: enrollment.status || 'active',
        progress: 0,
      })
      .select('*')
      .single();

    if (error) throw error;
    return c.json({ enrollment: data });
  } catch (e) {
    console.log('Create enrollment error:', e);
    return c.json({ error: `Failed to create enrollment: ${e.message}` }, 500);
  }
});

app.put("/make-server-36dfb453/enrollments/:id", async (c) => {
  try {
    const staffAuth = await requireAdminOrStaff(c);
    if ('json' in staffAuth) return staffAuth;

    const id = c.req.param('id');
    const updates = await c.req.json();
    delete updates.id;

    const supabase = adminClient();
    const { data, error } = await supabase.from('enrollments').update(updates).eq('id', id).select('*').single();
    if (error) throw error;
    return c.json({ enrollment: data });
  } catch (e) {
    console.log('Update enrollment error:', e);
    return c.json({ error: `Failed to update enrollment: ${e.message}` }, 500);
  }
});

// ──────────────────────────────────────
// PAYMENTS: Full CRUD + Approve/Reject
// ──────────────────────────────────────
app.get("/make-server-36dfb453/payments", async (c) => {
  try {
    const supabase = adminClient();
    const { data, error } = await supabase
      .from('payments')
      .select('*, student:profiles!payments_student_id_fkey(id, name, email, student_id_number), programs(id, name, name_fr, departments(name, slug, color))')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return c.json({ payments: data || [] });
  } catch (e) {
    console.log('List payments error:', e);
    return c.json({ error: `Failed to list payments: ${e.message}` }, 500);
  }
});

app.get("/make-server-36dfb453/payments/my", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);

    const supabase = adminClient();
    const { data, error } = await supabase
      .from('payments')
      .select('*, programs(id, name, name_fr, fees, departments(name, slug, color))')
      .eq('student_id', auth.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return c.json({ payments: data || [] });
  } catch (e) {
    console.log('My payments error:', e);
    return c.json({ error: `Failed to get payments: ${e.message}` }, 500);
  }
});

app.post("/make-server-36dfb453/payments", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);

    const payment = await c.req.json();
    const isDigital = payment.payment_mode && payment.payment_mode !== 'cash';

    const supabase = adminClient();
    const { data, error } = await supabase
      .from('payments')
      .insert({
        student_id: payment.student_id || auth.userId,
        program_id: payment.program_id || null,
        enrollment_id: payment.enrollment_id || null,
        amount: payment.amount,
        currency: payment.currency || 'USD',
        payment_mode: payment.payment_mode || 'cash',
        status: isDigital ? 'completed' : 'pending_approval',
        fee_item_id: payment.fee_item_id || '',
        fee_item_name: payment.fee_item_name || '',
        receipt_url: payment.receipt_url || '',
        transaction_ref: payment.transaction_ref || '',
        description: payment.description || '',
        notes: payment.notes || '',
      })
      .select('*')
      .single();

    if (error) throw error;
    return c.json({ payment: data });
  } catch (e) {
    console.log('Create payment error:', e);
    return c.json({ error: `Failed to create payment: ${e.message}` }, 500);
  }
});

app.put("/make-server-36dfb453/payments/:id/approve", async (c) => {
  try {
    const admin = await requireAdmin(c);
    if ('json' in admin) return admin;

    const id = c.req.param('id');
    const supabase = adminClient();
    const { data, error } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        approved_by: admin.userId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    console.log(`Payment ${id} approved by ${admin.userId}`);
    return c.json({ payment: data });
  } catch (e) {
    console.log('Approve payment error:', e);
    return c.json({ error: `Failed to approve payment: ${e.message}` }, 500);
  }
});

app.put("/make-server-36dfb453/payments/:id/reject", async (c) => {
  try {
    const admin = await requireAdmin(c);
    if ('json' in admin) return admin;

    const id = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    const supabase = adminClient();
    const { data, error } = await supabase
      .from('payments')
      .update({
        status: 'rejected',
        rejected_by: admin.userId,
        rejected_at: new Date().toISOString(),
        rejection_reason: body.reason || '',
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    console.log(`Payment ${id} rejected by ${admin.userId}`);
    return c.json({ payment: data });
  } catch (e) {
    console.log('Reject payment error:', e);
    return c.json({ error: `Failed to reject payment: ${e.message}` }, 500);
  }
});

// ──────────────────────────────────────
// ATTENDANCE: List / My / Create / Update
// ──────────────────────────────────────
app.get("/make-server-36dfb453/attendance", async (c) => {
  try {
    const supabase = adminClient();
    const { data, error } = await supabase
      .from('attendance')
      .select('*, student:profiles!attendance_student_id_fkey(id, name, email, student_id_number), courses(id, name, name_fr)')
      .order('date', { ascending: false });

    if (error) throw error;
    return c.json({ attendance: data || [] });
  } catch (e) {
    console.log('List attendance error:', e);
    return c.json({ error: `Failed to list attendance: ${e.message}` }, 500);
  }
});

app.get("/make-server-36dfb453/attendance/my", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);

    const supabase = adminClient();
    const { data, error } = await supabase
      .from('attendance')
      .select('*, courses(id, name, name_fr)')
      .eq('student_id', auth.userId)
      .order('date', { ascending: false });

    if (error) throw error;
    return c.json({ attendance: data || [] });
  } catch (e) {
    console.log('My attendance error:', e);
    return c.json({ error: `Failed to get attendance: ${e.message}` }, 500);
  }
});

app.post("/make-server-36dfb453/attendance", async (c) => {
  try {
    const staffAuth = await requireAdminOrStaff(c);
    if ('json' in staffAuth) return staffAuth;

    const record = await c.req.json();
    const supabase = adminClient();

    // Support batch insert (array of records)
    const records = Array.isArray(record) ? record : [record];
    const toInsert = records.map(r => ({
      student_id: r.student_id,
      course_id: r.course_id,
      date: r.date || new Date().toISOString().split('T')[0],
      status: r.status || 'present',
      check_in_time: r.check_in_time || null,
      notes: r.notes || '',
      marked_by: staffAuth.userId,
    }));

    const { data, error } = await supabase
      .from('attendance')
      .upsert(toInsert, { onConflict: 'student_id,course_id,date' })
      .select('*');

    if (error) throw error;
    return c.json({ attendance: data });
  } catch (e) {
    console.log('Create attendance error:', e);
    return c.json({ error: `Failed to create attendance: ${e.message}` }, 500);
  }
});

// ──────────────────────────────────────
// CERTIFICATES: CRUD
// ──────────────────────────────────────
app.get("/make-server-36dfb453/certificates", async (c) => {
  try {
    const supabase = adminClient();
    const { data, error } = await supabase
      .from('certificates')
      .select('*, student:profiles!certificates_student_id_fkey(id, name, email, student_id_number), programs(id, name, name_fr), courses(id, name, name_fr)')
      .order('issue_date', { ascending: false });

    if (error) throw error;
    return c.json({ certificates: data || [] });
  } catch (e) {
    console.log('List certificates error:', e);
    return c.json({ error: `Failed to list certificates: ${e.message}` }, 500);
  }
});

app.get("/make-server-36dfb453/certificates/my", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);

    const supabase = adminClient();
    const { data, error } = await supabase
      .from('certificates')
      .select('*, programs(id, name, name_fr), courses(id, name, name_fr)')
      .eq('student_id', auth.userId)
      .order('issue_date', { ascending: false });

    if (error) throw error;
    return c.json({ certificates: data || [] });
  } catch (e) {
    console.log('My certificates error:', e);
    return c.json({ error: `Failed to get certificates: ${e.message}` }, 500);
  }
});

app.post("/make-server-36dfb453/certificates", async (c) => {
  try {
    const admin = await requireAdmin(c);
    if ('json' in admin) return admin;

    const cert = await c.req.json();
    const supabase = adminClient();
    const { data, error } = await supabase
      .from('certificates')
      .insert({
        student_id: cert.student_id,
        program_id: cert.program_id || null,
        course_id: cert.course_id || null,
        title: cert.title,
        title_fr: cert.title_fr || '',
        description: cert.description || '',
        grade: cert.grade || '',
        issue_date: cert.issue_date || new Date().toISOString().split('T')[0],
        issued_by: admin.userId,
      })
      .select('*')
      .single();

    if (error) throw error;
    return c.json({ certificate: data });
  } catch (e) {
    console.log('Create certificate error:', e);
    return c.json({ error: `Failed to create certificate: ${e.message}` }, 500);
  }
});

app.put("/make-server-36dfb453/certificates/:id", async (c) => {
  try {
    const admin = await requireAdmin(c);
    if ('json' in admin) return admin;

    const id = c.req.param('id');
    const updates = await c.req.json();
    delete updates.id;

    const supabase = adminClient();
    const { data, error } = await supabase.from('certificates').update(updates).eq('id', id).select('*').single();
    if (error) throw error;
    return c.json({ certificate: data });
  } catch (e) {
    console.log('Update certificate error:', e);
    return c.json({ error: `Failed to update certificate: ${e.message}` }, 500);
  }
});

// ──────────────────────────────────────
// CONTACT MESSAGES: Create (public) + List/Update (admin)
// ──────────────────────────────────────
app.post("/make-server-36dfb453/contact", async (c) => {
  try {
    const message = await c.req.json();
    if (!message.name || !message.email || !message.message) {
      return c.json({ error: 'Missing required fields: name, email, message' }, 400);
    }

    const supabase = adminClient();
    const { data, error } = await supabase
      .from('contact_messages')
      .insert({
        name: message.name,
        email: message.email,
        phone: message.phone || '',
        subject: message.subject || '',
        message: message.message,
      })
      .select('id')
      .single();

    if (error) throw error;
    return c.json({ success: true, id: data.id });
  } catch (e) {
    console.log('Contact message error:', e);
    return c.json({ error: `Failed to send message: ${e.message}` }, 500);
  }
});

app.get("/make-server-36dfb453/contact", async (c) => {
  try {
    const staffAuth = await requireAdminOrStaff(c);
    if ('json' in staffAuth) return staffAuth;

    const supabase = adminClient();
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return c.json({ messages: data || [] });
  } catch (e) {
    console.log('List contact messages error:', e);
    return c.json({ error: `Failed to list messages: ${e.message}` }, 500);
  }
});

app.put("/make-server-36dfb453/contact/:id", async (c) => {
  try {
    const staffAuth = await requireAdminOrStaff(c);
    if ('json' in staffAuth) return staffAuth;

    const id = c.req.param('id');
    const updates = await c.req.json();
    delete updates.id;

    const supabase = adminClient();
    const { data, error } = await supabase.from('contact_messages').update(updates).eq('id', id).select('*').single();
    if (error) throw error;
    return c.json({ message: data });
  } catch (e) {
    console.log('Update contact error:', e);
    return c.json({ error: `Failed to update message: ${e.message}` }, 500);
  }
});

// ──────────────────────────────────────
// NOTIFICATIONS: User notifications
// ──────────────────────────────────────
app.get("/make-server-36dfb453/notifications", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);

    const supabase = adminClient();
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return c.json({ notifications: data || [] });
  } catch (e) {
    console.log('List notifications error:', e);
    return c.json({ error: `Failed to list notifications: ${e.message}` }, 500);
  }
});

app.post("/make-server-36dfb453/notifications", async (c) => {
  try {
    const admin = await requireAdmin(c);
    if ('json' in admin) return admin;

    const notif = await c.req.json();
    const supabase = adminClient();
    const { data, error } = await supabase.from('notifications').insert(notif).select('*').single();
    if (error) throw error;
    return c.json({ notification: data });
  } catch (e) {
    console.log('Create notification error:', e);
    return c.json({ error: `Failed to create notification: ${e.message}` }, 500);
  }
});

app.put("/make-server-36dfb453/notifications/:id/read", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    const supabase = adminClient();
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', auth.userId);

    if (error) throw error;
    return c.json({ success: true });
  } catch (e) {
    console.log('Mark notification read error:', e);
    return c.json({ error: `Failed to mark notification: ${e.message}` }, 500);
  }
});

// ──────────────────────────────────────
// APP SETTINGS: Read/Write
// ──────────────────────────────────────
app.get("/make-server-36dfb453/settings", async (c) => {
  try {
    const supabase = adminClient();
    const { data, error } = await supabase.from('app_settings').select('*');
    if (error) throw error;
    return c.json({ settings: data || [] });
  } catch (e) {
    console.log('List settings error:', e);
    return c.json({ error: `Failed to list settings: ${e.message}` }, 500);
  }
});

app.get("/make-server-36dfb453/settings/:key", async (c) => {
  try {
    const key = c.req.param('key');
    const supabase = adminClient();
    const { data, error } = await supabase.from('app_settings').select('*').eq('key', key).single();
    if (error || !data) return c.json({ error: 'Setting not found' }, 404);
    return c.json({ setting: data });
  } catch (e) {
    console.log('Get setting error:', e);
    return c.json({ error: `Failed to get setting: ${e.message}` }, 500);
  }
});

app.put("/make-server-36dfb453/settings/:key", async (c) => {
  try {
    const admin = await requireAdmin(c);
    if ('json' in admin) return admin;

    const key = c.req.param('key');
    const { value, description } = await c.req.json();

    const supabase = adminClient();
    const { data, error } = await supabase
      .from('app_settings')
      .upsert({
        key,
        value,
        description: description || '',
        updated_by: admin.userId,
      }, { onConflict: 'key' })
      .select('*')
      .single();

    if (error) throw error;
    return c.json({ setting: data });
  } catch (e) {
    console.log('Update setting error:', e);
    return c.json({ error: `Failed to update setting: ${e.message}` }, 500);
  }
});

// ──────────────────────────────────────
// STATS: Dashboard statistics
// ──────────────────────────────────────
app.get("/make-server-36dfb453/stats", async (c) => {
  try {
    const supabase = adminClient();
    const [studentsRes, staffRes, coursesRes, paymentsRes, enrollmentsRes, programsRes] = await Promise.all([
      supabase.from('profiles').select('id, name, email, created_at', { count: 'exact' }).eq('role', 'student'),
      supabase.from('profiles').select('id', { count: 'exact' }).in('role', ['admin', 'staff']),
      supabase.from('courses').select('id', { count: 'exact' }),
      supabase.from('payments').select('id, amount, currency, status, created_at, student_id'),
      supabase.from('enrollments').select('id', { count: 'exact' }),
      supabase.from('programs').select('id', { count: 'exact' }),
    ]);

    const payments = paymentsRes.data || [];
    const totalRevenue = payments
      .filter((p: any) => p.status === 'completed')
      .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);
    const pendingPayments = payments.filter((p: any) => p.status === 'pending_approval').length;

    const students = studentsRes.data || [];
    const recentStudents = students.slice(0, 5);
    const recentPayments = payments.slice(0, 5);

    return c.json({
      totalStudents: studentsRes.count || 0,
      totalStaff: staffRes.count || 0,
      totalCourses: coursesRes.count || 0,
      totalPrograms: programsRes.count || 0,
      totalPayments: payments.length,
      totalRevenue,
      pendingPayments,
      totalEnrollments: enrollmentsRes.count || 0,
      recentStudents,
      recentPayments,
    });
  } catch (e) {
    console.log('Stats error:', e);
    return c.json({ error: `Failed to get stats: ${e.message}` }, 500);
  }
});

// ──────────────────────────────────────
// VIEWS: Access database views
// ──────────────────────────────────────
app.get("/make-server-36dfb453/views/student-overview", async (c) => {
  try {
    const supabase = adminClient();
    const { data, error } = await supabase.from('student_overview').select('*');
    if (error) throw error;
    return c.json({ students: data || [] });
  } catch (e) {
    console.log('Student overview error:', e);
    return c.json({ error: `Failed to get student overview: ${e.message}` }, 500);
  }
});

app.get("/make-server-36dfb453/views/department-revenue", async (c) => {
  try {
    const supabase = adminClient();
    const { data, error } = await supabase.from('department_revenue').select('*');
    if (error) throw error;
    return c.json({ departments: data || [] });
  } catch (e) {
    console.log('Department revenue error:', e);
    return c.json({ error: `Failed to get department revenue: ${e.message}` }, 500);
  }
});

app.get("/make-server-36dfb453/views/monthly-revenue", async (c) => {
  try {
    const supabase = adminClient();
    const { data, error } = await supabase.from('monthly_revenue').select('*');
    if (error) throw error;
    return c.json({ revenue: data || [] });
  } catch (e) {
    console.log('Monthly revenue error:', e);
    return c.json({ error: `Failed to get monthly revenue: ${e.message}` }, 500);
  }
});

Deno.serve(app.fetch);