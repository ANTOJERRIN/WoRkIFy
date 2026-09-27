import React from 'react';
import { useWorkify } from '../../context/WorkifyContext';
import { ArrowRight, CheckCircle2, Terminal, Cpu, ShieldCheck } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { login, setCurrentPage } = useWorkify();

  return (
    <section className="relative w-full py-16 md:py-24 overflow-hidden bg-[#FAFAFC] dark:bg-[#070C1F] transition-colors">
      {/* Subtle Ambient Radial Glows (per DESIGN.md: soft blue/violet atmospheric glow) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[520px] bg-gradient-to-tr from-[#2F6BFF]/10 via-[#8B4CFF]/8 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute -top-32 right-10 w-[420px] h-[360px] bg-[#2F6BFF]/5 dark:bg-[#2F6BFF]/15 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Copy & Actions */}
          <div className="lg:col-span-7 flex flex-col items-start">
            {/* Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F3F4F7] dark:bg-white/10 shadow-sm mb-6 border border-[#DDE0E8]/50 dark:border-white/10">
              <span className="w-2 h-2 rounded-full bg-[#2F6BFF] animate-pulse"></span>
              <span className="text-xs uppercase font-semibold text-[#8B4CFF] dark:text-[#8B4CFF] tracking-wider font-['Plus_Jakarta_Sans',sans-serif]">
                The Next Era of Work
              </span>
            </div>

            {/* Main Display Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#070C1F] dark:text-white tracking-tight mb-4 leading-[1.08] font-['Plus_Jakarta_Sans',sans-serif]">
              AI is moving from answers to action
            </h1>

            {/* Supporting Subtitle */}
            <h2 className="text-2xl sm:text-3xl font-bold text-[#070C1F]/85 dark:text-gray-200 tracking-tight mb-5 font-['Plus_Jakarta_Sans',sans-serif]">
              Learn to build what comes next
            </h2>

            {/* Editorial Body Copy */}
            <p className="text-lg text-[#636875] dark:text-gray-300 max-w-xl mb-8 leading-relaxed">
              Workify turns AI learning into hands-on workshops, real projects and opportunity — so you don't just learn what AI can do. You learn how to build with it.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
              <button
                onClick={() => {
                  login();
                  setCurrentPage('workshops');
                }}
                className="inline-flex items-center justify-center gap-2.5 h-12 px-7 rounded-xl bg-[#2F6BFF] text-white font-semibold text-sm shadow-sm hover:bg-[#1F54E0] hover:shadow-lg transition-all duration-200 group"
              >
                <span>Get started</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => {
                  login();
                  setCurrentPage('workshops');
                }}
                className="inline-flex items-center justify-center h-12 px-7 rounded-xl bg-white dark:bg-white/5 text-[#070C1F] dark:text-white font-semibold text-sm shadow-sm border border-[#DDE0E8] dark:border-white/10 hover:bg-[#F3F4F7] dark:hover:bg-white/10 transition-all duration-200"
              >
                Sign in to continue
              </button>
            </div>

            {/* Proof Point Micro-metadata */}
            <div className="flex flex-wrap items-center gap-5 mt-10 pt-6 border-t border-[#DDE0E8]/70 dark:border-white/10 w-full">
              <div className="flex items-center gap-2 text-xs text-[#636875] dark:text-gray-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Live Google Meet interactive workshops</span>
              </div>
              <div className="h-3 w-px bg-[#DDE0E8] dark:bg-white/20 hidden sm:block"></div>
              <div className="flex items-center gap-2 text-xs text-[#636875] dark:text-gray-400">
                <Terminal className="w-4 h-4 text-[#2F6BFF]" />
                <span>Proof-of-build verified credentials</span>
              </div>
            </div>
          </div>

          {/* Right Column: Floating Glass Architecture Panel (per DESIGN.md & Stitch screen) */}
          <div className="lg:col-span-5 relative w-full flex justify-center">
            {/* Ambient Under-Glow */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-[#2F6BFF]/20 to-[#8B4CFF]/20 rounded-3xl blur-2xl -z-10 opacity-70"></div>

            <div className="w-full max-w-md rounded-3xl p-7 glass-panel-light dark:glass-panel-dark animate-soft-float">
              {/* Glass Card Header */}
              <div className="flex items-center justify-between pb-5 border-b border-[#DDE0E8]/60 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2F6BFF] to-[#8B4CFF] flex items-center justify-center text-white shadow-md">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#070C1F] dark:text-white text-base">
                      AI is becoming a teammate
                    </h3>
                    <p className="text-xs text-[#636875] dark:text-gray-400">Human + AI collaboration</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Live
                </span>
              </div>

              {/* Architecture Pillars / Pills */}
              <div className="py-6 space-y-3.5">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/70 dark:bg-white/5 border border-white dark:border-white/5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#2F6BFF]/10 text-[#2F6BFF] flex items-center justify-center font-bold text-xs">
                      01
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#070C1F] dark:text-white">Autonomous Agents</p>
                      <p className="text-[11px] text-[#636875] dark:text-gray-400">LangGraph, Multi-agent swarms</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-[#2F6BFF]/10 text-[#2F6BFF] uppercase">
                    AI AGENTS
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/70 dark:bg-white/5 border border-white dark:border-white/5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#8B4CFF]/10 text-[#8B4CFF] flex items-center justify-center font-bold text-xs">
                      02
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#070C1F] dark:text-white">Generative Systems</p>
                      <p className="text-[11px] text-[#636875] dark:text-gray-400">Hybrid RAG & Quantized SLMs</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-[#8B4CFF]/10 text-[#8B4CFF] uppercase">
                    GEN AI
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/70 dark:bg-white/5 border border-white dark:border-white/5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs">
                      03
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#070C1F] dark:text-white">Verified Build Proof</p>
                      <p className="text-[11px] text-[#636875] dark:text-gray-400">Cryptographic portfolio artifact</p>
                    </div>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                </div>
              </div>

              {/* Glass Card Footer Action */}
              <div className="pt-4 border-t border-[#DDE0E8]/60 dark:border-white/10 flex items-center justify-between text-xs">
                <span className="text-[#636875] dark:text-gray-400">Next workshop begins in:</span>
                <span className="font-mono font-bold text-[#2F6BFF]">24h 12m</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
