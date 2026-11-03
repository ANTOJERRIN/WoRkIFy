import { supabase } from '../lib/supabase';

const callbackUrl = () => new URL('/login', window.location.origin).href;
export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
}
export async function signUp(name: string, email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password,
    options: { data: { full_name: name.trim() }, emailRedirectTo: callbackUrl() } });
  if (error) throw error;
  return !!data.session;
}
export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: callbackUrl() });
  if (error) throw error;
}
export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}
export function authErrorMessage(error: unknown): string {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : '';
  if (code === 'invalid_credentials') return 'Email or password is incorrect. Please try again.';
  if (code === 'email_not_confirmed') return 'Confirm your email using the link in your inbox, then sign in.';
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit') return 'Too many attempts. Please wait a little and try again.';
  if (code === 'weak_password') return 'Choose a stronger password with at least 12 characters.';
  if (code === 'signup_disabled') return 'New accounts are currently disabled. Contact Workify for access.';
  return 'We could not complete that request. Check your connection and try again.';
}
