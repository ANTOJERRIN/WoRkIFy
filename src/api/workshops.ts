import { publicSupabase } from '../lib/supabase';
import { requestSignal } from './request';
import type { Workshop, WorkshopStatus } from '../types';

export interface DbWorkshop {
  id: string;
  slug: string;
  title: string;
  host_name: string;
  mode: string;
  starts_at: string | null;
  ends_at: string | null;
  timezone: string | null;
  status: WorkshopStatus;
  short_description: string;
  full_description: string;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

// Explicit public contract: no meeting URL, attendee data or account information.
export const PUBLIC_WORKSHOP_FIELDS = 'id,slug,title,host_name,mode,starts_at,ends_at,timezone,status,short_description,full_description,tags' as const;
type PublicWorkshopRow = Omit<DbWorkshop, 'created_at' | 'updated_at'>;

export function mapDbWorkshopToWorkshop(row: PublicWorkshopRow): Workshop {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    hostName: row.host_name,
    mode: 'Online — Google Meet',
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    timezone: row.timezone ?? '',
    status: row.status,
    shortDescription: row.short_description || '',
    fullDescription: row.full_description || '',
    tags: Array.isArray(row.tags) ? row.tags : [],
  };
}

/**
 * List all workshops ordered by status and starts_at
 */
export async function listWorkshops(signal?: AbortSignal): Promise<Workshop[]> {
  const { data, error } = await publicSupabase
    .from('workshops')
    .select(PUBLIC_WORKSHOP_FIELDS)
    .neq('status', 'archived')
    .abortSignal(requestSignal(signal))
    .order('starts_at', { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) throw new Error('The workshop service returned no response. Please try again.');
  return data.map(mapDbWorkshopToWorkshop);
}

/**
 * Get safe metadata by ID or slug, including an archived record for history.
 */
export async function getWorkshop(idOrSlug: string): Promise<Workshop | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

  const query = publicSupabase.from('workshops').select(PUBLIC_WORKSHOP_FIELDS)
    .abortSignal(AbortSignal.timeout(15000));
  const { data, error } = isUuid
    ? await query.eq('id', idOrSlug).maybeSingle()
    : await query.eq('slug', idOrSlug).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;
  return mapDbWorkshopToWorkshop(data);
}
