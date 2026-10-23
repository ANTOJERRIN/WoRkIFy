import React from 'react';
import { useWorkify } from '../../context/WorkifyContext';
import { formatWorkshopSchedule, parseWorkshopInstant, workshopLifecycle } from '../../domain/workshopLifecycle';
import { useWorkshopClock } from '../../hooks/useWorkshopClock';
import { MeetingAccessControl } from '../workshops/MeetingAccessControl';
import type { RegistrationWithWorkshop } from '../../types';
import {
  Calendar,
  Clock,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface DashboardWorkshopCardProps {
  registration: RegistrationWithWorkshop;
  onOpenDetail: (id: string) => void;
  onCancelRegistration: (id: string) => void;
  mutationPending: boolean;
  now: number;
}

const DashboardWorkshopCard: React.FC<DashboardWorkshopCardProps> = ({
  registration,
  onOpenDetail,
  onCancelRegistration,
  mutationPending,
  now,
}) => {
  const w = registration.workshop;
  const lifecycle = workshopLifecycle(w, now);
  const historical = ['completed', 'cancelled', 'archived'].includes(lifecycle.phase);
  const dateFormatted = formatWorkshopSchedule(w);
  return (
    <article aria-label={w.title} className="rounded-3xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 p-6 flex flex-col justify-between shadow-sm card-hover-elevation">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#8B4CFF]/10 text-[#8B4CFF]">
            {w.tags.length > 0 ? w.tags[0] : 'Workshop'}
          </span>
          <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md">
            <span>Registered ✓</span>
          </div>
        </div>

        <h3 className="text-lg font-bold text-[#070C1F] dark:text-white mb-2 font-['Plus_Jakarta_Sans',sans-serif]">
          <button onClick={() => onOpenDetail(w.id)} className="text-left break-words hover:text-[#2F6BFF] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2F6BFF] transition-colors">
            {w.title}
          </button>
        </h3>

        <p className="text-xs text-[#636875] dark:text-gray-400 mb-2 break-words">Hosted by {w.hostName || 'Host unavailable'}</p>
        {!historical && <p className="text-xs font-semibold text-[#8B4CFF] mb-3">{lifecycle.label}</p>}

        <p className="text-xs text-[#636875] dark:text-gray-400 line-clamp-2 mb-4">
          {w.shortDescription}
        </p>

        <div className="flex items-center gap-2 text-xs text-[#636875] dark:text-gray-400 mb-4">
          <Clock className="w-3.5 h-3.5 text-[#2F6BFF]" />
          <span>{dateFormatted}</span>
        </div>
      </div>

      <div className="pt-4 border-t border-[#DDE0E8]/60 dark:border-white/10 flex flex-col gap-3">
        {historical ? (
          <div className="text-xs text-[#636875] dark:text-gray-400">
            <p>{lifecycle.label} · Registration history</p>
            <p className="mt-1">Does not confirm attendance or completion.</p>
          </div>
        ) : (
        <div className="flex items-center justify-between">
          <MeetingAccessControl workshop={w} label="Join Meet" />

          {lifecycle.cancellationEligible && <button
            onClick={() => onCancelRegistration(w.id)}
            disabled={mutationPending}
            aria-label={`Cancel registration for ${w.title}`}
            className="text-xs text-[#636875] hover:text-red-500 underline self-start disabled:opacity-50 disabled:cursor-wait"
          >
            Cancel
          </button>}
        </div>
        )}

        <button
          onClick={() => onOpenDetail(w.id)}
          className="text-xs font-semibold text-[#2F6BFF] hover:text-[#1F54E0] self-start"
        >
          View details →
        </button>
      </div>
    </article>
  );
};

export const DashboardPage: React.FC = () => {
  const now = useWorkshopClock();
  const {
    isLoggedIn,
    unregisterFromWorkshop,
    openWorkshopDetail,
    setCurrentPage,
    registrations,
    registeredWorkshopIds,
    unavailableRegistrationCount,
    registrationsLoading: loading,
    registrationsRefreshing,
    registrationsError: error,
    reloadRegistrations,
    registeringWorkshopId,
  } = useWorkify();

  if (!isLoggedIn) {
    return null;
  }

  const handleCancelRegistration = async (workshopId: string) => {
    await unregisterFromWorkshop(workshopId);
  };

  const groups = [
    { id: 'ongoing', title: 'Ongoing sessions', phases: ['ongoing'], rows: [] as RegistrationWithWorkshop[] },
    { id: 'upcoming', title: 'Upcoming sessions', phases: ['scheduled', 'coming-soon', 'unscheduled'], rows: [] as RegistrationWithWorkshop[] },
    { id: 'past', title: 'Past and closed sessions', phases: ['completed', 'cancelled', 'archived'], rows: [] as RegistrationWithWorkshop[] },
    { id: 'unavailable', title: 'Sessions needing schedule updates', phases: ['unavailable'], rows: [] as RegistrationWithWorkshop[] },
  ];
  for (const registration of registrations) {
    groups.find(group => group.phases.includes(workshopLifecycle(registration.workshop, now).phase))!.rows.push(registration);
  }
  for (const group of groups) group.rows.sort((a, b) => {
    const left = parseWorkshopInstant(a.workshop.startsAt);
    const right = parseWorkshopInstant(b.workshop.startsAt);
    if (left === null && right !== null) return 1;
    if (right === null && left !== null) return -1;
    return ((left ?? 0) - (right ?? 0)) * (group.id === 'past' ? -1 : 1) || a.id.localeCompare(b.id);
  });

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
              View and manage your registered workshop commitments.
            </p>
          </div>

          <button
            onClick={() => setCurrentPage('workshops')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2F6BFF] hover:bg-[#1F54E0] text-white text-sm font-semibold shadow-sm transition-all"
          >
            <span>Browse workshops</span>
          </button>
        </div>

        <button disabled={loading || registrationsRefreshing} onClick={() => reloadRegistrations()} className="mb-4 text-xs font-semibold text-[#2F6BFF] disabled:opacity-50">Refresh registrations</button>
        {registrationsRefreshing && <p role="status" className="text-sm mb-4">Refreshing registrations...</p>}
        {!error && !loading && unavailableRegistrationCount > 0 && <p role="status" className="text-sm mb-4">Some workshop details are unavailable. Your registrations are preserved.</p>}
        {/* Registered Workshops Section */}
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
              {loading || error ? '—' : registeredWorkshopIds.length} registered
            </span>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="w-full py-20 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-8 h-8 text-[#2F6BFF] animate-spin mb-3" />
              <p className="text-sm text-[#636875] dark:text-gray-400">Loading your registrations...</p>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="w-full py-16 px-6 rounded-3xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 flex flex-col items-center justify-center text-center mb-6">
              <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
              <h3 className="text-base font-bold text-red-900 dark:text-red-200 mb-1">
                Failed to load registrations
              </h3>
              <p className="text-xs text-red-600 dark:text-red-400 max-w-sm mb-4">
                {error}
              </p>
              <button
                onClick={() => reloadRegistrations()}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {/* Registration cards or Empty state */}
          {!loading && !error && (
            registrations.length > 0 ? (
              <div className="space-y-8">
                {groups.filter(group => group.rows.length > 0).map(group => <section key={group.id} aria-labelledby={`dashboard-${group.id}`}>
                  <h2 id={`dashboard-${group.id}`} className="text-lg font-bold text-[#070C1F] dark:text-white mb-4">{group.title} ({group.rows.length})</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.rows.map(reg => (
                  <DashboardWorkshopCard
                    key={reg.id}
                    registration={reg}
                    onOpenDetail={openWorkshopDetail}
                    onCancelRegistration={handleCancelRegistration}
                    mutationPending={!!registeringWorkshopId}
                    now={now}
                  />
                ))}
                  </div>
                </section>)}
              </div>
            ) : (
              <div className="w-full py-16 px-6 rounded-3xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#F3F4F7] dark:bg-white/5 text-[#636875] flex items-center justify-center mb-3">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#070C1F] dark:text-white mb-1">
                  {unavailableRegistrationCount > 0 ? 'Workshop details unavailable' : "You haven't registered for any workshops yet"}
                </h3>
                <p className="text-xs text-[#636875] dark:text-gray-400 max-w-sm mb-6">
                  {unavailableRegistrationCount > 0 ? 'Refresh registrations to try loading their details again.' : 'Explore upcoming engineering builds and register for your next live session.'}
                </p>
                <button
                  onClick={() => setCurrentPage('workshops')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2F6BFF] text-white text-xs font-semibold hover:bg-[#1F54E0] transition-colors shadow-sm"
                >
                  <span>Browse workshops</span>
                </button>
              </div>
            )
          )}
        </div>

      </div>

    </div>
  );
};
