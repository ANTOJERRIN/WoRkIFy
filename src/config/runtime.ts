export interface PublicConfig { url: string; key: string }

export function assertPublicBrowserKey(key?: string): void {
  let privileged = key?.startsWith('sb_secret_') || key?.includes('service_role');
  if (key?.startsWith('eyJ')) {
    try {
      const payload = JSON.parse(atob(key.split('.')[1].replaceAll('-', '+').replaceAll('_', '/')));
      privileged ||= payload.role === 'service_role';
    } catch { /* Never print a credential on failure. */ }
  }
  if (privileged) throw new Error('Server secret keys must never be used in VITE_ browser configuration. Use a Supabase publishable key.');
}

export function readPublicConfig(env: Record<string, string | undefined>): PublicConfig {
  const key = (env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY)?.trim();
  assertPublicBrowserKey(key);
  const url = env.VITE_SUPABASE_URL?.trim();
  if (!url || !key || /your-project|your-supabase|placeholder/i.test(`${url} ${key}`)) {
    throw new Error('Configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local to connect Workify.');
  }
  let parsed: URL;
  try { parsed = new URL(url); } catch { throw new Error('VITE_SUPABASE_URL must be a valid Supabase API URL.'); }
  if (parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/' ||
    !(parsed.protocol === 'https:' || (parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname)))) {
    throw new Error('Use a secure Supabase API URL without credentials, paths or query parameters.');
  }
  return { url: parsed.origin, key };
}
