import { supabase } from '../lib/supabase';
import { requireUser, requestSignal } from './request';
import { decodeMeetingAccess, type MeetingAccess } from '../domain/meetingAccess';

export type { MeetingAccess } from '../domain/meetingAccess';

/** Server-owned status and URL. No user ID or browser clock is submitted. */
export async function getWorkshopMeetingAccess(workshopId: string, expectedUserId: string, signal?: AbortSignal): Promise<MeetingAccess> {
  try { await requireUser(expectedUserId); }
  catch (error: unknown) {
    if (error instanceof Error && (/fetch|network|timeout/i.test(error.name + error.message)
      || ('status' in error && typeof error.status === 'number' && error.status >= 500))) {
      throw new Error('Meeting access could not be checked. Please retry.');
    }
    return { status: 'unauthorized', refreshAfterMs: null };
  }
  signal?.throwIfAborted();
  const { data, error, status } = await supabase.rpc('get_workshop_join_state', { p_workshop_id: workshopId })
    .abortSignal(requestSignal(signal));
  if (status === 401 || error?.code === 'PGRST301') return { status: 'unauthorized', refreshAfterMs: null };
  if (error) throw new Error('Meeting access could not be checked. Please retry.');
  return decodeMeetingAccess(data);
}
