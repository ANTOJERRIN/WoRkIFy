import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl) {
  throw new Error(
    'Missing VITE_SUPABASE_URL. Add it to your .env file. See .env.example for required variables.'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_ANON_KEY. Add it to your .env file. See .env.example for required variables.'
  );
}

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
