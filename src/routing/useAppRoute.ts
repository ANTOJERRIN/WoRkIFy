import { useCallback, useEffect, useState } from 'react';
import type { PageRoute } from '../types';
const paths: Partial<Record<PageRoute, string>> = { landing: '/', workshops: '/workshops', dashboard: '/dashboard', profile: '/profile', admin: '/admin', login: '/login' };
export function parseRoute(pathname: string): { page: PageRoute; workshopId: string | null } {
  const path = pathname.replace(/\/$/, '') || '/';
  for (const [page, url] of Object.entries(paths)) if (path === url) return { page: page as PageRoute, workshopId: null };
  const match = /^\/workshops\/([^/]+)$/.exec(path);
  if (match) {
    try { return { page: 'workshop-detail', workshopId: decodeURIComponent(match[1]) }; } catch { /* malformed URL */ }
  }
  return { page: 'not-found', workshopId: null };
}
export function useAppRoute() {
  const [route, setRoute] = useState(() => parseRoute(location.pathname));
  useEffect(() => {
    const onPop = () => setRoute(parseRoute(location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const navigate = useCallback((page: PageRoute, workshopId?: string, replace = false) => {
    const path = page === 'workshop-detail' && workshopId ? `/workshops/${encodeURIComponent(workshopId)}` : paths[page] ?? '/404';
    if (path !== location.pathname) window.history[replace ? 'replaceState' : 'pushState']({}, '', path);
    setRoute(parseRoute(path));
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);
  return { ...route, navigate };
}
