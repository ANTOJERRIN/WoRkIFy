import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types';

export interface DbProfile {
  id: string;
  name: string;
  email: string;
  handle: string | null;
  bio: string | null;
  avatar_url: string | null;
  college: string | null;
  location: string | null;
  skills: string[] | null;
  linkedin_url: string | null;
  x_url: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
}

export function mapDbProfileToUserProfile(row: DbProfile): UserProfile {
  return {
    id: row.id,
    name: row.name || 'User',
    email: row.email || '',
    handle: row.handle || '',
    avatarUrl: row.avatar_url || '/workify-logo.png',
    bio: row.bio || '',
    college: row.college || '',
    location: row.location || '',
    skills: Array.isArray(row.skills) ? row.skills : [],
    links: {
      linkedin: row.linkedin_url || '',
      x: row.x_url || '',
      website: row.website_url || '',
    },
  };
}

/**
 * Fetch current user profile from public.profiles table
 */
export async function getProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;
  return mapDbProfileToUserProfile(data as DbProfile);
}

export interface UpdateProfileInput {
  name: string;
  handle: string;
  bio: string;
  college: string;
  location: string;
  skills: string[];
  links: {
    linkedin?: string;
    x?: string;
    website?: string;
  };
}

/**
 * Validate profile input fields
 */
export function validateProfile(input: UpdateProfileInput): { valid: boolean; error?: string } {
  // Name
  if (!input.name.trim()) {
    return { valid: false, error: 'Name is required.' };
  }
  if (input.name.trim().length > 50) {
    return { valid: false, error: 'Name must be 50 characters or fewer.' };
  }

  // Handle format: 3-20 lowercase, numbers, underscores
  const cleanHandle = input.handle.trim().toLowerCase().replace(/^@/, '');
  if (cleanHandle) {
    if (!/^[a-z0-9_]{3,20}$/.test(cleanHandle)) {
      return {
        valid: false,
        error: 'Handle must be 3–20 characters and contain only lowercase letters, numbers, and underscores.',
      };
    }
  }

  // Bio
  if (input.bio && input.bio.length > 500) {
    return { valid: false, error: 'Bio must be 500 characters or fewer.' };
  }

  // College & Location
  if (input.college && input.college.length > 100) {
    return { valid: false, error: 'College must be 100 characters or fewer.' };
  }
  if (input.location && input.location.length > 100) {
    return { valid: false, error: 'Location must be 100 characters or fewer.' };
  }

  // Skills: max 10, each <= 30
  if (input.skills.length > 10) {
    return { valid: false, error: 'Maximum 10 skills allowed.' };
  }
  for (const skill of input.skills) {
    if (skill.length > 30) {
      return { valid: false, error: `Skill "${skill}" exceeds 30 characters.` };
    }
  }

  // URLs: must start with https:// if provided
  const checkUrl = (url: string | undefined, label: string) => {
    if (url && url.trim()) {
      const trimmed = url.trim();
      if (!trimmed.startsWith('https://')) {
        return `${label} URL must start with https://`;
      }
    }
    return null;
  };

  const linkedinErr = checkUrl(input.links.linkedin, 'LinkedIn');
  if (linkedinErr) return { valid: false, error: linkedinErr };

  const xErr = checkUrl(input.links.x, 'X');
  if (xErr) return { valid: false, error: xErr };

  const websiteErr = checkUrl(input.links.website, 'Website');
  if (websiteErr) return { valid: false, error: websiteErr };

  return { valid: true };
}

/**
 * Update current user's profile
 */
export async function updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const validation = validateProfile(input);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const cleanHandle = input.handle.trim().toLowerCase().replace(/^@/, '') || null;

  const payload = {
    name: input.name.trim(),
    handle: cleanHandle,
    bio: input.bio.trim(),
    college: input.college.trim(),
    location: input.location.trim(),
    skills: input.skills.map(s => s.trim()).filter(Boolean),
    linkedin_url: input.links.linkedin?.trim() || '',
    x_url: input.links.x?.trim() || '',
    website_url: input.links.website?.trim() || '',
  };

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    // Unique violation error on handle
    if (error.code === '23505' || error.message.includes('unique') || error.message.includes('handle')) {
      throw new Error(`The handle "@${cleanHandle}" is already taken. Please choose another.`);
    }
    throw new Error(error.message);
  }

  return mapDbProfileToUserProfile(data as DbProfile);
}

/**
 * Upload an avatar image to the avatars bucket and update avatar_url on the user's profile
 */
export async function uploadAvatar(file: File): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check file size (max 2 MB)
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Avatar image must be smaller than 2 MB.');
  }

  // Check file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed.');
  }

  const fileExt = file.name.split('.').pop() || 'png';
  const filePath = `${user.id}/avatar.${fileExt}`;

  // Upload or replace in avatars bucket
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    throw new Error(`Avatar upload failed: ${uploadError.message}`);
  }

  // Get public URL with timestamp cache buster
  const { data: publicData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  const publicUrl = `${publicData.publicUrl}?t=${Date.now()}`;

  // Update avatar_url on public.profiles
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id);

  if (profileError) {
    throw new Error(`Failed to update profile avatar: ${profileError.message}`);
  }

  return publicUrl;
}
