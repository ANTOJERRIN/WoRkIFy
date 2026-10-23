import { supabase } from '../lib/supabase';
import type { RegistrationWithWorkshop } from '../types';
import { mapDbWorkshopToWorkshop, type DbWorkshop } from './workshops';
import { PUBLIC_WORKSHOP_FIELDS } from './workshops';
import { requireUser, requestSignal } from './request';

interface DbRegistrationJoined {
  id: string;
  user_id: string;
  workshop_id: string;
  created_at: string;
  workshops: DbWorkshop | null;
}

/**
 * Loads all registrations for the currently authenticated user, joined with workshop details.
 */
export interface RegistrationSnapshot {
  workshopIds: string[];
  registrations: RegistrationWithWorkshop[];
}

export async function listUserRegistrations(expectedUserId?: string, signal?: AbortSignal): Promise<RegistrationSnapshot> {
  const user = await requireUser(expectedUserId);
  signal?.throwIfAborted();

  const { data, error } = await supabase
    .from('registrations')
    .select(`id,user_id,workshop_id,created_at,workshops:workshops(${PUBLIC_WORKSHOP_FIELDS})`)
    .eq('user_id', user.id)
    .abortSignal(requestSignal(signal))
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) throw new Error('The registration service returned no response. Please try again.');

  const results: RegistrationWithWorkshop[] = [];

  for (const row of (data as unknown as DbRegistrationJoined[])) {
    if (row.workshops) {
      results.push({
        id: row.id,
        userId: row.user_id,
        workshopId: row.workshop_id,
        createdAt: row.created_at,
        workshop: mapDbWorkshopToWorkshop(row.workshops),
      });
    }
  }

  return { workshopIds: data.map(row => row.workshop_id), registrations: results };
}

export type RegistrationMutationResult = 'registered' | 'already_registered' | 'cancelled' | 'not_registered';

function mutationFailure(error: { code?: string; message: string }, status?: number): Error {
  if (status === 401 || error.code === 'PGRST301') return new Error('Your session expired. Reload the page to check your sign-in status.');
  if (error.code === '42501') return new Error('This registration is not permitted. Refresh the workshop and check your sign-in status.');
  if (error.code === 'P0001') return new Error(error.message);
  return new Error('The registration service could not confirm the update. Refresh registrations before retrying.');
}

function validateWorkshopId(id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new Error('This workshop has an invalid ID. Reload the workshop page.');
}

async function mutationUser(expectedUserId?: string) {
  try { return await requireUser(expectedUserId); }
  catch { throw new Error('Your session could not be verified. Reload the page to check your sign-in status.'); }
}

/** The verified identity supplies user_id; RLS and the trigger remain authoritative. */
export async function registerForWorkshop(workshopId: string, expectedUserId?: string, signal?: AbortSignal): Promise<RegistrationMutationResult> {
  validateWorkshopId(workshopId);
  const user = await mutationUser(expectedUserId);
  signal?.throwIfAborted();
  const { error, status } = await supabase.from('registrations')
    .insert({ user_id: user.id, workshop_id: workshopId }).abortSignal(requestSignal(signal));
  if (!error) return 'registered';
  if (error.code === '23505') {
    // A uniqueness error is idempotent success only if our reservation exists.
    // Do not mask unrelated unique violations or a failed verification query.
    const existing = await supabase.from('registrations').select('id')
      .eq('user_id', user.id).eq('workshop_id', workshopId)
      .abortSignal(requestSignal(signal)).maybeSingle();
    if (!existing.error && existing.data) return 'already_registered';
  }
  throw mutationFailure(error, status);
}

export async function unregister(workshopId: string, expectedUserId?: string, signal?: AbortSignal): Promise<RegistrationMutationResult> {
  validateWorkshopId(workshopId);
  const user = await mutationUser(expectedUserId);
  signal?.throwIfAborted();
  const { data, error, status } = await supabase.from('registrations').delete()
    .eq('user_id', user.id).eq('workshop_id', workshopId).select('id')
    .abortSignal(requestSignal(signal));
  if (error) throw mutationFailure(error, status);
  if (!data) throw new Error('Cancellation could not be confirmed. Refresh registrations before retrying.');
  return data.length ? 'cancelled' : 'not_registered';
}
