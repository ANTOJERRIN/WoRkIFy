import React from 'react';
import { WorkifyProvider, useWorkify } from './context/WorkifyContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './components/landing/LandingPage';
import { WorkshopsPage } from './components/workshops/WorkshopsPage';
import { WorkshopDetailPage } from './components/workshops/WorkshopDetailPage';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { ProfilePage } from './components/profile/ProfilePage';
import { AdminPage } from './components/admin/AdminPage';
import { HostWorkshopModal } from './components/workshops/HostWorkshopModal';
import { AuthModal } from './components/auth/AuthModal';
import { RouteGuard } from './routing/RouteGuard';
import { AccountFeedback } from './components/layout/AccountFeedback';
import { AppErrorBoundary } from './components/layout/AppErrorBoundary';

export const AppContent: React.FC = () => {
  const { currentPage, selectedWorkshopId, setCurrentPage, authUser, logoutError } = useWorkify();

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage />;
      case 'workshops':
        return <WorkshopsPage />;
      case 'workshop-detail':
        return <WorkshopDetailPage key={`${selectedWorkshopId}:${authUser?.id ?? 'public'}`} />;
      case 'dashboard':
        return <RouteGuard><DashboardPage key={authUser?.id} /></RouteGuard>;
      case 'profile':
        return <RouteGuard><ProfilePage key={authUser?.id} /></RouteGuard>;
      case 'admin':
        return <RouteGuard admin><AdminPage key={authUser?.id} /></RouteGuard>;
      default:
        return <section className="px-6 py-24 text-center">
          <h1 className="text-3xl font-bold mb-4">Page not found</h1>
          <p className="mb-6">This address does not match a Workify page.</p>
          <button onClick={() => setCurrentPage('workshops')} className="px-5 py-3 rounded-xl bg-[#2F6BFF] text-white text-sm font-semibold">Explore workshops</button>
        </section>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFC] dark:bg-[#070C1F] text-[#070C1F] dark:text-[#F3F4F7] transition-colors duration-200">
      <Navbar key={authUser?.id ?? 'public'} />
      <AccountFeedback />
      {logoutError && <p role="alert" className="px-6 py-3 text-center text-sm text-red-600 dark:text-red-400">{logoutError}</p>}
      <main tabIndex={-1} className="flex-1 w-full">
        {renderCurrentPage()}
      </main>
      <Footer />
      <HostWorkshopModal />
      <AuthModal />
    </div>
  );
};

export function App() {
  return (
    <AppErrorBoundary><WorkifyProvider>
      <AppContent />
    </WorkifyProvider></AppErrorBoundary>
  );
}

export default App;
