import React, { useState } from 'react';
import { useWorkify } from '../../context/WorkifyContext';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  ExternalLink,
  Share2,
  Check,
  AlertCircle
} from 'lucide-react';

export const WorkshopDetailPage: React.FC = () => {
  const {
    selectedWorkshopId,
    workshops,
    setCurrentPage,
    registeredWorkshopIds,
    registerForWorkshop,
    unregisterFromWorkshop
  } = useWorkify();

  const [copiedLink, setCopiedLink] = useState(false);

  const workshop = workshops.find(w => w.id === selectedWorkshopId) || workshops[0];
  const isRegistered = registeredWorkshopIds.includes(workshop.id);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAddToCalendar = () => {
    const title = encodeURIComponent(workshop.title);
    const details = encodeURIComponent(workshop.fullDescription + '\n\nJoin: ' + workshop.meetUrl);
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${encodeURIComponent(workshop.meetUrl)}`;
    window.open(gCalUrl, '_blank');
  };

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
                {workshop.domainLabel}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#8B4CFF]/10 text-[#8B4CFF]">
                {workshop.level}
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-5 border-y border-[#DDE0E8]/70 dark:border-white/10 mb-8 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2F6BFF]/10 text-[#2F6BFF] flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-[#636875] dark:text-gray-400">Date & Time</p>
                <p className="font-semibold text-[#070C1F] dark:text-white">{workshop.dateTime}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#8B4CFF]/10 text-[#8B4CFF] flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-[#636875] dark:text-gray-400">Duration</p>
                <p className="font-semibold text-[#070C1F] dark:text-white">
                  {workshop.durationMinutes ? `${workshop.durationMinutes} minutes` : 'To be announced'}
                </p>
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

          {/* Action CTAs: Register, Registered State, Join Meet, Add to Calendar */}
          <div className="flex flex-wrap items-center gap-4">
            {isRegistered ? (
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-emerald-500 text-white font-semibold text-sm shadow-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Registered ✓</span>
                </div>

                <a
                  href={workshop.meetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-[#2F6BFF] hover:bg-[#1F54E0] text-white font-semibold text-sm shadow-md transition-colors"
                >
                  <Video className="w-4 h-4" />
                  <span>Join Google Meet</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </a>

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
                className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-[#2F6BFF] hover:bg-[#1F54E0] text-white font-semibold text-sm shadow-md transition-all duration-200"
              >
                <span>Register for workshop</span>
              </button>
            )}

            <button
              onClick={handleAddToCalendar}
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-white dark:bg-white/5 border border-[#DDE0E8] dark:border-white/10 text-[#070C1F] dark:text-white font-semibold text-sm hover:bg-[#F3F4F7] dark:hover:bg-white/10 transition-colors"
            >
              <Calendar className="w-4 h-4 text-[#8B4CFF]" />
              <span>Add to Google Calendar</span>
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-[#636875] dark:text-gray-400">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Workshops run live over Google Meet. The Join button activates 10 minutes prior to session start.</span>
          </div>
        </div>

        {/* Content Columns: Curriculum & Host */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 2 Cols: Full Description & Agenda */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview */}
            <div className="rounded-3xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 p-8">
              <h2 className="text-xl font-bold text-[#070C1F] dark:text-white mb-4 font-['Plus_Jakarta_Sans',sans-serif]">
                About this build
              </h2>
              <p className="text-sm text-[#636875] dark:text-gray-300 leading-relaxed mb-6">
                {workshop.fullDescription}
              </p>

              <h3 className="text-sm font-bold text-[#070C1F] dark:text-white uppercase tracking-wider mb-3">
                Technologies & Tools
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
            </div>

            {/* Agenda Timeline */}
            {workshop.agenda && workshop.agenda.length > 0 && (
              <div className="rounded-3xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 p-8">
                <h2 className="text-xl font-bold text-[#070C1F] dark:text-white mb-6 font-['Plus_Jakarta_Sans',sans-serif]">
                  Syllabus & Live Agenda
                </h2>

                <div className="space-y-6">
                  {workshop.agenda.map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-[#2F6BFF]/10 text-[#2F6BFF] text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </div>
                        {idx < workshop.agenda!.length - 1 && (
                          <div className="w-0.5 flex-1 bg-[#DDE0E8] dark:bg-white/10 my-1"></div>
                        )}
                      </div>
                      <div className="pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-semibold text-[#8B4CFF]">{item.time}</span>
                          <span className="text-xs text-[#636875] dark:text-gray-400">·</span>
                          <h3 className="text-sm font-bold text-[#070C1F] dark:text-white">{item.title}</h3>
                        </div>
                        <p className="text-xs text-[#636875] dark:text-gray-400">{item.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prerequisites */}
            {workshop.prerequisites && workshop.prerequisites.length > 0 && (
              <div className="rounded-3xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 p-8">
                <h2 className="text-xl font-bold text-[#070C1F] dark:text-white mb-4 font-['Plus_Jakarta_Sans',sans-serif]">
                  Prerequisites & Setup
                </h2>
                <ul className="space-y-2.5">
                  {workshop.prerequisites.map((p, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-[#636875] dark:text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-[#2F6BFF] shrink-0 mt-0.5" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Col: Host Profile */}
          <div className="space-y-6">
            {/* Host Card */}
            <div className="rounded-3xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 p-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#636875] dark:text-gray-400 mb-4">
                Instructor
              </h2>

              <div className="flex items-center gap-3.5 mb-4">
                <img
                  src={workshop.host.avatarUrl || '/workify-logo.png'}
                  alt={workshop.host.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-[#DDE0E8] dark:border-white/20"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-[#070C1F] dark:text-white text-base">
                      {workshop.host.name}
                    </h3>
                    {workshop.host.verified && (
                      <CheckCircle2 className="w-4 h-4 text-[#2F6BFF]" />
                    )}
                  </div>
                  <p className="text-xs text-[#636875] dark:text-gray-400">{workshop.host.role}</p>
                  <p className="text-xs font-semibold text-[#8B4CFF]">{workshop.host.organization}</p>
                </div>
              </div>

              <p className="text-xs text-[#636875] dark:text-gray-300 leading-relaxed">
                Practitioner and engineering lead building production AI workflows and training next-generation software builders.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
