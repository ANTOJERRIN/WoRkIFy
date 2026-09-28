import React from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { F1FORGE_URL } from '../../config/site';

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
              href={F1FORGE_URL}
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
          </div>

        </div>
      </div>
    </footer>
  );
};
