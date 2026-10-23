import { supabase } from '../lib/supabase';
import { requireUser, requestSignal } from './request';
import type { Workshop, AdminRegistrationItem } from '../types';
import { mapDbWorkshopToWorkshop, PUBLIC_WORKSHOP_FIELDS, type DbWorkshop } from './workshops';
import { normalizeWorkshopInput, validateWorkshopInput, RETIRED_WORKSHOP_ID, type WorkshopInput } from '../domain/workshopInput';
import { isAllowedMeetingUrl } from '../domain/meetingAccess';
import { safeContactUrl } from '../domain/profileValidation';
export type { WorkshopInput } from '../domain/workshopInput';

async function bounded<T>(operation: PromiseLike<T>, signal: AbortSignal): Promise<T> {
  signal.throwIfAborted();
  let abort!: () => void;
  const cancelled = new Promise<never>((_resolve, reject) => {
    abort = () => reject(new Error('The admin request could not be confirmed. Refresh before retrying.'));
    signal.addEventListener('abort', abort, { once: true });
  });
  try { return await Promise.race([operation, cancelled]); }
  finally { signal.removeEventListener('abort', abort); }
}

/** Authoritative membership source; editable metadata is never consulted. */
export async function checkIsAdmin(expectedUserId?: string, signal?: AbortSignal): Promise<boolean> {
  const pending = requestSignal(signal);
  const { data: { user }, error: authError } = await bounded(supabase.auth.getUser(), pending);
  if (authError) throw new Error('Your admin permission could not be verified.');
  if (!user) return false;
  if (expectedUserId && user.id !== expectedUserId) throw new Error('Your account changed. Reload to check permission.');
  const { data, error } = await supabase.from('admin_users').select('user_id').eq('user_id', user.id).abortSignal(pending).maybeSingle();
  if (error) throw new Error('Your admin permission could not be verified.');
  return data?.user_id === user.id;
}
async function requireAdmin(expectedUserId: string | undefined, signal: AbortSignal) {
  const user = await bounded(requireUser(expectedUserId), signal);
  if (!await checkIsAdmin(user.id, signal)) throw new Error('Admin permission is required. Reload to check your access.');
  signal.throwIfAborted();
}
const failure = (error: { code?: string } | null) => new Error(error?.code === '23505'
  ? 'This slug is already in use. Choose another slug.'
  : 'The admin update was not confirmed. Refresh to check the saved state before retrying.');
const validId = (id: string) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new Error('Invalid workshop ID. Refresh the admin list.');
};
const payload = (raw: WorkshopInput) => {
  const error = validateWorkshopInput(raw);
  if (error) throw new Error(error);
  const input = normalizeWorkshopInput(raw);
  return { slug: input.slug, title: input.title, host_name: input.hostName, status: input.status,
    short_description: input.shortDescription, full_description: input.fullDescription, tags: input.tags,
    starts_at: input.startsAt, ends_at: input.endsAt, timezone: input.timezone, mode: 'Online — Google Meet' };
};

export async function listAdminWorkshops(expectedUserId?: string, signal?: AbortSignal): Promise<Workshop[]> {
  const pending = requestSignal(signal);
  await requireAdmin(expectedUserId, pending);
  const { data, error } = await supabase.from('workshops').select(PUBLIC_WORKSHOP_FIELDS).abortSignal(pending).order('created_at', { ascending: false });
  if (error || !data) throw new Error('Admin workshops could not be loaded. Please retry.');
  return data.map(row => mapDbWorkshopToWorkshop(row as DbWorkshop));
}
export async function createWorkshop(input: WorkshopInput, expectedUserId?: string, signal?: AbortSignal): Promise<Workshop> {
  const value = payload(input), pending = requestSignal(signal);
  await requireAdmin(expectedUserId, pending);
  const { data, error } = await supabase.from('workshops').insert(value).select(PUBLIC_WORKSHOP_FIELDS).abortSignal(pending).single();
  if (error || !data?.id || data.slug !== value.slug) throw failure(error);
  return mapDbWorkshopToWorkshop(data as DbWorkshop);
}
export async function updateWorkshop(id: string, input: WorkshopInput, expectedUserId?: string, signal?: AbortSignal): Promise<Workshop> {
  validId(id);
  if (id === RETIRED_WORKSHOP_ID && input.status !== 'archived') throw new Error('The retired workshop must remain archived.');
  const value = payload(input), pending = requestSignal(signal);
  await requireAdmin(expectedUserId, pending);
  const { data, error } = await supabase.from('workshops').update(value).eq('id', id).select(PUBLIC_WORKSHOP_FIELDS).abortSignal(pending).single();
  if (error || !data || data.id !== id) throw failure(error);
  return mapDbWorkshopToWorkshop(data as DbWorkshop);
}
export async function setWorkshopStatus(id: string, status: 'cancelled' | 'archived', expectedUserId?: string, signal?: AbortSignal): Promise<Workshop> {
  validId(id);
  if (!['cancelled', 'archived'].includes(status)) throw new Error('Invalid workshop status.');
  if (id === RETIRED_WORKSHOP_ID && status !== 'archived') throw new Error('The retired workshop must remain archived.');
  const pending = requestSignal(signal);
  await requireAdmin(expectedUserId, pending);
  const { data, error } = await supabase.from('workshops').update({ status }).eq('id', id).select(PUBLIC_WORKSHOP_FIELDS).abortSignal(pending).single();
  if (error || !data || data.id !== id || data.status !== status) throw failure(error);
  return mapDbWorkshopToWorkshop(data as DbWorkshop);
}
export async function getAdminMeetUrl(workshopId: string, expectedUserId?: string, signal?: AbortSignal): Promise<string> {
  validId(workshopId);
  const pending = requestSignal(signal);
  await requireAdmin(expectedUserId, pending);
  const { data, error } = await supabase.from('workshop_links').select('meet_url').eq('workshop_id', workshopId).abortSignal(pending).maybeSingle();
  if (error) throw new Error('The private meeting link could not be loaded.');
  return isAllowedMeetingUrl(data?.meet_url) ? data.meet_url : '';
}
export async function setWorkshopMeetUrl(workshopId: string, meetUrl: string, expectedUserId?: string, signal?: AbortSignal): Promise<void> {
  validId(workshopId);
  const value = meetUrl.trim();
  if (value && !isAllowedMeetingUrl(value)) throw new Error('Use https://meet.google.com/abc-defg-hij without query parameters or fragments.');
  const pending = requestSignal(signal);
  await requireAdmin(expectedUserId, pending);
  const { data, error } = await supabase.from('workshop_links').upsert({ workshop_id: workshopId, meet_url: value })
    .select('workshop_id,meet_url').abortSignal(pending).single();
  if (error || !data || data.workshop_id !== workshopId || data.meet_url !== value) throw failure(error);
}
export async function listWorkshopRegistrations(workshopId: string, expectedUserId?: string, signal?: AbortSignal): Promise<AdminRegistrationItem[]> {
  validId(workshopId);
  const pending = requestSignal(signal);
  await requireAdmin(expectedUserId, pending);
  const { data, error } = await supabase.from('registrations').select('id,user_id,workshop_id,created_at')
    .eq('workshop_id', workshopId).abortSignal(pending).order('created_at', { ascending: false });
  if (error || !data) throw new Error('Workshop registrations could not be loaded.');
  if (!data.length) return [];
  const { data: profiles, error: profileError } = await supabase.from('profiles').select('id,name,email,handle,linkedin_url')
    .in('id', [...new Set(data.map(row => row.user_id))]).abortSignal(pending);
  if (profileError || !profiles) throw new Error('Attendee contact details could not be loaded.');
  const byId = new Map(profiles.map(row => [row.id, row]));
  return data.map(row => {
    const profile = byId.get(row.user_id);
    return { id: row.id, userId: row.user_id, workshopId: row.workshop_id, createdAt: row.created_at,
      profile: profile ? { name: profile.name || '', email: profile.email || '', handle: profile.handle || '', linkedinUrl: safeContactUrl(profile.linkedin_url) } : null };
  });
}
