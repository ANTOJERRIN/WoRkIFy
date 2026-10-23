import { test, expect, type Page } from '@playwright/test';
import { setupSession, archived, profile } from './session-fixture';
import type {} from './session-control';

const start = '2030-01-02T12:00:00Z';
const end = '2030-01-02T13:00:00Z';
const workshop = { ...archived, id: '11111111-1111-4111-8111-111111111111', slug: 'dashboard-fixture',
  title: 'Dashboard fixture', status: 'open', starts_at: start as string | null, ends_at: end as string | null };

async function registrations(page: Page, workshops: (typeof workshop | null)[]) {
  await page.route('**/rest/v1/registrations*', route => {
    expect(new URL(route.request().url()).searchParams.get('user_id')).toBe(`eq.${profile.id}`);
    return route.fulfill({ json: workshops.map((row, index) => ({
      id: `registration-${index}`, user_id: profile.id, workshop_id: row?.id ?? 'missing',
      created_at: '2030-01-01T12:00:00Z', workshops: row,
    })) });
  });
}

test('dashboard groups real reservations, sorts schedules and preserves closed and missing history', async ({ page }) => {
  await setupSession(page, true);
  await page.clock.install({ time: new Date('2030-01-02T12:30:00Z') });
  await registrations(page, [
    { ...workshop, title: 'Later session', starts_at: '2030-01-04T12:00:00Z', ends_at: '2030-01-04T13:00:00Z' },
    { ...workshop, title: 'Earlier session', starts_at: '2030-01-03T12:00:00Z', ends_at: '2030-01-03T13:00:00Z' },
    { ...workshop, title: 'Ongoing session' },
    { ...workshop, title: 'Past session', starts_at: '2030-01-01T12:00:00Z', ends_at: '2030-01-01T13:00:00Z' },
    { ...workshop, title: 'Cancelled session', status: 'cancelled' },
    { ...workshop, title: 'Archived session', status: 'archived' },
    { ...workshop, title: 'Unscheduled session', status: 'coming_soon', starts_at: null, ends_at: null },
    { ...workshop, title: 'Invalid schedule', ends_at: null },
    null,
  ]);
  await page.goto('/dashboard');
  const upcoming = page.getByRole('region', { name: 'Upcoming sessions (3)', exact: true });
  await expect(upcoming.getByRole('heading', { level: 3 })).toHaveText(['Earlier session', 'Later session', 'Unscheduled session']);
  await expect(page.getByRole('region', { name: 'Ongoing sessions (1)', exact: true })).toBeVisible();
  const history = page.getByRole('region', { name: 'Past and closed sessions (3)', exact: true });
  await expect(history.getByRole('article')).toHaveCount(3);
  await expect(history.getByRole('button', { name: /Cancel registration/ })).toHaveCount(0);
  await expect(history.getByRole('link', { name: /Join/ })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Sessions needing schedule updates (1)', exact: true })).toBeVisible();
  await expect(page.getByText('9 registered', { exact: true })).toBeVisible();
  await expect(page.getByText('Some workshop details are unavailable. Your registrations are preserved.', { exact: true })).toBeVisible();
  await expect(page.getByText('Hosted by F1 Forge', { exact: true })).toHaveCount(8);
  await expect(page.getByRole('button', { name: /Cancel registration for/ })).toHaveCount(2);
  await expect(page.getByRole('article')).toHaveCount(8);
  expect(await page.locator('main').evaluate(element => element.scrollWidth <= window.innerWidth)).toBe(true);
});

test('registered sessions move from upcoming to ongoing to history without reloading', async ({ page }) => {
  await setupSession(page, true);
  await page.clock.install({ time: new Date('2030-01-02T11:59:57Z') });
  await page.clock.pauseAt(new Date('2030-01-02T11:59:58Z'));
  await registrations(page, [workshop]);
  await page.goto('/dashboard');
  await expect(page.getByRole('region', { name: 'Upcoming sessions (1)', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Cancel registration for/ })).toBeVisible();
  await page.clock.fastForward(3100);
  await expect(page.getByRole('region', { name: 'Ongoing sessions (1)', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Cancel registration for/ })).toHaveCount(0);
  await page.clock.fastForward(60 * 60 * 1000);
  await expect(page.getByRole('region', { name: 'Past and closed sessions (1)', exact: true })).toBeVisible();
  await expect(page.getByText('Does not confirm attendance or completion.', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /Join/ })).toHaveCount(0);
});

test('workshop titles support keyboard detail navigation and browser back', async ({ page }) => {
  await setupSession(page, true);
  await registrations(page, [workshop]);
  await page.route('**/rest/v1/workshops*', route => route.fulfill({ json: [workshop] }));
  await page.goto('/dashboard');
  const title = page.getByRole('button', { name: workshop.title, exact: true });
  await title.focus();
  await expect(title).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(`/workshops/${workshop.id}$`));
  await expect(page.getByRole('heading', { name: workshop.title, exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
});

test('a loaded dashboard clears immediately on account switch and logout', async ({ page }) => {
  await setupSession(page, true);
  const otherId = '66666666-6666-4666-8666-666666666666';
  await page.route('**/rest/v1/registrations*', route => {
    const owner = new URL(route.request().url()).searchParams.get('user_id');
    expect([`eq.${profile.id}`, `eq.${otherId}`]).toContain(owner);
    return route.fulfill({ json: [{ id: 'reservation', user_id: owner!.slice(3), workshop_id: workshop.id,
      created_at: '2030-01-01T12:00:00Z', workshops: { ...workshop, title: owner === `eq.${profile.id}` ? 'First private session' : 'Second private session' },
    }] });
  });
  await page.goto('/tests/browser/harness.html?session=controlled');
  await page.evaluate(() => window.sessionTest.resolve(window.sessionTest.initial));
  await page.getByRole('button', { name: 'Private dashboard', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'First private session', exact: true })).toBeVisible();
  await page.evaluate(id => {
    const initial = window.sessionTest.initial!;
    window.sessionTest.emit({ ...initial, user: { ...initial.user, id } });
  }, otherId);
  await expect(page.getByRole('heading', { name: 'First private session', exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Second private session', exact: true })).toBeVisible();
  await page.evaluate(() => window.sessionTest.emit(null));
  await expect(page.getByRole('heading', { name: 'Second private session', exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Registration IDs')).toBeEmpty();
  await expect(page.getByRole('heading', { name: 'Sign-in temporarily unavailable', exact: true })).toBeVisible();
});
