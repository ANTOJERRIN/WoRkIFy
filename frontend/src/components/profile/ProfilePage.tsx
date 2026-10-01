import React, { useState } from 'react';
import { useWorkify } from '../../context/WorkifyContext';
import {
  ExternalLink,
  Globe,
  Share2,
  Check,
  Sparkles
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { userProfile } = useWorkify();
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.origin + '?profile=' + userProfile.handle);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full py-10 md:py-16 bg-[#FAFAFC] dark:bg-[#070C1F] min-h-[calc(100vh-4rem)] transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Profile Header Hero */}
        <div className="rounded-3xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 p-8 sm:p-10 mb-8 shadow-sm relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#2F6BFF]/10 to-[#8B4CFF]/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative">
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.name}
                  className="w-24 h-24 rounded-3xl object-cover border-2 border-white dark:border-white/20 shadow-lg"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#070C1F] dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
                    {userProfile.name}
                  </h1>
                </div>

                <p className="text-sm font-semibold text-[#8B4CFF] mb-2">{userProfile.headline}</p>
                <p className="text-xs text-[#636875] dark:text-gray-400">
                  {userProfile.location} · {userProfile.companyOrSchool}
                </p>
              </div>
            </div>

            {/* Share Profile Action */}
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F3F4F7] dark:bg-white/10 hover:bg-[#DDE0E8] dark:hover:bg-white/15 text-[#070C1F] dark:text-white text-xs font-semibold transition-colors shadow-sm self-start sm:self-auto"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4 text-[#2F6BFF]" />}
              <span>{copied ? 'Profile link copied!' : 'Share Public Profile'}</span>
            </button>
          </div>

          <p className="text-sm text-[#636875] dark:text-gray-300 leading-relaxed max-w-3xl mb-8">
            {userProfile.bio}
          </p>

          {/* Social Links & Verification Hash */}
          <div className="pt-6 border-t border-[#DDE0E8]/70 dark:border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-4 text-[#636875] dark:text-gray-300">
              {userProfile.links.portfolio && (
                <a
                  href={userProfile.links.portfolio}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 hover:text-[#2F6BFF] transition-colors"
                >
                  <Globe className="w-4 h-4 text-[#2F6BFF]" />
                  <span>Portfolio</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* 2 Column Layout: Verified Proofs & Skills */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 2 Cols: Verified Proof of Skills */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 p-8 shadow-sm">
              <h2 className="text-xl font-bold text-[#070C1F] dark:text-white font-['Plus_Jakarta_Sans',sans-serif] mb-2">
                Verified proof of skills
              </h2>
              <p className="text-sm text-[#636875] dark:text-gray-400 leading-relaxed">
                In development — coming soon
              </p>
            </div>
          </div>

          {/* Right Col: Skills Graph & Verification Standard */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-[#8B4CFF]" />
                <h3 className="font-bold text-sm text-[#070C1F] dark:text-white">
                  Skills
                </h3>
              </div>

              <div className="flex flex-wrap gap-2">
                {userProfile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F3F4F7] dark:bg-white/5 border border-[#DDE0E8]/60 dark:border-white/10 text-[#070C1F] dark:text-gray-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
