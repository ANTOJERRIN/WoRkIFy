import React, { createContext, useCallback, useContext, useState } from 'react';
import type { PageRoute } from '../types';
import { useSession, type SessionAccess } from '../auth/useSession';
import { useUrlRoute } from '../routing/useUrlRoute';
import { pagePath, workshopPath } from '../routing/routes';
import { useCatalog } from '../hooks/useCatalog';
import { useProfile } from '../hooks/useProfile';
import { useRegistrations } from '../hooks/useRegistrations';
import { useTheme } from '../hooks/useTheme';
import { useModals } from '../hooks/useModals';

type WorkifyContextType = Omit<SessionAccess, 'logout'> &
  ReturnType<typeof useCatalog> & ReturnType<typeof useProfile> &
  ReturnType<typeof useRegistrations> & ReturnType<typeof useTheme> &
  ReturnType<typeof useModals> & {
    logout: () => Promise<void>;
    currentPage: PageRoute;
    setCurrentPage: (page: PageRoute) => void;
    selectedWorkshopId: string | null;
    openWorkshopDetail: (workshopId: string) => void;
  };

const WorkifyContext = createContext<WorkifyContextType | undefined>(undefined);

type ScopedProps = React.PropsWithChildren<{
  session: SessionAccess;
  catalog: ReturnType<typeof useCatalog>;
  theme: ReturnType<typeof useTheme>;
  route: ReturnType<typeof useUrlRoute>;
}>;

// A new identity gets a fresh private store and feature tree. Late callbacks can
// only address the previous, unmounted store. Catalog, theme and URL stay outside.
function ScopedWorkifyProvider({ children, session, catalog, theme, route }: ScopedProps) {
  const profile = useProfile(session.authUser?.id);
  const registrations = useRegistrations(session.authUser?.id, catalog.reloadWorkshops);
  const modals = useModals(session.isLoggedIn, route.currentPage, route.selectedWorkshopId);
  const { closeModals, setIsAuthModalOpen } = modals;
  const { navigate } = route;
  const { logout: endSession, isLoggedIn } = session;

  const logout = useCallback(async () => {
    closeModals();
    if (await endSession()) navigate('/');
  }, [closeModals, endSession, navigate]);
  const setCurrentPage = useCallback((page: PageRoute) => {
    closeModals();
    navigate(pagePath(page));
  }, [closeModals, navigate]);
  const openWorkshopDetail = useCallback((id: string) => {
    closeModals();
    navigate(workshopPath(id));
  }, [closeModals, navigate]);
  const register = registrations.registerForWorkshop;
  const registerForWorkshop = useCallback(async (id: string) => {
    if (!isLoggedIn) { setIsAuthModalOpen(true); return false; }
    return register(id);
  }, [isLoggedIn, register, setIsAuthModalOpen]);

  return <WorkifyContext.Provider value={{
    ...session, ...catalog, ...theme, ...profile, ...registrations, ...modals,
    logout, registerForWorkshop, currentPage: route.currentPage,
    selectedWorkshopId: route.selectedWorkshopId, setCurrentPage, openWorkshopDetail,
  }}>{children}</WorkifyContext.Provider>;
}

export function WorkifyProvider({ children }: React.PropsWithChildren) {
  const [identityVersion, setIdentityVersion] = useState(0);
  const identityChanged = useCallback(() => setIdentityVersion(previous => previous + 1), []);
  const session = useSession(identityChanged);
  const catalog = useCatalog();
  const theme = useTheme();
  const route = useUrlRoute();
  return <ScopedWorkifyProvider key={identityVersion} session={session} catalog={catalog} theme={theme} route={route}>
    {children}
  </ScopedWorkifyProvider>;
}

export function useWorkify() {
  const context = useContext(WorkifyContext);
  if (!context) throw new Error('useWorkify must be used within a WorkifyProvider');
  return context;
}
