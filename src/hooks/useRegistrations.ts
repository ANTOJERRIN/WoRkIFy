import { useCallback, useEffect, useRef, useState } from 'react';
import { listUserRegistrations, registerForWorkshop, unregister, type RegistrationSnapshot } from '../api/registrations';
import { useResource } from './useResource';

const emptyRegistrations: RegistrationSnapshot = { workshopIds: [], registrations: [] };

export function useRegistrations(userId: string | undefined, reloadWorkshops: () => Promise<boolean>) {
  const load = useCallback((signal: AbortSignal) => listUserRegistrations(userId, signal), [userId]);
  const resource = useResource(load, emptyRegistrations, !!userId);
  const { reload } = resource;
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutationNotice, setMutationNotice] = useState<string | null>(null);
  const mounted = useRef(false);
  const mutationPending = useRef(false);
  const mutationController = useRef<AbortController | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; mutationController.current?.abort(); };
  }, []);

  const mutate = useCallback(async (id: string, cancel: boolean) => {
    if (!userId || !mounted.current || mutationPending.current) return false;
    mutationPending.current = true;
    setPendingId(id);
    setMutationError(null);
    setMutationNotice(null);
    const controller = new AbortController();
    mutationController.current = controller;
    const timeout = window.setTimeout(() => controller.abort(new Error('The update could not be confirmed. Refresh registrations before retrying.')), 15_000);
    let onAbort!: () => void;
    const aborted = new Promise<never>((_resolve, reject) => {
      onAbort = () => reject(controller.signal.reason);
      controller.signal.addEventListener('abort', onAbort, { once: true });
    });
    try {
      await Promise.race([cancel ? unregister(id, userId, controller.signal)
        : registerForWorkshop(id, userId, controller.signal), aborted]);
      window.clearTimeout(timeout);
      if (!mounted.current) return false;
      // Invalidate pre-mutation reads; every consumer uses the same confirmed snapshot.
      const [registrationsFresh, workshopsFresh] = await Promise.all([reload(), reloadWorkshops()]);
      if (mounted.current && (!registrationsFresh || !workshopsFresh)) setMutationNotice('Your update was saved, but the latest data could not be loaded. Refresh registrations and the workshop before making another change.');
      return true;
    } catch (error: unknown) {
      window.clearTimeout(timeout);
      if (mounted.current) {
        setMutationError(error instanceof Error ? error.message : 'Registration could not be updated. Please try again.');
        // A timeout may have committed; a lifecycle denial may mean the public
        // schedule changed. Reconcile both without optimistic state changes.
        await Promise.all([reload(), reloadWorkshops()]);
      }
      return false;
    } finally {
      window.clearTimeout(timeout);
      controller.signal.removeEventListener('abort', onAbort);
      mutationPending.current = false;
      if (mounted.current) setPendingId(null);
    }
  }, [userId, reload, reloadWorkshops]);

  const register = useCallback((id: string) => mutate(id, false), [mutate]);
  const cancel = useCallback((id: string) => mutate(id, true), [mutate]);
  return { registrations: resource.data.registrations, registeredWorkshopIds: resource.data.workshopIds,
    unavailableRegistrationCount: resource.data.workshopIds.length - resource.data.registrations.length,
    registrationsLoading: resource.loading, registrationsRefreshing: resource.refreshing,
    registrationsError: resource.error, registrationMutationError: mutationError,
    registrationMutationNotice: mutationNotice,
    registeringWorkshopId: pendingId, reloadRegistrations: resource.reload,
    registerForWorkshop: register, unregisterFromWorkshop: cancel };
}
