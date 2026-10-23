import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { workshopLifecycle, discoverWorkshops, formatWorkshopSchedule, parseWorkshopInstant } from '../../src/domain/workshopLifecycle.ts';
import type { Workshop } from '../../src/types/index.ts';

const matrix = JSON.parse(readFileSync(new URL('../fixtures/workshop-lifecycle.json', import.meta.url), 'utf8')) as {
  startsAt: string; endsAt: string;
  cases: Array<{ name: string; status: string; startsAt?: string | null; endsAt?: string | null; now: string;
    phase: string; register: boolean; join: boolean; discover: boolean }>;
};
const base: Workshop = { id: 'fixture', slug: 'fixture', title: 'Fixture', hostName: 'Fixture', mode: 'Online — Google Meet',
  startsAt: matrix.startsAt, endsAt: matrix.endsAt, timezone: 'Asia/Kolkata', status: 'open', shortDescription: '', fullDescription: '', tags: [] };

for (const row of matrix.cases) test(`lifecycle: ${row.name}`, () => {
  const workshop = { ...base, status: row.status as Workshop['status'],
    startsAt: row.startsAt === undefined ? matrix.startsAt : row.startsAt,
    endsAt: row.endsAt === undefined ? matrix.endsAt : row.endsAt };
  const result = workshopLifecycle(workshop, Date.parse(row.now));
  assert.equal(result.phase, row.phase);
  assert.equal(result.registrationEligible, row.register);
  assert.equal(result.cancellationEligible, row.register);
  assert.equal(result.joinEligible, row.join);
  assert.equal(result.discoverable, row.discover);
});

test('discovery sorts ongoing first, scheduled by instant and unscheduled last with stable ID ties', () => {
  const future = { ...base, startsAt: '2030-01-02T14:00:00Z', endsAt: '2030-01-02T15:00:00Z' };
  const rows = [
    { ...base, id: 'unscheduled', status: 'coming_soon' as const, startsAt: null, endsAt: null },
    { ...future, id: 'b' }, { ...base, id: 'ongoing' }, { ...future, id: 'a' },
    { ...future, id: 'cancelled', status: 'cancelled' as const },
  ];
  const before = [...rows];
  assert.deepEqual(discoverWorkshops(rows, Date.parse('2030-01-02T12:30:00Z')).map(row => row.id), ['ongoing', 'a', 'b', 'unscheduled']);
  assert.deepEqual(rows, before, 'discovery must not reorder the shared catalog');
});

test('schedule formatting handles timezone, cross-midnight dates and explicit invalid states', () => {
  assert.match(formatWorkshopSchedule(base), /5:30.*6:30/);
  assert.match(formatWorkshopSchedule({ ...base, startsAt: '2030-01-02T23:30:00Z', endsAt: '2030-01-03T00:30:00Z', timezone: 'UTC' }), /2 Jan,? 2030.*3 Jan,? 2030/);
  assert.equal(formatWorkshopSchedule({ ...base, status: 'coming_soon', startsAt: null, endsAt: null }), 'Date to be announced');
  assert.equal(formatWorkshopSchedule({ ...base, startsAt: null, endsAt: null }), 'Schedule unavailable');
  assert.equal(formatWorkshopSchedule({ ...base, endsAt: null }), 'Schedule unavailable');
  assert.match(formatWorkshopSchedule({ ...base, timezone: 'Invalid/Zone' }), /timezone unavailable; shown in UTC/);
  assert.equal(parseWorkshopInstant('2030-02-30T12:00:00Z'), null);
  assert.equal(parseWorkshopInstant('2030-01-02T12:00:00'), null);
});
