import React, { useState } from 'react';
import { useWorkify } from '../../context/WorkifyContext';
import {
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Globe,
  Share2,
  Check,
  Award,
  Terminal,
  Code2,
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
                <div className="absolute -bottom-1 -right-1 p-1 bg-white dark:bg-[#0B1533] rounded-full shadow">
                  <CheckCircle2 className="w-5 h-5 text-[#2F6BFF] fill-[#2F6BFF]/10" />
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#070C1F] dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
                    {userProfile.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified Builder</span>
                  </span>
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

            <div className="font-mono text-[11px] text-[#636875] dark:text-gray-400 bg-[#F3F4F7] dark:bg-white/5 px-3 py-1.5 rounded-lg border border-[#DDE0E8] dark:border-white/10">
              DID: <span className="text-[#070C1F] dark:text-gray-200 font-bold">{userProfile.verifiedId}</span>
            </div>
          </div>
        </div>

        {/* 2 Column Layout: Verified Proofs & Skills */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 2 Cols: Cryptographic Credentials */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#070C1F] dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
                  Verified Proof of Builds
                </h2>
                <p className="text-xs text-[#636875] dark:text-gray-400">
                  Tamper-proof credentials issued upon working code submission
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#8B4CFF]/10 text-[#8B4CFF]">
                {userProfile.credentials.length} verified
              </span>
            </div>

            <div className="space-y-4">
              {userProfile.credentials.map((cred) => (
                <div
                  key={cred.id}
                  className="rounded-3xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 p-6 shadow-sm flex flex-col justify-between card-hover-elevation"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2F6BFF] to-[#8B4CFF] flex items-center justify-center text-white shadow-md shrink-0">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-[#070C1F] dark:text-white text-base">
                            {cred.title}
                          </h3>
                        </div>
                        <p className="text-xs text-[#636875] dark:text-gray-400">
                          Issued by {cred.issuer} · {cred.dateAwarded}
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                      {cred.badgeType}
                    </span>
                  </div>

                  {/* Skills badges */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {cred.skills.map((s) => (
                      <span
                        key={s}
                        className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-[#F3F4F7] dark:bg-white/5 text-[#070C1F] dark:text-gray-300"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Footer with Hash & Code Build Link */}
                  <div className="pt-3 border-t border-[#DDE0E8]/60 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#636875] dark:text-gray-400">
                      <Terminal className="w-3.5 h-3.5 text-[#2F6BFF]" />
                      <span>Hash: {cred.hash}</span>
                    </div>

                    {cred.buildUrl && (
                      <a
                        href={cred.buildUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#2F6BFF] hover:text-[#1F54E0] transition-colors"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>Inspect Repo Build</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Col: Skills Graph & Verification Standard */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-[#8B4CFF]" />
                <h3 className="font-bold text-sm text-[#070C1F] dark:text-white">
                  Verified Skills
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
