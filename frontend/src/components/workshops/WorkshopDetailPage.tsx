import React, { useState, useEffect, useCallback } from 'react';
import { useWorkify } from '../../context/WorkifyContext';
import { formatWorkshopDateIST } from '../../api/workshops';
import { getWorkshopMeetUrl, getJoinState, type JoinState } from '../../api/links';
import {
  ArrowLeft,
  Calendar,
  Video,
  CheckCircle2,
  Share2,
  Check,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

export const WorkshopDetailPage: React.FC = () => {
  const {
    selectedWorkshopId,
    workshops,
    setCurrentPage,
    registeredWorkshopIds,
    registerForWorkshop,
    unregisterFromWorkshop,
    registeringWorkshopId
  } = useWorkify();

  const [copiedLink, setCopiedLink] = useState(false);
  const [meetUrl, setMeetUrl] = useState<string | null>(null);
  const [joinState, setJoinState] = useState<JoinState>({ status: 'no_link' });

  const workshop = workshops.find(w => w.id === selectedWorkshopId || w.slug === selectedWorkshopId);
  const isRegistered = workshop ? registeredWorkshopIds.includes(workshop.id) : false;
  const isComingSoon = workshop?.status === 'coming_soon';
  const isRegistering = workshop ? registeringWorkshopId === workshop.id : false;

  // Fetch Meet URL only if user is registered
  const fetchLink = useCallback(async () => {
    if (!workshop || !isRegistered) {
      setMeetUrl(null);
      return;
    }
    const url = await getWorkshopMeetUrl(workshop.id);
    setMeetUrl(url);
  }, [workshop, isRegistered]);

  useEffect(() => {
    fetchLink();
  }, [fetchLink]);

  // Update join state every minute to handle time-based window transitions
  useEffect(() => {
    if (!workshop) return;

    const updateState = () => {
      const state = getJoinState(workshop.startsAt, workshop.endsAt, meetUrl);
      setJoinState(state);
    };

    updateState();
    const interval = setInterval(updateState, 60 * 1000);
    return () => clearInterval(interval);
  }, [workshop, meetUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAddToCalendar = () => {
    if (!workshop || !workshop.startsAt) return;
    const title = encodeURIComponent(workshop.title);
    const details = encodeURIComponent(workshop.fullDescription);
    const startIso = workshop.startsAt.replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endIso = workshop.endsAt
      ? workshop.endsAt.replace(/[-:]/g, '').split('.')[0] + 'Z'
      : startIso;
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=Google+Meet`;
    window.open(gCalUrl, '_blank');
  };

  if (!workshop) {
    return (
      <div className="w-full py-16 bg-[#FAFAFC] dark:bg-[#070C1F] min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center">
        <p className="text-base text-[#636875] dark:text-gray-400 mb-4">Workshop not found.</p>
        <button
          onClick={() => setCurrentPage('workshops')}
          className="px-5 py-2 rounded-xl bg-[#2F6BFF] text-white text-xs font-semibold hover:bg-[#1F54E0] transition-colors"
        >
          Back to all workshops
        </button>
      </div>
    );
  }

  const dateFormatted = formatWorkshopDateIST(workshop.startsAt, workshop.endsAt);

  return (
    <div className="w-full py-10 md:py-16 bg-[#FAFAFC] dark:bg-[#070C1F] min-h-[calc(100vh-4rem)] transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <button
          onClick={() => setCurrentPage('workshops')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#636875] dark:text-gray-400 hover:text-[#070C1F] dark:hover:text-white mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to all workshops</span>
        </button>

        {/* Main Header Card */}
        <div className="rounded-3xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 p-8 sm:p-10 mb-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#2F6BFF]/10 text-[#2F6BFF] uppercase tracking-wider">
                {workshop.tags.length > 0 ? workshop.tags[0] : 'Workshop'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#8B4CFF]/10 text-[#8B4CFF]">
                {workshop.status === 'open' ? 'Live Session' : workshop.status === 'coming_soon' ? 'Coming Soon' : 'Cancelled'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="p-2 rounded-xl text-[#636875] dark:text-gray-400 hover:bg-[#F3F4F7] dark:hover:bg-white/5 transition-colors text-xs flex items-center gap-1.5"
                title="Share Workshop"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Share'}</span>
              </button>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#070C1F] dark:text-white tracking-tight mb-4 font-['Plus_Jakarta_Sans',sans-serif] leading-tight">
            {workshop.title}
          </h1>

          <p className="text-base sm:text-lg text-[#636875] dark:text-gray-300 leading-relaxed mb-8 max-w-3xl">
            {workshop.shortDescription}
          </p>

          {/* Quick Meta Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-y border-[#DDE0E8]/70 dark:border-white/10 mb-8 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2F6BFF]/10 text-[#2F6BFF] flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-[#636875] dark:text-gray-400">Date & Time</p>
                <p className="font-semibold text-[#070C1F] dark:text-white">{dateFormatted}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-[#636875] dark:text-gray-400">Delivery Mode</p>
                <p className="font-semibold text-[#070C1F] dark:text-white">Online · Google Meet</p>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4">
            {isComingSoon ? (
              <span className="inline-flex items-center justify-center h-12 px-6 rounded-xl bg-[#F3F4F7] dark:bg-white/10 text-[#636875] dark:text-gray-400 font-semibold text-sm cursor-not-allowed">
                Coming soon
              </span>
            ) : isRegistered ? (
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-emerald-500 text-white font-semibold text-sm shadow-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Registered ✓</span>
                </div>

                {/* Gated Join Meet Button / Join State Indicator */}
                {joinState.status === 'active' && (
                  <a
                    href={joinState.meetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-[#2F6BFF] hover:bg-[#1F54E0] text-white font-semibold text-sm shadow-md transition-colors"
                  >
                    <Video className="w-4 h-4" />
                    <span>Join Google Meet</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </a>
                )}

                {joinState.status === 'upcoming' && (
                  <span className="inline-flex items-center gap-1.5 h-12 px-5 rounded-xl bg-[#F3F4F7] dark:bg-white/10 text-[#636875] dark:text-gray-300 text-xs font-semibold">
                    <Video className="w-3.5 h-3.5 text-blue-500" />
                    <span>Starts {formatWorkshopDateIST(workshop.startsAt, null)} (Join opens 15m prior)</span>
                  </span>
                )}

                {joinState.status === 'ended' && (
                  <span className="inline-flex items-center h-12 px-5 rounded-xl bg-gray-100 dark:bg-white/5 text-[#636875] dark:text-gray-400 text-xs font-semibold">
                    Workshop ended
                  </span>
                )}

                {joinState.status === 'no_link' && (
                  <span className="inline-flex items-center h-12 px-5 rounded-xl bg-[#F3F4F7] dark:bg-white/10 text-[#636875] dark:text-gray-300 text-xs font-semibold">
                    Link will be shared soon
                  </span>
                )}

                <button
                  onClick={() => unregisterFromWorkshop(workshop.id)}
                  className="text-xs text-[#636875] hover:text-red-500 underline ml-2"
                >
                  Cancel registration
                </button>
              </div>
            ) : (
              <button
                onClick={() => registerForWorkshop(workshop.id)}
                disabled={isRegistering}
                className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-[#2F6BFF] hover:bg-[#1F54E0] disabled:opacity-50 text-white font-semibold text-sm shadow-md transition-all duration-200"
              >
                <span>{isRegistering ? 'Registering...' : 'Register for workshop'}</span>
              </button>
            )}

            {workshop.startsAt && !isComingSoon && (
              <button
                onClick={handleAddToCalendar}
                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-white dark:bg-white/5 border border-[#DDE0E8] dark:border-white/10 text-[#070C1F] dark:text-white font-semibold text-sm hover:bg-[#F3F4F7] dark:hover:bg-white/10 transition-colors"
              >
                <Calendar className="w-4 h-4 text-[#8B4CFF]" />
                <span>Add to Google Calendar</span>
              </button>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-[#636875] dark:text-gray-400">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Workshops run live over Google Meet. Gated link opens 15 minutes before session starts until conclusion.</span>
          </div>
        </div>

        {/* Content Columns: Curriculum & Host */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 2 Cols: Full Description */}
          <div className="lg:col-span-2 space-y-8">
            <div className="rounded-3xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 p-8">
              <h2 className="text-xl font-bold text-[#070C1F] dark:text-white mb-4 font-['Plus_Jakarta_Sans',sans-serif]">
                About this session
              </h2>
              <p className="text-sm text-[#636875] dark:text-gray-300 leading-relaxed mb-6 whitespace-pre-line">
                {workshop.fullDescription}
              </p>

              {workshop.tags.length > 0 && (
                <>
                  <h3 className="text-sm font-bold text-[#070C1F] dark:text-white uppercase tracking-wider mb-3">
                    Technologies & Topics
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {workshop.tags.map(t => (
                      <span
                        key={t}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-[#F3F4F7] dark:bg-white/5 text-[#070C1F] dark:text-gray-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Col: Host Profile */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 p-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#636875] dark:text-gray-400 mb-4">
                Host
              </h2>

              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-[#2F6BFF]/10 text-[#2F6BFF] flex items-center justify-center font-bold text-xl border border-[#DDE0E8] dark:border-white/20">
                  {workshop.hostName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-[#070C1F] dark:text-white text-base">
                    {workshop.hostName}
                  </h3>
                  <p className="text-xs text-[#636875] dark:text-gray-400">Workshop Instructor</p>
                </div>
              </div>

              <p className="text-xs text-[#636875] dark:text-gray-300 leading-relaxed">
                Practitioner leading live, interactive sessions for engineering builders.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
