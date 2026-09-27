import React from 'react';
import type { Domain } from '../../types';
import { Search } from 'lucide-react';

interface WorkshopFiltersProps {
  selectedDomain: Domain;
  onSelectDomain: (domain: Domain) => void;
  dateFilter: string;
  onSelectDateFilter: (filter: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const WorkshopFilters: React.FC<WorkshopFiltersProps> = ({
  selectedDomain,
  onSelectDomain,
  dateFilter,
  onSelectDateFilter,
  searchQuery,
  onSearchChange
}) => {
  const domains: { key: Domain; label: string }[] = [
    { key: 'ALL', label: 'All Tracks' },
    { key: 'AGENTS', label: 'AI Agents' },
    { key: 'GEN_AI', label: 'Generative AI' },
    { key: 'AUTOMATION', label: 'Automation' },
    { key: 'CLOUD', label: 'Cloud & Edge' }
  ];

  return (
    <div className="w-full flex flex-col gap-5 mb-10">
      
      {/* Top Bar: Search & Date Dropdown */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#636875] dark:text-gray-400" />
          <input
            type="text"
            placeholder="Search workshops, topics, or hosts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 text-sm text-[#070C1F] dark:text-white placeholder-[#636875] focus:outline-none focus:border-[#2F6BFF] transition-colors"
          />
        </div>

        {/* Date Filter Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto self-end">
          <label className="text-xs text-[#636875] dark:text-gray-400 font-medium">Date:</label>
          <select
            value={dateFilter}
            onChange={(e) => onSelectDateFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 text-xs font-semibold text-[#070C1F] dark:text-white focus:outline-none focus:border-[#2F6BFF] transition-colors"
          >
            <option value="ALL">All Upcoming</option>
            <option value="THIS_WEEK">This Week</option>
            <option value="THIS_MONTH">This Month</option>
          </select>
        </div>
      </div>

      {/* Domain Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {domains.map((d) => (
          <button
            key={d.key}
            onClick={() => onSelectDomain(d.key)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              selectedDomain === d.key
                ? 'bg-[#2F6BFF] text-white shadow-sm'
                : 'bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 text-[#636875] dark:text-gray-300 hover:border-[#2F6BFF]/40'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

    </div>
  );
};
