import { supabase } from '../lib/supabase';
import type { Workshop } from '../types';

export interface DbWorkshop {
  id: string;
  slug: string;
  title: string;
  host_name: string;
  mode: string;
  starts_at: string | null;
  ends_at: string | null;
  timezone: string;
  status: 'open' | 'coming_soon' | 'cancelled';
  short_description: string;
  full_description: string;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export function mapDbWorkshopToWorkshop(row: DbWorkshop): Workshop {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    hostName: row.host_name,
    mode: 'Online — Google Meet',
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    timezone: row.timezone || 'Asia/Kolkata',
    status: row.status,
    shortDescription: row.short_description || '',
    fullDescription: row.full_description || '',
    tags: Array.isArray(row.tags) ? row.tags : [],
  };
}

/**
 * Formats start and end ISO timestamps into an Indian Standard Time (IST) display string.
 * Example: "Fri, 2 Oct · 7:30–8:30 pm IST"
 * When starts_at is null, returns "Date to be announced".
 */
export function formatWorkshopDateIST(startsAt: string | null, endsAt: string | null): string {
  if (!startsAt) {
    return 'Date to be announced';
  }

  const startDate = new Date(startsAt);
  if (isNaN(startDate.getTime())) {
    return 'Date to be announced';
  }

  // Format date part in IST: "Fri, 2 Oct"
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  };
  const dateStr = new Intl.DateTimeFormat('en-IN', dateOptions).format(startDate);

  // Format start time in IST: "7:30 pm"
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  };
  const startTimeRaw = new Intl.DateTimeFormat('en-IN', timeOptions).format(startDate);
  // Normalize "7:30 PM" / "7:30 pm"
  const startTimeClean = startTimeRaw.toLowerCase().replace(/\s+/g, ' ').trim();

  if (!endsAt) {
    return `${dateStr} · ${startTimeClean} IST`;
  }

  const endDate = new Date(endsAt);
  if (isNaN(endDate.getTime())) {
    return `${dateStr} · ${startTimeClean} IST`;
  }

  const endTimeRaw = new Intl.DateTimeFormat('en-IN', timeOptions).format(endDate);
  const endTimeClean = endTimeRaw.toLowerCase().replace(/\s+/g, ' ').trim();

  // If both are pm or both am, we can format as "7:30–8:30 pm IST"
  const startAmPmMatch = startTimeClean.match(/(am|pm)$/);
  const endAmPmMatch = endTimeClean.match(/(am|pm)$/);

  if (startAmPmMatch && endAmPmMatch && startAmPmMatch[1] === endAmPmMatch[1]) {
    const startTimeWithoutPeriod = startTimeClean.replace(/\s*(am|pm)$/, '').trim();
    return `${dateStr} · ${startTimeWithoutPeriod}–${endTimeClean} IST`;
  }

  return `${dateStr} · ${startTimeClean}–${endTimeClean} IST`;
}

/**
 * List all workshops ordered by status and starts_at
 */
export async function listWorkshops(): Promise<Workshop[]> {
  const { data, error } = await supabase
    .from('workshops')
    .select('*')
    .order('starts_at', { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as DbWorkshop[]).map(mapDbWorkshopToWorkshop);
}

/**
 * Get a single workshop by ID or slug
 */
export async function getWorkshop(idOrSlug: string): Promise<Workshop | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

  const query = supabase.from('workshops').select('*');
  const { data, error } = isUuid
    ? await query.eq('id', idOrSlug).maybeSingle()
    : await query.eq('slug', idOrSlug).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;
  return mapDbWorkshopToWorkshop(data as DbWorkshop);
}

/**
 * Fetch registrations for the current user
 */
export async function listUserRegistrations(): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('registrations')
    .select('workshop_id')
    .eq('user_id', user.id);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((r: { workshop_id: string }) => r.workshop_id);
}

/**
 * Register current user for a workshop
 */
export async function registerForWorkshop(workshopId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('registrations')
    .insert({
      user_id: user.id,
      workshop_id: workshopId,
    });

  if (error) {
    // Check for unique constraint violation (already registered)
    if (error.code === '23505' || error.message.includes('unique')) {
      return; // Already registered, treat gracefully
    }
    throw new Error(error.message);
  }
}

/**
 * Unregister current user from a workshop
 */
export async function unregister(workshopId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('registrations')
    .delete()
    .eq('user_id', user.id)
    .eq('workshop_id', workshopId);

  if (error) {
    throw new Error(error.message);
  }
}
