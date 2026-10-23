export interface UpdateProfileInput {
  name: string; handle: string; bio: string; college: string; location: string;
  skills: string[];
  links: { linkedin?: string; x?: string; website?: string };
}
export type ProfileField = 'name' | 'handle' | 'bio' | 'college' | 'location' | 'skills' | 'linkedin' | 'x' | 'website' | 'avatar';
export type ProfileErrors = Partial<Record<ProfileField, string>>;
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
};

/** Also used when displaying legacy contact links; never render unsafe schemes. */
export function safeContactUrl(value?: string | null): string {
  const text = value?.trim() ?? '';
  if (!text || text.length > 2048 || !text.startsWith('https://') || /[\s\\]/.test(text)
    || [...text].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) return '';
  try {
    const url = new URL(text);
    return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}

export function normalizeProfile(input: UpdateProfileInput): UpdateProfileInput {
  return { name: input.name.trim(), handle: input.handle.trim().toLowerCase().replace(/^@/, ''),
    bio: input.bio.trim(), college: input.college.trim(), location: input.location.trim(),
    skills: [...new Set(input.skills.map(skill => skill.trim()).filter(Boolean))],
    links: { linkedin: input.links.linkedin?.trim() ?? '', x: input.links.x?.trim() ?? '', website: input.links.website?.trim() ?? '' } };
}

export function validateProfile(input: UpdateProfileInput) {
  const value = normalizeProfile(input);
  const fields: ProfileErrors = {};
  if (!value.name) fields.name = 'Name is required.';
  else if (value.name.length > 50) fields.name = 'Name must be 50 characters or fewer.';
  if (value.handle && !/^[a-z0-9_]{3,20}$/.test(value.handle)) fields.handle = 'Handle must be 3–20 lowercase letters, numbers, or underscores.';
  if (value.bio.length > 500) fields.bio = 'Bio must be 500 characters or fewer.';
  if (value.college.length > 100) fields.college = 'College must be 100 characters or fewer.';
  if (value.location.length > 100) fields.location = 'Location must be 100 characters or fewer.';
  if (value.skills.length > 10 || value.skills.some(skill => skill.length > 30)) fields.skills = 'Use up to 10 skills, each 30 characters or fewer.';
  for (const key of ['linkedin', 'x', 'website'] as const) {
    if (value.links[key] && !safeContactUrl(value.links[key])) fields[key] = 'Enter a valid HTTPS URL without credentials, up to 2048 characters.';
  }
  return { valid: Object.keys(fields).length === 0, error: Object.values(fields)[0], fields };
}

export async function validateAvatar(file: File): Promise<string | null> {
  if (!Object.hasOwn(AVATAR_EXTENSIONS, file.type)) return 'Choose a JPEG, PNG, WebP, or GIF image.';
  if (!file.size || file.size > AVATAR_MAX_BYTES) return 'Choose a nonempty image no larger than 2 MB.';
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  const valid = file.type === 'image/png' ? [137, 80, 78, 71, 13, 10, 26, 10].every((value, i) => bytes[i] === value)
    : file.type === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : file.type === 'image/gif' ? ['GIF87a', 'GIF89a'].includes(ascii(0, 6))
    : ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP';
  return valid ? null : 'The image contents do not match its file type.';
}
