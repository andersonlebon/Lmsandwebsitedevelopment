import { supabaseAnonKey, apiBase } from './config';
import { supabase } from '../../context/AuthContext';
import { getCurrentSessionToken } from './auth-token-getter';

const API_BASE = apiBase;
const publicAnonKey = supabaseAnonKey;

/**
 * Decode a JWT payload without verifying signature.
 * Returns the `exp` (seconds since epoch) or null if parsing fails.
 */
function jwtExp(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

/** True if this token is the project anon key (no real user). */
function isAnonToken(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    return payload.role === 'anon';
  } catch {
    return false;
  }
}

/**
 * Get the best available auth token:
 * 1. Read cached session
 * 2. Decode the JWT to check real expiry
 * 3. If expired/close to expiry, call refreshSession()
 * 4. Fall back to publicAnonKey (valid JWT the gateway always accepts)
 * If requireUserToken is true, never returns anon key — throws instead.
 */
async function getFreshToken(requireUserToken = false): Promise<string> {
  try {
    // Use the same token as the UI (AuthContext) when available — avoids "Session expired" while sidebar shows logged in
    const currentToken = getCurrentSessionToken();
    if (currentToken && !isAnonToken(currentToken)) {
      const exp = jwtExp(currentToken);
      const now = Math.floor(Date.now() / 1000);
      if (exp !== null && exp - now > 60) return currentToken;
    }

    let { data: { session } } = await supabase.auth.getSession();
    // When auth is required and storage returned no session, try one refresh (e.g. rehydration race)
    if (requireUserToken && !session?.access_token) {
      await supabase.auth.refreshSession();
      const next = await supabase.auth.getSession();
      session = next.data.session;
    }
    if (!session?.access_token) {
      if (requireUserToken) throw new Error('Session expired. Please log in again.');
      return publicAnonKey;
    }

    // Check actual JWT expiry (more reliable than session.expires_at)
    const exp = jwtExp(session.access_token);
    const now = Math.floor(Date.now() / 1000);

    if (exp === null || exp - now < 60) {
      // Token is expired, about to expire, or unparseable — refresh it
      const { data: { session: refreshed } } = await supabase.auth.refreshSession();
      if (refreshed?.access_token) {
        const refreshedExp = jwtExp(refreshed.access_token);
        if (refreshedExp && refreshedExp - now > 30) {
          return refreshed.access_token;
        }
      }
      if (requireUserToken) throw new Error('Session expired. Please log in again.');
      return publicAnonKey;
    }

    const token = session.access_token;
    if (requireUserToken && isAnonToken(token)) {
      throw new Error('Session expired. Please log in again.');
    }
    return token;
  } catch (e) {
    if (requireUserToken && e instanceof Error) throw e;
    return publicAnonKey;
  }
}

export type ApiFetchOptions = RequestInit & {
  /** When true, require a real user session (never use anon key). Use for admin/staff mutations. */
  requireAuth?: boolean;
};

/**
 * Fetch helper that auto-attaches a fresh Supabase access token.
 * - If an accessToken is explicitly passed, it uses that.
 * - Otherwise it gets a fresh session token (refreshing if expired).
 * - Falls back to publicAnonKey for unauthenticated endpoints.
 * - On 401 "Invalid JWT", retries once after refreshing the session.
 * - When requireAuth: true, never sends anon key; throws "Session expired. Please log in again." if no valid user token.
 */
export async function apiFetch(
  path: string,
  options: ApiFetchOptions = {},
  accessToken?: string | null
) {
  const requireAuth = options.requireAuth === true;
  const { requireAuth: _, ...fetchOptions } = options;

  let token = accessToken ?? await getFreshToken(requireAuth);

  const buildHeaders = (t: string): Record<string, string> => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${t}`,
    ...(fetchOptions.headers as Record<string, string> || {}),
  });

  const doFetch = () => fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers: buildHeaders(token),
  });

  let res: Response;
  try {
    res = await doFetch();
  } catch (networkErr) {
    const isFailedToFetch = networkErr instanceof TypeError && (networkErr.message === 'Failed to fetch' || (networkErr as any).name === 'TypeError');
    const msg = isFailedToFetch
      ? 'Impossible de joindre le serveur API. En local, lancez "npm run server" (port 5000) et définissez VITE_API_URL=http://localhost:5000 dans .env'
      : (networkErr instanceof Error ? networkErr.message : 'Network error');
    throw new Error(msg);
  }

  // If 401 and we didn't explicitly pass a token, try refreshing and retry once
  if (res.status === 401 && !accessToken) {
    try {
      const { data: { session } } = await supabase.auth.refreshSession();
      const refreshedToken = session?.access_token;
      if (refreshedToken && refreshedToken !== token && !isAnonToken(refreshedToken)) {
        res = await fetch(`${API_BASE}${path}`, {
          ...fetchOptions,
          headers: buildHeaders(refreshedToken),
        });
      }
      // Do not fall back to anon key for auth-required requests
      if (res.status === 401 && !requireAuth && token !== publicAnonKey) {
        res = await fetch(`${API_BASE}${path}`, {
          ...fetchOptions,
          headers: buildHeaders(publicAnonKey),
        });
      }
    } catch (refreshErr) {
      if (requireAuth && refreshErr instanceof Error) throw refreshErr;
      console.error('Token refresh failed during 401 retry:', refreshErr);
      if (!requireAuth && token !== publicAnonKey) {
        res = await fetch(`${API_BASE}${path}`, {
          ...fetchOptions,
          headers: buildHeaders(publicAnonKey),
        });
      }
    }
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    console.error(`API error [${res.status}] ${path}:`, errorData);
    throw new Error(errorData.error || `Request failed: ${res.status}`);
  }

  try {
    return await res.json();
  } catch (e) {
    throw new Error('Invalid JSON response from server');
  }
}
