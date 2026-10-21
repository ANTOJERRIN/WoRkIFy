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

const AppContent: React.FC = () => {
  const { currentPage, isLoggedIn, isAdmin } = useWorkify();

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage />;
      case 'workshops':
        return <WorkshopsPage />;
      case 'workshop-detail':
        return <WorkshopDetailPage />;
      case 'dashboard':
        return isLoggedIn ? <DashboardPage /> : <LandingPage />;
      case 'profile':
        return isLoggedIn ? <ProfilePage /> : <LandingPage />;
      case 'admin':
        return isLoggedIn && isAdmin ? <AdminPage /> : <LandingPage />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFC] dark:bg-[#070C1F] text-[#070C1F] dark:text-[#F3F4F7] transition-colors duration-200">
      <Navbar />
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
    <WorkifyProvider>
      <AppContent />
    </WorkifyProvider>
  );
}

export default App;
