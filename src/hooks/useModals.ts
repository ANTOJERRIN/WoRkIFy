import { useCallback, useEffect, useState } from 'react';
import type { PageRoute } from '../types';

export function useModals(page: PageRoute, workshopId: string | null) {
  const [isHostModalOpen, setHostModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const closeModals = useCallback(() => { setHostModalOpen(false); setIsAuthModalOpen(false); }, []);
  useEffect(closeModals, [closeModals, page, workshopId]);
  const setIsHostModalOpen = useCallback((open: boolean) => {
    setHostModalOpen(open);
  }, []);
  return { isHostModalOpen, setIsHostModalOpen, isAuthModalOpen, setIsAuthModalOpen, closeModals };
}
