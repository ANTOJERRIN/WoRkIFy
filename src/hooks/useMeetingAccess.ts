import { useCallback, useEffect, useState } from 'react';
import { getWorkshopMeetingAccess, type MeetingAccess } from '../api/links';

const unavailable: MeetingAccess = { status: 'unavailable', refreshAfterMs: null };

/** Every recheck clears the URL; timers use elapsed time, never the wall clock. */
export function useMeetingAccess(workshopId: string, userId: string | undefined, enabled: boolean, scheduleKey: string) {
  const key = `${userId}:${workshopId}:${enabled}:${scheduleKey}`;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; access: MeetingAccess; loading: boolean; error: string | null }>({ key: '', access: unavailable, loading: false, error: null });
  const retry = useCallback(() => setAttempt(previous => previous + 1), []);
  useEffect(() => {
    if (!enabled || !userId) return;
    let active = true;
    let timer: number | undefined;
    let controller: AbortController | undefined;
    let version = 0;
    const run = async () => {
      const current = ++version;
      controller?.abort(); window.clearTimeout(timer);
      const pending = new AbortController(); controller = pending;
      const started = performance.now();
      setResult({ key, access: unavailable, loading: true, error: null });
      let abort!: () => void;
      const aborted = new Promise<never>((_resolve, reject) => {
        abort = () => reject(new Error('Meeting access timed out. Please retry.'));
        pending.signal.addEventListener('abort', abort, { once: true });
      });
      const timeout = window.setTimeout(() => pending.abort(), 15_000);
      try {
        const access = await Promise.race([getWorkshopMeetingAccess(workshopId, userId, pending.signal), aborted]);
        if (!active || current !== version) return;
        const remaining = access.refreshAfterMs === null ? null : access.refreshAfterMs - (performance.now() - started);
        setResult({ key, access: remaining !== null && remaining <= 0 ? unavailable : access, loading: false, error: null });
        if (remaining !== null) timer = window.setTimeout(() => { void run(); }, Math.max(100, remaining));
      } catch {
        if (active && current === version) setResult({ key, access: unavailable, loading: false, error: 'Meeting access could not be checked. Please retry.' });
      } finally {
        window.clearTimeout(timeout); pending.signal.removeEventListener('abort', abort);
      }
    };
    const recheck = () => { if (document.visibilityState === 'visible') void run(); };
    const visibility = () => {
      if (document.visibilityState === 'visible') void run();
      else {
        version++; controller?.abort(); window.clearTimeout(timer);
        setResult({ key, access: unavailable, loading: false, error: null });
      }
    };
    void run();
    window.addEventListener('focus', recheck); document.addEventListener('visibilitychange', visibility);
    return () => {
      active = false; version++; controller?.abort(); window.clearTimeout(timer);
      window.removeEventListener('focus', recheck); document.removeEventListener('visibilitychange', visibility);
    };
  }, [enabled, userId, workshopId, key, attempt]);
  const current = enabled && result.key === key;
  return { access: current ? result.access : unavailable, loading: enabled && (!current || result.loading),
    error: current ? result.error : null, retry };
}
