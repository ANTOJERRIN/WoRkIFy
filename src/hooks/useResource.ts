import { useCallback, useEffect, useRef, useState } from 'react';

/** One request owner, explicit refresh state, and latest-request-wins semantics. */
export function useResource<T>(load: (signal: AbortSignal) => Promise<T>, initial: T, enabled = true) {
  const [state, setState] = useState({ data: initial, pending: enabled, loaded: false, error: null as string | null });
  const request = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(false);

  const reload = useCallback(async () => {
    if (!mounted.current || !enabled) return false;
    const version = ++request.current;
    controller.current?.abort();
    const pending = new AbortController();
    controller.current = pending;
    setState(previous => ({ ...previous, pending: true, error: null }));
    let onAbort!: () => void;
    const aborted = new Promise<T>((_resolve, reject) => {
      onAbort = () => reject(pending.signal.reason);
      pending.signal.addEventListener('abort', onAbort, { once: true });
    });
    const timeout = window.setTimeout(() => pending.abort(new Error('The request timed out. Please try again.')), 15_000);
    try {
      const data = await Promise.race([load(pending.signal), aborted]);
      if (!mounted.current || version !== request.current) return false;
      setState({ data, pending: false, loaded: true, error: null });
      return true;
    } catch (error: unknown) {
      if (!mounted.current || version !== request.current) return false;
      setState(previous => ({ ...previous, pending: false,
        error: error instanceof Error ? error.message : 'The request failed. Please try again.' }));
      return false;
    } finally {
      window.clearTimeout(timeout);
      pending.signal.removeEventListener('abort', onAbort);
    }
  }, [enabled, load]);

  const replace = useCallback((data: T) => {
    if (!mounted.current) return;
    request.current++;
    controller.current?.abort();
    setState({ data, pending: false, loaded: true, error: null });
  }, []);

  useEffect(() => {
    mounted.current = true;
    void reload();
    return () => {
      mounted.current = false;
      request.current++;
      controller.current?.abort();
    };
  }, [reload]);

  return { data: state.data, error: state.error,
    loading: state.pending && !state.loaded, refreshing: state.pending && state.loaded,
    reload, replace };
}
