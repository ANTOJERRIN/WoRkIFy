import React from 'react';
import { Search } from 'lucide-react';

interface WorkshopFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const WorkshopFilters: React.FC<WorkshopFiltersProps> = ({
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
      {/* Search Input */}
      <div className="relative w-full sm:w-96">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#636875] dark:text-gray-400" />
        <input
          type="text"
          placeholder="Search by title, host, or tags..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 text-sm text-[#070C1F] dark:text-white placeholder-[#636875] focus:outline-none focus:border-[#2F6BFF] transition-colors"
        />
      </div>
    </div>
  );
};
