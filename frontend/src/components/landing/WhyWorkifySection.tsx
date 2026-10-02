import React from 'react';
import { Hammer, Sparkles, Award, ArrowUpRight } from 'lucide-react';

export const WhyWorkifySection: React.FC = () => {
  const cards = [
    {
      num: '01',
      title: 'Learn by building',
      subtitle: 'Hands-on experiences instead of passive tutorials',
      description: 'Stop watching 20-hour video courses that become obsolete in months. Workify workshops are focused 60-90 minute code-alongs where you engineer working components directly on your machine.',
      icon: Hammer,
      accent: 'from-[#2F6BFF] to-[#1F54E0]'
    },
    {
      num: '02',
      title: "Work with what's next",
      subtitle: 'AI agents, GenAI, automation and cloud',
      description: 'The frontier moves too fast for traditional curriculums. We partner with practitioners building autonomous agent swarms, hybrid vector search pipelines, and local neural runtimes right now.',
      icon: Sparkles,
      accent: 'from-[#8B4CFF] to-[#6E36D6]'
    },
    {
      num: '03',
      title: 'Turn skills into opportunity',
      subtitle: 'Projects become proof of what you can do',
      description: 'Every workshop focuses on building a functional project. Apply modern tools, grow your technical skills, and showcase hands-on work on your Workify profile.',
      icon: Award,
      accent: 'from-emerald-500 to-teal-600'
    }
  ];

  return (
    <section className="w-full py-24 bg-[#070C1F] text-white relative overflow-hidden">
      {/* Background glow touches */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#2F6BFF]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#8B4CFF]/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-2xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8B4CFF]"></span>
            <span className="text-xs uppercase font-semibold text-[#8B4CFF] tracking-wider">
              Why Workify
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight font-['Plus_Jakarta_Sans',sans-serif]">
            Learn by building. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-400">
              Build for what comes next.
            </span>
          </h2>
        </div>

        {/* 3 Numbered Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.num}
                className="relative group rounded-3xl p-8 bg-[#0B1533] border border-white/10 hover:border-white/20 transition-all duration-300 flex flex-col justify-between card-hover-elevation"
              >
                <div>
                  {/* Top: Number & Icon */}
                  <div className="flex items-center justify-between mb-8">
                    <span className="text-3xl font-mono font-extrabold text-white/30 group-hover:text-white/60 transition-colors">
                      {card.num}
                    </span>
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.accent} flex items-center justify-center text-white shadow-lg`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="text-xl font-bold text-white mb-2 font-['Plus_Jakarta_Sans',sans-serif]">
                    {card.title}
                  </h3>
                  <h4 className="text-sm font-semibold text-[#8B4CFF] mb-4">
                    {card.subtitle}
                  </h4>

                  {/* Body Copy */}
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-400 group-hover:text-white transition-colors">
                  <span>Explore tracks</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
