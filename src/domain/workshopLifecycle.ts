import type { Workshop, WorkshopStatus } from '../types';

export type WorkshopSchedule = Pick<Workshop, 'status' | 'startsAt' | 'endsAt' | 'timezone'>;
export type WorkshopPhase = 'unscheduled' | 'unavailable' | 'coming-soon' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'archived';
export const JOIN_EARLY_MS = 15 * 60 * 1000;

/** Accept explicit-offset ISO instants only, including real calendar dates. */
export function parseWorkshopInstant(value: string | null): number | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,6})?)?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute, second = '0', zone] = match;
  const y = Number(year), m = Number(month), d = Number(day);
  const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (y < 1 || m < 1 || m > 12 || d < 1 || d > days[m - 1]! || Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59) return null;
  if (zone !== 'Z' && (Number(zone!.slice(1, 3)) > 23 || Number(zone!.slice(4, 6)) > 59)) return null;
  const instant = Date.parse(value);
  return Number.isFinite(instant) ? instant : null;
}

export function readWorkshopSchedule(workshop: Pick<Workshop, 'startsAt' | 'endsAt'>) {
  const start = parseWorkshopInstant(workshop.startsAt);
  const end = parseWorkshopInstant(workshop.endsAt);
  return { start, end, valid: start !== null && end !== null && end > start,
    unscheduled: workshop.startsAt === null && workshop.endsAt === null };
}

/** Advisory UI contract. Authorization uses the server clock in stages 09/10. */
export function workshopLifecycle(workshop: WorkshopSchedule, now = Date.now()) {
  const schedule = readWorkshopSchedule(workshop);
  let phase: WorkshopPhase;
  if (workshop.status === 'archived' || workshop.status === 'cancelled') phase = workshop.status;
  else if (!Number.isFinite(now) || !(['open', 'coming_soon'] as string[]).includes(workshop.status)) phase = 'unavailable';
  else if (workshop.status === 'coming_soon' && schedule.unscheduled) phase = 'unscheduled';
  else if (!schedule.valid) phase = 'unavailable';
  else if (now >= schedule.end!) phase = 'completed';
  else if (workshop.status === 'coming_soon') phase = 'coming-soon';
  else if (now >= schedule.start!) phase = 'ongoing';
  else phase = 'scheduled';

  const registrationEligible = phase === 'scheduled';
  const joinEligible = workshop.status === 'open' && schedule.valid && Number.isFinite(now)
    && now >= schedule.start! - JOIN_EARLY_MS && now < schedule.end!;
  const label: Record<WorkshopPhase, string> = {
    unscheduled: 'Coming soon', unavailable: 'Schedule unavailable', 'coming-soon': 'Coming soon',
    scheduled: 'Registration open', ongoing: 'Ongoing', completed: 'Completed session',
    cancelled: 'Cancelled workshop', archived: 'Archived workshop',
  };
  return { phase, label: label[phase], registrationEligible, cancellationEligible: registrationEligible,
    joinEligible, discoverable: ['unscheduled', 'coming-soon', 'scheduled', 'ongoing'].includes(phase) };
}

export function discoverWorkshops(workshops: Workshop[], now: number): Workshop[] {
  return workshops.filter(workshop => workshopLifecycle(workshop, now).discoverable).sort((left, right) => {
    const a = workshopLifecycle(left, now), b = workshopLifecycle(right, now);
    if (a.phase === 'ongoing' && b.phase !== 'ongoing') return -1;
    if (b.phase === 'ongoing' && a.phase !== 'ongoing') return 1;
    const difference = (parseWorkshopInstant(left.startsAt) ?? Infinity) - (parseWorkshopInstant(right.startsAt) ?? Infinity);
    return (Number.isNaN(difference) ? 0 : difference) || left.id.localeCompare(right.id);
  });
}

/** Display in the stored timezone; invalid timezone labels fall back explicitly to UTC. */
export function formatWorkshopSchedule(workshop: WorkshopSchedule): string {
  const schedule = readWorkshopSchedule(workshop);
  if (schedule.unscheduled) return workshop.status === 'coming_soon' ? 'Date to be announced' : 'Schedule unavailable';
  if (!schedule.valid) return 'Schedule unavailable';
  let zone = workshop.timezone;
  let zoneUnavailable = false;
  try { new Intl.DateTimeFormat('en-IN', { timeZone: zone }).format(0); }
  catch { zone = 'UTC'; zoneUnavailable = true; }
  if (!zone) { zone = 'UTC'; zoneUnavailable = true; }
  const date = new Intl.DateTimeFormat('en-IN', { timeZone: zone, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const time = new Intl.DateTimeFormat('en-IN', { timeZone: zone, hour: 'numeric', minute: '2-digit', hour12: true, timeZoneName: 'short' });
  const startDate = date.format(schedule.start!), endDate = date.format(schedule.end!);
  return `${startDate} · ${time.format(schedule.start!)} – ${startDate === endDate ? '' : `${endDate} · `}${time.format(schedule.end!)}${zoneUnavailable ? ' (timezone unavailable; shown in UTC)' : ''}`;
}

export function validateWorkshopSchedule(status: WorkshopStatus, startsAt: string | null, endsAt: string | null): string | null {
  if (status === 'archived' || status === 'cancelled') return null;
  const schedule = readWorkshopSchedule({ startsAt, endsAt });
  if (status === 'coming_soon' && schedule.unscheduled) return null;
  return schedule.valid ? null : 'Provide valid start and end times, with the end after the start. Unscheduled workshops must use Coming Soon.';
}
