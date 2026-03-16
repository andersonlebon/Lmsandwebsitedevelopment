import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient, Session, User } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey, apiBase } from '../app/lib/config';
import { setAuthTokenGetter } from '../app/lib/auth-token-getter';

// Explicit session persistence so the session survives refresh and new tabs
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export { supabase };

export type UserRole = 'admin' | 'staff' | 'student';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  phone?: string;
  avatar?: string;
  createdAt?: string;
  emailConfirmed: boolean;
}

interface SignUpResult {
  error?: string;
  needsConfirmation?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (data: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    phone?: string;
    department?: string;
  }) => Promise<SignUpResult>;
  /** Admin-only: create staff accounts (auto-confirmed, no email needed) */
  adminCreateUser: (data: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    phone?: string;
    department?: string;
  }) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({}),
  signUp: async () => ({}),
  adminCreateUser: async () => ({}),
  signOut: async () => {},
  refreshProfile: async () => {},
  resendConfirmation: async () => ({}),
});

const API_BASE = apiBase;

/** JWT exp (seconds since epoch) or null if unparseable. */
function jwtExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

// Re-entrancy guard to prevent fetchDbProfile → refreshSession → onAuthStateChange → fetchDbProfile loop
let _fetchingProfile = false;

/**
 * Fetch the real profile from the database profiles table.
 * This is the source of truth for role, department, etc.
 * Falls back to user_metadata if the DB fetch fails.
 * 
 * @param skipRefresh  When true, don't attempt refreshSession() on 401.
 *                     Used when called from onAuthStateChange to avoid infinite loops.
 */
async function fetchDbProfile(user: User, accessToken?: string, skipRefresh = false): Promise<UserProfile> {
  const fallback = profileFromUser(user);

  // Prevent re-entrant calls (refreshSession inside here can trigger onAuthStateChange)
  if (_fetchingProfile) {
    console.log('fetchDbProfile: skipping re-entrant call, returning fallback');
    return fallback;
  }

  _fetchingProfile = true;

  try {
    let token = accessToken || '';

    // If no token passed, try to get one from the current session
    if (!token) {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token || '';
    }

    // If still no real token, we can't call /me (anon key won't work)
    if (!token) {
      console.warn('fetchDbProfile: no access token available, using user_metadata fallback');
      return fallback;
    }

    const res = await fetch(`${API_BASE}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.ok) {
      const json = await res.json();
      const data = json.profile || json;
      if (data && data.id) {
        const validRoles: UserRole[] = ['admin', 'staff', 'student'];
        return {
          id: data.id,
          email: data.email || user.email || '',
          name: data.name || fallback.name,
          role: validRoles.includes(data.role) ? data.role : fallback.role,
          department: data.department_id || data.department || fallback.department,
          phone: data.phone || fallback.phone,
          avatar: data.avatar || fallback.avatar,
          createdAt: data.created_at || user.created_at,
          emailConfirmed: !!user.email_confirmed_at,
        };
      }
      console.warn('fetchDbProfile: response ok but data missing id. Response:', JSON.stringify(json).slice(0, 500));
    } else {
      const errorBody = await res.text().catch(() => '(no body)');
      console.warn(`fetchDbProfile: HTTP ${res.status} from /me. Body: ${errorBody.slice(0, 500)}`);

      // On 401, try refreshing the session and retry ONCE — but only if not called from onAuthStateChange
      if (res.status === 401 && !skipRefresh) {
        console.log('fetchDbProfile: attempting session refresh for retry...');
        // Temporarily clear guard so the refresh doesn't see us as re-entrant
        _fetchingProfile = false;
        const { data: { session: refreshed } } = await supabase.auth.refreshSession();
        _fetchingProfile = true;
        if (refreshed?.access_token && refreshed.access_token !== token) {
          const retryRes = await fetch(`${API_BASE}/me`, {
            headers: {
              Authorization: `Bearer ${refreshed.access_token}`,
              'Content-Type': 'application/json',
            },
          });
          if (retryRes.ok) {
            const json = await retryRes.json();
            const data = json.profile || json;
            if (data && data.id) {
              const validRoles: UserRole[] = ['admin', 'staff', 'student'];
              return {
                id: data.id,
                email: data.email || user.email || '',
                name: data.name || fallback.name,
                role: validRoles.includes(data.role) ? data.role : fallback.role,
                department: data.department_id || data.department || fallback.department,
                phone: data.phone || fallback.phone,
                avatar: data.avatar || fallback.avatar,
                createdAt: data.created_at || user.created_at,
                emailConfirmed: !!user.email_confirmed_at,
              };
            }
          }
          console.warn('fetchDbProfile: retry after refresh also failed, status:', retryRes.status);
        } else {
          console.warn('fetchDbProfile: session refresh returned same or no token');
        }
      }
    }
  } catch (e) {
    console.warn('fetchDbProfile: exception during fetch:', e);
  } finally {
    _fetchingProfile = false;
  }
  console.warn('fetchDbProfile: falling back to user_metadata. Fallback role:', fallback.role);
  return fallback;
}

/**
 * Build a UserProfile directly from the Supabase auth User object.
 * The role, name, department, phone are all in user_metadata.
 */
function profileFromUser(user: User): UserProfile {
  const meta = user.user_metadata || {};
  const validRoles: UserRole[] = ['admin', 'staff', 'student'];
  const role: UserRole = validRoles.includes(meta.role) ? meta.role : 'student';

  return {
    id: user.id,
    email: user.email || '',
    name: meta.name || meta.full_name || user.email?.split('@')[0] || 'User',
    role,
    department: meta.department || '',
    phone: meta.phone || '',
    avatar: meta.avatar || meta.avatar_url || '',
    createdAt: user.created_at,
    emailConfirmed: !!user.email_confirmed_at,
  };
}

/** Sync profile info to localStorage for layouts that still read it */
function syncLocalStorage(profile: UserProfile) {
  localStorage.setItem('btc_auth', 'true');
  localStorage.setItem('btc_user', JSON.stringify({
    name: profile.name,
    role: profile.role === 'admin' ? 'Administrator' : profile.role === 'staff' ? 'Staff' : 'Student',
    email: profile.email,
  }));
}

function clearLocalStorage() {
  localStorage.removeItem('btc_auth');
  localStorage.removeItem('btc_user');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // So apiFetch uses the same token as the UI on all pages (no "Session expired" while logged in)
  useEffect(() => {
    setAuthTokenGetter(() => session?.access_token ?? null);
  }, [session]);

  // On mount, check for existing session
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const { data: { session: cachedSession } } = await supabase.auth.getSession();
        if (cachedSession?.user) {
          const now = Math.floor(Date.now() / 1000);
          const exp = jwtExp(cachedSession.access_token ?? '');
          // Only refresh when token is expired or expires in less than 60 seconds — avoids refreshing every page load
          const needsRefresh = exp === null || exp - now < 60;
          let session = cachedSession;
          if (needsRefresh) {
            const { data: { session: freshSession } } = await supabase.auth.refreshSession();
            session = freshSession || cachedSession;
          }
          if (mounted) {
            setSession(session);
            const profile = await fetchDbProfile(session.user!, session.access_token);
            setUser(profile);
            syncLocalStorage(profile);
          }
        }
      } catch (e) {
        console.error('Auth init error:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    // Listen for auth state changes (sign-in, sign-out, token refresh, initial session)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      setSession(newSession);

      // Restore user profile on sign-in or when initial session is restored (e.g. page refresh)
      if (newSession?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        fetchDbProfile(newSession.user, newSession.access_token, true).then((profile) => {
          if (!mounted) return;
          setUser(profile);
          syncLocalStorage(profile);
        });
      } else if (newSession?.user && event === 'TOKEN_REFRESHED') {
        // Token refreshed in background — only update session, do not re-fetch profile (avoids flicker / "refresh" feel)
      } else if (!newSession || event === 'SIGNED_OUT') {
        setUser(null);
        clearLocalStorage();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Sign in error:', error.message);
        return { error: error.message };
      }
      if (data.session?.user) {
        setSession(data.session);
        const profile = await fetchDbProfile(data.session.user, data.session.access_token);
        setUser(profile);
        syncLocalStorage(profile);
        console.log('Sign in success:', profile.email, 'role:', profile.role);
      }
      return {};
    } catch (e: any) {
      console.error('Sign in exception:', e);
      return { error: e.message || 'Sign in failed' };
    }
  }, []);

  /**
   * Student self-registration via client-side supabase.auth.signUp().
   * This triggers Supabase's built-in email confirmation flow.
   * The user must confirm their email before they can sign in.
   */
  const signUp = useCallback(async (data: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    phone?: string;
    department?: string;
  }): Promise<SignUpResult> => {
    try {
      // 1. Create user via Supabase client Auth (sends confirmation email)
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: data.role,
            department: data.department || '',
            phone: data.phone || '',
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        console.error('Signup error:', error.message);
        return { error: error.message };
      }

      // 2. Pre-store profile in KV so admin can see the student immediately
      if (authData.user) {
        try {
          await fetch(`${API_BASE}/register-profile`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${supabaseAnonKey}`,
            },
            body: JSON.stringify({
              id: authData.user.id,
              email: data.email,
              name: data.name,
              role: data.role,
              department: data.department || '',
              phone: data.phone || '',
            }),
          });
        } catch (e) {
          console.error('Failed to store profile in KV (non-blocking):', e);
        }
      }

      // 3. If no session → email confirmation required
      if (authData.user && !authData.session) {
        console.log('Signup success — email confirmation required for:', data.email);
        return { needsConfirmation: true };
      }

      // 4. If session exists (auto-confirmed, e.g. confirmation disabled in Supabase settings)
      if (authData.session?.user) {
        setSession(authData.session);
        const profile = await fetchDbProfile(authData.session.user);
        setUser(profile);
        syncLocalStorage(profile);
      }

      return {};
    } catch (e: any) {
      console.error('Signup exception:', e);
      return { error: e.message || 'Signup failed' };
    }
  }, []);

  /**
   * Admin-only: create staff accounts via server route.
   * These are auto-confirmed (email_confirm: true) — no confirmation email sent.
   */
  const adminCreateUser = useCallback(async (data: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    phone?: string;
    department?: string;
  }) => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const token = currentSession?.access_token || supabaseAnonKey;

      const res = await fetch(`${API_BASE}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        console.error('Admin create user error:', result);
        return { error: result.error || 'Failed to create user' };
      }
      return {};
    } catch (e: any) {
      console.error('Admin create user exception:', e);
      return { error: e.message || 'Failed to create user' };
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    clearLocalStorage();
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    const { data: { user: freshUser }, error } = await supabase.auth.getUser();
    if (freshUser && !error) {
      const profile = await fetchDbProfile(freshUser, currentSession?.access_token);
      setUser(profile);
      syncLocalStorage(profile);
    }
  }, []);

  const resendConfirmation = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) {
        console.error('Resend confirmation error:', error.message);
        return { error: error.message };
      }
      return {};
    } catch (e: any) {
      console.error('Resend confirmation exception:', e);
      return { error: e.message || 'Resend confirmation failed' };
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, adminCreateUser, signOut, refreshProfile, resendConfirmation }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}