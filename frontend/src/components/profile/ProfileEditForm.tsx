import React, { useState } from 'react';
import type { UserProfile } from '../../types';
import { updateProfile, uploadAvatar, type UpdateProfileInput } from '../../api/profile';
import { X, Upload, Loader2, Plus, AlertCircle } from 'lucide-react';

interface ProfileEditFormProps {
  userProfile: UserProfile;
  onSaved: (updated: UserProfile) => void;
  onCancel: () => void;
}

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  userProfile,
  onSaved,
  onCancel
}) => {
  const [name, setName] = useState(userProfile.name || '');
  const [handle, setHandle] = useState(userProfile.handle ? userProfile.handle.replace(/^@/, '') : '');
  const [bio, setBio] = useState(userProfile.bio || '');
  const [college, setCollege] = useState(userProfile.college || '');
  const [location, setLocation] = useState(userProfile.location || '');
  const [skills, setSkills] = useState<string[]>(userProfile.skills || []);
  const [skillInput, setSkillInput] = useState('');
  const [linkedin, setLinkedin] = useState(userProfile.links?.linkedin || '');
  const [x, setX] = useState(userProfile.links?.x || '');
  const [website, setWebsite] = useState(userProfile.links?.website || '');

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(userProfile.avatarUrl);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setErrorMessage(null);
    try {
      const publicUrl = await uploadAvatar(file);
      setAvatarPreview(publicUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Avatar upload failed';
      setErrorMessage(msg);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (skills.length >= 10) {
      setErrorMessage('Maximum 10 skills allowed.');
      return;
    }
    if (trimmed.length > 30) {
      setErrorMessage('Skill must be 30 characters or fewer.');
      return;
    }
    if (!skills.includes(trimmed)) {
      setSkills(prev => [...prev, trimmed]);
    }
    setSkillInput('');
    setErrorMessage(null);
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(prev => prev.filter(s => s !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);

    const input: UpdateProfileInput = {
      name,
      handle,
      bio,
      college,
      location,
      skills,
      links: {
        linkedin: linkedin.trim() || undefined,
        x: x.trim() || undefined,
        website: website.trim() || undefined,
      },
    };

    try {
      const updated = await updateProfile(input);
      // ensure preview is preserved
      if (avatarPreview) {
        updated.avatarUrl = avatarPreview;
      }
      onSaved(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save profile';
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Avatar upload */}
      <div className="flex items-center gap-5">
        <div className="relative">
          <img
            src={avatarPreview}
            alt={name}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-white dark:border-white/20 shadow-sm"
          />
          {uploadingAvatar && (
            <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
          )}
        </div>

        <div>
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F3F4F7] dark:bg-white/10 hover:bg-[#DDE0E8] dark:hover:bg-white/15 text-xs font-semibold text-[#070C1F] dark:text-white transition-colors">
            <Upload className="w-3.5 h-3.5 text-[#2F6BFF]" />
            <span>{uploadingAvatar ? 'Uploading...' : 'Change photo'}</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleAvatarFileChange}
              disabled={uploadingAvatar}
              className="hidden"
            />
          </label>
          <p className="text-[11px] text-[#636875] dark:text-gray-400 mt-1.5">
            PNG, JPEG, WebP, or GIF (max 2 MB)
          </p>
        </div>
      </div>

      {/* Grid: Name & Handle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#070C1F] dark:text-gray-200 mb-1.5">
            Full Name *
          </label>
          <input
            type="text"
            required
            maxLength={50}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#070C1F] border border-[#DDE0E8] dark:border-white/10 text-sm text-[#070C1F] dark:text-white focus:outline-none focus:border-[#2F6BFF]"
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#070C1F] dark:text-gray-200 mb-1.5">
            Handle (3–20 chars, lowercase, numbers, _)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#636875]">@</span>
            <input
              type="text"
              maxLength={20}
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-[#070C1F] border border-[#DDE0E8] dark:border-white/10 text-sm text-[#070C1F] dark:text-white focus:outline-none focus:border-[#2F6BFF]"
              placeholder="handle"
            />
          </div>
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-xs font-semibold text-[#070C1F] dark:text-gray-200 mb-1.5">
          Bio (max 500 chars)
        </label>
        <textarea
          rows={3}
          maxLength={500}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#070C1F] border border-[#DDE0E8] dark:border-white/10 text-sm text-[#070C1F] dark:text-white focus:outline-none focus:border-[#2F6BFF]"
          placeholder="Tell others about what you build and what you are learning..."
        />
      </div>

      {/* College & Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#070C1F] dark:text-gray-200 mb-1.5">
            College / Institution
          </label>
          <input
            type="text"
            maxLength={100}
            value={college}
            onChange={(e) => setCollege(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#070C1F] border border-[#DDE0E8] dark:border-white/10 text-sm text-[#070C1F] dark:text-white focus:outline-none focus:border-[#2F6BFF]"
            placeholder="e.g. Stanford University, MIT"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#070C1F] dark:text-gray-200 mb-1.5">
            Location
          </label>
          <input
            type="text"
            maxLength={100}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#070C1F] border border-[#DDE0E8] dark:border-white/10 text-sm text-[#070C1F] dark:text-white focus:outline-none focus:border-[#2F6BFF]"
            placeholder="e.g. Bengaluru, India"
          />
        </div>
      </div>

      {/* Skills Chips */}
      <div>
        <label className="block text-xs font-semibold text-[#070C1F] dark:text-gray-200 mb-1.5">
          Skills (up to 10 chips, max 30 chars each)
        </label>
        <div className="flex gap-2 mb-2.5">
          <input
            type="text"
            maxLength={30}
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddSkill();
              }
            }}
            placeholder="Type a skill and press Enter or click Add"
            className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-[#070C1F] border border-[#DDE0E8] dark:border-white/10 text-sm text-[#070C1F] dark:text-white focus:outline-none focus:border-[#2F6BFF]"
          />
          <button
            type="button"
            onClick={handleAddSkill}
            className="px-4 py-2 rounded-xl bg-[#F3F4F7] dark:bg-white/10 hover:bg-[#DDE0E8] dark:hover:bg-white/15 text-xs font-semibold text-[#070C1F] dark:text-white transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-[#2F6BFF]/10 text-[#2F6BFF] border border-[#2F6BFF]/20"
            >
              <span>{skill}</span>
              <button
                type="button"
                onClick={() => handleRemoveSkill(skill)}
                className="hover:text-red-500 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Social Links */}
      <div className="space-y-3 pt-2 border-t border-[#DDE0E8]/70 dark:border-white/10">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#636875] dark:text-gray-400">
          Social Links (must start with https://)
        </h4>

        <div>
          <label className="block text-xs font-medium text-[#636875] dark:text-gray-400 mb-1">
            LinkedIn URL
          </label>
          <input
            type="url"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            placeholder="https://linkedin.com/in/username"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#070C1F] border border-[#DDE0E8] dark:border-white/10 text-sm text-[#070C1F] dark:text-white focus:outline-none focus:border-[#2F6BFF]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#636875] dark:text-gray-400 mb-1">
            X (Twitter) URL
          </label>
          <input
            type="url"
            value={x}
            onChange={(e) => setX(e.target.value)}
            placeholder="https://x.com/username"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#070C1F] border border-[#DDE0E8] dark:border-white/10 text-sm text-[#070C1F] dark:text-white focus:outline-none focus:border-[#2F6BFF]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#636875] dark:text-gray-400 mb-1">
            Website URL
          </label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://yourwebsite.com"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#070C1F] border border-[#DDE0E8] dark:border-white/10 text-sm text-[#070C1F] dark:text-white focus:outline-none focus:border-[#2F6BFF]"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DDE0E8]/70 dark:border-white/10">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold text-[#636875] dark:text-gray-400 hover:text-[#070C1F] dark:hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || uploadingAvatar}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2F6BFF] hover:bg-[#1F54E0] disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-colors"
        >
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Profile</span>
          )}
        </button>
      </div>
    </form>
  );
};
