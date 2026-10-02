import React from 'react';
import { ExternalLink, Sparkles, Terminal, Code2 } from 'lucide-react';
import { F1FORGE_URL } from '../../config/site';

export const F1ForgeSection: React.FC = () => {
  const isF1ForgeUrlConfigured =
    Boolean(F1FORGE_URL) &&
    !F1FORGE_URL.includes('[FILL') &&
    F1FORGE_URL.startsWith('http');

  return (
    <section className="w-full py-24 bg-[#FAFAFC] dark:bg-[#070C1F] border-t border-[#DDE0E8]/50 dark:border-white/5 transition-colors relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-80 h-80 bg-[#8B4CFF]/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Brand & Mission */}
          <div className="lg:col-span-7 flex flex-col items-start">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F3F4F7] dark:bg-white/10 mb-6 border border-[#DDE0E8]/60 dark:border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-[#8B4CFF]" />
              <span className="text-xs uppercase font-semibold text-[#8B4CFF] tracking-wider">
                The Engineering Studio
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#070C1F] dark:text-white tracking-tight mb-5 font-['Plus_Jakarta_Sans',sans-serif]">
              Built by{' '}
              {isF1ForgeUrlConfigured ? (
                <a
                  href={F1FORGE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline hover:text-[#2F6BFF] transition-colors"
                >
                  F1 Forge
                </a>
              ) : (
                <span>F1 Forge</span>
              )}
              .
            </h2>

            <p className="text-lg text-[#636875] dark:text-gray-300 max-w-xl leading-relaxed mb-8">
              A team building practical technology experiences for the next generation of builders. We build the interfaces, runtimes, and protocols that make modern AI usable in real engineering environments.
            </p>

            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10">
                <Code2 className="w-5 h-5 text-[#2F6BFF] mb-2" />
                <p className="text-xs font-bold text-[#070C1F] dark:text-white">Hands-on Sandbox</p>
                <p className="text-[11px] text-[#636875] dark:text-gray-400">Zero-setup dev environments</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10">
                <Terminal className="w-5 h-5 text-[#8B4CFF] mb-2" />
                <p className="text-xs font-bold text-[#070C1F] dark:text-white">Applied Engineering</p>
                <p className="text-[11px] text-[#636875] dark:text-gray-400">Practical builds that solve real problems</p>
              </div>
            </div>
          </div>

          {/* Right Column: Glass Profile Panel (per DESIGN.md: glassmorphism highlight surface) */}
          <div className="lg:col-span-5 relative w-full flex justify-center">
            <div className="w-full max-w-md rounded-3xl p-8 glass-panel-light dark:glass-panel-dark relative border border-white dark:border-white/10 shadow-xl">
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2F6BFF] to-[#8B4CFF] flex items-center justify-center text-white font-bold text-xl shadow-md border-2 border-white dark:border-white/20 shrink-0 font-['Plus_Jakarta_Sans',sans-serif]">
                  JA
                </div>
                <div>
                  <span className="text-[11px] font-bold tracking-wider uppercase text-[#8B4CFF]">Founder & Lead</span>
                  <h3 className="text-xl font-bold text-[#070C1F] dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
                    Jerrin Anto
                  </h3>
                  <p className="text-xs text-[#636875] dark:text-gray-400">F1 Forge · Workify</p>
                </div>
              </div>

              <p className="text-xs text-[#636875] dark:text-gray-300 leading-relaxed mb-6">
                Building AI agent platforms, developer tools, and practical engineering workshops for students and builders.
              </p>

              {isF1ForgeUrlConfigured && (
                <a
                  href={F1FORGE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 px-5 rounded-xl bg-[#2F6BFF] hover:bg-[#1F54E0] text-white text-xs font-semibold flex items-center justify-between transition-colors shadow-sm"
                >
                  <span>Visit F1 Forge</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
