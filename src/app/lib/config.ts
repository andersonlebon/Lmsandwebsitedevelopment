/**
 * Centralized configuration for the BTC platform.
 * Reads from Vite env vars (VITE_*) with fallbacks to the hardcoded Make values.
 * 
 * For Vercel deployment, set these environment variables:
 *   VITE_SUPABASE_URL        - Your Supabase project URL
 *   VITE_SUPABASE_ANON_KEY   - Your Supabase public anon key
 * 
 * These are injected at build time by Vite.
 */

import { projectId as makeProjectId, publicAnonKey as makeAnonKey } from '/utils/supabase/info';

// Vite injects VITE_* env vars at build time via import.meta.env
const envUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL;
const envKey = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY;

/** Supabase project URL */
export const supabaseUrl: string = envUrl || `https://${makeProjectId}.supabase.co`;

/** Supabase public anon key */
export const supabaseAnonKey: string = envKey || makeAnonKey;

/** Base URL for the Edge Function server */
export const apiBase: string = `${supabaseUrl}/functions/v1/make-server-36dfb453`;
