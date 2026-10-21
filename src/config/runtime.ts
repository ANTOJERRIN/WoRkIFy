export interface PublicConfigSource {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}

export class PublicConfigurationError extends Error {}

/** Also run by Vite before serving/bundling public environment variables. */
export function assertPublicBrowserKey(key: string | undefined) {
  let legacyRole: string | undefined;
  try {
    const payload = key?.split('.')[1];
    if (payload) legacyRole = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))).role;
  } catch { /* Non-JWT publishable keys have no legacy role. */ }
  if (key?.trim().startsWith('sb_secret_') || legacyRole === 'service_role') {
    throw new PublicConfigurationError('VITE_SUPABASE_ANON_KEY must use a public publishable or legacy anon key. Server secret keys cannot be used in the browser.');
  }
}

/** Public build-time configuration only; never include server credentials here. */
export function readPublicConfig(env: PublicConfigSource) {
  const supabaseUrl = env.VITE_SUPABASE_URL?.trim();
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY?.trim();
  assertPublicBrowserKey(supabaseAnonKey);
  const missing = [
    !supabaseUrl && 'VITE_SUPABASE_URL',
    !supabaseAnonKey && 'VITE_SUPABASE_ANON_KEY',
  ].filter(Boolean);

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new PublicConfigurationError(`Missing public configuration: ${missing.join(', ')}. Copy .env.example to .env and configure your Supabase project.`);
  }
  if (supabaseUrl.includes('your-project-ref') || supabaseAnonKey === 'your-supabase-publishable-key') {
    throw new PublicConfigurationError('Replace the placeholders in .env with your Supabase project URL and public publishable key.');
  }
  try {
    const url = new URL(supabaseUrl);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error();
  } catch {
    throw new PublicConfigurationError('VITE_SUPABASE_URL must be a valid HTTP or HTTPS project URL without credentials.');
  }

  return { supabaseUrl, supabaseAnonKey };
}
