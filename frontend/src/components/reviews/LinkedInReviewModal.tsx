import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, AlertCircle, CheckCircle2, ChevronRight, Award } from 'lucide-react';
import { submitLinkedInReview } from '../../api/reviews';
import type { LinkedInReview, ReviewBand } from '../../types';

interface LinkedInReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  workshop: {
    id: string;
    title: string;
  };
  initialLinkedinUrl?: string;
  existingReview?: LinkedInReview | null;
  onSuccess: (review: LinkedInReview) => void;
}

export const getBandColor = (band: ReviewBand | string) => {
  switch (band) {
    case 'Standout':
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    case 'Strong':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'Developing':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'Needs work':
    default:
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
  }
};

export const LinkedInReviewModal: React.FC<LinkedInReviewModalProps> = ({
  isOpen,
  onClose,
  workshop,
  initialLinkedinUrl = '',
  existingReview = null,
  onSuccess,
}) => {
  const [linkedinUrl, setLinkedinUrl] = useState(initialLinkedinUrl);
  const [profileText, setProfileText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<LinkedInReview | null>(existingReview);

  useEffect(() => {
    if (existingReview) {
      setReview(existingReview);
    } else {
      setReview(null);
    }
    setLinkedinUrl(initialLinkedinUrl || '');
    setError(null);
  }, [existingReview, initialLinkedinUrl, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUrl = linkedinUrl.trim();
    if (!cleanUrl || !cleanUrl.startsWith('https://')) {
      setError('Please provide a valid LinkedIn URL starting with https://');
      return;
    }

    const cleanText = profileText.trim();
    if (cleanText.length < 80) {
      setError('Please paste at least 80 characters of your profile text (headline, about, experience, skills).');
      return;
    }

    if (cleanText.length > 12000) {
      setError('Profile text exceeds 12,000 characters. Please trim excessive text.');
      return;
    }

    setLoading(true);
    try {
      const result = await submitLinkedInReview({
        workshopId: workshop.id,
        linkedinUrl: cleanUrl,
        profileText: cleanText,
      });
      setReview(result);
      onSuccess(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Review submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 my-8 text-left max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#DDE0E8]/70 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2F6BFF]/10 text-[#2F6BFF] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#070C1F] dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
                {review ? 'LinkedIn Review Results' : 'Get your LinkedIn review'}
              </h2>
              <p className="text-xs text-[#636875] dark:text-gray-400">
                {workshop.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-[#636875] dark:text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto py-4 space-y-6 flex-1 pr-1">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-600 dark:text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {review ? (
            /* Review Results Display */
            <div className="space-y-6">
              {/* Score & Band Card */}
              <div className="p-6 rounded-2xl bg-[#F3F4F7] dark:bg-white/5 border border-[#DDE0E8] dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-[#636875] dark:text-gray-400 uppercase tracking-wider">
                    Overall Evaluation
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-extrabold text-[#070C1F] dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
                      {review.overallScore}
                    </span>
                    <span className="text-sm font-semibold text-[#636875] dark:text-gray-400">/ 100</span>
                  </div>
                </div>

                <div className="flex flex-col items-start sm:items-end gap-1">
                  <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold border ${getBandColor(review.band)}`}>
                    {review.band}
                  </span>
                  <span className="text-[11px] text-[#636875] dark:text-gray-400">
                    Graded against workshop rubric
                  </span>
                </div>
              </div>

              {/* Rubric Criteria Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#636875] dark:text-gray-400">
                  Criterion Scores
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {review.criteria && Object.entries(review.criteria).map(([key, item]) => {
                    const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
                    const pct = (item.score / 20) * 100;
                    return (
                      <div
                        key={key}
                        className="p-3.5 rounded-xl bg-white dark:bg-[#070C1F] border border-[#DDE0E8]/70 dark:border-white/10 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-[#070C1F] dark:text-white">
                          <span>{formattedKey}</span>
                          <span className="text-[#2F6BFF]">{item.score} / 20</span>
                        </div>
                        <div className="w-full bg-[#E5E7EB] dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#2F6BFF] h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-[#636875] dark:text-gray-400 leading-relaxed">
                          {item.feedback}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Strengths */}
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Key Strengths</span>
                </div>
                <div className="text-xs text-[#070C1F] dark:text-gray-300 whitespace-pre-line leading-relaxed pl-6">
                  {review.strengths}
                </div>
              </div>

              {/* Actionable Improvements */}
              <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400">
                  <Award className="w-4 h-4" />
                  <span>Prioritized Recommendations</span>
                </div>
                <div className="text-xs text-[#070C1F] dark:text-gray-300 whitespace-pre-line leading-relaxed pl-6">
                  {review.improvements}
                </div>
              </div>
            </div>
          ) : (
            /* Submission Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-[#636875] dark:text-gray-400 leading-relaxed">
                Paste your LinkedIn profile text below (Headline, About section, recent experience bullet points, and skills list). The evaluation model will review your profile strictly against the criteria taught in the workshop.
              </p>

              <div>
                <label className="block text-xs font-bold text-[#070C1F] dark:text-white mb-1.5">
                  LinkedIn Profile URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://linkedin.com/in/username"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE0E8] dark:border-white/10 bg-white dark:bg-white/5 text-[#070C1F] dark:text-white text-xs focus:outline-none focus:border-[#2F6BFF]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#070C1F] dark:text-white">
                    Pasted Profile Content <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-[#636875] dark:text-gray-400">
                    {profileText.length} / 12,000 characters
                  </span>
                </div>
                <textarea
                  required
                  rows={8}
                  placeholder={`Example content format to paste:

HEADLINE:
Full Stack Engineer | React, Node.js & Cloud | Building scalable developer tools

ABOUT:
Passionate software engineer with 2+ years of experience crafting high-performance web applications...

EXPERIENCE:
Software Engineering Fellow — ABC Tech (Jan 2025 – Present)
• Engineered real-time dashboard decreasing API query latency by 35%
• Built authentication pipeline servicing 10,000+ monthly active users

SKILLS:
React, TypeScript, Next.js, Node.js, PostgreSQL, Docker, AWS`}
                  value={profileText}
                  onChange={(e) => setProfileText(e.target.value)}
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE0E8] dark:border-white/10 bg-white dark:bg-white/5 text-[#070C1F] dark:text-white text-xs focus:outline-none focus:border-[#2F6BFF] font-mono leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#636875] hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading || profileText.trim().length < 80}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2F6BFF] hover:bg-[#1F54E0] disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Analyzing Profile...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Submit for Review</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {review && (
          <div className="pt-4 border-t border-[#DDE0E8]/70 dark:border-white/10 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#F3F4F7] dark:bg-white/10 hover:bg-[#DDE0E8] dark:hover:bg-white/20 text-[#070C1F] dark:text-white text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
