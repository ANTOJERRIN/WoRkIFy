// Deterministic auth events for isolated browser tests; never imported by src.
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../../src/lib/supabase';

declare global {
  interface Window {
    sessionTest: {
      resolve: (session: Session | null) => void;
      reject: () => void;
      emit: (session: Session | null) => void;
      listeners: () => number;
      initial: Session | null;
    };
  }
}

export function installSessionControl() {
  let current: Session | null = JSON.parse(localStorage.getItem('sb-workify-browser-test-auth-token') ?? 'null');
  const callbacks = new Set<(event: AuthChangeEvent, session: Session | null) => void | Promise<void>>();
  let resolve!: (value: Awaited<ReturnType<typeof supabase.auth.getSession>>) => void;
  let reject!: (error: Error) => void;
  const restoration = new Promise<Awaited<ReturnType<typeof supabase.auth.getSession>>>((res, rej) => { resolve = res; reject = rej; });
  supabase.auth.getSession = () => restoration;
  supabase.auth.getUser = (() => Promise.resolve({ data: { user: current?.user ?? null }, error: null })) as typeof supabase.auth.getUser;
  supabase.auth.onAuthStateChange = callback => {
    callbacks.add(callback);
    return { data: { subscription: { id: 'controlled', callback, unsubscribe: () => { callbacks.delete(callback); } } } };
  };
  window.sessionTest = {
    initial: current,
    resolve: session => { current = session; resolve(session ? { data: { session }, error: null } : { data: { session: null }, error: null }); },
    reject: () => reject(new Error('Isolated restoration failure')),
    emit: session => {
      current = session;
      callbacks.forEach(callback => callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session));
    },
    listeners: () => callbacks.size,
  };
}
