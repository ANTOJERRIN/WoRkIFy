import React, { useState } from 'react';
import { useWorkify } from '../../context/WorkifyContext';
import { ProfileEditForm } from './ProfileEditForm';
import { formatWorkshopSchedule, workshopLifecycle } from '../../domain/workshopLifecycle';
import { useWorkshopClock } from '../../hooks/useWorkshopClock';
import type { UserProfile } from '../../types';
import {
  ExternalLink,
  Globe,
  Sparkles,
  Edit3,
  Clock,
  MapPin,
  GraduationCap,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { userProfile, acceptProfile, reloadProfile, profileLoading, profileRefreshing, profileError,
    registrations, registrationsLoading: loadingRegistrations, registrationsRefreshing,
    registeredWorkshopIds, unavailableRegistrationCount,
    registrationsError, reloadRegistrations, openWorkshopDetail } = useWorkify();
  const [isEditing, setIsEditing] = useState(false);
  const now = useWorkshopClock();

  const handleSavedProfile = (updated: UserProfile) => {
    acceptProfile(updated);
    setIsEditing(false);
    reloadProfile();
  };

  if (profileLoading) return <p role="status" className="py-24 text-center">Loading your profile...</p>;
  if (profileError || !userProfile) return <section className="max-w-xl mx-auto px-6 py-24 text-center">
    <h1 className="text-2xl font-bold mb-4">{profileError ? 'Profile could not be loaded' : 'Profile record unavailable'}</h1>
    <p role={profileError ? 'alert' : undefined} className="text-sm mb-6">{profileError ?? 'Your session is valid, but no profile record was found. Contact support if this continues.'}</p>
    <button onClick={() => reloadProfile()} className="px-5 py-3 rounded-xl bg-[#2F6BFF] text-white text-sm font-semibold">Retry profile</button>
  </section>;
  const displayHandle = userProfile.handle ? `@${userProfile.handle.replace(/^@/, '')}` : '';

  return (
    <div className="w-full py-10 md:py-16 bg-[#FAFAFC] dark:bg-[#070C1F] min-h-[calc(100vh-4rem)] transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Profile Header Hero Card */}
        <button disabled={profileRefreshing || isEditing} onClick={() => reloadProfile()} className="mb-4 text-xs font-semibold text-[#2F6BFF] disabled:opacity-50">Refresh profile</button>
        {profileRefreshing && <p role="status" className="text-sm mb-4">Refreshing profile...</p>}
        <div className="rounded-3xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 p-8 sm:p-10 mb-8 shadow-sm relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#2F6BFF]/10 to-[#8B4CFF]/10 rounded-full blur-3xl pointer-events-none"></div>

          {isEditing ? (
            <div>
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#DDE0E8] dark:border-white/10">
                <h2 className="text-xl font-bold text-[#070C1F] dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
                  Edit Profile
                </h2>
              </div>

              <ProfileEditForm
                userProfile={userProfile}
                onSaved={handleSavedProfile}
                onCancel={() => { setIsEditing(false); void reloadProfile(); }}
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

                {/* Actions: Edit Profile */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2F6BFF] hover:bg-[#1F54E0] text-white text-xs font-semibold transition-colors shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
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

        {/* 2 Column Layout: Registered Workshops & Skills */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 2 Cols: Registration History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Registered Workshops on Profile */}
            <div className="rounded-3xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#070C1F] dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
                  Registered Workshops
                </h2>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {loadingRegistrations || registrationsError ? '—' : registeredWorkshopIds.length}
                </span>
              </div>

              <p className="text-xs text-[#636875] dark:text-gray-400 mb-3">Registration history does not confirm attendance or completion.</p>

              <button disabled={registrationsRefreshing} onClick={() => reloadRegistrations()} className="mb-3 text-xs text-[#2F6BFF] disabled:opacity-50">Refresh registrations</button>
              {registrationsRefreshing && <p role="status" className="text-xs mb-3">Refreshing registrations...</p>}
              {!registrationsError && !loadingRegistrations && unavailableRegistrationCount > 0 && <p role="status" className="text-xs mb-3">Some workshop details are unavailable. Your registrations are preserved.</p>}
              {registrationsError ? (
                <div role="alert" className="text-sm text-red-600 dark:text-red-400">
                  <p>Registrations could not be loaded. {registrationsError}</p>
                  <button onClick={() => reloadRegistrations()} className="mt-2 underline">Retry registrations</button>
                </div>
              ) : loadingRegistrations ? (
                <p className="text-xs text-[#636875] dark:text-gray-400">Loading registered sessions...</p>
              ) : registrations.length > 0 ? (
                <div className="space-y-3">
                  {registrations.map(reg => {
                    const w = reg.workshop;
                    const dateFormatted = formatWorkshopSchedule(w);
                    return (
                      <button type="button"
                        key={reg.id}
                        onClick={() => openWorkshopDetail(w.id)}
                        className="w-full text-left p-4 rounded-2xl bg-[#F3F4F7] dark:bg-white/5 hover:bg-[#DDE0E8]/40 dark:hover:bg-white/10 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <h4 className="text-sm font-bold text-[#070C1F] dark:text-white">
                            {w.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-[#636875] dark:text-gray-400 mt-1">
                            <Clock className="w-3 h-3 text-[#2F6BFF]" />
                            <span>{dateFormatted}</span>
                            <span>{workshopLifecycle(w, now).label} · Registration history</span>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-[#2F6BFF] self-start sm:self-auto">
                          View details →
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#636875] dark:text-gray-400">
                  {unavailableRegistrationCount > 0 ? 'Refresh registrations to try loading their details again.' : 'Not registered for any workshops yet.'}
                </p>
              )}
            </div>

          </div>

          {/* Right Col: Profile Skills */}
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

    </div>
  );
};
