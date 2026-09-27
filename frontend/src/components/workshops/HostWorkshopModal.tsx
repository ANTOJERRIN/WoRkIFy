import React, { useState } from 'react';
import { useWorkify } from '../../context/WorkifyContext';
import type { Domain, Workshop } from '../../types';
import { X, Video, Calendar, Sparkles } from 'lucide-react';

export const HostWorkshopModal: React.FC = () => {
  const { isHostModalOpen, setIsHostModalOpen, hostNewWorkshop } = useWorkify();

  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState<Domain>('AGENTS');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [dateTime, setDateTime] = useState('Friday at 7:00 PM IST');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [meetUrl, setMeetUrl] = useState('https://meet.google.com/new');
  const [prerequisitesText, setPrerequisitesText] = useState('Python 3.10+, Docker, Git');

  if (!isHostModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const domainLabelMap: Record<Domain, string> = {
      ALL: 'All Tracks',
      AGENTS: 'AI Agents',
      GEN_AI: 'Generative AI',
      AUTOMATION: 'Automation',
      CLOUD: 'Cloud & Edge',
      HUMAN_AI: 'Human + AI'
    };

    const newWorkshopData: Omit<Workshop, 'id' | 'attendeesCount'> = {
      title,
      domain,
      domainLabel: domainLabelMap[domain],
      shortDescription: shortDescription || 'Practical hands-on workshop building AI systems.',
      fullDescription: fullDescription || shortDescription || 'In this workshop, you will learn hands-on implementation details and deploy your own build.',
      dateTime,
      startsAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      durationMinutes,
      mode: 'Online — Google Meet',
      meetUrl,
      level: 'Intermediate',
      tags: [domainLabelMap[domain], 'Live Build', 'Hands-on'],
      prerequisites: prerequisitesText.split(',').map(s => s.trim()).filter(Boolean),
      agenda: [
        { time: '00:00 - 00:15', title: 'Architecture Primer', summary: 'Core concepts & system boundaries' },
        { time: '00:15 - 00:45', title: 'Hands-on Coding', summary: 'Live implementation in sandbox' },
        { time: '00:45 - 01:00', title: 'Proof Submission & Q&A', summary: 'Verifying student build artifacts' }
      ],
      host: {
        name: 'You',
        role: 'Workshop Host',
        organization: 'Independent Builder',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        verified: true
      }
    };

    hostNewWorkshop(newWorkshopData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-5 border-b border-[#DDE0E8] dark:border-white/10 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2F6BFF]/10 text-[#2F6BFF] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#070C1F] dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
                Host a Workify Workshop
              </h2>
              <p className="text-xs text-[#636875] dark:text-gray-400">
                Run an interactive live session over Google Meet
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsHostModalOpen(false)}
            className="p-1.5 rounded-xl text-[#636875] hover:text-[#070C1F] dark:text-gray-400 dark:hover:text-white hover:bg-[#F3F4F7] dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#070C1F] dark:text-white mb-1.5">
              Workshop Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Building Agent Workflows with LangGraph & FastAPI"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#070C1F] border border-[#DDE0E8] dark:border-white/10 text-sm text-[#070C1F] dark:text-white placeholder-[#636875] focus:outline-none focus:border-[#2F6BFF]"
            />
          </div>

          {/* Domain & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#070C1F] dark:text-white mb-1.5">
                Domain Track
              </label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value as Domain)}
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#070C1F] border border-[#DDE0E8] dark:border-white/10 text-sm text-[#070C1F] dark:text-white focus:outline-none focus:border-[#2F6BFF]"
              >
                <option value="AGENTS">AI Agents</option>
                <option value="GEN_AI">Generative AI</option>
                <option value="AUTOMATION">Automation</option>
                <option value="CLOUD">Cloud & Edge</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#070C1F] dark:text-white mb-1.5">
                Duration (minutes)
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#070C1F] border border-[#DDE0E8] dark:border-white/10 text-sm text-[#070C1F] dark:text-white focus:outline-none focus:border-[#2F6BFF]"
              >
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={75}>75 minutes</option>
                <option value={90}>90 minutes</option>
              </select>
            </div>
          </div>

          {/* Date / Time */}
          <div>
            <label className="block text-xs font-semibold text-[#070C1F] dark:text-white mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#8B4CFF]" />
              <span>Date & Time Display</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. This Saturday at 6:00 PM IST"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#070C1F] border border-[#DDE0E8] dark:border-white/10 text-sm text-[#070C1F] dark:text-white focus:outline-none focus:border-[#2F6BFF]"
            />
          </div>

          {/* Google Meet Link */}
          <div>
            <label className="block text-xs font-semibold text-[#070C1F] dark:text-white mb-1.5 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-emerald-500" />
              <span>Google Meet Link</span>
            </label>
            <input
              type="url"
              required
              placeholder="https://meet.google.com/..."
              value={meetUrl}
              onChange={(e) => setMeetUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#070C1F] border border-[#DDE0E8] dark:border-white/10 text-sm text-[#070C1F] dark:text-white focus:outline-none focus:border-[#2F6BFF]"
            />
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-xs font-semibold text-[#070C1F] dark:text-white mb-1.5">
              Brief Summary
            </label>
            <input
              type="text"
              placeholder="One line summary of what attendees will build..."
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#070C1F] border border-[#DDE0E8] dark:border-white/10 text-sm text-[#070C1F] dark:text-white focus:outline-none focus:border-[#2F6BFF]"
            />
          </div>

          {/* Full Description */}
          <div>
            <label className="block text-xs font-semibold text-[#070C1F] dark:text-white mb-1.5">
              Full Syllabus & Details
            </label>
            <textarea
              rows={3}
              placeholder="Detailed curriculum and what attendees will take away..."
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#070C1F] border border-[#DDE0E8] dark:border-white/10 text-sm text-[#070C1F] dark:text-white focus:outline-none focus:border-[#2F6BFF]"
            />
          </div>

          {/* Prerequisites */}
          <div>
            <label className="block text-xs font-semibold text-[#070C1F] dark:text-white mb-1.5">
              Prerequisites (comma-separated)
            </label>
            <input
              type="text"
              placeholder="Python, Node.js, API Key"
              value={prerequisitesText}
              onChange={(e) => setPrerequisitesText(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#070C1F] border border-[#DDE0E8] dark:border-white/10 text-sm text-[#070C1F] dark:text-white focus:outline-none focus:border-[#2F6BFF]"
            />
          </div>

          {/* Buttons */}
          <div className="pt-4 border-t border-[#DDE0E8] dark:border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsHostModalOpen(false)}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-[#636875] hover:bg-[#F3F4F7] dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#2F6BFF] hover:bg-[#1F54E0] text-white text-xs font-semibold shadow-md transition-colors"
            >
              Publish workshop
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
