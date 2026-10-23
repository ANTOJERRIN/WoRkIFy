import React, { useEffect, useRef, useState } from 'react';
import type { UserProfile } from '../../types';
import { ProfileSaveError, updateProfile } from '../../api/profile';
import { validateAvatar, validateProfile, type UpdateProfileInput, type ProfileErrors, type ProfileField } from '../../domain/profileValidation';
import { X, Upload, Loader2, Plus, AlertCircle } from 'lucide-react';

interface ProfileEditFormProps {
  userProfile: UserProfile;
  onSaved: (updated: UserProfile) => void;
  onCancel: () => void;
}
const inputStyle = 'w-full min-w-0 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#070C1F] border border-[#DDE0E8] dark:border-white/10 text-sm text-[#070C1F] dark:text-white focus:outline-none focus:border-[#2F6BFF]';

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({ userProfile, onSaved, onCancel }) => {
  const [input, setInput] = useState<UpdateProfileInput>(() => ({
    name: userProfile.name, handle: userProfile.handle, bio: userProfile.bio, college: userProfile.college,
    location: userProfile.location, skills: userProfile.skills, links: { ...userProfile.links },
  }));
  const [skillInput, setSkillInput] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [preview, setPreview] = useState(userProfile.avatarUrl);
  const [saving, setSaving] = useState(false);
  const [checkingPhoto, setCheckingPhoto] = useState(false);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mounted = useRef(false);
  const busy = useRef(false);
  const selection = useRef(0);
  const previewUrl = useRef<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    mounted.current = true;
    const activeController = controller;
    const activePreview = previewUrl;
    const activeSelection = selection;
    return () => {
      mounted.current = false;
      activeSelection.current++;
      activeController.current?.abort();
      if (activePreview.current) URL.revokeObjectURL(activePreview.current);
    };
  }, []);

  const fieldError = (field: ProfileField) => errors[field] ? <p id={`profile-${field}-error`} className="text-xs text-red-600 dark:text-red-400 mt-1">{errors[field]}</p> : null;
  const accessibility = (field: ProfileField) => ({ id: `profile-${field}`, 'aria-invalid': !!errors[field], 'aria-describedby': errors[field] ? `profile-${field}-error` : undefined });
  const change = (field: 'name' | 'handle' | 'bio' | 'college' | 'location', value: string) => {
    setInput(previous => ({ ...previous, [field]: value }));
    setErrors(previous => ({ ...previous, [field]: undefined }));
  };
  const selectPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || busy.current) return;
    const version = ++selection.current;
    setCheckingPhoto(true);
    try {
      const error = await validateAvatar(file);
      if (!mounted.current || version !== selection.current) return;
      setErrors(previous => ({ ...previous, avatar: error ?? undefined }));
      if (error) return;
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = URL.createObjectURL(file);
      setPreview(previewUrl.current);
      setAvatar(file);
    } catch {
      if (mounted.current && version === selection.current) setErrors(previous => ({ ...previous, avatar: 'This image could not be read. Choose another.' }));
    } finally {
      if (mounted.current && version === selection.current) setCheckingPhoto(false);
    }
  };
  const addSkill = () => {
    const skill = skillInput.trim();
    if (!skill) return;
    if (input.skills.length >= 10 || skill.length > 30) {
      setErrors(previous => ({ ...previous, skills: 'Use up to 10 skills, each 30 characters or fewer.' }));
      return;
    }
    setInput(previous => ({ ...previous, skills: [...new Set([...previous.skills, skill])] }));
    setSkillInput('');
    setErrors(previous => ({ ...previous, skills: undefined }));
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy.current || checkingPhoto) return;
    const validation = validateProfile(input);
    setErrors(validation.fields);
    setErrorMessage(null);
    if (!validation.valid) {
      requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    busy.current = true;
    setSaving(true);
    const pending = new AbortController();
    controller.current = pending;
    try {
      const updated = await updateProfile(input, userProfile.id, avatar, pending.signal);
      if (mounted.current) onSaved(updated);
    } catch (error) {
      if (mounted.current) {
        setErrorMessage(error instanceof Error ? error.message : 'Profile save could not be confirmed. Please try again.');
        if (error instanceof ProfileSaveError) setErrors(error.fields);
      }
    } finally {
      busy.current = false;
      if (mounted.current) setSaving(false);
    }
  };

  return <form ref={form} onSubmit={submit} noValidate className="space-y-6">
    {errorMessage && <div role="alert" className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-300 text-xs flex gap-2">
      <AlertCircle className="w-4 h-4 shrink-0" /><span>{errorMessage}</span>
    </div>}
    <fieldset disabled={saving} className="space-y-6 min-w-0">
      <legend className="sr-only">Edit your profile</legend>
      <div className="flex flex-wrap items-center gap-5">
        <img src={preview} alt="Profile photo preview" className="w-20 h-20 rounded-2xl object-cover border-2 border-white dark:border-white/20 shadow-sm" />
        <div className="min-w-0">
          <label htmlFor="profile-avatar" className="inline-flex items-center gap-2 text-xs font-semibold"><Upload className="w-4 h-4 text-[#2F6BFF]" />Change photo</label>
          <input {...accessibility('avatar')} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={selectPhoto} disabled={checkingPhoto}
            className="block w-full max-w-64 mt-2 text-xs file:rounded-xl file:border-0 file:px-3 file:py-2 file:mr-2 file:bg-[#F3F4F7] file:text-[#070C1F]" />
          <p className="text-[11px] text-[#636875] dark:text-gray-400 mt-1.5">PNG, JPEG, WebP, or GIF; max 2 MB. Photos are public.</p>
          {checkingPhoto && <p role="status" className="text-xs">Checking photo...</p>}
          {avatar && <p className="text-xs text-[#2F6BFF] mt-1">Photo selected. It will upload when you save.</p>}
          {fieldError('avatar')}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {([
          ['name', 'Full Name *', 'Your name', 50], ['handle', 'Handle (3–20 chars, lowercase, numbers, _)', 'handle', 21],
          ['college', 'College / Institution', 'e.g. Stanford University, MIT', 100], ['location', 'Location', 'e.g. Bengaluru, India', 100],
        ] as const).map(([field, label, placeholder, max]) => <div key={field}>
          <label htmlFor={`profile-${field}`} className="block text-xs font-semibold mb-1.5">{label}</label>
          <input {...accessibility(field)} type="text" value={input[field]} maxLength={max} required={field === 'name'}
            onChange={event => change(field, event.target.value)} placeholder={placeholder} className={inputStyle} />
          {fieldError(field)}
        </div>)}
      </div>
      <div>
        <label htmlFor="profile-bio" className="block text-xs font-semibold mb-1.5">Bio (max 500 chars)</label>
        <textarea {...accessibility('bio')} rows={3} maxLength={500} value={input.bio} onChange={event => change('bio', event.target.value)}
          placeholder="Tell others about what you build and what you are learning..." className={inputStyle} />
        {fieldError('bio')}
      </div>
      <div>
        <label htmlFor="profile-skills" className="block text-xs font-semibold mb-1.5">Skills (up to 10 chips, max 30 chars each)</label>
        <div className="flex gap-2 mb-2.5">
          <input {...accessibility('skills')} value={skillInput} maxLength={30} onChange={event => setSkillInput(event.target.value)}
            onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addSkill(); } }}
            placeholder="Type a skill and press Enter or click Add" className={`${inputStyle} flex-1`} />
          <button type="button" onClick={addSkill} className="px-3 rounded-xl bg-[#F3F4F7] dark:bg-white/10 inline-flex items-center gap-1 text-xs font-semibold"><Plus className="w-3.5 h-3.5" />Add</button>
        </div>
        {fieldError('skills')}
        <div className="flex flex-wrap gap-2">{input.skills.map(skill => <span key={skill} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-[#2F6BFF]/10 text-[#2F6BFF] border border-[#2F6BFF]/20">
          {skill}<button type="button" aria-label={`Remove skill ${skill}`} onClick={() => setInput(previous => ({ ...previous, skills: previous.skills.filter(item => item !== skill) }))}><X className="w-3 h-3" /></button>
        </span>)}</div>
      </div>
      <div className="space-y-3 pt-2 border-t border-[#DDE0E8]/70 dark:border-white/10">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#636875] dark:text-gray-400">Social Links (HTTPS)</h3>
        {([['linkedin', 'LinkedIn URL', 'https://linkedin.com/in/username'], ['x', 'X (Twitter) URL', 'https://x.com/username'], ['website', 'Website URL', 'https://yourwebsite.com']] as const).map(([field, label, placeholder]) => <div key={field}>
          <label htmlFor={`profile-${field}`} className="block text-xs font-medium mb-1">{label}</label>
          <input {...accessibility(field)} type="url" value={input.links[field] ?? ''} maxLength={2048} placeholder={placeholder} className={inputStyle}
            onChange={event => { setInput(previous => ({ ...previous, links: { ...previous.links, [field]: event.target.value } })); setErrors(previous => ({ ...previous, [field]: undefined })); }} />
          {fieldError(field)}
        </div>)}
      </div>
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DDE0E8]/70 dark:border-white/10">
        <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-xl text-xs font-semibold text-[#636875] dark:text-gray-400">Cancel</button>
        <button type="submit" disabled={checkingPhoto} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2F6BFF] hover:bg-[#1F54E0] disabled:opacity-50 text-white text-xs font-semibold shadow-md">
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}{saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </fieldset>
  </form>;
};
