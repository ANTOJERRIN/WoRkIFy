import { supabase } from '../lib/supabase';

/** Verify the SDK user before issuing an account-scoped request. RLS still authorizes it. */
export async function requireUser(expectedUserId?: string) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error('Your session is unavailable. Please reload the page.');
  if (expectedUserId && user.id !== expectedUserId) throw new Error('Your account changed. Please reload the page.');
  return user;
}

export function requestSignal(signal?: AbortSignal) {
  const timeout = AbortSignal.timeout(15_000);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}
