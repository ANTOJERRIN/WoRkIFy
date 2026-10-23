import { supabase } from '../lib/supabase';
import { requireUser, requestSignal } from './request';
import type { UserProfile } from '../types';
import { AVATAR_EXTENSIONS, normalizeProfile, validateAvatar, validateProfile, safeContactUrl, type UpdateProfileInput, type ProfileErrors } from '../domain/profileValidation';
export { validateProfile } from '../domain/profileValidation';
export type { UpdateProfileInput } from '../domain/profileValidation';

export interface DbProfile {
  id: string; name: string; email: string; handle: string | null; bio: string | null;
  avatar_url: string | null; college: string | null; location: string | null; skills: string[] | null;
  linkedin_url: string | null; x_url: string | null; website_url: string | null;
  created_at: string; updated_at: string;
}
const PROFILE_FIELDS = 'id,name,email,handle,bio,avatar_url,college,location,skills,linkedin_url,x_url,website_url';

export function mapDbProfileToUserProfile(row: DbProfile): UserProfile {
  return { id: row.id, name: row.name || '', email: row.email || '', handle: row.handle || '',
    avatarUrl: row.avatar_url || '/workify-logo.png', bio: row.bio || '', college: row.college || '', location: row.location || '',
    skills: Array.isArray(row.skills) ? row.skills : [],
    links: { linkedin: safeContactUrl(row.linkedin_url), x: safeContactUrl(row.x_url), website: safeContactUrl(row.website_url) } };
}

export async function getProfile(expectedUserId?: string, signal?: AbortSignal): Promise<UserProfile | null> {
  const user = await requireUser(expectedUserId);
  signal?.throwIfAborted();
  const { data, error } = await supabase.from('profiles').select(PROFILE_FIELDS).eq('id', user.id)
    .abortSignal(requestSignal(signal)).maybeSingle();
  if (error) throw new Error('Your profile could not be loaded. Please try again.');
  if (!data) return null;
  if (data.id !== user.id) throw new Error('The profile response did not match your account.');
  return mapDbProfileToUserProfile(data as DbProfile);
}

export class ProfileSaveError extends Error {
  fields: ProfileErrors;
  constructor(message: string, fields: ProfileErrors = {}) { super(message); this.name = 'ProfileSaveError'; this.fields = fields; }
}

/** Bounds SDK methods that do not take a signal; abort also prevents subsequent writes. */
async function bounded<T>(operation: PromiseLike<T>, signal: AbortSignal): Promise<T> {
  signal.throwIfAborted();
  let abort!: () => void;
  const cancelled = new Promise<never>((_resolve, reject) => {
    abort = () => reject(new Error('The save could not be confirmed. Your changes are retained; reload to check the saved profile before retrying.'));
    signal.addEventListener('abort', abort, { once: true });
  });
  try { return await Promise.race([operation, cancelled]); }
  finally { signal.removeEventListener('abort', abort); }
}

/** One confirmed profile write, after an optional fresh upload. Never overwrites the old image. */
export async function updateProfile(input: UpdateProfileInput, expectedUserId?: string, avatar?: File | null, signal?: AbortSignal): Promise<UserProfile> {
  const validation = validateProfile(input);
  if (!validation.valid) throw new ProfileSaveError(validation.error!, validation.fields);
  if (avatar) {
    const error = await validateAvatar(avatar);
    if (error) throw new ProfileSaveError(error, { avatar: error });
  }
  const pending = requestSignal(signal);
  const user = await bounded(requireUser(expectedUserId), pending);
  const value = normalizeProfile(input);
  let avatarUrl: string | undefined;
  let uploadAttempted = false;
  try {
    if (avatar) {
      pending.throwIfAborted();
      const path = `${user.id}/${crypto.randomUUID()}.${AVATAR_EXTENSIONS[avatar.type]}`;
      uploadAttempted = true;
      const { error } = await bounded(supabase.storage.from('avatars').upload(path, avatar, { upsert: false, contentType: avatar.type }), pending);
      if (error) throw new ProfileSaveError('Photo upload failed. Your profile edits have not been submitted. Please try again.', { avatar: 'Photo upload failed. Please try again.' });
      avatarUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
      await bounded(requireUser(user.id), pending);
    }
    pending.throwIfAborted();
    const { data, error } = await supabase.from('profiles').update({
      name: value.name, handle: value.handle || null, bio: value.bio, college: value.college, location: value.location,
      skills: value.skills, linkedin_url: safeContactUrl(value.links.linkedin), x_url: safeContactUrl(value.links.x), website_url: safeContactUrl(value.links.website),
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    }).eq('id', user.id).select(PROFILE_FIELDS).abortSignal(pending).single();
    if (error?.code === '23505') throw new ProfileSaveError('This handle is already taken. Choose another.', { handle: 'This handle is already taken. Choose another.' });
    if (error || !data || data.id !== user.id || (avatarUrl && data.avatar_url !== avatarUrl)) throw new Error('Profile save was not confirmed. Reload to check the saved profile before retrying.');
    return mapDbProfileToUserProfile(data as DbProfile);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Profile save could not be confirmed. Please try again.';
    if (uploadAttempted && !(error instanceof ProfileSaveError && error.fields.avatar)) {
      throw new ProfileSaveError(`The photo may have uploaded, but profile save was not confirmed. Your edits are retained. Reload to check before retrying. ${message}`,
        error instanceof ProfileSaveError ? error.fields : {});
    }
    throw error;
  }
}
