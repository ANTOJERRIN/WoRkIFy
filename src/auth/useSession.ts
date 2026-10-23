import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { checkIsAdmin } from '../api/admin';

export type SessionStatus = 'loading' | 'authenticated' | 'signed-out' | 'failed';
export type PermissionStatus = 'pending' | 'allowed' | 'denied' | 'failed';
export interface SessionAccess {
  sessionStatus: SessionStatus;
  sessionError: string | null;
  authUser: User | null;
  authLoading: boolean;
  isLoggedIn: boolean;
  adminStatus: PermissionStatus;
  adminLoading: boolean;
  isAdmin: boolean;
  logoutPending: boolean;
  logoutError: string | null;
  logout: () => Promise<boolean>;
}

const resolutionTimeout = 12_000;

/** Owns identity and permission only; feature data remains in its data layer. */
export function useSession(onIdentityChange: (userId: string | null) => void): SessionAccess {
  const [state, setState] = useState<{ status: SessionStatus; user: User | null }>({ status: 'loading', user: null });
  const [role, setRole] = useState<{ userId: string; status: PermissionStatus } | null>(null);
  const [logoutPending, setLogoutPending] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const identity = useRef<string | null>(null);
  const mounted = useRef(false);
  const signingOut = useRef(false);

  const accept = useCallback((session: Session | null, failed = false) => {
    const user = session?.user ?? null;
    if (identity.current !== (user?.id ?? null)) {
      identity.current = user?.id ?? null;
      onIdentityChange(user?.id ?? null);
      setRole(null);
      setLogoutError(null);
    }
    setState({ status: failed ? 'failed' : user ? 'authenticated' : 'signed-out', user });
  }, [onIdentityChange]);

  useEffect(() => {
    mounted.current = true;
    let active = true;
    let eventReceived = false;
    const timer = window.setTimeout(() => {
      if (active && !eventReceived) accept(null, true);
    }, resolutionTimeout);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      eventReceived = true;
      window.clearTimeout(timer);
      accept(session);
    });
    // Auth events are authoritative if restoration finishes after a newer event.
    supabase.auth.getSession().then(({ data, error }) => {
      if (active && !eventReceived) accept(error ? null : data.session, !!error);
    }).catch(() => {
      if (active && !eventReceived) accept(null, true);
    }).finally(() => window.clearTimeout(timer));
    return () => {
      active = false;
      mounted.current = false;
      window.clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [accept]);

  const userId = state.user?.id;
  useEffect(() => {
    if (!userId) return;
    let active = true;
    const finish = (status: PermissionStatus) => {
      if (!active) return;
      active = false;
      window.clearTimeout(timer);
      setRole({ userId, status });
    };
    const timer = window.setTimeout(() => finish('failed'), resolutionTimeout);
    checkIsAdmin().then(allowed => finish(allowed ? 'allowed' : 'denied')).catch(() => finish('failed'));
    return () => { active = false; window.clearTimeout(timer); };
  }, [userId]);

  const logout = useCallback(async () => {
    if (signingOut.current) return false;
    signingOut.current = true;
    setLogoutPending(true);
    setLogoutError(null);
    const startingIdentity = identity.current;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      if (!mounted.current || (identity.current !== null && identity.current !== startingIdentity)) return false;
      accept(null);
      return true;
    } catch {
      if (mounted.current && (identity.current === startingIdentity || identity.current === null)) {
        setLogoutError(identity.current === null && startingIdentity !== null
          ? 'You are signed out here, but sign-out on other devices could not be confirmed.'
          : 'Sign-out failed. Your session may still be active. Please try again.');
      }
      return false;
    } finally {
      signingOut.current = false;
      if (mounted.current) setLogoutPending(false);
    }
  }, [accept]);

  const adminStatus = !userId ? 'denied' : role?.userId === userId ? role.status : 'pending';
  return {
    sessionStatus: state.status,
    sessionError: state.status === 'failed' ? 'Your session could not be restored. Public workshops are still available.' : null,
    authUser: state.user,
    authLoading: state.status === 'loading',
    isLoggedIn: state.status === 'authenticated',
    adminStatus,
    adminLoading: adminStatus === 'pending',
    isAdmin: adminStatus === 'allowed',
    logoutPending, logoutError, logout,
  };
}
