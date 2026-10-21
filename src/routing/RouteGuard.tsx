import type { ReactNode } from 'react';
import { useWorkify } from '../context/WorkifyContext';

export function RouteGuard({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { authLoading, adminLoading, isLoggedIn, isAdmin, setCurrentPage } = useWorkify();
  if (authLoading || (isLoggedIn && admin && adminLoading)) {
    return <div role="status" className="py-24 text-center">Checking access...</div>;
  }
  if (!isLoggedIn || (admin && !isAdmin)) {
    return <section className="max-w-xl mx-auto px-6 py-24 text-center">
      <h1 className="text-2xl font-bold mb-4">{!isLoggedIn ? 'Sign-in temporarily unavailable' : 'Admin access required'}</h1>
      <p className="text-sm mb-6">{!isLoggedIn
        ? 'This page requires an existing signed-in session. Sign-in is temporarily unavailable while we update authentication. You can still browse public workshops.'
        : 'Your account does not have permission to view this page.'}</p>
      <button onClick={() => setCurrentPage('workshops')} className="px-5 py-3 rounded-xl bg-[#2F6BFF] text-white text-sm font-semibold">Explore workshops</button>
    </section>;
  }
  return children;
}
