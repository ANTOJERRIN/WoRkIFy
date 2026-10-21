import type { PageRoute } from '../types';

export interface AppRoute {
  page: PageRoute;
  workshopId: string | null;
}

export function workshopPath(idOrSlug: string): string {
  return `/workshops/${encodeURIComponent(idOrSlug)}`;
}

export function pagePath(page: PageRoute): string {
  return page === 'landing' ? '/' : page === 'workshop-detail' ? '/workshops' : `/${page}`;
}

export function readRoute(location: Pick<Location, 'pathname' | 'search'>): AppRoute {
  const path = location.pathname.replace(/\/+$/, '') || '/';
  if (path === '/') {
    const legacy = new URLSearchParams(location.search).get('workshop');
    if (legacy) return { page: 'workshop-detail', workshopId: legacy };
    return { page: 'landing', workshopId: null };
  }
  if (['/workshops', '/dashboard', '/profile', '/admin'].includes(path)) {
    return { page: path.slice(1) as PageRoute, workshopId: null };
  }
  const match = /^\/workshops\/([^/]+)$/.exec(path);
  if (match) {
    try {
      const id = decodeURIComponent(match[1]!);
      if (id && !id.includes('/') && !id.includes('\\') && ![...id].some(char => char.charCodeAt(0) < 32)) return { page: 'workshop-detail', workshopId: id };
    } catch { /* Invalid URL encoding is a not-found route. */ }
  }
  return { page: 'not-found', workshopId: null };
}
