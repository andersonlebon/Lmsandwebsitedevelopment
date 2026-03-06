/**
 * Single source of truth for all env-based config in the application.
 * The app should import from this file only (no direct import.meta.env elsewhere).
 *
 * Keys in .env (no duplicates):
 *   VITE_SUPABASE_URL       – Supabase project URL (frontend + server)
 *   VITE_SUPABASE_ANON_KEY  – Supabase anon key (frontend + server)
 *   VITE_API_URL            – optional; API base (e.g. http://localhost:5000)
 */

import { projectId as makeProjectId, publicAnonKey as makeAnonKey } from '/utils/supabase/info';

function getEnv(key: string): string | undefined {
  if (typeof import.meta !== 'undefined' && import.meta.env?.[key] != null) {
    return String(import.meta.env[key]);
  }
  return undefined;
}

/** Supabase project URL */
export const supabaseUrl: string =
  getEnv('VITE_SUPABASE_URL') || `https://${makeProjectId}.supabase.co`;

/** Supabase public anon key */
export const supabaseAnonKey: string =
  getEnv('VITE_SUPABASE_ANON_KEY') || makeAnonKey;

/** API base URL. Set VITE_API_URL to use the local Drizzle server. */
export const apiBase: string =
  getEnv('VITE_API_URL') || `${supabaseUrl}/functions/v1/make-server-36dfb453`;

/** All env-derived config in one object (for convenience). */
export const env = {
  supabaseUrl,
  supabaseAnonKey,
  apiBase,
} as const;

export default env;
