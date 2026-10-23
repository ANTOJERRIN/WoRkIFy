import { useCallback, useEffect, useState } from 'react';
import type { PageRoute } from '../types';

export function useModals(isLoggedIn: boolean, page: PageRoute, workshopId: string | null) {
  const [isHostModalOpen, setHostModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const closeModals = useCallback(() => { setHostModalOpen(false); setIsAuthModalOpen(false); }, []);
  useEffect(closeModals, [closeModals, page, workshopId]);
  const setIsHostModalOpen = useCallback((open: boolean) => {
    if (open && !isLoggedIn) setIsAuthModalOpen(true);
    else setHostModalOpen(open);
  }, [isLoggedIn]);
  return { isHostModalOpen, setIsHostModalOpen, isAuthModalOpen, setIsAuthModalOpen, closeModals };
}
