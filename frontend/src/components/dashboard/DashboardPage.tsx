import React, { useEffect, useState, useCallback } from 'react';
import { useWorkify } from '../../context/WorkifyContext';
import { formatWorkshopDateIST } from '../../api/workshops';
import { listUserRegistrationsWithWorkshops } from '../../api/registrations';
import { getWorkshopMeetUrl, getJoinState, type JoinState } from '../../api/links';
import { listUserLinkedInReviews } from '../../api/reviews';
import type { RegistrationWithWorkshop, LinkedInReview } from '../../types';
import { LinkedInReviewModal } from '../reviews/LinkedInReviewModal';
import {
  Calendar,
  Clock,
  Sparkles,
  Loader2,
  AlertCircle,
  Video,
  ExternalLink,
  Award
} from 'lucide-react';

interface DashboardWorkshopCardProps {
  registration: RegistrationWithWorkshop;
  review?: LinkedInReview | null;
  onOpenDetail: (id: string) => void;
  onCancelRegistration: (id: string) => void;
  onOpenReview: (w: { id: string; title: string }, review: LinkedInReview | null) => void;
}

const DashboardWorkshopCard: React.FC<DashboardWorkshopCardProps> = ({
  registration,
  review,
  onOpenDetail,
  onCancelRegistration,
  onOpenReview,
}) => {
  const w = registration.workshop;
  const dateFormatted = formatWorkshopDateIST(w.startsAt, w.endsAt);
  const [meetUrl, setMeetUrl] = useState<string | null>(null);
  const [joinState, setJoinState] = useState<JoinState>({ status: 'no_link' });

  // Fetch Meet URL for registered workshop
  useEffect(() => {
    let isMounted = true;
    getWorkshopMeetUrl(w.id).then(url => {
      if (isMounted) setMeetUrl(url);
    });
    return () => {
      isMounted = false;
    };
  }, [w.id]);

  // Compute join state and refresh periodically
  useEffect(() => {
    const updateState = () => {
      const state = getJoinState(w.startsAt, w.endsAt, meetUrl);
      setJoinState(state);
    };

    updateState();
    const interval = setInterval(updateState, 60 * 1000);
    return () => clearInterval(interval);
  }, [w.startsAt, w.endsAt, meetUrl]);

  return (
    <div className="rounded-3xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 p-6 flex flex-col justify-between shadow-sm card-hover-elevation">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#8B4CFF]/10 text-[#8B4CFF]">
            {w.tags.length > 0 ? w.tags[0] : 'Workshop'}
          </span>
          <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md">
            <span>Registered ✓</span>
          </div>
        </div>

        <h3
          onClick={() => onOpenDetail(w.id)}
          className="text-lg font-bold text-[#070C1F] dark:text-white hover:text-[#2F6BFF] cursor-pointer transition-colors mb-2 font-['Plus_Jakarta_Sans',sans-serif]"
        >
          {w.title}
        </h3>

        <p className="text-xs text-[#636875] dark:text-gray-400 line-clamp-2 mb-4">
          {w.shortDescription}
        </p>

        <div className="flex items-center gap-2 text-xs text-[#636875] dark:text-gray-400 mb-4">
          <Clock className="w-3.5 h-3.5 text-[#2F6BFF]" />
          <span>{dateFormatted}</span>
        </div>
      </div>

      <div className="pt-4 border-t border-[#DDE0E8]/60 dark:border-white/10 flex flex-col gap-3">
        {/* Join action area */}
        <div className="flex items-center justify-between">
          {joinState.status === 'active' && (
            <a
              href={joinState.meetUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2F6BFF] hover:bg-[#1F54E0] text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Join Meet</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          )}

          {joinState.status === 'upcoming' && (
            <span className="text-xs text-[#636875] dark:text-gray-400">
              Starts {formatWorkshopDateIST(w.startsAt, null)}
            </span>
          )}

          {joinState.status === 'ended' && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] text-[#636875] dark:text-gray-400">
                Workshop ended
              </span>
              {review ? (
                <button
                  type="button"
                  onClick={() => onOpenReview({ id: w.id, title: w.title }, review)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-bold border border-purple-500/20 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>View Review ({review.overallScore}/100)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenReview({ id: w.id, title: w.title }, null)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#8B4CFF] to-[#2F6BFF] hover:opacity-90 text-white text-xs font-bold shadow-sm transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Get your LinkedIn review</span>
                </button>
              )}
            </div>
          )}

          {joinState.status === 'no_link' && (
            <span className="text-xs text-[#636875] dark:text-gray-400">
              Link will be shared soon
            </span>
          )}

          <button
            onClick={() => onCancelRegistration(w.id)}
            className="text-xs text-[#636875] hover:text-red-500 underline self-start"
          >
            Cancel
          </button>
        </div>

        <button
          onClick={() => onOpenDetail(w.id)}
          className="text-xs font-semibold text-[#2F6BFF] hover:text-[#1F54E0] self-start"
        >
          View details →
        </button>
      </div>
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const {
    isLoggedIn,
    authUser,
    unregisterFromWorkshop,
    openWorkshopDetail,
    setIsAuthModalOpen,
    setCurrentPage,
    registeredWorkshopIds
  } = useWorkify();

  const [registrations, setRegistrations] = useState<RegistrationWithWorkshop[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      setCurrentPage('landing');
      setIsAuthModalOpen(true);
    }
  }, [isLoggedIn, setCurrentPage, setIsAuthModalOpen]);

  const loadData = useCallback(async () => {
    if (!authUser) {
      setRegistrations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await listUserRegistrationsWithWorkshops();
      setRegistrations(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load registered workshops';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    loadData();
  }, [loadData, registeredWorkshopIds]);

  if (!isLoggedIn) {
    return null;
  }

  const handleCancelRegistration = async (workshopId: string) => {
    await unregisterFromWorkshop(workshopId);
    setRegistrations(prev => prev.filter(r => r.workshopId !== workshopId));
  };

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
              {registrations.length} registered
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
                onClick={() => loadData()}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {/* Registration cards or Empty state */}
          {!loading && !error && (
            registrations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {registrations.map(reg => (
                  <DashboardWorkshopCard
                    key={reg.id}
                    registration={reg}
                    onOpenDetail={openWorkshopDetail}
                    onCancelRegistration={handleCancelRegistration}
                  />
                ))}
              </div>
            ) : (
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
            )
          )}
        </div>

      </div>
    </div>
  );
};
