import React, { useState, useMemo } from 'react';
import { useWorkify } from '../../context/WorkifyContext';
import { WorkshopCard } from './WorkshopCard';
import { WorkshopFilters } from './WorkshopFilters';
import { Sparkles, CalendarX, Plus, Loader2, AlertCircle } from 'lucide-react';

export const WorkshopsPage: React.FC = () => {
  const { workshops, workshopsLoading, workshopsError, reloadWorkshops, setIsHostModalOpen } = useWorkify();
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredWorkshops = useMemo(() => {
    return workshops.filter((w) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = w.title.toLowerCase().includes(q);
        const matchesDesc = w.shortDescription.toLowerCase().includes(q) || w.fullDescription.toLowerCase().includes(q);
        const matchesHost = w.hostName.toLowerCase().includes(q);
        const matchesTags = w.tags.some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesHost && !matchesTags) {
          return false;
        }
      }
      return true;
    });
  }, [workshops, searchQuery]);

  return (
    <div className="w-full py-10 md:py-16 bg-[#FAFAFC] dark:bg-[#070C1F] min-h-[calc(100vh-4rem)] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Title & Intro */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3F4F7] dark:bg-white/10 mb-3 border border-[#DDE0E8]/60 dark:border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-[#2F6BFF]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#2F6BFF]">
                Live Engineering Builds
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#070C1F] dark:text-white tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
              Upcoming Workshops
            </h1>
            <p className="text-sm text-[#636875] dark:text-gray-400 mt-1">
              Short, practitioner-led sessions on Google Meet that turn into hands-on builds.
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

        {/* Filters / Search */}
        <WorkshopFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Loading State */}
        {workshopsLoading && (
          <div className="w-full py-24 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-[#2F6BFF] animate-spin mb-3" />
            <p className="text-sm text-[#636875] dark:text-gray-400">Loading workshops...</p>
          </div>
        )}

        {/* Error State */}
        {!workshopsLoading && workshopsError && (
          <div className="w-full py-16 px-6 rounded-3xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
            <h3 className="text-base font-bold text-red-900 dark:text-red-200 mb-1">
              Failed to load workshops
            </h3>
            <p className="text-xs text-red-600 dark:text-red-400 max-w-sm mb-4">
              {workshopsError}
            </p>
            <button
              onClick={() => reloadWorkshops()}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* Workshops Grid or Empty State */}
        {!workshopsLoading && !workshopsError && (
          filteredWorkshops.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorkshops.map((workshop) => (
                <WorkshopCard key={workshop.id} workshop={workshop} />
              ))}
            </div>
          ) : (
            <div className="w-full py-20 px-6 rounded-3xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#F3F4F7] dark:bg-white/5 text-[#636875] flex items-center justify-center mb-4">
                <CalendarX className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-[#070C1F] dark:text-white mb-1">
                No workshops found
              </h3>
              <p className="text-sm text-[#636875] dark:text-gray-400 max-w-sm mb-6">
                There are no workshops matching your search. Try searching for a different keyword or host one yourself.
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-5 py-2 rounded-xl bg-[#F3F4F7] dark:bg-white/10 text-[#070C1F] dark:text-white text-xs font-semibold hover:bg-[#DDE0E8] transition-colors"
                >
                  Clear search
                </button>
              )}
            </div>
          )
        )}

      </div>
    </div>
  );
};
