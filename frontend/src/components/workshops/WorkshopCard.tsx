import React from 'react';
import type { Workshop } from '../../types';
import { useWorkify } from '../../context/WorkifyContext';
import { Calendar, Video, ArrowRight, CheckCircle2 } from 'lucide-react';

interface WorkshopCardProps {
  workshop: Workshop;
}

export const WorkshopCard: React.FC<WorkshopCardProps> = ({ workshop }) => {
  const { openWorkshopDetail, registeredWorkshopIds, registerForWorkshop } = useWorkify();
  const isRegistered = registeredWorkshopIds.includes(workshop.id);
  const isComingSoon = !!workshop.comingSoon;

  return (
    <div
      onClick={() => {
        if (!isComingSoon) {
          openWorkshopDetail(workshop.id);
        }
      }}
      className={`rounded-3xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 p-6 flex flex-col justify-between transition-all duration-200 ${
        isComingSoon
          ? 'opacity-65 cursor-not-allowed select-none'
          : 'cursor-pointer group hover:border-[#2F6BFF]/40 dark:hover:border-[#2F6BFF]/40 card-hover-elevation'
      }`}
    >
      <div>
        {/* Top Badges: Domain Tag & Mode Tag */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#2F6BFF]/10 text-[#2F6BFF] uppercase tracking-wider">
            {workshop.domainLabel}
          </span>
          
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#F3F4F7] dark:bg-white/5 text-[#636875] dark:text-gray-300">
            <Video className="w-3.5 h-3.5 text-emerald-500" />
            <span>Online · Google Meet</span>
          </div>
        </div>

        {/* Title */}
        <h3 className={`text-xl font-bold mb-2 transition-colors leading-snug font-['Plus_Jakarta_Sans',sans-serif] ${
          isComingSoon
            ? 'text-[#636875] dark:text-gray-300'
            : 'text-[#070C1F] dark:text-white group-hover:text-[#2F6BFF] dark:group-hover:text-[#2F6BFF]'
        }`}>
          {workshop.title}
        </h3>

        {/* Short Description */}
        <p className="text-sm text-[#636875] dark:text-gray-400 line-clamp-2 mb-5 leading-relaxed">
          {workshop.shortDescription}
        </p>

        {/* Host Details */}
        <div className="flex items-center gap-3 py-3 border-t border-[#DDE0E8]/60 dark:border-white/10 mb-4">
          <img
            src={workshop.host.avatarUrl || '/workify-logo.png'}
            alt={workshop.host.name}
            className="w-9 h-9 rounded-full object-cover border border-[#DDE0E8] dark:border-white/20"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#070C1F] dark:text-white">
                {workshop.host.name}
              </span>
              {workshop.host.verified && (
                <CheckCircle2 className="w-3 h-3 text-[#2F6BFF]" />
              )}
            </div>
            <span className="text-[11px] text-[#636875] dark:text-gray-400">
              {workshop.host.role} · {workshop.host.organization}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Info & Action */}
      <div className="pt-3 border-t border-[#DDE0E8]/60 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-[#636875] dark:text-gray-400 font-medium">
          <Calendar className="w-3.5 h-3.5 text-[#8B4CFF]" />
          <span>{workshop.dateTime}</span>
        </div>

        <div className="flex items-center gap-2">
          {isComingSoon ? (
            <span className="px-3 py-1 rounded-lg bg-[#F3F4F7] dark:bg-white/10 text-[#636875] dark:text-gray-400 text-xs font-semibold cursor-not-allowed">
              Coming soon
            </span>
          ) : isRegistered ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-lg">
              <CheckCircle2 className="w-3 h-3" />
              <span>Registered</span>
            </span>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                registerForWorkshop(workshop.id);
              }}
              className="px-3 py-1 rounded-lg bg-[#2F6BFF] hover:bg-[#1F54E0] text-white text-xs font-semibold shadow-sm transition-colors"
            >
              Register
            </button>
          )}

          {!isComingSoon && (
            <button
              onClick={() => openWorkshopDetail(workshop.id)}
              className="p-1 rounded-lg text-[#636875] group-hover:text-[#2F6BFF] transition-colors"
              title="View Details"
            >
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
