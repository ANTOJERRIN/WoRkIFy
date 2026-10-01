import React, { useEffect } from 'react';
import { useWorkify } from '../../context/WorkifyContext';
import {
  Calendar,
  Video,
  Clock,
  Sparkles,
  Plus
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const {
    isLoggedIn,
    workshops,
    registeredWorkshopIds,
    unregisterFromWorkshop,
    openWorkshopDetail,
    setIsHostModalOpen,
    setIsAuthModalOpen,
    setCurrentPage
  } = useWorkify();

  useEffect(() => {
    if (!isLoggedIn) {
      setCurrentPage('landing');
      setIsAuthModalOpen(true);
    }
  }, [isLoggedIn, setCurrentPage, setIsAuthModalOpen]);

  if (!isLoggedIn) {
    return null;
  }

  const attendingWorkshops = workshops.filter(w => registeredWorkshopIds.includes(w.id));

  return (
    <div className="w-full py-10 md:py-16 bg-[#FAFAFC] dark:bg-[#070C1F] min-h-[calc(100vh-4rem)] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-[#DDE0E8]/70 dark:border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3F4F7] dark:bg-white/10 mb-3 border border-[#DDE0E8]/60 dark:border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-[#8B4CFF]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8B4CFF]">
                Personal Workspace
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#070C1F] dark:text-white tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
              Dashboard
            </h1>
            <p className="text-sm text-[#636875] dark:text-gray-400 mt-1">
              View and manage your upcoming workshop commitments.
            </p>
          </div>

          <button
            onClick={() => setIsHostModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2F6BFF] hover:bg-[#1F54E0] text-white text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Host a workshop</span>
          </button>
        </div>

        {/* Registered / Attending Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#070C1F] dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
                My Registered Workshops
              </h2>
              <p className="text-xs text-[#636875] dark:text-gray-400">
                Sessions you have registered for
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {attendingWorkshops.length} registered
            </span>
          </div>

          {attendingWorkshops.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {attendingWorkshops.map(w => (
                <div
                  key={w.id}
                  className="rounded-3xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 p-6 flex flex-col justify-between shadow-sm card-hover-elevation"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#8B4CFF]/10 text-[#8B4CFF]">
                        {w.domainLabel}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md">
                        <span>Registered ✓</span>
                      </div>
                    </div>

                    <h3
                      onClick={() => openWorkshopDetail(w.id)}
                      className="text-lg font-bold text-[#070C1F] dark:text-white hover:text-[#2F6BFF] cursor-pointer transition-colors mb-2 font-['Plus_Jakarta_Sans',sans-serif]"
                    >
                      {w.title}
                    </h3>

                    <p className="text-xs text-[#636875] dark:text-gray-400 line-clamp-2 mb-4">
                      {w.shortDescription}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-[#636875] dark:text-gray-400 mb-4">
                      <Clock className="w-3.5 h-3.5 text-[#2F6BFF]" />
                      <span>{w.dateTime}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#DDE0E8]/60 dark:border-white/10 flex items-center justify-between">
                    {w.meetUrl ? (
                      <a
                        href={w.meetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2F6BFF] hover:bg-[#1F54E0] text-white text-xs font-semibold shadow-sm transition-colors"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join Meet</span>
                      </a>
                    ) : (
                      <span className="text-xs text-[#636875] dark:text-gray-400">
                        Link available soon
                      </span>
                    )}

                    <button
                      onClick={() => unregisterFromWorkshop(w.id)}
                      className="text-xs text-[#636875] hover:text-red-500 underline"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Explicit Empty State required by Item 9 */
            <div className="w-full py-16 px-6 rounded-3xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#F3F4F7] dark:bg-white/5 text-[#636875] flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#070C1F] dark:text-white mb-1">
                You haven't registered for any workshops yet
              </h3>
              <p className="text-xs text-[#636875] dark:text-gray-400 max-w-sm mb-6">
                Explore upcoming engineering builds and register for your next live session.
              </p>
              <button
                onClick={() => setCurrentPage('workshops')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2F6BFF] text-white text-xs font-semibold hover:bg-[#1F54E0] transition-colors shadow-sm"
              >
                <span>Browse workshops</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
