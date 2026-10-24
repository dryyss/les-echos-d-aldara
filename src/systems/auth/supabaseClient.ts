/**
 * Client Supabase unique. Créé seulement si les variables d'environnement
 * VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY existent ; sinon `null` et le
 * jeu fonctionne en mode local (invité sans compte).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function readSupabaseConfig(
  env: Record<string, unknown> = import.meta.env as Record<string, unknown>,
): SupabaseConfig | null {
  const url = env.VITE_SUPABASE_URL;
  const anonKey = env.VITE_SUPABASE_ANON_KEY;
  if (typeof url !== 'string' || typeof anonKey !== 'string') return null;
  if (url.trim() === '' || anonKey.trim() === '') return null;
  return { url: url.trim(), anonKey: anonKey.trim() };
}

const config = readSupabaseConfig();

export function isSupabaseConfigured(): boolean {
  return config !== null;
}

export const supabase: SupabaseClient | null = config
  ? createClient(config.url, config.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;
