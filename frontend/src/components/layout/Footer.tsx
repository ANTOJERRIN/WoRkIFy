import React from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#FAFAFC] dark:bg-[#070C1F] border-t border-[#DDE0E8] dark:border-white/10 py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Left: Brand & Copyright */}
          <div className="flex items-center gap-3">
            <img
              src="/workify-logo.png"
              alt="Workify Logo"
              className="w-6 h-6 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="font-semibold text-sm text-[#070C1F] dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
              Workify
            </span>
            <span className="text-xs text-[#636875] dark:text-gray-400">
              © 2026 Workify. All rights reserved.
            </span>
          </div>

          {/* Center: Built by F1 Forge */}
          <div className="flex items-center gap-2 text-xs text-[#636875] dark:text-gray-400">
            <span>Built by</span>
            <a
              href="https://jerrin-ai.onrender.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-[#070C1F] dark:text-white hover:text-[#2F6BFF] dark:hover:text-[#2F6BFF] transition-colors"
            >
              <span>F1 Forge</span>
              <ExternalLink className="w-3 h-3 text-[#2F6BFF]" />
            </a>
            <span>· Led by Jerrin Anto</span>
          </div>

          {/* Right: Security & Links */}
          <div className="flex items-center gap-5 text-xs text-[#636875] dark:text-gray-400">
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Proofs</span>
            </div>
            <a
              href="https://github.com/ANTOJERRIN/WoRkIFy"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#070C1F] dark:hover:text-white transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </a>
          </div>

        </div>
      </div>
    </footer>
  );
};
