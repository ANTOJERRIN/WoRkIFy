import { createClient } from '@supabase/supabase-js';
import { readPublicConfig } from '../config/runtime';

const { supabaseUrl, supabaseAnonKey } = readPublicConfig(import.meta.env);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Public metadata must not wait for session refresh or a stored-session lock.
// This client always uses the public key and cannot inherit an account session.
export const publicSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'workify-public-catalog',
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
