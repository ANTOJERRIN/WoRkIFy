import type { WorkshopStatus } from '../types/index.ts';
export interface WorkshopInput {
  slug: string; title: string; hostName: string; status: WorkshopStatus;
  shortDescription: string; fullDescription: string; tags: string[];
  startsAt: string | null; endsAt: string | null; timezone?: string;
}
export function validateWorkshop(input: WorkshopInput): void {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug.trim()) || input.slug.trim().length > 100) throw new Error('Use a slug of up to 100 lowercase letters, numbers and single hyphens.');
  if (!input.title.trim() || input.title.trim().length > 200) throw new Error('Enter a workshop title of up to 200 characters.');
  if (!input.hostName.trim() || input.hostName.trim().length > 100) throw new Error('Enter a host name of up to 100 characters.');
  if (!['open', 'coming_soon', 'cancelled', 'archived'].includes(input.status)) throw new Error('Choose a valid workshop status.');
  if (input.shortDescription.length > 500 || input.fullDescription.length > 20000) throw new Error('Keep the summary under 500 characters and description under 20,000 characters.');
  if (input.tags.length > 12 || input.tags.some(tag => !tag.trim() || tag.length > 40)) throw new Error('Use up to 12 tags, each with 1–40 characters.');
  if (input.status === 'open' && (!input.startsAt || !input.endsAt)) throw new Error('Open workshops need both a start and an end time.');
  if (!!input.startsAt !== !!input.endsAt) throw new Error('Set both start and end times, or leave both empty for an announcement.');
  if (input.startsAt && input.endsAt && (!Number.isFinite(Date.parse(input.startsAt)) || !Number.isFinite(Date.parse(input.endsAt)) || Date.parse(input.endsAt) <= Date.parse(input.startsAt))) throw new Error('The end time must be after the start time.');
  try { new Intl.DateTimeFormat('en', { timeZone: input.timezone || 'Asia/Kolkata' }).format(); }
  catch { throw new Error('Choose a valid IANA timezone.'); }
}
export function validateMeetUrl(value: string): void {
  if (!value.trim()) return;
  let url: URL;
  try { url = new URL(value.trim()); } catch { throw new Error('Enter a valid Google Meet link.'); }
  if (url.protocol !== 'https:' || url.hostname !== 'meet.google.com' || url.port || url.username || url.password || url.search || url.hash || !/^\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(url.pathname)) throw new Error('Use a Google Meet link such as https://meet.google.com/abc-defg-hij.');
}
// datetime-local inputs are explicitly IST, independent of the admin computer's timezone.
export function fromIST(value: string): string | null {
  return value ? new Date(`${value}:00+05:30`).toISOString() : null;
}
export function toIST(value: string | null): string {
  return value ? new Date(Date.parse(value) + 330 * 60000).toISOString().slice(0, 16) : '';
}
