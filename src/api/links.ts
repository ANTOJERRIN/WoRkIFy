import { supabase } from '../lib/supabase';

export type JoinState =
  | { status: 'ended' }
  | { status: 'active'; meetUrl: string }
  | { status: 'no_link' }
  | { status: 'upcoming'; startsAt: string };

/**
 * Fetches the Google Meet URL for a specific workshop.
 * RLS ensures only users registered for this workshop (or admins) can read the link.
 */
export async function getWorkshopMeetUrl(workshopId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('workshop_links')
    .select('meet_url')
    .eq('workshop_id', workshopId)
    .maybeSingle();

  if (error) {
    // If not permitted by RLS or not found, safely return null
    return null;
  }

  return data?.meet_url?.trim() || null;
}

/**
 * Calculates whether the meeting join link should be active:
 * - Active from 15 minutes before starts_at until ends_at.
 * - If now > ends_at: returns 'ended'.
 * - If now < 15 mins before starts_at: returns 'upcoming' with start time.
 * - If within window but no link: returns 'no_link'.
 * - If within window and link exists: returns 'active' with meetUrl.
 */
export function getJoinState(
  startsAt: string | null,
  endsAt: string | null,
  meetUrl: string | null
): JoinState {
  if (!startsAt) {
    return meetUrl ? { status: 'active', meetUrl } : { status: 'no_link' };
  }

  const now = Date.now();
  const startTime = new Date(startsAt).getTime();
  const endTime = endsAt ? new Date(endsAt).getTime() : startTime + 60 * 60 * 1000; // default 1h if null

  // After session ends
  if (now > endTime) {
    return { status: 'ended' };
  }

  const windowOpenTime = startTime - 15 * 60 * 1000; // 15 mins before starts_at

  // Within the join window (15 mins prior up to ends_at)
  if (now >= windowOpenTime && now <= endTime) {
    if (meetUrl) {
      return { status: 'active', meetUrl };
    }
    return { status: 'no_link' };
  }

  // Before the join window
  return { status: 'upcoming', startsAt };
}
