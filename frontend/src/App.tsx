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
  const { currentPage } = useWorkify();

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage />;
      case 'workshops':
        return <WorkshopsPage />;
      case 'workshop-detail':
        return <WorkshopDetailPage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'profile':
        return <ProfilePage />;
      case 'admin':
        return <AdminPage />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFC] dark:bg-[#070C1F] text-[#070C1F] dark:text-[#F3F4F7] transition-colors duration-200">
      <Navbar />
      <main className="flex-1 w-full">
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
