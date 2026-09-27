import React, { useState } from 'react';
import { useWorkify } from '../../context/WorkifyContext';
import { Sun, Moon, Plus, User, LogOut, CheckCircle2, ChevronDown, Menu, X, Sparkles } from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    isLoggedIn,
    login,
    logout,
    currentPage,
    setCurrentPage,
    setIsHostModalOpen,
    setIsAuthModalOpen,
    userProfile,
    darkMode,
    toggleDarkMode
  } = useWorkify();

  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 dark:bg-[#070C1F]/90 backdrop-blur-md border-b border-[#DDE0E8] dark:border-white/10 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Brand Logo & Wordmark */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setCurrentPage(isLoggedIn ? 'workshops' : 'landing')}
            className="flex items-center gap-3 group focus:outline-none text-left"
          >
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm flex items-center justify-center bg-white border border-[#DDE0E8] dark:border-white/10 group-hover:scale-105 transition-transform duration-200">
              <img
                src="/workify-logo.png"
                alt="Workify Logo"
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  // Fallback if local file not found in build
                  (e.target as HTMLImageElement).src = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYL1QwCM_q9VNyj-U3MkMf4cxN173cfBXm1yyzk-YW_ku4mkjSq39Wn_hBaQAyKLbQmHtK1L9uX_DxFTwTiiDEI_moAOMlLbjoPZaulniQwCGX9AfYn51QejkzhoVxD7lg1-95nCdmxTaqZCWjNLBm1ZvxEO3RmEuV8zW_u02Y_rfMmr9pT9g9q28q5aHC3Q0lyIyHHD3umxlLt9cnkW6YM-cKcvi2aI0rhYmT2cBbOn-6UXC0eReMybcV31Eig9bPxcQ';
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-[#070C1F] dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
                Workify
              </span>
            </div>
          </button>

          {/* Quick status pill for testing preview states */}
          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-[#DDE0E8] dark:border-white/10 text-xs text-[#636875] dark:text-gray-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{isLoggedIn ? 'Logged in view' : 'Logged out view'}</span>
            <button
              onClick={() => (isLoggedIn ? logout() : login())}
              className="ml-1 text-[11px] underline text-[#2F6BFF] hover:text-[#1F54E0] font-medium"
            >
              (switch)
            </button>
          </div>
        </div>

        {/* Center: Logged-in Nav Links */}
        {isLoggedIn ? (
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <button
              onClick={() => setCurrentPage('workshops')}
              className={`relative py-1 transition-colors ${
                currentPage === 'workshops' || currentPage === 'workshop-detail'
                  ? 'text-[#070C1F] dark:text-white font-semibold'
                  : 'text-[#636875] dark:text-gray-400 hover:text-[#070C1F] dark:hover:text-white'
              }`}
            >
              Workshops
              {(currentPage === 'workshops' || currentPage === 'workshop-detail') && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#2F6BFF] rounded-full"></span>
              )}
            </button>

            <button
              onClick={() => setCurrentPage('dashboard')}
              className={`relative py-1 transition-colors ${
                currentPage === 'dashboard'
                  ? 'text-[#070C1F] dark:text-white font-semibold'
                  : 'text-[#636875] dark:text-gray-400 hover:text-[#070C1F] dark:hover:text-white'
              }`}
            >
              Dashboard
              {currentPage === 'dashboard' && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#2F6BFF] rounded-full"></span>
              )}
            </button>

            <button
              onClick={() => setCurrentPage('profile')}
              className={`relative py-1 transition-colors ${
                currentPage === 'profile'
                  ? 'text-[#070C1F] dark:text-white font-semibold'
                  : 'text-[#636875] dark:text-gray-400 hover:text-[#070C1F] dark:hover:text-white'
              }`}
            >
              Profile
              {currentPage === 'profile' && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#2F6BFF] rounded-full"></span>
              )}
            </button>
          </nav>
        ) : (
          <div className="hidden md:flex items-center text-xs text-[#636875] dark:text-gray-400">
            <span>AI Learning · Real Builds · Verified Proofs</span>
          </div>
        )}

        {/* Right Actions: Logged In vs Logged Out */}
        <div className="flex items-center gap-3">
          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl text-[#636875] hover:text-[#070C1F] dark:text-gray-400 dark:hover:text-white bg-[#F3F4F7] dark:bg-white/5 transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {isLoggedIn ? (
            <>
              {/* Standalone + Host Pill Button (per DESIGN.md: 999px radius, set apart from regular nav) */}
              <button
                onClick={() => setIsHostModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full bg-[#2F6BFF] hover:bg-[#1F54E0] text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Host</span>
              </button>

              {/* User Avatar Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-[#2F6BFF]/30 transition-all focus:outline-none"
                >
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.name}
                    className="w-8 h-8 rounded-full object-cover border border-[#DDE0E8] dark:border-white/20"
                  />
                  <ChevronDown className="w-3.5 h-3.5 text-[#636875] dark:text-gray-400 hidden sm:block" />
                </button>

                {isAvatarMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-60 rounded-2xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 shadow-xl py-2 z-50 text-sm"
                    onMouseLeave={() => setIsAvatarMenuOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-[#DDE0E8] dark:border-white/10">
                      <div className="flex items-center gap-1.5 font-semibold text-[#070C1F] dark:text-white">
                        <span>{userProfile.name}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#2F6BFF] fill-[#2F6BFF]/10" />
                      </div>
                      <p className="text-xs text-[#636875] dark:text-gray-400 truncate">{userProfile.handle}</p>
                    </div>

                    <button
                      onClick={() => {
                        setCurrentPage('profile');
                        setIsAvatarMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-[#070C1F] dark:text-gray-200 hover:bg-[#F3F4F7] dark:hover:bg-white/5 flex items-center gap-2"
                    >
                      <User className="w-4 h-4 text-[#2F6BFF]" />
                      <span>Verified Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setCurrentPage('dashboard');
                        setIsAvatarMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-[#070C1F] dark:text-gray-200 hover:bg-[#F3F4F7] dark:hover:bg-white/5 flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-[#8B4CFF]" />
                      <span>My Workshops & Proofs</span>
                    </button>

                    <div className="border-t border-[#DDE0E8] dark:border-white/10 my-1"></div>

                    <button
                      onClick={() => {
                        logout();
                        setIsAvatarMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2 text-xs"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Logged-out state: "Sign in" only */
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="inline-flex items-center justify-center h-10 px-5 rounded-xl bg-white dark:bg-white/5 border border-[#DDE0E8] dark:border-white/15 text-[#070C1F] dark:text-white font-semibold text-sm hover:bg-[#F3F4F7] dark:hover:bg-white/10 transition-colors shadow-sm"
            >
              Sign in
            </button>
          )}

          {/* Mobile menu trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-[#636875] hover:text-[#070C1F] dark:text-gray-300"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[#DDE0E8] dark:border-white/10 px-4 pt-3 pb-5 space-y-2 bg-white dark:bg-[#070C1F]">
          {isLoggedIn ? (
            <>
              <button
                onClick={() => {
                  setCurrentPage('workshops');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 font-medium text-[#070C1F] dark:text-white"
              >
                Workshops
              </button>
              <button
                onClick={() => {
                  setCurrentPage('dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 font-medium text-[#070C1F] dark:text-white"
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  setCurrentPage('profile');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 font-medium text-[#070C1F] dark:text-white"
              >
                Verified Profile
              </button>
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 text-sm text-red-500"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                login();
                setIsMobileMenuOpen(false);
              }}
              className="w-full py-2.5 rounded-xl bg-[#2F6BFF] text-white font-semibold text-center"
            >
              Sign in to Workify
            </button>
          )}
        </div>
      )}
    </header>
  );
};
