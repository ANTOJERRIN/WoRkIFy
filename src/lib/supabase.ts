import { createClient } from '@supabase/supabase-js';
import { readPublicConfig } from '../config/runtime';

const { url: supabaseUrl, key: supabaseAnonKey } = readPublicConfig(import.meta.env);
const boundedFetch: typeof fetch = (input, init) => fetch(input, {
  ...init,
  signal: init?.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(20000)]) : AbortSignal.timeout(20000),
});
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: boundedFetch },
  auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

// Public metadata must not wait for session refresh or a stored-session lock.
// This client always uses the public key and cannot inherit an account session.
export const publicSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: boundedFetch },
  auth: {
    storageKey: 'workify-public-catalog',
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
