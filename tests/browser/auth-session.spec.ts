import { test, expect } from '@playwright/test';
import { setupSession } from './session-fixture';
import type {} from './session-control';

test('slow and failed initialization keep public browsing usable and make no private requests', async ({ page }) => {
  const requests = await setupSession(page);
  await page.goto('/tests/browser/harness.html?session=controlled');
  await expect(page.getByLabel('Session status')).toHaveText('loading');
  await page.getByRole('button', { name: 'Public navigation', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Upcoming Workshops', exact: true })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.evaluate(() => window.sessionTest.reject());
  await expect(page.getByLabel('Session status')).toHaveText('failed');
  await page.getByRole('button', { name: 'Private profile', exact: true }).click();
  await expect(page.getByText('Your session could not be restored. Public workshops are still available.')).toBeVisible();
  expect(requests.every(url => url.pathname === '/rest/v1/workshops')).toBe(true);
});

test('initialization timeout ends the spinner and a later valid session can recover', async ({ page }) => {
  await setupSession(page, true);
  await page.clock.install();
  await page.goto('/tests/browser/harness.html?session=controlled');
  await expect(page.getByLabel('Session status')).toHaveText('loading');
  await page.clock.fastForward(12_100);
  await expect(page.getByLabel('Session status')).toHaveText('failed');
  await page.evaluate(() => window.sessionTest.resolve(window.sessionTest.initial));
  await expect(page.getByLabel('Session status')).toHaveText('authenticated');
});

test('auth events beat stale initialization and strict mode leaves one listener', async ({ page }) => {
  await setupSession(page, true);
  await page.goto('/tests/browser/harness.html?session=controlled');
  await expect.poll(() => page.evaluate(() => window.sessionTest.listeners())).toBe(1);
  await page.evaluate(() => {
    window.sessionTest.emit(window.sessionTest.initial);
    window.sessionTest.resolve(null);
  });
  await expect(page.getByLabel('Session status')).toHaveText('authenticated');
  await page.evaluate(() => window.sessionTest.emit(null));
  await expect(page.getByLabel('Session status')).toHaveText('signed-out');
  await expect(page.getByLabel('Permission status')).toHaveText('denied');
});

test('identity switch clears private state and ignores delayed previous-user responses', async ({ page }) => {
  await setupSession(page, true, true);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let oldRequests = 0;
  let returned = 0;
  let old = true;
  await page.route('**/rest/v1/*', async route => {
    const path = new URL(route.request().url()).pathname;
    if (!['/rest/v1/profiles', '/rest/v1/registrations', '/rest/v1/admin_users'].includes(path)) return route.fallback();
    const isOld = old;
    if (isOld) { oldRequests++; await gate; }
    await route.fulfill({ json: !isOld ? [] : path.endsWith('profiles') ? [{
      id: '55555555-5555-4555-8555-555555555555', name: 'Previous private name',
    }] : path.endsWith('registrations') ? [{ workshop_id: 'previous-private-registration' }] : [{ user_id: '55555555-5555-4555-8555-555555555555' }] });
    if (isOld) returned++;
  });
  await page.goto('/tests/browser/harness.html?session=controlled');
  await page.evaluate(() => window.sessionTest.resolve(window.sessionTest.initial));
  await expect.poll(() => oldRequests).toBe(3);
  await page.getByRole('button', { name: 'Open host', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  old = false;
  await page.evaluate(() => {
    const initial = window.sessionTest.initial!;
    window.sessionTest.emit({ ...initial, user: { ...initial.user,
      id: '66666666-6666-4666-8666-666666666666', user_metadata: { full_name: 'Current account' },
    } });
  });
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByLabel('Profile name')).toHaveText('No profile loaded');
  release();
  await expect.poll(() => returned).toBe(3);
  await expect(page.getByLabel('Registration IDs')).toBeEmpty();
  await expect(page.getByLabel('Profile name')).toHaveText('No profile loaded');
  await expect(page.getByLabel('Admin status')).toHaveText('false');
});

test('session expiry removes private content and clears loaded private state', async ({ page }) => {
  await setupSession(page, true);
  await page.goto('/tests/browser/harness.html?session=controlled');
  await page.evaluate(() => window.sessionTest.resolve(window.sessionTest.initial));
  await expect(page.getByLabel('Profile name')).toHaveText('History fixture user');
  await page.getByRole('button', { name: 'Private profile', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'History fixture user', exact: true })).toBeVisible();
  await page.evaluate(() => window.sessionTest.emit(null));
  await expect(page.getByRole('heading', { name: 'History fixture user', exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Registration IDs')).toBeEmpty();
  await expect(page.getByLabel('Profile name')).not.toHaveText('History fixture user');
});

test('expired stored sessions with a rejected refresh never fetch private data', async ({ page }) => {
  const requests = await setupSession(page, true);
  await page.addInitScript(() => {
    const key = 'sb-workify-browser-test-auth-token';
    const session = JSON.parse(localStorage.getItem(key)!);
    session.expires_at = 1;
    localStorage.setItem(key, JSON.stringify(session));
  });
  await page.route('**/auth/v1/token*', route => route.fulfill({
    status: 400, json: { code: 'refresh_token_not_found', message: 'Isolated expired refresh token' },
  }));
  await page.goto('/tests/browser/harness.html');
  await expect(page.getByLabel('Session status')).toHaveText(/signed-out|failed/);
  await page.getByRole('button', { name: 'Private dashboard', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Sign-in temporarily unavailable', exact: true })).toBeVisible();
  expect(requests.some(url => /\/rest\/v1\/(profiles|registrations|admin_users)/.test(url.pathname))).toBe(false);
});

test('admin request failure and timeout deny access without an endless permission spinner', async ({ page }) => {
  await page.clock.install();
  for (const mode of ['failure', 'timeout']) {
    await setupSession(page, true);
    await page.route('**/rest/v1/admin_users*', route => mode === 'failure'
      ? route.fulfill({ status: 403, json: { message: 'Isolated permission failure' } })
      : new Promise<void>(() => {}));
    await page.goto('/tests/browser/harness.html?session=controlled');
    await page.evaluate(() => window.sessionTest.resolve(window.sessionTest.initial));
    await page.getByRole('button', { name: 'Private admin', exact: true }).click();
    if (mode === 'timeout') await page.clock.fastForward(12_100);
    await expect(page.getByLabel('Permission status')).toHaveText('failed');
    await expect(page.getByText('Admin permission could not be checked. Access remains unavailable.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Workshop', exact: true })).toHaveCount(0);
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  }
});

test('remote logout failure reports partial success; retry finishes and clears data', async ({ page }) => {
  await setupSession(page, true);
  let fail = true;
  await page.route('**/auth/v1/logout*', route => route.fulfill(fail
    ? { status: 500, json: { message: 'Isolated sign-out failure' } }
    : { status: 204, body: '' }));
  await page.goto('/tests/browser/harness.html');
  await expect(page.getByLabel('Session status')).toHaveText('authenticated');
  await expect(page.getByLabel('Profile name')).toHaveText('History fixture user');
  await page.getByRole('button', { name: 'Private profile', exact: true }).click();
  await page.getByRole('button', { name: 'Logout', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('sign-out on other devices could not be confirmed');
  await expect(page.getByLabel('Session status')).toHaveText('signed-out');
  await expect(page.getByLabel('Current page')).toHaveText('profile');
  fail = false;
  await page.getByRole('button', { name: 'Logout', exact: true }).click();
  await expect(page.getByLabel('Session status')).toHaveText('signed-out');
  await expect(page.getByLabel('Current page')).toHaveText('landing');
  await expect(page.getByLabel('Registration IDs')).toBeEmpty();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('logout rejection without a sign-out event preserves the current valid session', async ({ page }) => {
  await setupSession(page, true);
  await page.goto('/tests/browser/harness.html?session=logout-reject');
  await expect(page.getByLabel('Session status')).toHaveText('authenticated');
  await page.getByRole('button', { name: 'Private profile', exact: true }).click();
  await page.getByRole('button', { name: 'Logout', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Sign-out failed');
  await expect(page.getByLabel('Session status')).toHaveText('authenticated');
  await expect(page.getByLabel('Current page')).toHaveText('profile');
});

test('protected route explains unavailable auth; dialog closes and public action ignores return URLs', async ({ page }) => {
  await setupSession(page);
  await page.goto('/tests/browser/harness.html?returnTo=https://untrusted.invalid');
  await page.getByRole('button', { name: 'Private dashboard', exact: true }).click();
  const opener = page.getByRole('button', { name: 'Sign-in information', exact: true });
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'Sign-in temporarily unavailable' });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(opener).toBeFocused();
  await opener.click();
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(opener).toBeFocused();
  await opener.click();
  await dialog.getByRole('button', { name: 'Explore workshops', exact: true }).click();
  await expect(page).toHaveURL('http://127.0.0.1:4174/workshops');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
});
