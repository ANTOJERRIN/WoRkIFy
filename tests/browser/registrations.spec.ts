import { test, expect, type Page } from '@playwright/test';
import { setupSession, profile, archived } from './session-fixture';

const workshopId = '11111111-1111-4111-8111-111111111111';
const workshop = { ...archived, id: workshopId, slug: 'registration-fixture', title: 'Registration fixture',
  status: 'open', starts_at: '2099-01-01T10:00:00Z', ends_at: '2099-01-01T11:00:00Z' };
const reservation = { id: '77777777-7777-4777-8777-777777777777', user_id: profile.id,
  workshop_id: workshopId, created_at: '2026-10-22T10:00:00Z', workshops: workshop };

async function catalog(page: Page) {
  let reads = 0;
  await page.route('**/rest/v1/workshops*', async route => { reads++; await route.fulfill({ json: [workshop] }); });
  return () => reads;
}

test('anonymous registration explains unavailable sign-in without issuing a mutation', async ({ page }) => {
  const requests = await setupSession(page); await catalog(page);
  await page.goto('/tests/browser/harness.html');
  await page.getByRole('button', { name: 'Register fixture', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Sign-in temporarily unavailable' })).toBeVisible();
  expect(requests.some(url => url.pathname === '/rest/v1/registrations')).toBe(false);
});

test('a server lifecycle denial refreshes stale workshop actions and keeps registration empty', async ({ page }) => {
  await setupSession(page, true);
  let cancelled = false;
  await page.route('**/rest/v1/workshops*', route => route.fulfill({ json: [{ ...workshop, status: cancelled ? 'cancelled' : 'open' }] }));
  await page.route('**/rest/v1/registrations*', async route => {
    if (route.request().method() === 'POST') {
      cancelled = true;
      await route.fulfill({ status: 400, json: { code: 'P0001', message: 'Registration and cancellation are available only for open workshops before they start.' } });
    } else await route.fulfill({ json: [] });
  });
  await page.goto('/tests/browser/harness.html');
  await page.getByTitle('View Details', { exact: true }).click();
  await page.getByRole('button', { name: 'Register for workshop', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('only for open workshops before they start');
  await expect(page.getByRole('button', { name: 'Register for workshop', exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Registration IDs')).toBeEmpty();
});

test('pending registration blocks repeated clicks; success refreshes catalog, detail, dashboard and profile', async ({ page }) => {
  await setupSession(page, true);
  const catalogReads = await catalog(page);
  let saved = false, writes = 0;
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/rest/v1/registrations*', async route => {
    if (route.request().method() === 'POST') {
      expect(route.request().postDataJSON()).toEqual({ user_id: profile.id, workshop_id: workshopId });
      writes++; await gate; saved = true; await route.fulfill({ status: 201, body: '' });
    } else await route.fulfill({ json: saved ? [reservation] : [] });
  });
  await page.goto('/tests/browser/harness.html');
  await page.getByTitle('View Details', { exact: true }).click();
  const initialReads = catalogReads();
  await page.getByRole('button', { name: 'Register for workshop', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Registering...', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Register fixture', exact: true }).click();
  expect(writes).toBe(1);
  await expect(page.getByLabel('Registration IDs')).toBeEmpty();
  release();
  await expect(page.getByText('Registered ✓', { exact: true })).toBeVisible();
  await expect.poll(catalogReads).toBeGreaterThan(initialReads);
  await page.getByRole('button', { name: 'Private dashboard', exact: true }).click();
  await expect(page.getByRole('heading', { name: workshop.title, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Private profile', exact: true }).click();
  await expect(page.getByText(workshop.title, { exact: true })).toBeVisible();
});

test('duplicate registration is success only after an owner-scoped reservation is confirmed', async ({ page }) => {
  await setupSession(page, true); await catalog(page);
  let attempted = false;
  let verified = false;
  await page.route('**/rest/v1/registrations*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (request.method() === 'POST') {
      attempted = true;
      await route.fulfill({ status: 409, json: { code: '23505', message: 'Duplicate fixture' } });
    } else if (url.searchParams.get('select') === 'id') {
      expect(url.searchParams.get('user_id')).toBe(`eq.${profile.id}`);
      expect(url.searchParams.get('workshop_id')).toBe(`eq.${workshopId}`);
      verified = true;
      await route.fulfill({ json: [{ id: reservation.id }] });
    } else await route.fulfill({ json: attempted ? [reservation] : [] });
  });
  await page.goto('/tests/browser/harness.html');
  await expect(page.getByLabel('Profile name')).toHaveText(profile.name);
  await page.getByRole('button', { name: 'Register fixture', exact: true }).click();
  await expect(page.getByLabel('Registration IDs')).toHaveText(workshopId);
  expect(verified).toBe(true);
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('an unrelated uniqueness error cannot become successful registration', async ({ page }) => {
  await setupSession(page, true); await catalog(page);
  await page.route('**/rest/v1/registrations*', route => route.fulfill(route.request().method() === 'POST'
    ? { status: 409, json: { code: '23505', message: 'Unrelated fixture constraint' } }
    : { json: [] }));
  await page.goto('/tests/browser/harness.html');
  await expect(page.getByLabel('Profile name')).toHaveText(profile.name);
  await page.getByRole('button', { name: 'Register fixture', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('could not confirm');
  await expect(page.getByLabel('Registration IDs')).toBeEmpty();
});

test('session expiry during registration leaves no fabricated reservation and gives recovery guidance', async ({ page }) => {
  await setupSession(page, true); await catalog(page);
  await page.route('**/rest/v1/registrations*', route => route.fulfill(route.request().method() === 'POST'
    ? { status: 401, json: { code: 'PGRST301', message: 'JWT fixture expired' } }
    : { json: [] }));
  await page.goto('/tests/browser/harness.html');
  await expect(page.getByLabel('Profile name')).toHaveText(profile.name);
  await page.getByRole('button', { name: 'Register fixture', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Your session expired. Reload');
  await expect(page.getByLabel('Registration IDs')).toBeEmpty();
});

test('saved mutation with a failed refresh reports saved state separately from mutation failure', async ({ page }) => {
  await setupSession(page, true); await catalog(page);
  let saved = false;
  await page.route('**/rest/v1/registrations*', async route => {
    if (route.request().method() === 'POST') { saved = true; await route.fulfill({ status: 201, body: '' }); }
    else await route.fulfill(saved ? { status: 403, json: { message: 'Read fixture unavailable' } } : { json: [] });
  });
  await page.goto('/tests/browser/harness.html');
  await expect(page.getByLabel('Profile name')).toHaveText(profile.name);
  await page.getByRole('button', { name: 'Register fixture', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Your update was saved' })).toBeVisible();
  await expect(page.getByText(/Registration update failed:/)).toHaveCount(0);
});

test('a late mutation from a signed-out account cannot repopulate private state', async ({ page }) => {
  await setupSession(page, true); await catalog(page);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let writes = 0;
  await page.route('**/rest/v1/registrations*', async route => {
    if (route.request().method() === 'POST') {
      writes++; await gate; await route.fulfill({ status: 201, body: '' }).catch(() => {});
    } else await route.fulfill({ json: [] });
  });
  await page.goto('/tests/browser/harness.html?session=controlled');
  await page.evaluate(() => window.sessionTest.resolve(window.sessionTest.initial));
  await expect(page.getByLabel('Profile name')).toHaveText(profile.name);
  await page.getByRole('button', { name: 'Register fixture', exact: true }).click();
  await expect.poll(() => writes).toBe(1);
  await page.evaluate(() => window.sessionTest.emit(null));
  await expect(page.getByLabel('Session status')).toHaveText('signed-out');
  release();
  await expect(page.getByLabel('Registration IDs')).toBeEmpty();
  await expect(page.getByLabel('Profile name')).toHaveText('No profile loaded');
});

test('a stalled mutation releases the pending control and explains uncertain outcome', async ({ page }) => {
  await setupSession(page, true); await catalog(page);
  await page.clock.install();
  await page.route('**/rest/v1/registrations*', route => route.request().method() === 'POST'
    ? new Promise<void>(() => {}) : route.fulfill({ json: [] }));
  await page.goto('/tests/browser/harness.html');
  await expect(page.getByLabel('Profile name')).toHaveText(profile.name);
  await page.getByTitle('View Details', { exact: true }).click();
  await page.getByRole('button', { name: 'Register for workshop', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Registering...', exact: true })).toBeDisabled();
  await page.clock.fastForward(15_100);
  await expect(page.getByRole('alert')).toContainText('Refresh registrations before retrying');
  await expect(page.getByRole('button', { name: 'Register for workshop', exact: true })).toBeEnabled();
  await page.unrouteAll({ behavior: 'ignoreErrors' });
});
