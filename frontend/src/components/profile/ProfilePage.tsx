import React, { useState, useEffect, useCallback } from 'react';
import { useWorkify } from '../../context/WorkifyContext';
import { ProfileEditForm } from './ProfileEditForm';
import { listUserRegistrationsWithWorkshops } from '../../api/registrations';
import { formatWorkshopDateIST } from '../../api/workshops';
import { listUserLinkedInReviews } from '../../api/reviews';
import type { RegistrationWithWorkshop, UserProfile, LinkedInReview } from '../../types';
import { LinkedInReviewModal, getBandColor } from '../reviews/LinkedInReviewModal';
import {
  ExternalLink,
  Globe,
  Share2,
  Check,
  Sparkles,
  Edit3,
  Clock,
  MapPin,
  GraduationCap,
  Loader2,
  ArrowRight
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { userProfile, setUserProfile, reloadProfile, authUser, openWorkshopDetail } = useWorkify();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [registrations, setRegistrations] = useState<RegistrationWithWorkshop[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(true);

  // Reviews state
  const [reviews, setReviews] = useState<LinkedInReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewModalWorkshop, setReviewModalWorkshop] = useState<{ id: string; title: string } | null>(null);
  const [activeReviewForModal, setActiveReviewForModal] = useState<LinkedInReview | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const displayHandle = userProfile.handle ? `@${userProfile.handle.replace(/^@/, '')}` : '';

  const handleShare = () => {
    const url = displayHandle
      ? `${window.location.origin}?profile=${userProfile.handle.replace(/^@/, '')}`
      : window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadRegisteredWorkshops = useCallback(async () => {
    if (!authUser) {
      setRegistrations([]);
      setLoadingRegistrations(false);
      return;
    }
    setLoadingRegistrations(true);
    try {
      const data = await listUserRegistrationsWithWorkshops();
      setRegistrations(data);
    } catch (err) {
      console.error('Failed to load registered workshops on profile:', err);
    } finally {
      setLoadingRegistrations(false);
    }
  }, [authUser]);

  const loadReviews = useCallback(async () => {
    if (!authUser) {
      setReviews([]);
      setLoadingReviews(false);
      return;
    }
    setLoadingReviews(true);
    try {
      const data = await listUserLinkedInReviews();
      setReviews(data);
    } catch (err) {
      console.error('Failed to load user reviews on profile:', err);
    } finally {
      setLoadingReviews(false);
    }
  }, [authUser]);

  useEffect(() => {
    loadRegisteredWorkshops();
    loadReviews();
  }, [loadRegisteredWorkshops, loadReviews]);

  const handleOpenReviewModal = (workshop: { id: string; title: string }, review: LinkedInReview | null) => {
    setReviewModalWorkshop(workshop);
    setActiveReviewForModal(review);
    setIsReviewModalOpen(true);
  };

  const handleReviewSuccess = (newReview: LinkedInReview) => {
    setReviews(prev => {
      const exists = prev.some(r => r.id === newReview.id);
      if (exists) {
        return prev.map(r => (r.id === newReview.id ? newReview : r));
      }
      return [newReview, ...prev];
    });
    setActiveReviewForModal(newReview);
  };

  const handleSavedProfile = (updated: UserProfile) => {
    setUserProfile(updated);
    setIsEditing(false);
    reloadProfile();
  };

  return (
    <div className="w-full py-10 md:py-16 bg-[#FAFAFC] dark:bg-[#070C1F] min-h-[calc(100vh-4rem)] transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Profile Header Hero Card */}
        <div className="rounded-3xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 p-8 sm:p-10 mb-8 shadow-sm relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#2F6BFF]/10 to-[#8B4CFF]/10 rounded-full blur-3xl pointer-events-none"></div>

          {isEditing ? (
            <div>
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#DDE0E8] dark:border-white/10">
                <h2 className="text-xl font-bold text-[#070C1F] dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
                  Edit Profile
                </h2>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-[#636875] hover:text-[#070C1F] dark:text-gray-400 dark:hover:text-white font-semibold"
                >
                  Cancel
                </button>
              </div>

              <ProfileEditForm
                userProfile={userProfile}
                onSaved={handleSavedProfile}
                onCancel={() => setIsEditing(false)}
              />
            </div>
          ) : (
            <>
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
                      {displayHandle && (
                        <span className="text-sm font-semibold text-[#8B4CFF] bg-[#8B4CFF]/10 px-2.5 py-0.5 rounded-full">
                          {displayHandle}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#636875] dark:text-gray-400 mt-2">
                      {userProfile.college && (
                        <span className="inline-flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-[#2F6BFF]" />
                          <span>{userProfile.college}</span>
                        </span>
                      )}
                      {userProfile.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#2F6BFF]" />
                          <span>{userProfile.location}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions: Edit & Share Profile */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2F6BFF] hover:bg-[#1F54E0] text-white text-xs font-semibold transition-colors shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F3F4F7] dark:bg-white/10 hover:bg-[#DDE0E8] dark:hover:bg-white/15 text-[#070C1F] dark:text-white text-xs font-semibold transition-colors shadow-sm"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5 text-[#2F6BFF]" />}
                    <span>{copied ? 'Copied!' : 'Share'}</span>
                  </button>
                </div>
              </div>

              {userProfile.bio ? (
                <p className="text-sm text-[#636875] dark:text-gray-300 leading-relaxed max-w-3xl mb-8 whitespace-pre-line">
                  {userProfile.bio}
                </p>
              ) : (
                <p className="text-xs text-[#636875] dark:text-gray-400 italic mb-8">
                  No bio added yet. Click "Edit Profile" to tell others about yourself.
                </p>
              )}

              {/* Social Links */}
              <div className="pt-6 border-t border-[#DDE0E8]/70 dark:border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex flex-wrap items-center gap-4 text-[#636875] dark:text-gray-300">
                  {userProfile.links.linkedin && (
                    <a
                      href={userProfile.links.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 hover:text-[#2F6BFF] transition-colors"
                    >
                      <span className="font-semibold text-xs">LinkedIn</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  {userProfile.links.x && (
                    <a
                      href={userProfile.links.x}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 hover:text-[#2F6BFF] transition-colors"
                    >
                      <span className="font-semibold text-xs">X / Twitter</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  {userProfile.links.website && (
                    <a
                      href={userProfile.links.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 hover:text-[#2F6BFF] transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5 text-[#2F6BFF]" />
                      <span>Website</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  {!userProfile.links.linkedin && !userProfile.links.x && !userProfile.links.website && (
                    <span className="text-xs text-[#636875] dark:text-gray-500">
                      No social links added yet.
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 2 Column Layout: Verified Proofs & Skills */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 2 Cols: Registered Workshops & Verified Proof of Skills */}
          <div className="lg:col-span-2 space-y-6">
            {/* Registered Workshops on Profile */}
            <div className="rounded-3xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#070C1F] dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
                  Registered Workshops
                </h2>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {registrations.length}
                </span>
              </div>

              {loadingRegistrations ? (
                <p className="text-xs text-[#636875] dark:text-gray-400">Loading registered sessions...</p>
              ) : registrations.length > 0 ? (
                <div className="space-y-3">
                  {registrations.map(reg => {
                    const w = reg.workshop;
                    const dateFormatted = formatWorkshopDateIST(w.startsAt, w.endsAt);
                    return (
                      <div
                        key={reg.id}
                        onClick={() => openWorkshopDetail(w.id)}
                        className="p-4 rounded-2xl bg-[#F3F4F7] dark:bg-white/5 hover:bg-[#DDE0E8]/40 dark:hover:bg-white/10 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <h4 className="text-sm font-bold text-[#070C1F] dark:text-white">
                            {w.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-[#636875] dark:text-gray-400 mt-1">
                            <Clock className="w-3 h-3 text-[#2F6BFF]" />
                            <span>{dateFormatted}</span>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-[#2F6BFF] self-start sm:self-auto">
                          View details →
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#636875] dark:text-gray-400">
                  Not registered for any workshops yet.
                </p>
              )}
            </div>

            {/* LinkedIn Review Card */}
            <div className="rounded-3xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#070C1F] dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
                      LinkedIn Review
                    </h2>
                    <p className="text-xs text-[#636875] dark:text-gray-400">
                      AI profile critique scored against workshop rubric
                    </p>
                  </div>
                </div>
              </div>

              {loadingReviews ? (
                <div className="py-6 flex items-center justify-center gap-2 text-xs text-[#636875] dark:text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin text-[#2F6BFF]" />
                  <span>Loading review...</span>
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map(rev => (
                    <div
                      key={rev.id}
                      className="p-5 rounded-2xl bg-[#F3F4F7] dark:bg-white/5 border border-[#DDE0E8]/70 dark:border-white/10 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DDE0E8]/60 dark:border-white/10">
                        <div>
                          <h4 className="text-sm font-bold text-[#070C1F] dark:text-white">
                            {rev.workshopTitle || 'LinkedIn Workshop'}
                          </h4>
                          <span className="text-[11px] text-[#636875] dark:text-gray-400">
                            Evaluated {new Date(rev.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 self-start sm:self-auto">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getBandColor(rev.band)}`}>
                            {rev.band}
                          </span>
                          <div className="text-right">
                            <span className="text-xl font-extrabold text-[#070C1F] dark:text-white">
                              {rev.overallScore}
                            </span>
                            <span className="text-xs text-[#636875] dark:text-gray-400 font-semibold"> / 100</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-white dark:bg-[#070C1F] border border-[#DDE0E8]/60 dark:border-white/10 space-y-1">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px] uppercase tracking-wider block">
                            Key Strengths
                          </span>
                          <p className="text-[#636875] dark:text-gray-300 whitespace-pre-line leading-relaxed text-[11px]">
                            {rev.strengths}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-white dark:bg-[#070C1F] border border-[#DDE0E8]/60 dark:border-white/10 space-y-1">
                          <span className="font-bold text-purple-600 dark:text-purple-400 text-[11px] uppercase tracking-wider block">
                            Actionable Improvements
                          </span>
                          <p className="text-[#636875] dark:text-gray-300 whitespace-pre-line leading-relaxed text-[11px]">
                            {rev.improvements}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenReviewModal({ id: rev.workshopId, title: rev.workshopTitle || 'LinkedIn Workshop' }, rev)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2F6BFF] hover:text-[#1F54E0] transition-colors"
                      >
                        <span>View full rubric breakdown</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-[#F3F4F7] dark:bg-white/5 border border-dashed border-[#DDE0E8] dark:border-white/10 text-center space-y-3">
                  <p className="text-xs text-[#636875] dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                    {registrations.some(r => r.workshop.endsAt && new Date() > new Date(r.workshop.endsAt))
                      ? 'Your workshop has concluded! You are eligible to submit your LinkedIn profile for an AI evaluation.'
                      : 'Complete a workshop to receive your personalized LinkedIn profile evaluation and score.'}
                  </p>

                  {registrations.find(r => r.workshop.endsAt && new Date() > new Date(r.workshop.endsAt)) && (
                    <button
                      onClick={() => {
                        const endedReg = registrations.find(r => r.workshop.endsAt && new Date() > new Date(r.workshop.endsAt));
                        if (endedReg) {
                          handleOpenReviewModal({ id: endedReg.workshop.id, title: endedReg.workshop.title }, null);
                        }
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B4CFF] to-[#2F6BFF] hover:opacity-90 text-white text-xs font-bold shadow-sm transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Get your LinkedIn review</span>
                    </button>
                  )}
                </div>
              )}
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

              {userProfile.skills && userProfile.skills.length > 0 ? (
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
              ) : (
                <p className="text-xs text-[#636875] dark:text-gray-400">
                  No skills listed yet. Add skills in edit mode.
                </p>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* LinkedIn Review Modal */}
      {reviewModalWorkshop && (
        <LinkedInReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setReviewModalWorkshop(null);
          }}
          workshop={reviewModalWorkshop}
          initialLinkedinUrl={userProfile.links.linkedin}
          existingReview={activeReviewForModal}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
};
