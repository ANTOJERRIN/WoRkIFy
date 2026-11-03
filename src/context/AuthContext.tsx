import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type SessionStatus = 'loading' | 'authenticated' | 'signed-out' | 'failed';
type PermissionStatus = 'loading' | 'admin' | 'attendee' | 'failed';
interface AuthState {
  user: User | null;
  status: SessionStatus;
  permission: PermissionStatus;
  recovery: boolean;
  finishRecovery: () => void;
  error: string | null;
  clearError: () => void;
  retry: () => void;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [permission, setPermission] = useState<PermissionStatus>('attendee');
  const [recovery, setRecovery] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const generation = useRef(0);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    let identityTimeout: ReturnType<typeof setTimeout>;
    const resolveIdentity = async (expectedUserId?: string | null) => {
      const request = ++generation.current;
      clearTimeout(identityTimeout);
      if (expectedUserId === null) {
        setUser(null); setPermission('attendee'); setStatus('signed-out'); setRecovery(false);
        return;
      }
      setPermission('loading');
      try {
        const result = await Promise.race([
          supabase.auth.getUser(),
          new Promise<never>((_, reject) => {
            identityTimeout = setTimeout(() => reject(new Error('Session timeout')), 20000);
          }),
        ]);
        if (!active || request !== generation.current) return;
        clearTimeout(identityTimeout);
        if (result.error && result.error.name !== 'AuthSessionMissingError') throw result.error;
        const verified = result.data.user;
        if (expectedUserId && verified?.id !== expectedUserId) throw new Error('Identity changed');
        setUser(verified); setStatus(verified ? 'authenticated' : 'signed-out'); setError(null);
        if (!verified) { setPermission('attendee'); return; }
        const { data: admin, error: roleError } = await supabase.from('admin_users')
          .select('user_id').eq('user_id', verified.id).abortSignal(AbortSignal.timeout(15000)).maybeSingle();
        if (!active || request !== generation.current) return;
        setPermission(roleError ? 'failed' : admin ? 'admin' : 'attendee');
      } catch {
        if (!active || request !== generation.current) return;
        clearTimeout(identityTimeout);
        setUser(null); setStatus('failed'); setPermission('attendee');
        setError('Your session could not be verified. You can still browse workshops.');
      }
    };
    const schedule = (id?: string | null) => {
      clearTimeout(timer);
      timer = setTimeout(() => { void resolveIdentity(id); }, 0);
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Revoke privileges immediately; do API work outside this callback to avoid auth-lock deadlocks.
      generation.current++;
      setPermission(session ? 'loading' : 'attendee');
      setUser(previous => previous?.id === session?.user.id ? previous : null);
      setStatus(session ? 'loading' : 'signed-out');
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      if (event === 'SIGNED_OUT') { setRecovery(false); setError(null); }
      schedule(session?.user.id ?? null);
    });
    schedule();
    return () => { active = false; generation.current++; clearTimeout(timer); clearTimeout(identityTimeout); subscription.unsubscribe(); };
  }, [attempt]);

  const logout = useCallback(async () => {
    setError(null);
    try {
      const { error: logoutError } = await supabase.auth.signOut();
      if (logoutError) throw logoutError;
      generation.current++;
      setUser(null); setStatus('signed-out'); setPermission('attendee'); setRecovery(false);
    } catch {
      // Current Supabase clients clear local credentials even if global revocation fails.
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        generation.current++; setUser(null); setStatus('signed-out'); setPermission('attendee'); setRecovery(false);
        setError('Signed out on this device. Sign-out on other devices could not be confirmed.');
      } else setError('Sign out failed. Your session is still active. Please try again.');
    }
  }, []);
  const retry = useCallback(() => { setPermission('loading'); setStatus('loading'); setError(null); setAttempt(n => n + 1); }, []);
  const finishRecovery = useCallback(() => setRecovery(false), []);
  const clearError = useCallback(() => setError(null), []);
  return <AuthContext.Provider value={{ user, status, permission, recovery, finishRecovery, error, clearError, retry, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const state = useContext(AuthContext);
  if (!state) throw new Error('useAuth must be used inside AuthProvider');
  return state;
}
