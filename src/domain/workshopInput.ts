import type { WorkshopStatus } from '../types';
import { validateWorkshopSchedule } from './workshopLifecycle.ts';

export const RETIRED_WORKSHOP_ID = 'be33c1fc-e4c4-4def-b33e-078fdf662400';

export interface WorkshopInput {
  slug: string; title: string; hostName: string; status: WorkshopStatus;
  shortDescription: string; fullDescription: string; tags: string[];
  startsAt: string | null; endsAt: string | null; timezone: string;
}
export function normalizeWorkshopInput(input: WorkshopInput): WorkshopInput {
  return { ...input, slug: input.slug.trim().toLowerCase(), title: input.title.trim(), hostName: input.hostName.trim(),
    shortDescription: input.shortDescription.trim(), fullDescription: input.fullDescription.trim(),
    tags: [...new Set(input.tags.map(tag => tag.trim()).filter(Boolean))], timezone: input.timezone.trim() };
}
export function validateWorkshopInput(input: WorkshopInput): string | null {
  const value = normalizeWorkshopInput(input);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug) || value.slug.length < 3 || value.slug.length > 80) return 'Slug must be 3–80 lowercase letters/numbers separated by single hyphens.';
  if (!value.title || value.title.length > 160) return 'Title is required and must be 160 characters or fewer.';
  if (!value.hostName || value.hostName.length > 100) return 'Host is required and must be 100 characters or fewer.';
  if (!['open', 'coming_soon', 'cancelled', 'archived'].includes(value.status)) return 'Choose a valid publication status.';
  if (value.shortDescription.length > 500 || value.fullDescription.length > 12000) return 'Use at most 500 characters for the short description and 12000 for the full description.';
  if (value.tags.length > 10 || value.tags.some(tag => tag.length > 40)) return 'Use up to 10 tags, each 40 characters or fewer.';
  if (!value.timezone || value.timezone.length > 100) return 'Choose a valid IANA timezone, such as Asia/Kolkata or UTC.';
  try { new Intl.DateTimeFormat('en', { timeZone: value.timezone }).format(0); }
  catch { return 'Choose a valid IANA timezone, such as Asia/Kolkata or UTC.'; }
  if (/meet\.google\.com/i.test([value.slug,value.title,value.hostName,value.shortDescription,value.fullDescription,...value.tags].join(' '))) return 'Keep meeting addresses in the private Meet link field, not public workshop text.';
  return validateWorkshopSchedule(value.status, value.startsAt, value.endsAt);
}
