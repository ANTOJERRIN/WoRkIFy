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
import { AuthModal } from './components/auth/AuthModal';
import { LoginPage } from './components/auth/LoginPage';
import { useAuth } from './context/AuthContext';

const AppContent: React.FC = () => {
  const { currentPage, isLoggedIn, isAdmin, actionError, clearActionError, setCurrentPage } = useWorkify();
  const auth = useAuth();

  const renderCurrentPage = () => {
    if (auth.recovery) return <LoginPage />;
    const protectedPage = ['dashboard', 'profile', 'admin'].includes(currentPage);
    if (protectedPage && auth.status === 'loading') return <p role="status" className="p-16 text-center">Checking your session…</p>;
    if (protectedPage && !isLoggedIn) return <LoginPage />;
    if (currentPage === 'admin' && auth.permission === 'loading') return <p role="status" className="p-16 text-center">Checking admin access…</p>;
    if (currentPage === 'admin' && !isAdmin) return <section className="max-w-xl mx-auto p-10 my-14 text-center"><h1 className="text-3xl font-bold mb-4">{auth.permission === 'failed' ? 'Could not verify admin access' : 'Admin access only'}</h1><p className="text-[#636875] dark:text-gray-400 mb-6">{auth.permission === 'failed' ? 'Please retry the permission check.' : 'Only the Workify admin can create and host workshops.'}</p>{auth.permission === 'failed' && <button onClick={auth.retry} className="px-5 py-3 rounded-xl bg-[#2F6BFF] text-white mr-3">Try again</button>}<button onClick={() => setCurrentPage('workshops')} className="px-5 py-3 rounded-xl border border-[#DDE0E8]">Explore workshops</button></section>;
    switch (currentPage) {
      case 'landing':
        return <LandingPage />;
      case 'login':
        return auth.status === 'loading' || (isLoggedIn && auth.permission === 'loading') ? <p role="status" className="p-16 text-center">Checking your session…</p> : <LoginPage />;
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
        return <section className="p-16 text-center"><h1 className="text-3xl font-bold mb-5">Page not found</h1><button onClick={() => setCurrentPage('workshops')} className="text-[#2F6BFF]">Explore workshops</button></section>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFC] dark:bg-[#070C1F] text-[#070C1F] dark:text-[#F3F4F7] transition-colors duration-200">
      <Navbar />
      {(auth.error || actionError) && <div role="alert" className="px-6 py-3 bg-amber-50 text-amber-900 flex items-center justify-between gap-4"><span>{auth.error || actionError}</span><button onClick={auth.error ? auth.status === 'failed' ? auth.retry : auth.clearError : clearActionError} className="font-semibold underline">{auth.error && auth.status === 'failed' ? 'Try again' : 'Dismiss'}</button></div>}
      <main tabIndex={-1} className="flex-1 w-full">
        <div key={auth.user?.id ?? 'visitor'}>{renderCurrentPage()}</div>
      </main>
      <Footer />
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
