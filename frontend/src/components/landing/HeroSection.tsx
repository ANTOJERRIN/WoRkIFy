import React from 'react';
import { useWorkify } from '../../context/WorkifyContext';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { login, setCurrentPage } = useWorkify();

  return (
    <section className="relative w-full py-16 md:py-24 overflow-hidden bg-[#FAFAFC] dark:bg-[#070C1F] transition-colors">
      {/* Subtle Ambient Radial Glows (per DESIGN.md: soft blue/violet atmospheric glow) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[520px] bg-gradient-to-tr from-[#2F6BFF]/10 via-[#8B4CFF]/8 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute -top-32 right-10 w-[420px] h-[360px] bg-[#2F6BFF]/5 dark:bg-[#2F6BFF]/15 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl flex flex-col items-start">
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
          <p className="text-lg text-[#636875] dark:text-gray-300 max-w-2xl mb-8 leading-relaxed">
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
          <div className="flex flex-wrap items-center gap-5 mt-10 pt-6 border-t border-[#DDE0E8]/70 dark:border-white/10 w-full max-w-xl">
            <div className="flex items-center gap-2 text-xs text-[#636875] dark:text-gray-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Interactive workshops</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

