import { supabase } from '../lib/supabase';
import type { RegistrationWithWorkshop } from '../types';
import { mapDbWorkshopToWorkshop, type DbWorkshop } from './workshops';

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
export async function listUserRegistrationsWithWorkshops(): Promise<RegistrationWithWorkshop[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('registrations')
    .select(`
      id,
      user_id,
      workshop_id,
      created_at,
      workshops:workshops (
        id,
        slug,
        title,
        host_name,
        mode,
        starts_at,
        ends_at,
        timezone,
        status,
        short_description,
        full_description,
        tags,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return [];

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

  return results;
}
