// Test-only context driver; the production entry never imports this module.
import { createRoot } from 'react-dom/client';
import { WorkifyProvider, useWorkify } from '../../frontend/src/context/WorkifyContext';
import { supabase } from '../../frontend/src/lib/supabase';
import { WorkshopsPage } from '../../frontend/src/components/workshops/WorkshopsPage';
import { WorkshopDetailPage } from '../../frontend/src/components/workshops/WorkshopDetailPage';
import { AuthModal } from '../../frontend/src/components/auth/AuthModal';
import { HostWorkshopModal } from '../../frontend/src/components/workshops/HostWorkshopModal';
import '../../frontend/src/index.css';

const mode = new URLSearchParams(location.search).get('session');
if (mode === 'reject') supabase.auth.getSession = () => Promise.reject(new Error('Test session failure'));
if (mode === 'pending') supabase.auth.getSession = () => new Promise(() => {});

export function Driver() {
  const state = useWorkify();
  return <>
    <header>
      <button onClick={() => state.setCurrentPage('workshops')}>Public navigation</button>
      <button onClick={() => state.setCurrentPage('dashboard')}>Private dashboard</button>
      <button onClick={() => state.setCurrentPage('profile')}>Private profile</button>
      <button onClick={() => state.setCurrentPage('admin')}>Private admin</button>
      <button onClick={() => state.unregisterFromWorkshop('11111111-1111-4111-8111-111111111111')}>Cancel registration</button>
      <button onClick={() => state.openWorkshopDetail('missing-workshop')}>Missing detail</button>
      <button onClick={() => state.logout()}>Logout</button>
      <button onClick={() => state.setIsAuthModalOpen(true)}>Open auth</button>
      <button onClick={() => state.setIsHostModalOpen(true)}>Open host</button>
      <output aria-label="Current page">{state.currentPage}</output>
    </header>
    <main tabIndex={-1}>
      {state.currentPage === 'workshop-detail' ? <WorkshopDetailPage /> : <WorkshopsPage />}
    </main>
    <AuthModal /><HostWorkshopModal />
  </>;
}

createRoot(document.getElementById('root')!).render(<WorkifyProvider><Driver /></WorkifyProvider>);
