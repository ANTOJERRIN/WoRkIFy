import React, { useState, useEffect, useCallback } from 'react';
import { useWorkify } from '../../context/WorkifyContext';
import {
  createWorkshop,
  updateWorkshop,
  cancelWorkshop,
  getAdminMeetUrl,
  setWorkshopMeetUrl,
  listWorkshopRegistrations,
  listWorkshopReviews,
  resetLinkedInReview,
  type WorkshopInput
} from '../../api/admin';
import { formatWorkshopDateIST } from '../../api/workshops';
import type { Workshop, WorkshopStatus, AdminRegistrationItem, AdminReviewItem } from '../../types';
import {
  Shield,
  Plus,
  Edit2,
  Video,
  Users,
  Star,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { isAdmin, workshops, reloadWorkshops } = useWorkify();

  const [activeTab, setActiveTab] = useState<'workshops' | 'registrations' | 'reviews'>('workshops');
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string>(workshops[0]?.id || '');
  const [registrations, setRegistrations] = useState<AdminRegistrationItem[]>([]);
  const [reviews, setReviews] = useState<AdminReviewItem[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Meet link state
  const [meetUrlInput, setMeetUrlInput] = useState('');
  const [savingMeetUrl, setSavingMeetUrl] = useState(false);
  const [meetUrlSuccess, setMeetUrlSuccess] = useState(false);

  // Workshop Form State (for Create & Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkshopId, setEditingWorkshopId] = useState<string | null>(null);
  const [formSlug, setFormSlug] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formHost, setFormHost] = useState('');
  const [formStatus, setFormStatus] = useState<WorkshopStatus>('open');
  const [formShortDesc, setFormShortDesc] = useState('');
  const [formFullDesc, setFormFullDesc] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formStartsAt, setFormStartsAt] = useState('');
  const [formEndsAt, setFormEndsAt] = useState('');
  const [submittingWorkshop, setSubmittingWorkshop] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load meet link, registrations, and reviews when selected workshop changes
  const loadWorkshopData = useCallback(async (wId: string) => {
    if (!wId) return;
    setLoadingDetails(true);
    setMeetUrlSuccess(false);
    try {
      const [url, regList, revList] = await Promise.all([
        getAdminMeetUrl(wId),
        listWorkshopRegistrations(wId),
        listWorkshopReviews(wId),
      ]);
      setMeetUrlInput(url);
      setRegistrations(regList);
      setReviews(revList);
    } catch (err) {
      console.error('Failed to load admin workshop details:', err);
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    if (selectedWorkshopId) {
      loadWorkshopData(selectedWorkshopId);
    } else if (workshops.length > 0) {
      setSelectedWorkshopId(workshops[0].id);
    }
  }, [isAdmin, selectedWorkshopId, workshops, loadWorkshopData]);

  // Non-admins see nothing
  if (!isAdmin) {
    return null;
  }

  const handleSaveMeetUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkshopId) return;
    setSavingMeetUrl(true);
    setMeetUrlSuccess(false);
    try {
      await setWorkshopMeetUrl(selectedWorkshopId, meetUrlInput);
      setMeetUrlSuccess(true);
      setTimeout(() => setMeetUrlSuccess(false), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save Meet link');
    } finally {
      setSavingMeetUrl(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingWorkshopId(null);
    setFormSlug('');
    setFormTitle('');
    setFormHost('Workify');
    setFormStatus('open');
    setFormShortDesc('');
    setFormFullDesc('');
    setFormTags('LinkedIn, Career Growth');
    setFormStartsAt('');
    setFormEndsAt('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (w: Workshop) => {
    setEditingWorkshopId(w.id);
    setFormSlug(w.slug);
    setFormTitle(w.title);
    setFormHost(w.hostName);
    setFormStatus(w.status);
    setFormShortDesc(w.shortDescription);
    setFormFullDesc(w.fullDescription);
    setFormTags(w.tags.join(', '));
    setFormStartsAt(w.startsAt ? w.startsAt.substring(0, 16) : '');
    setFormEndsAt(w.endsAt ? w.endsAt.substring(0, 16) : '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleWorkshopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingWorkshop(true);
    setFormError(null);

    const tagsArray = formTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const workshopData: WorkshopInput = {
      slug: formSlug.trim(),
      title: formTitle.trim(),
      hostName: formHost.trim(),
      status: formStatus,
      shortDescription: formShortDesc.trim(),
      fullDescription: formFullDesc.trim(),
      tags: tagsArray,
      startsAt: formStartsAt ? new Date(formStartsAt).toISOString() : null,
      endsAt: formEndsAt ? new Date(formEndsAt).toISOString() : null,
      timezone: 'Asia/Kolkata',
    };

    try {
      if (editingWorkshopId) {
        await updateWorkshop(editingWorkshopId, workshopData);
      } else {
        await createWorkshop(workshopData);
      }
      await reloadWorkshops();
      setIsModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setSubmittingWorkshop(false);
    }
  };

  const handleCancelWorkshop = async (wId: string) => {
    if (!window.confirm('Are you sure you want to cancel this workshop?')) return;
    try {
      await cancelWorkshop(wId);
      await reloadWorkshops();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Cancellation failed');
    }
  };

  const handleResetReview = async (reviewId: string) => {
    if (!window.confirm('Reset this review? The user will be able to submit a new review.')) return;
    try {
      await resetLinkedInReview(reviewId);
      setReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Reset failed');
    }
  };

  const activeWorkshop = workshops.find(w => w.id === selectedWorkshopId) || workshops[0];

  return (
    <div className="w-full py-10 md:py-16 bg-[#FAFAFC] dark:bg-[#070C1F] min-h-[calc(100vh-4rem)] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#DDE0E8] dark:border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-2 font-semibold text-xs border border-amber-500/20">
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#070C1F] dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
              Workify Management
            </h1>
            <p className="text-xs text-[#636875] dark:text-gray-400 mt-1">
              Create and manage workshops, Google Meet links, registrations, and reviews.
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2F6BFF] hover:bg-[#1F54E0] text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Workshop</span>
          </button>
        </div>

        {/* Workshop Picker Bar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[#636875] dark:text-gray-400">Managing:</span>
            <select
              value={selectedWorkshopId}
              onChange={(e) => setSelectedWorkshopId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#F3F4F7] dark:bg-white/10 border border-[#DDE0E8] dark:border-white/10 text-xs font-bold text-[#070C1F] dark:text-white focus:outline-none focus:border-[#2F6BFF]"
            >
              {workshops.map(w => (
                <option key={w.id} value={w.id} className="dark:bg-[#0B1533]">
                  {w.title} ({w.status})
                </option>
              ))}
            </select>
          </div>

          {/* Tab switches */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F3F4F7] dark:bg-white/5 border border-[#DDE0E8] dark:border-white/10 text-xs">
            <button
              onClick={() => setActiveTab('workshops')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeTab === 'workshops'
                  ? 'bg-white dark:bg-white/15 text-[#070C1F] dark:text-white shadow-sm'
                  : 'text-[#636875] dark:text-gray-400 hover:text-[#070C1F]'
              }`}
            >
              Workshops
            </button>
            <button
              onClick={() => setActiveTab('registrations')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'registrations'
                  ? 'bg-white dark:bg-white/15 text-[#070C1F] dark:text-white shadow-sm'
                  : 'text-[#636875] dark:text-gray-400 hover:text-[#070C1F]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Registrations ({registrations.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'reviews'
                  ? 'bg-white dark:bg-white/15 text-[#070C1F] dark:text-white shadow-sm'
                  : 'text-[#636875] dark:text-gray-400 hover:text-[#070C1F]'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Reviews ({reviews.length})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Workshop Management & Meet Link */}
        {activeTab === 'workshops' && (
          <div className="space-y-8">
            {/* Google Meet Link Gated Config */}
            {activeWorkshop && (
              <div className="rounded-3xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Video className="w-5 h-5 text-[#2F6BFF]" />
                  <h3 className="text-base font-bold text-[#070C1F] dark:text-white">
                    Google Meet Link for "{activeWorkshop.title}"
                  </h3>
                </div>
                <p className="text-xs text-[#636875] dark:text-gray-400 mb-4 max-w-2xl">
                  This Meet link is stored securely in <code className="text-xs bg-gray-100 dark:bg-white/10 px-1 py-0.5 rounded">workshop_links</code>. Database RLS exposes it strictly to registered users inside the 15-minute join window.
                </p>

                <form onSubmit={handleSaveMeetUrl} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="url"
                    value={meetUrlInput}
                    onChange={(e) => setMeetUrlInput(e.target.value)}
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    required
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#F3F4F7] dark:bg-[#070C1F] border border-[#DDE0E8] dark:border-white/10 text-sm text-[#070C1F] dark:text-white focus:outline-none focus:border-[#2F6BFF]"
                  />
                  <button
                    type="submit"
                    disabled={savingMeetUrl}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#2F6BFF] hover:bg-[#1F54E0] disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-sm"
                  >
                    {savingMeetUrl ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Meet Link</span>
                    )}
                  </button>
                </form>

                {meetUrlSuccess && (
                  <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Meet link saved successfully!</span>
                  </p>
                )}
              </div>
            )}

            {/* Workshops Table */}
            <div className="rounded-3xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 p-6 sm:p-8 shadow-sm">
              <h3 className="text-base font-bold text-[#070C1F] dark:text-white mb-4">
                All Workshops
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#DDE0E8] dark:border-white/10 text-[#636875] dark:text-gray-400 font-semibold">
                      <th className="pb-3">Title</th>
                      <th className="pb-3">Slug</th>
                      <th className="pb-3">Host</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Schedule (IST)</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDE0E8]/60 dark:divide-white/5">
                    {workshops.map(w => (
                      <tr key={w.id} className="hover:bg-[#F3F4F7]/60 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3 font-semibold text-[#070C1F] dark:text-white">
                          {w.title}
                        </td>
                        <td className="py-3 font-mono text-[11px] text-[#636875] dark:text-gray-400">
                          {w.slug}
                        </td>
                        <td className="py-3 text-[#636875] dark:text-gray-300">
                          {w.hostName}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            w.status === 'open'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : w.status === 'coming_soon'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : 'bg-red-500/10 text-red-600 dark:text-red-400'
                          }`}>
                            {w.status}
                          </span>
                        </td>
                        <td className="py-3 text-[#636875] dark:text-gray-400">
                          {formatWorkshopDateIST(w.startsAt, w.endsAt)}
                        </td>
                        <td className="py-3 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEditModal(w)}
                            className="p-1 rounded-lg text-[#2F6BFF] hover:bg-[#2F6BFF]/10 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {w.status !== 'cancelled' && (
                            <button
                              onClick={() => handleCancelWorkshop(w.id)}
                              className="text-[11px] text-red-600 dark:text-red-400 hover:underline"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Registrations */}
        {activeTab === 'registrations' && (
          <div className="rounded-3xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#070C1F] dark:text-white">
                Attendees for "{activeWorkshop?.title}" ({registrations.length})
              </h3>
              <button
                onClick={() => selectedWorkshopId && loadWorkshopData(selectedWorkshopId)}
                className="p-1.5 rounded-xl bg-[#F3F4F7] dark:bg-white/10 hover:bg-[#DDE0E8] text-[#636875] dark:text-gray-300"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingDetails ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingDetails ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-6 h-6 text-[#2F6BFF] animate-spin" />
              </div>
            ) : registrations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#DDE0E8] dark:border-white/10 text-[#636875] dark:text-gray-400 font-semibold">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Handle</th>
                      <th className="pb-3">LinkedIn</th>
                      <th className="pb-3">Registered At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDE0E8]/60 dark:divide-white/5">
                    {registrations.map(r => (
                      <tr key={r.id} className="hover:bg-[#F3F4F7]/60 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3 font-semibold text-[#070C1F] dark:text-white">
                          {r.profile?.name || 'Anonymous'}
                        </td>
                        <td className="py-3 text-[#636875] dark:text-gray-400">
                          {r.profile?.email || 'N/A'}
                        </td>
                        <td className="py-3 text-[#636875] dark:text-gray-300 font-mono text-[11px]">
                          {r.profile?.handle ? `@${r.profile.handle}` : '—'}
                        </td>
                        <td className="py-3">
                          {r.profile?.linkedinUrl ? (
                            <a
                              href={r.profile.linkedinUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#2F6BFF] hover:underline inline-flex items-center gap-1"
                            >
                              <span>View</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 text-[#636875] dark:text-gray-400">
                          {new Date(r.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-[#636875] dark:text-gray-400 py-8 text-center">
                No registrations yet for this workshop.
              </p>
            )}
          </div>
        )}

        {/* Tab 3: Reviews */}
        {activeTab === 'reviews' && (
          <div className="rounded-3xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 p-6 sm:p-8 shadow-sm">
            <h3 className="text-base font-bold text-[#070C1F] dark:text-white mb-4">
              LinkedIn Reviews for "{activeWorkshop?.title}" ({reviews.length})
            </h3>

            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map(rev => (
                  <div
                    key={rev.id}
                    className="p-5 rounded-2xl bg-[#F3F4F7] dark:bg-white/5 border border-[#DDE0E8] dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-[#070C1F] dark:text-white">
                          Score: {rev.overallScore}/100
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8B4CFF]/10 text-[#8B4CFF]">
                          {rev.band}
                        </span>
                      </div>
                      <p className="text-xs text-[#636875] dark:text-gray-400">
                        Profile: <a href={rev.linkedinUrl} target="_blank" rel="noreferrer" className="text-[#2F6BFF] underline">{rev.linkedinUrl}</a>
                      </p>
                    </div>

                    <button
                      onClick={() => handleResetReview(rev.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors"
                    >
                      Reset Review
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#636875] dark:text-gray-400 py-8 text-center">
                No reviews recorded yet for this workshop.
              </p>
            )}
          </div>
        )}

      </div>

      {/* Workshop Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#DDE0E8] dark:border-white/10 mb-6">
              <h3 className="text-lg font-bold text-[#070C1F] dark:text-white">
                {editingWorkshopId ? 'Edit Workshop' : 'Create New Workshop'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[#636875] hover:text-[#070C1F] dark:text-gray-400 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleWorkshopSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#070C1F] dark:text-gray-200 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F3F4F7] dark:bg-[#070C1F] border border-[#DDE0E8] dark:border-white/10 text-sm text-[#070C1F] dark:text-white focus:outline-none focus:border-[#2F6BFF]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#070C1F] dark:text-gray-200 mb-1">
                    Slug * (URL friendly)
                  </label>
                  <input
                    type="text"
                    required
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="w-full px-3 py-2 rounded-xl bg-[#F3F4F7] dark:bg-[#070C1F] border border-[#DDE0E8] dark:border-white/10 text-sm text-[#070C1F] dark:text-white focus:outline-none focus:border-[#2F6BFF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#070C1F] dark:text-gray-200 mb-1">
                    Host Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formHost}
                    onChange={(e) => setFormHost(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F3F4F7] dark:bg-[#070C1F] border border-[#DDE0E8] dark:border-white/10 text-sm text-[#070C1F] dark:text-white focus:outline-none focus:border-[#2F6BFF]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#070C1F] dark:text-gray-200 mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as WorkshopStatus)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F3F4F7] dark:bg-[#070C1F] border border-[#DDE0E8] dark:border-white/10 text-sm text-[#070C1F] dark:text-white focus:outline-none focus:border-[#2F6BFF]"
                  >
                    <option value="open">Open (Active)</option>
                    <option value="coming_soon">Coming Soon</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#070C1F] dark:text-gray-200 mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  value={formShortDesc}
                  onChange={(e) => setFormShortDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F3F4F7] dark:bg-[#070C1F] border border-[#DDE0E8] dark:border-white/10 text-sm text-[#070C1F] dark:text-white focus:outline-none focus:border-[#2F6BFF]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#070C1F] dark:text-gray-200 mb-1">
                  Full Description
                </label>
                <textarea
                  rows={4}
                  value={formFullDesc}
                  onChange={(e) => setFormFullDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F3F4F7] dark:bg-[#070C1F] border border-[#DDE0E8] dark:border-white/10 text-sm text-[#070C1F] dark:text-white focus:outline-none focus:border-[#2F6BFF]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#070C1F] dark:text-gray-200 mb-1">
                    Starts At (Local IST)
                  </label>
                  <input
                    type="datetime-local"
                    value={formStartsAt}
                    onChange={(e) => setFormStartsAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F3F4F7] dark:bg-[#070C1F] border border-[#DDE0E8] dark:border-white/10 text-sm text-[#070C1F] dark:text-white focus:outline-none focus:border-[#2F6BFF]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#070C1F] dark:text-gray-200 mb-1">
                    Ends At (Local IST)
                  </label>
                  <input
                    type="datetime-local"
                    value={formEndsAt}
                    onChange={(e) => setFormEndsAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F3F4F7] dark:bg-[#070C1F] border border-[#DDE0E8] dark:border-white/10 text-sm text-[#070C1F] dark:text-white focus:outline-none focus:border-[#2F6BFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#070C1F] dark:text-gray-200 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="AI Agents, Gen AI, Automation"
                  className="w-full px-3 py-2 rounded-xl bg-[#F3F4F7] dark:bg-[#070C1F] border border-[#DDE0E8] dark:border-white/10 text-sm text-[#070C1F] dark:text-white focus:outline-none focus:border-[#2F6BFF]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DDE0E8] dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#636875] hover:text-[#070C1F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingWorkshop}
                  className="px-5 py-2 rounded-xl bg-[#2F6BFF] hover:bg-[#1F54E0] disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition-colors"
                >
                  {submittingWorkshop ? 'Saving...' : editingWorkshopId ? 'Save Changes' : 'Create Workshop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
