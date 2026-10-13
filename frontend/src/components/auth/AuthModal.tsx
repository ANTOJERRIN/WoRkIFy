import React from 'react';
import { useWorkify } from '../../context/WorkifyContext';
import { X } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, setCurrentPage } = useWorkify();

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sign-in temporarily unavailable"
        className="w-full max-w-md rounded-3xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 shadow-2xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-5 border-b border-[#DDE0E8] dark:border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <img
              src="/workify-logo.png"
              alt="Workify Logo"
              className="w-8 h-8 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div>
              <h2 className="text-xl font-bold text-[#070C1F] dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
                Sign-in temporarily unavailable
              </h2>
              <p className="text-xs text-[#636875] dark:text-gray-400">
                You can still explore public workshops
              </p>
            </div>
          </div>

          <button
            aria-label="Close"
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 rounded-xl text-[#636875] hover:text-[#070C1F] dark:text-gray-400 dark:hover:text-white hover:bg-[#F3F4F7] dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-[#636875] dark:text-gray-300 mb-6">
          Sign-in is temporarily unavailable while we update authentication.
        </p>
        <button
          onClick={() => {
            setIsAuthModalOpen(false);
            setCurrentPage('workshops');
          }}
          className="w-full py-3 px-5 rounded-xl bg-[#2F6BFF] hover:bg-[#1F54E0] text-white text-sm font-semibold shadow-md transition-colors"
        >
          Explore workshops
        </button>
      </div>
    </div>
  );
};
