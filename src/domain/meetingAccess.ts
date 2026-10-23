export type MeetingAccess =
  | { status: 'joinable'; meetUrl: string; refreshAfterMs: number }
  | { status: 'upcoming'; refreshAfterMs: number }
  | { status: 'ended' | 'unauthorized'; refreshAfterMs: null }
  | { status: 'unavailable'; refreshAfterMs: number | null };

/** Same canonical allowlist as the database; no query, fragment or redirect. */
export function isAllowedMeetingUrl(value: unknown): value is string {
  return typeof value === 'string' && /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(value);
}

export function decodeMeetingAccess(value: unknown): MeetingAccess {
  const invalid = (): never => { throw new Error('Meeting access returned an invalid response. Please retry.'); };
  if (!value || typeof value !== 'object') return invalid();
  const row = value as Record<string, unknown>;
  const duration = row.refresh_after_ms;
  const refresh = typeof duration === 'number' && Number.isInteger(duration) && duration > 0 && duration <= 30_000 ? duration : null;
  switch (row.status) {
    case 'joinable': return isAllowedMeetingUrl(row.meet_url) && refresh !== null
      ? { status: 'joinable', meetUrl: row.meet_url, refreshAfterMs: refresh } : invalid();
    case 'upcoming': return refresh !== null ? { status: 'upcoming', refreshAfterMs: refresh } : invalid();
    case 'ended': case 'unauthorized': return { status: row.status, refreshAfterMs: null };
    case 'unavailable': return { status: 'unavailable', refreshAfterMs: refresh };
    default: return invalid();
  }
}
