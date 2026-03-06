import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { supabase } from '../../context/AuthContext';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-36dfb453`;

interface TestResult {
  name: string;
  status: 'pending' | 'ok' | 'error';
  time?: number;
  data?: any;
  error?: string;
}

async function runTest(name: string, fn: () => Promise<any>): Promise<TestResult> {
  const start = Date.now();
  try {
    const data = await fn();
    return { name, status: 'ok', time: Date.now() - start, data };
  } catch (e: any) {
    return { name, status: 'error', time: Date.now() - start, error: e.message || String(e) };
  }
}

export function Debug() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data?.session || null));
  }, []);

  const runAll = async () => {
    setRunning(true);
    setResults([]);
    const tests: TestResult[] = [];

    const addResult = (r: TestResult) => {
      tests.push(r);
      setResults([...tests]);
    };

    // Test 1: Basic connectivity — health endpoint
    addResult(await runTest('1. Health endpoint (no auth needed)', async () => {
      const res = await fetch(`${API_BASE}/health`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      return await res.json();
    }));

    // Test 2: Debug endpoint — tests env vars + DB connection inside the edge function
    addResult(await runTest('2. Debug endpoint (env vars + DB connection)', async () => {
      const res = await fetch(`${API_BASE}/debug`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      return await res.json();
    }));

    // Test 3: DB Check — tests if all tables exist
    addResult(await runTest('3. DB Check (all 11 tables)', async () => {
      const res = await fetch(`${API_BASE}/db-check`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      return await res.json();
    }));

    // Test 4: Departments list (the simplest GET route)
    addResult(await runTest('4. GET /departments (simplest query)', async () => {
      const res = await fetch(`${API_BASE}/departments`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      return await res.json();
    }));

    // Test 5: Students list
    addResult(await runTest('5. GET /students', async () => {
      const res = await fetch(`${API_BASE}/students`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      return await res.json();
    }));

    // Test 6: Stats
    addResult(await runTest('6. GET /stats (dashboard data)', async () => {
      const res = await fetch(`${API_BASE}/stats`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      return await res.json();
    }));

    // Test 7: Programs
    addResult(await runTest('7. GET /programs', async () => {
      const res = await fetch(`${API_BASE}/programs`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      return await res.json();
    }));

    // Test 8: Direct Supabase client query (bypasses edge function entirely)
    addResult(await runTest('8. Direct Supabase client: kv_store_36dfb453', async () => {
      const { data, error } = await supabase.from('kv_store_36dfb453').select('*').limit(3);
      if (error) throw new Error(`${error.code}: ${error.message} (hint: ${error.hint})`);
      return { count: data?.length ?? 0, sample: data };
    }));

    // Test 9: Direct Supabase client: departments (tests if table exists from client side)
    addResult(await runTest('9. Direct Supabase client: departments table', async () => {
      const { data, error } = await supabase.from('departments').select('id, name').limit(3);
      if (error) throw new Error(`${error.code}: ${error.message} (hint: ${error.hint})`);
      return { count: data?.length ?? 0, sample: data };
    }));

    // Test 10: Auth session check
    addResult(await runTest('10. Current auth session', async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw new Error(error.message);
      if (!session) return { loggedIn: false, message: 'No active session — you need to log in first for mutation routes' };
      return {
        loggedIn: true,
        email: session.user?.email,
        role: session.user?.user_metadata?.role,
        tokenExpiry: new Date((session.expires_at || 0) * 1000).toISOString(),
        tokenPrefix: session.access_token?.substring(0, 30) + '...',
      };
    }));

    setRunning(false);
  };

  useEffect(() => { runAll(); }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            BTC API Diagnostics
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Testing the full chain: Frontend → Edge Function → Supabase Database
          </p>
          <div className="mt-2 text-xs font-mono text-gray-400 dark:text-gray-500 space-y-1">
            <div>API Base: <span className="text-blue-500">{API_BASE}</span></div>
            <div>Project ID: <span className="text-blue-500">{projectId}</span></div>
            <div>Anon Key: <span className="text-blue-500">{publicAnonKey.substring(0, 30)}...</span></div>
          </div>
        </div>

        <button
          onClick={runAll}
          disabled={running}
          className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {running ? 'Running tests...' : 'Re-run All Tests'}
        </button>

        <div className="space-y-3">
          {results.map((r, i) => (
            <div
              key={i}
              className={`rounded-xl border p-4 ${
                r.status === 'ok'
                  ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                  : r.status === 'error'
                  ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                  : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-gray-900 dark:text-white">
                  {r.status === 'ok' ? '✅' : r.status === 'error' ? '❌' : '⏳'} {r.name}
                </span>
                {r.time !== undefined && (
                  <span className="text-xs text-gray-400">{r.time}ms</span>
                )}
              </div>
              {r.error && (
                <pre className="text-xs text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-3 rounded-lg overflow-auto whitespace-pre-wrap max-h-48">
                  ERROR: {r.error}
                </pre>
              )}
              {r.data && (
                <pre className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded-lg overflow-auto whitespace-pre-wrap max-h-64 border border-gray-100 dark:border-gray-700">
                  {JSON.stringify(r.data, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>

        {results.length > 0 && !running && (
          <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
            <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2">How to read these results:</h3>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li><strong>Test 1 fails:</strong> Edge function is not running at all — deployment issue</li>
              <li><strong>Test 2 fails:</strong> Edge function runs but can't connect to DB — check SUPABASE_URL/SERVICE_ROLE_KEY</li>
              <li><strong>Test 3 fails:</strong> Tables don't exist — run btc_schema.sql in Supabase SQL Editor</li>
              <li><strong>Tests 4-7 fail:</strong> Specific query issues — check the error messages</li>
              <li><strong>Test 8 OK but 9 fails:</strong> kv_store exists but your custom tables don't — schema not applied</li>
              <li><strong>Test 9 shows 42501 (permission denied):</strong> RLS is blocking — but edge function uses service_role which bypasses RLS</li>
              <li><strong>Test 10:</strong> Whether you're logged in — needed for mutation routes only</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
