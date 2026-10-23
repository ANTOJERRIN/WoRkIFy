import { test, expect } from '@playwright/test';
import { setupSession, profile, archived } from './session-fixture';

test('profile failure, missing record and retry are distinct from a fabricated identity', async ({ page }) => {
  await setupSession(page, true);
  let response: 'failed' | 'missing' | 'present' = 'failed';
  await page.route('**/rest/v1/profiles*', route => route.fulfill(response === 'failed'
    ? { status: 403, json: { message: 'Profile fixture denied' } }
    : { json: response === 'missing' ? [] : [profile] }));
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Profile could not be loaded' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Edit Profile', exact: true })).toHaveCount(0);
  response = 'missing';
  await page.getByRole('button', { name: 'Retry profile' }).click();
  await expect(page.getByRole('heading', { name: 'Profile record unavailable' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Edit Profile', exact: true })).toHaveCount(0);
  response = 'present';
  await page.getByRole('button', { name: 'Retry profile' }).click();
  await expect(page.getByRole('heading', { name: profile.name, exact: true })).toBeVisible();
});

test('profile and dashboard share one registration load and an explicit refresh', async ({ page }) => {
  const requests = await setupSession(page, true);
  await page.goto('/tests/browser/harness.html');
  await expect(page.getByLabel('Registration IDs')).toHaveText(archived.id);
  const reads = () => requests.filter(url => url.pathname === '/rest/v1/registrations');
  const initialCount = reads().length;
  for (const name of ['Private dashboard', 'Private profile', 'Private dashboard']) {
    await page.getByRole('button', { name, exact: true }).click();
    await expect(page.getByRole('heading', { name: archived.title, exact: true })).toBeVisible();
    expect(reads()).toHaveLength(initialCount);
  }
  await page.getByRole('button', { name: 'Refresh registrations', exact: true }).click();
  await expect.poll(() => reads().length).toBe(initialCount + 1);
  await expect(page.getByRole('heading', { name: archived.title, exact: true })).toBeVisible();
  expect(reads().every(url => url.searchParams.get('user_id') === `eq.${profile.id}`)).toBe(true);
});

test('registration read failure has retry on both personal pages and never appears as an empty success', async ({ page }) => {
  await setupSession(page, true);
  let fail = true;
  await page.route('**/rest/v1/registrations*', async route => {
    if (fail) await route.fulfill({ status: 403, json: { message: 'Registration fixture denied' } });
    else await route.fallback();
  });
  await page.goto('/tests/browser/harness.html');
  await page.getByRole('button', { name: 'Private dashboard', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Failed to load registrations' })).toBeVisible();
  await expect(page.getByText("You haven't registered for any workshops yet", { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Private profile', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Registrations could not be loaded');
  await expect(page.getByText('Not registered for any workshops yet.', { exact: true })).toHaveCount(0);
  fail = false;
  await page.getByRole('button', { name: 'Retry registrations', exact: true }).click();
  await expect(page.getByRole('heading', { name: archived.title, exact: true })).toBeVisible();
});

test('slow initial registrations and refreshing registrations retain different presentations', async ({ page }) => {
  await setupSession(page, true);
  let release!: () => void;
  let gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/rest/v1/registrations*', async route => { await gate; await route.fallback(); });
  await page.goto('/tests/browser/harness.html');
  await page.getByRole('button', { name: 'Private dashboard', exact: true }).click();
  await expect(page.getByText('Loading your registrations...', { exact: true })).toBeVisible();
  await expect(page.getByText("You haven't registered for any workshops yet", { exact: true })).toHaveCount(0);
  release();
  await expect(page.getByRole('heading', { name: archived.title, exact: true })).toBeVisible();
  gate = new Promise<void>(resolve => { release = resolve; });
  await page.getByRole('button', { name: 'Refresh registrations', exact: true }).click();
  await expect(page.getByText('Refreshing registrations...', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: archived.title, exact: true })).toBeVisible();
  release();
  await expect(page.getByText('Refreshing registrations...', { exact: true })).toHaveCount(0);
});

test('newer profile refresh wins over an older delayed response', async ({ page }) => {
  await setupSession(page, true);
  await page.goto('/tests/browser/harness.html');
  await expect(page.getByLabel('Profile name')).toHaveText(profile.name);
  let calls = 0;
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/rest/v1/profiles*', async route => {
    const index = ++calls;
    if (index === 1) await gate;
    await route.fulfill({ json: [{ ...profile, name: index === 1 ? 'Outdated response' : 'Newest response' }] }).catch(() => {});
  });
  await page.getByRole('button', { name: 'Reload profile', exact: true }).click();
  await expect.poll(() => calls).toBe(1);
  await page.getByRole('button', { name: 'Reload profile', exact: true }).click();
  await expect(page.getByLabel('Profile name')).toHaveText('Newest response');
  release();
  await expect(page.getByLabel('Profile name')).toHaveText('Newest response');
});

test('a stalled registration read stops loading and exposes a retry', async ({ page }) => {
  await setupSession(page, true);
  await page.clock.install();
  await page.route('**/rest/v1/registrations*', () => new Promise<void>(() => {}));
  await page.goto('/tests/browser/harness.html');
  await page.getByRole('button', { name: 'Private dashboard', exact: true }).click();
  await expect(page.getByText('Loading your registrations...', { exact: true })).toBeVisible();
  await page.clock.fastForward(15_100);
  await expect(page.getByRole('heading', { name: 'Failed to load registrations' })).toBeVisible();
  await page.unrouteAll({ behavior: 'ignoreErrors' });
  await setupSession(page, true);
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('heading', { name: archived.title, exact: true })).toBeVisible();
});

test('saving a profile updates the shared display and refreshes from the API', async ({ page }) => {
  await setupSession(page, true);
  let saved = { ...profile };
  let patches = 0;
  let reads = 0;
  await page.route('**/rest/v1/profiles*', async route => {
    if (route.request().method() === 'PATCH') {
      expect(new URL(route.request().url()).searchParams.get('id')).toBe(`eq.${profile.id}`);
      saved = { ...saved, ...route.request().postDataJSON() };
      patches++;
      await route.fulfill({ json: saved });
    } else { reads++; await route.fulfill({ json: [saved] }); }
  });
  await page.goto('/tests/browser/harness.html');
  await page.getByRole('button', { name: 'Private profile', exact: true }).click();
  await page.getByRole('button', { name: 'Edit Profile', exact: true }).click();
  await page.getByPlaceholder('Your name', { exact: true }).fill('Updated fixture name');
  const before = reads;
  await page.getByRole('button', { name: 'Save Profile', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Updated fixture name', exact: true })).toBeVisible();
  await expect(page.getByLabel('Profile name')).toHaveText('Updated fixture name');
  expect(patches).toBe(1);
  await expect.poll(() => reads).toBeGreaterThan(before);
});

test('a failed cancellation preserves the registration and successful retry refreshes every consumer', async ({ page }) => {
  await setupSession(page, true);
  let fail = true;
  let rows = [{ id: 'registration-fixture', user_id: profile.id, workshop_id: archived.id,
    created_at: '2026-10-01T12:00:00Z', workshops: { ...archived, status: 'open', starts_at: '2099-01-01T10:00:00Z', ends_at: '2099-01-01T11:00:00Z' } }];
  await page.route('**/rest/v1/registrations*', async route => {
    if (route.request().method() === 'DELETE') {
      expect(new URL(route.request().url()).searchParams.get('user_id')).toBe(`eq.${profile.id}`);
      if (fail) await route.fulfill({ status: 403, json: { message: 'Cancellation fixture denied' } });
      else { rows = []; await route.fulfill({ json: [{ id: 'registration-fixture' }] }); }
    } else await route.fulfill({ json: rows });
  });
  await page.goto('/tests/browser/harness.html');
  await page.getByRole('button', { name: 'Private dashboard', exact: true }).click();
  await expect(page.getByRole('heading', { name: archived.title, exact: true })).toBeVisible();
  await page.getByRole('button', { name: `Cancel registration for ${archived.title}`, exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Registration update failed');
  await expect(page.getByRole('heading', { name: archived.title, exact: true })).toBeVisible();
  fail = false;
  await page.getByRole('button', { name: `Cancel registration for ${archived.title}`, exact: true }).click();
  await expect(page.getByText("You haven't registered for any workshops yet", { exact: true })).toBeVisible();
  await expect(page.getByLabel('Registration IDs')).toBeEmpty();
  await page.getByRole('button', { name: 'Private profile', exact: true }).click();
  await expect(page.getByText('Not registered for any workshops yet.', { exact: true })).toBeVisible();
});

test('successful registration refreshes shared status and uses the current account', async ({ page }) => {
  await setupSession(page, true);
  const workshopId = '11111111-1111-4111-8111-111111111111';
  let registered = false;
  await page.route('**/rest/v1/registrations*', async route => {
    if (route.request().method() === 'POST') {
      expect(route.request().postDataJSON()).toEqual({ user_id: profile.id, workshop_id: workshopId });
      registered = true;
      await route.fulfill({ status: 201, body: '' });
    } else await route.fulfill({ json: registered ? [{ id: 'new-registration', user_id: profile.id,
      workshop_id: workshopId, created_at: '2026-10-21T10:00:00Z', workshops: { ...archived, id: workshopId } }] : [] });
  });
  await page.goto('/tests/browser/harness.html');
  await expect(page.getByLabel('Profile name')).toHaveText(profile.name);
  await page.getByRole('button', { name: 'Register fixture', exact: true }).click();
  await expect(page.getByLabel('Registration IDs')).toHaveText(workshopId);
  await page.getByRole('button', { name: 'Private dashboard', exact: true }).click();
  await expect(page.getByRole('heading', { name: archived.title, exact: true })).toBeVisible();
});

test('missing joined metadata preserves registration IDs and does not claim an empty account', async ({ page }) => {
  await setupSession(page, true);
  await page.route('**/rest/v1/registrations*', route => route.fulfill({ json: [{
    id: 'unavailable-registration', user_id: profile.id, workshop_id: archived.id,
    created_at: '2026-10-21T10:00:00Z', workshops: null,
  }] }));
  await page.goto('/tests/browser/harness.html');
  await page.getByRole('button', { name: 'Private dashboard', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Workshop details unavailable', exact: true })).toBeVisible();
  await expect(page.getByLabel('Registration IDs')).toHaveText(archived.id);
  await page.getByRole('button', { name: 'Private profile', exact: true }).click();
  await expect(page.getByText('Some workshop details are unavailable. Your registrations are preserved.', { exact: true })).toBeVisible();
  await expect(page.getByText('Not registered for any workshops yet.', { exact: true })).toHaveCount(0);
});

test('theme toggle changes rendered colors and persists across reloads', async ({ page }) => {
  await setupSession(page);
  await page.goto('/workshops');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(250, 250, 252)');
  await page.getByRole('button', { name: 'Toggle Theme', exact: true }).click();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(7, 12, 31)');
  await page.reload();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(7, 12, 31)');
  await page.getByRole('button', { name: 'Toggle Theme', exact: true }).click();
  await page.reload();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(250, 250, 252)');
});

test('theme remains usable when preference storage is blocked', async ({ page }) => {
  await setupSession(page);
  await page.addInitScript(() => {
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === 'workify-theme') throw new Error('Isolated storage failure');
      return setItem.call(this, key, value);
    };
  });
  await page.goto('/workshops');
  await page.getByRole('button', { name: 'Toggle Theme', exact: true }).click();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(7, 12, 31)');
  await expect(page.getByRole('heading', { name: 'Upcoming Workshops', exact: true })).toBeVisible();
});

test('render failures show a recovery screen without replacing operational errors', async ({ page }) => {
  await setupSession(page);
  await page.goto('/tests/browser/harness.html?crash');
  await expect(page.getByRole('heading', { name: 'Workify encountered a problem' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reload page', exact: true })).toBeVisible();
});
