import { useCallback, useEffect, useState } from 'react';
import { readRoute, workshopPath } from './routes';

export function useUrlRoute() {
  const [route, setRoute] = useState(() => readRoute(window.location));

  useEffect(() => {
    const initial = readRoute(window.location);
    // Keep historical links working, replacing rather than adding a history entry.
    if (window.location.pathname === '/' && initial.workshopId && new URLSearchParams(window.location.search).has('workshop')) {
      window.history.replaceState(null, '', workshopPath(initial.workshopId));
    }
    const onPopState = () => setRoute(readRoute(window.location));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((path: string) => {
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== path) {
      window.history.pushState(null, '', path);
    }
    setRoute(readRoute(window.location));
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return { currentPage: route.page, selectedWorkshopId: route.workshopId, navigate };
}
