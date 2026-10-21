// Test-only context driver; the production entry never imports this module.
import { createRoot } from 'react-dom/client';
import { WorkifyProvider, useWorkify } from '../../src/context/WorkifyContext';
import { supabase } from '../../src/lib/supabase';
import { WorkshopsPage } from '../../src/components/workshops/WorkshopsPage';
import { WorkshopDetailPage } from '../../src/components/workshops/WorkshopDetailPage';
import { AuthModal } from '../../src/components/auth/AuthModal';
import { HostWorkshopModal } from '../../src/components/workshops/HostWorkshopModal';
import { DashboardPage } from '../../src/components/dashboard/DashboardPage';
import { ProfilePage } from '../../src/components/profile/ProfilePage';
import { AdminPage } from '../../src/components/admin/AdminPage';
import '../../src/index.css';

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
      <button onClick={() => state.openWorkshopDetail('be33c1fc-e4c4-4def-b33e-078fdf662400')}>Historical detail</button>
      <button onClick={() => state.logout()}>Logout</button>
      <button onClick={() => state.setIsAuthModalOpen(true)}>Open auth</button>
      <button onClick={() => state.setIsHostModalOpen(true)}>Open host</button>
      <output aria-label="Current page">{state.currentPage}</output>
      <output aria-label="Admin status">{String(state.isAdmin)}</output>
    </header>
    <main tabIndex={-1}>
      {state.currentPage === 'workshop-detail' ? <WorkshopDetailPage />
        : state.currentPage === 'dashboard' ? <DashboardPage />
        : state.currentPage === 'profile' ? <ProfilePage />
        : state.currentPage === 'admin' ? <AdminPage />
        : <WorkshopsPage />}
    </main>
    <AuthModal /><HostWorkshopModal />
  </>;
}

createRoot(document.getElementById('root')!).render(<WorkifyProvider><Driver /></WorkifyProvider>);
