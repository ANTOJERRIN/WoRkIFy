import React, { useState } from 'react';
import { useWorkify } from '../../context/WorkifyContext';
import { X, ArrowRight, ShieldCheck } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, login } = useWorkify();
  const [email, setEmail] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
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
                Sign in to Workify
              </h2>
              <p className="text-xs text-[#636875] dark:text-gray-400">
                Join live builds and hands-on workshops
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 rounded-xl text-[#636875] hover:text-[#070C1F] dark:text-gray-400 dark:hover:text-white hover:bg-[#F3F4F7] dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#070C1F] dark:text-white mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#070C1F] border border-[#DDE0E8] dark:border-white/10 text-sm text-[#070C1F] dark:text-white placeholder-[#636875] focus:outline-none focus:border-[#2F6BFF]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-5 rounded-xl bg-[#2F6BFF] hover:bg-[#1F54E0] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-colors"
          >
            <span>Continue with Email</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="relative py-2 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#DDE0E8] dark:border-white/10"></div>
            </div>
            <span className="relative px-3 bg-white dark:bg-[#0B1533] text-[11px] text-[#636875] dark:text-gray-400">
              or quick demo access
            </span>
          </div>

          <button
            type="button"
            onClick={() => login()}
            className="w-full py-2.5 px-4 rounded-xl bg-[#F3F4F7] dark:bg-white/5 hover:bg-[#DDE0E8] dark:hover:bg-white/10 text-[#070C1F] dark:text-white text-xs font-semibold border border-[#DDE0E8] dark:border-white/10 transition-colors"
          >
            Sign in as Demo User
          </button>

          <div className="pt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#636875] dark:text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Secure passwordless authentication</span>
          </div>
        </form>
      </div>
    </div>
  );
};
