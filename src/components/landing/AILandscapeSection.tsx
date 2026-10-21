import React from 'react';
import { Bot, Cpu, GitBranch, Users, ArrowRight } from 'lucide-react';
import { useWorkify } from '../../context/WorkifyContext';

export const AILandscapeSection: React.FC = () => {
  const { setCurrentPage } = useWorkify();

  const themes = [
    {
      id: 'AGENTS',
      tag: 'AGENTS',
      title: 'Autonomous Swarms',
      subtitle: 'Multi-agent orchestration & state machines',
      description: 'Moving beyond single-prompt chatbots to stateful graphs, planning hierarchies, and tool-augmented agent teams.',
      icon: Bot,
      color: 'text-[#2F6BFF]',
      bg: 'bg-[#2F6BFF]/10',
      border: 'hover:border-[#2F6BFF]/40'
    },
    {
      id: 'GEN_AI',
      tag: 'GENERATIVE AI',
      title: 'Foundation Systems',
      subtitle: 'Hybrid RAG, SLMs & Fine-tuning',
      description: 'Engineering resilient retrieval with reciprocal fusion, semantic caching, and local browser-based SLM deployments.',
      icon: Cpu,
      color: 'text-[#8B4CFF]',
      bg: 'bg-[#8B4CFF]/10',
      border: 'hover:border-[#8B4CFF]/40'
    },
    {
      id: 'AUTOMATION',
      tag: 'AUTOMATION',
      title: 'Developer Tooling',
      subtitle: 'AST parsing, CI/CD & API integrations',
      description: 'Deterministic code transformation, automated pull request agents, and production pipeline self-healing.',
      icon: GitBranch,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      border: 'hover:border-amber-500/40'
    },
    {
      id: 'HUMAN_AI',
      tag: 'HUMAN + AI',
      title: 'Collaborative UX',
      subtitle: 'Approval gates & decision augmentation',
      description: 'Designing safe interfaces where autonomous agents propose actions while humans retain sovereign judgment.',
      icon: Users,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      border: 'hover:border-emerald-500/40'
    }
  ];

  return (
    <section className="w-full py-24 bg-[#FAFAFC] dark:bg-[#070C1F] transition-colors border-t border-[#DDE0E8]/50 dark:border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-2xl mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F3F4F7] dark:bg-white/10 mb-4 border border-[#DDE0E8]/60 dark:border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2F6BFF]"></span>
            <span className="text-xs uppercase font-semibold text-[#2F6BFF] dark:text-[#2F6BFF] tracking-wider">
              The AI Landscape
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#070C1F] dark:text-white tracking-tight mb-4 font-['Plus_Jakarta_Sans',sans-serif]">
            From copilots to autonomous agents
          </h2>

          <p className="text-base sm:text-lg text-[#636875] dark:text-gray-300 leading-relaxed">
            The tools are changing quickly. Workify is designed around learning how to use, build and collaborate with them.
          </p>
        </div>

        {/* 4 Theme Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {themes.map((theme) => {
            const Icon = theme.icon;
            return (
              <div
                key={theme.id}
                onClick={() => setCurrentPage('workshops')}
                className={`cursor-pointer rounded-3xl p-7 bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 ${theme.border} transition-all duration-300 flex flex-col justify-between card-hover-elevation group`}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-[#F3F4F7] dark:bg-white/5 text-[#636875] dark:text-gray-300">
                      {theme.tag}
                    </span>
                    <div className={`w-10 h-10 rounded-2xl ${theme.bg} ${theme.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-[#070C1F] dark:text-white mb-1.5 font-['Plus_Jakarta_Sans',sans-serif]">
                    {theme.title}
                  </h3>
                  <h4 className="text-xs font-semibold text-[#8B4CFF] mb-3">
                    {theme.subtitle}
                  </h4>
                  <p className="text-xs text-[#636875] dark:text-gray-400 leading-relaxed">
                    {theme.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#DDE0E8]/50 dark:border-white/5 flex items-center justify-between text-xs font-semibold text-[#2F6BFF] group-hover:translate-x-1 transition-transform">
                  <span>Browse tracks</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
