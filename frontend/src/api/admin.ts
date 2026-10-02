import { supabase } from '../lib/supabase';
import type { Workshop, WorkshopStatus, AdminRegistrationItem, AdminReviewItem } from '../types';
import { mapDbWorkshopToWorkshop, type DbWorkshop } from './workshops';

/**
 * Checks if the current authenticated user has admin privileges.
 * Directly queries admin_users using RLS policy "Admins can read admin_users".
 */
export async function checkIsAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return true;
}

export interface WorkshopInput {
  slug: string;
  title: string;
  hostName: string;
  status: WorkshopStatus;
  shortDescription: string;
  fullDescription: string;
  tags: string[];
  startsAt: string | null;
  endsAt: string | null;
  timezone?: string;
}

/**
 * Create a new workshop (Admin only - enforced by RLS)
 */
export async function createWorkshop(input: WorkshopInput): Promise<Workshop> {
  const payload = {
    slug: input.slug.trim().toLowerCase(),
    title: input.title.trim(),
    host_name: input.hostName.trim(),
    mode: 'Online — Google Meet',
    status: input.status,
    short_description: input.shortDescription.trim(),
    full_description: input.fullDescription.trim(),
    tags: input.tags,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    timezone: input.timezone || 'Asia/Kolkata',
  };

  const { data, error } = await supabase
    .from('workshops')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapDbWorkshopToWorkshop(data as DbWorkshop);
}

/**
 * Update an existing workshop (Admin only - enforced by RLS)
 */
export async function updateWorkshop(id: string, input: Partial<WorkshopInput>): Promise<Workshop> {
  const payload: Record<string, unknown> = {};
  if (input.slug !== undefined) payload.slug = input.slug.trim().toLowerCase();
  if (input.title !== undefined) payload.title = input.title.trim();
  if (input.hostName !== undefined) payload.host_name = input.hostName.trim();
  if (input.status !== undefined) payload.status = input.status;
  if (input.shortDescription !== undefined) payload.short_description = input.shortDescription.trim();
  if (input.fullDescription !== undefined) payload.full_description = input.fullDescription.trim();
  if (input.tags !== undefined) payload.tags = input.tags;
  if (input.startsAt !== undefined) payload.starts_at = input.startsAt;
  if (input.endsAt !== undefined) payload.ends_at = input.endsAt;
  if (input.timezone !== undefined) payload.timezone = input.timezone;

  const { data, error } = await supabase
    .from('workshops')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapDbWorkshopToWorkshop(data as DbWorkshop);
}

/**
 * Cancel a workshop by updating status to 'cancelled' (Admin only)
 */
export async function cancelWorkshop(id: string): Promise<void> {
  const { error } = await supabase
    .from('workshops')
    .update({ status: 'cancelled' })
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Fetch workshop meet link for admin view
 */
export async function getAdminMeetUrl(workshopId: string): Promise<string> {
  const { data, error } = await supabase
    .from('workshop_links')
    .select('meet_url')
    .eq('workshop_id', workshopId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.meet_url || '';
}

/**
 * Set or replace a workshop's Google Meet URL (Admin only - writes to workshop_links)
 */
export async function setWorkshopMeetUrl(workshopId: string, meetUrl: string): Promise<void> {
  const { error } = await supabase
    .from('workshop_links')
    .upsert({
      workshop_id: workshopId,
      meet_url: meetUrl.trim(),
    });

  if (error) {
    throw new Error(error.message);
  }
}

interface RawRegistrationWithProfile {
  id: string;
  user_id: string;
  workshop_id: string;
  created_at: string;
  profiles?: {
    name: string;
    email: string;
    handle: string | null;
    linkedin_url: string | null;
  } | null;
}

/**
 * View registrations for a given workshop (Admin only)
 */
export async function listWorkshopRegistrations(workshopId: string): Promise<AdminRegistrationItem[]> {
  const { data, error } = await supabase
    .from('registrations')
    .select(`
      id,
      user_id,
      workshop_id,
      created_at
    `)
    .eq('workshop_id', workshopId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) return [];

  // Fetch associated profiles for these users
  const userIds = data.map((r: { user_id: string }) => r.user_id);
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, name, email, handle, linkedin_url')
    .in('id', userIds);

  const profileMap = new Map<string, { name: string; email: string; handle: string; linkedinUrl: string }>();
  if (profilesData) {
    for (const p of profilesData) {
      profileMap.set(p.id, {
        name: p.name || 'Anonymous User',
        email: p.email || '',
        handle: p.handle || '',
        linkedinUrl: p.linkedin_url || '',
      });
    }
  }

  return (data as RawRegistrationWithProfile[]).map(r => ({
    id: r.id,
    userId: r.user_id,
    workshopId: r.workshop_id,
    createdAt: r.created_at,
    profile: profileMap.get(r.user_id) || null,
  }));
}

/**
 * View LinkedIn reviews for a workshop (Admin only)
 */
export async function listWorkshopReviews(workshopId: string): Promise<AdminReviewItem[]> {
  const { data, error } = await supabase
    .from('linkedin_reviews')
    .select(`
      id,
      user_id,
      workshop_id,
      linkedin_url,
      overall_score,
      band,
      strengths,
      improvements,
      created_at
    `)
    .eq('workshop_id', workshopId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return [];

  return data.map((r: any) => ({
    id: r.id,
    userId: r.user_id,
    workshopId: r.workshop_id,
    linkedinUrl: r.linkedin_url,
    overallScore: r.overall_score,
    band: r.band,
    strengths: r.strengths,
    improvements: r.improvements,
    createdAt: r.created_at,
  }));
}

/**
 * Reset a LinkedIn review (Deletes review row so user can re-submit)
 */
export async function resetLinkedInReview(reviewId: string): Promise<void> {
  const { error } = await supabase
    .from('linkedin_reviews')
    .delete()
    .eq('id', reviewId);

  if (error) {
    throw new Error(error.message);
  }
}
