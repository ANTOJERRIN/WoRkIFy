// Test-only context driver; the production entry never imports this module.
import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { installSessionControl } from './session-control';
import { AccountFeedback } from '../../src/components/layout/AccountFeedback';
import { AppErrorBoundary } from '../../src/components/layout/AppErrorBoundary';
import { WorkifyProvider, useWorkify } from '../../src/context/WorkifyContext';
import { supabase } from '../../src/lib/supabase';
import { WorkshopsPage } from '../../src/components/workshops/WorkshopsPage';
import { WorkshopDetailPage } from '../../src/components/workshops/WorkshopDetailPage';
import { AuthModal } from '../../src/components/auth/AuthModal';
import { HostWorkshopModal } from '../../src/components/workshops/HostWorkshopModal';
import { DashboardPage } from '../../src/components/dashboard/DashboardPage';
import { ProfilePage } from '../../src/components/profile/ProfilePage';
import { AdminPage } from '../../src/components/admin/AdminPage';
import { AppContent } from '../../src/App';
import { RouteGuard } from '../../src/routing/RouteGuard';
import '../../src/index.css';

const mode = new URLSearchParams(location.search).get('session');
if (mode === 'controlled') installSessionControl();
if (mode === 'logout-reject') supabase.auth.signOut = () => Promise.reject(new Error('Isolated sign-out rejection'));
if (mode === 'reject') supabase.auth.getSession = () => Promise.reject(new Error('Test session failure'));
if (mode === 'pending') {
  supabase.auth.getSession = () => new Promise(() => {});
  supabase.auth.onAuthStateChange = () => ({ data: { subscription: { id: 'pending', callback: () => {}, unsubscribe: () => {} } } });
}

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
      <output aria-label="Session status">{state.sessionStatus}</output>
      <output aria-label="Permission status">{state.adminStatus}</output>
      <output aria-label="Profile name">{state.userProfile?.name ?? 'No profile loaded'}</output>
      <output aria-label="Registration IDs">{state.registeredWorkshopIds.join(',')}</output>
      <button onClick={() => state.reloadProfile()}>Reload profile</button>
      <button onClick={() => state.reloadRegistrations()}>Reload registrations</button>
      <button onClick={() => state.reloadWorkshops()}>Reload catalog</button>
      <button onClick={() => state.registerForWorkshop('11111111-1111-4111-8111-111111111111')}>Register fixture</button>
      <button onClick={state.toggleDarkMode}>Toggle theme</button>
      {state.logoutError && <p role="alert">{state.logoutError}</p>}
    </header>
    <AccountFeedback />
    <main tabIndex={-1}>
      {state.currentPage === 'workshop-detail' ? <WorkshopDetailPage />
        : state.currentPage === 'dashboard' ? <RouteGuard><DashboardPage /></RouteGuard>
        : state.currentPage === 'profile' ? <RouteGuard><ProfilePage /></RouteGuard>
        : state.currentPage === 'admin' ? <RouteGuard admin><AdminPage /></RouteGuard>
        : <WorkshopsPage />}
    </main>
    <AuthModal /><HostWorkshopModal />
  </>;
}

function BrokenRender(): never { throw new Error('Isolated render failure'); }
createRoot(document.getElementById('root')!).render(<StrictMode><AppErrorBoundary><WorkifyProvider>{new URLSearchParams(location.search).has('crash') ? <BrokenRender /> : new URLSearchParams(location.search).has('shell') ? <AppContent /> : <Driver />}</WorkifyProvider></AppErrorBoundary></StrictMode>);
