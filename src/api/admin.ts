import { supabase } from '../lib/supabase';
import type { Workshop, WorkshopStatus, AdminRegistrationItem } from '../types';
import { mapDbWorkshopToWorkshop, PUBLIC_WORKSHOP_FIELDS } from './workshops';
import { validateWorkshop, validateMeetUrl, type WorkshopInput } from '../domain/workshop';
export type { WorkshopInput } from '../domain/workshop';

export async function checkIsAdmin(): Promise<boolean> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return false;
  const result = await supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
  if (result.error) throw new Error('Admin access could not be verified.');
  return !!result.data;
}
async function requireAdmin() {
  if (!await checkIsAdmin()) throw new Error('Only the Workify admin can manage workshops.');
}
function saveError(error: { code?: string; message: string }): Error {
  if (error.code === '23505') return new Error('That workshop URL is already taken. Choose another slug.');
  if (error.code === '42501') return new Error('Admin permission is required for this action.');
  return new Error(error.message);
}
function payload(input: WorkshopInput) {
  validateWorkshop(input);
  return { slug: input.slug.trim().toLowerCase(), title: input.title.trim(), host_name: input.hostName.trim(),
    mode: 'Online — Google Meet', status: input.status, short_description: input.shortDescription.trim(),
    full_description: input.fullDescription.trim(), tags: input.tags.map(tag => tag.trim()).filter(Boolean),
    starts_at: input.startsAt, ends_at: input.endsAt, timezone: input.timezone || 'Asia/Kolkata' };
}
export async function createWorkshop(input: WorkshopInput): Promise<Workshop> {
  const values = payload(input);
  await requireAdmin();
  const { data, error } = await supabase.from('workshops').insert(values).select(PUBLIC_WORKSHOP_FIELDS).single();
  if (error) throw saveError(error);
  return mapDbWorkshopToWorkshop(data);
}
export async function updateWorkshop(id: string, input: WorkshopInput): Promise<Workshop> {
  const values = payload(input);
  await requireAdmin();
  const { data, error } = await supabase.from('workshops').update(values).eq('id', id).select(PUBLIC_WORKSHOP_FIELDS).single();
  if (error) throw saveError(error);
  return mapDbWorkshopToWorkshop(data);
}
export async function setWorkshopStatus(id: string, status: WorkshopStatus): Promise<void> {
  await requireAdmin();
  const { error } = await supabase.from('workshops').update({ status }).eq('id', id).select('id').single();
  if (error) throw saveError(error);
}
export async function getAdminMeetUrl(workshopId: string): Promise<string> {
  await requireAdmin();
  const { data, error } = await supabase.from('workshop_links').select('meet_url').eq('workshop_id', workshopId).maybeSingle();
  if (error) throw new Error('The private meeting link could not be loaded.');
  return data?.meet_url || '';
}
export async function setWorkshopMeetUrl(workshopId: string, meetUrl: string): Promise<void> {
  validateMeetUrl(meetUrl);
  await requireAdmin();
  const { error } = meetUrl.trim()
    ? await supabase.from('workshop_links').upsert({ workshop_id: workshopId, meet_url: meetUrl.trim() })
    : await supabase.from('workshop_links').delete().eq('workshop_id', workshopId);
  if (error) throw saveError(error);
}
export async function listWorkshopRegistrations(workshopId: string): Promise<AdminRegistrationItem[]> {
  await requireAdmin();
  const { data, error } = await supabase.from('registrations').select('id,user_id,workshop_id,created_at').eq('workshop_id', workshopId).order('created_at', { ascending: false });
  if (error) throw new Error('Registrations could not be loaded.');
  if (!data?.length) return [];
  const { data: profiles, error: profileError } = await supabase.from('profiles').select('id,name,email,handle,linkedin_url').in('id', [...new Set(data.map(row => row.user_id))]);
  if (profileError) throw new Error('Attendee profiles could not be loaded.');
  return data.map(row => {
    const profile = profiles?.find(person => person.id === row.user_id);
    return { id: row.id, userId: row.user_id, workshopId: row.workshop_id, createdAt: row.created_at,
      profile: profile ? { name: profile.name, email: profile.email, handle: profile.handle || '', linkedinUrl: profile.linkedin_url || '' } : null };
  });
}
