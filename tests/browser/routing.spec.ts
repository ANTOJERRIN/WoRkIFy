import { test, expect, type Page } from '@playwright/test';
import { setupSession } from './session-fixture';

const id = 'be33c1fc-e4c4-4def-b33e-078fdf662400';

async function openWorkshop(page: Page) {
  await setupSession(page);
  await page.route('**/rest/v1/workshops*', route => {
    const params = new URL(route.request().url()).searchParams;
    const found = params.get('id') === `eq.${id}` || params.get('slug') === 'eq.routing-fixture';
    return route.fulfill({ json: found ? [{
      id, slug: 'routing-fixture', title: 'Routing fixture', host_name: 'Test host',
      starts_at: null, ends_at: null, timezone: 'Asia/Kolkata', status: 'coming_soon',
      short_description: 'Test-only workshop', full_description: '', tags: [],
    }] : [] });
  });
}

test('direct ID and slug routes survive refresh with one shared page shell', async ({ page }) => {
  await openWorkshop(page);
  for (const key of [id, 'routing-fixture']) {
    await page.goto(`/workshops/${key}`);
    await expect(page.getByRole('heading', { name: 'Routing fixture', exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Routing fixture', exact: true })).toBeVisible();
    await expect(page.locator('header')).toHaveCount(1);
    await expect(page.locator('footer')).toHaveCount(1);
  }
});

test('legacy link becomes a canonical URL; Back and Forward follow page navigation', async ({ page }) => {
  await openWorkshop(page);
  await page.goto('/?workshop=routing-fixture');
  await expect(page).toHaveURL('/workshops/routing-fixture');
  await page.getByRole('button', { name: 'Back to all workshops', exact: true }).click();
  await expect(page).toHaveURL('/workshops');
  await expect(page.getByRole('heading', { name: 'Upcoming Workshops', exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Routing fixture', exact: true })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole('heading', { name: 'Upcoming Workshops', exact: true })).toBeVisible();
});

test('unknown, malformed and missing workshop routes have recovery states', async ({ page }) => {
  await openWorkshop(page);
  for (const path of ['/unknown', '/profile/somebody', '/workshops/a%2Fb']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: 'Page not found', exact: true })).toBeVisible();
  }
  // HTTP servers reject malformed escapes before serving the app. Verify the
  // parser also handles malformed paths reached through browser history.
  await page.evaluate(() => { history.pushState(null, '', '/workshops/%ZZ'); dispatchEvent(new PopStateEvent('popstate')); });
  await expect(page.getByRole('heading', { name: 'Page not found', exact: true })).toBeVisible();
  await page.goto('/workshops/missing');
  await expect(page.getByText('Workshop not found.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Back to all workshops', exact: true }).click();
  await expect(page).toHaveURL('/workshops');
});

test('anonymous direct private routes stay at their URL and never request private data', async ({ page }) => {
  const requests = await setupSession(page);
  for (const path of ['/dashboard', '/profile', '/admin']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: 'Sign-in temporarily unavailable', exact: true })).toBeVisible();
    await expect(page).toHaveURL(path);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Sign-in temporarily unavailable', exact: true })).toBeVisible();
  }
  expect(requests.every(url => url.pathname === '/rest/v1/workshops')).toBe(true);
});

test('pending session hides private content but public routes remain usable', async ({ page }) => {
  const requests = await setupSession(page);
  await page.goto('/tests/browser/harness.html?session=pending&shell=1');
  // Drive a real popstate through the production shell with a test-only pending session.
  await page.evaluate(() => { history.pushState(null, '', '/dashboard'); dispatchEvent(new PopStateEvent('popstate')); });
  await expect(page.getByRole('status')).toHaveText('Checking access...');
  await expect(page.getByRole('heading', { name: 'My Registered Workshops', exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Sign-in temporarily unavailable', exact: true })).toHaveCount(0);
  await page.evaluate(() => { history.pushState(null, '', '/workshops'); dispatchEvent(new PopStateEvent('popstate')); });
  await expect(page.getByRole('heading', { name: 'Upcoming Workshops', exact: true })).toBeVisible();
  expect(requests.every(url => url.pathname === '/rest/v1/workshops')).toBe(true);
});

test('existing session allows personal routes, denies ordinary users admin and preserves logout', async ({ page }) => {
  await setupSession(page, true);
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'My Registered Workshops', exact: true })).toBeVisible();
  await page.goto('/profile');
  await expect(page.getByRole('button', { name: 'Edit Profile', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Share/ })).toHaveCount(0);
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Admin access required', exact: true })).toBeVisible();
  await page.goto('/tests/browser/harness.html');
  await page.getByRole('button', { name: 'Logout', exact: true }).click();
  await expect(page).toHaveURL('/');
  await page.goBack();
  await expect(page.getByRole('button', { name: 'Edit Profile', exact: true })).toHaveCount(0);
});

test('admin route waits for a separate permission check', async ({ page }) => {
  await setupSession(page, true, true);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/rest/v1/admin_users*', async route => {
    await gate;
    await route.fulfill({ json: [{ user_id: '55555555-5555-4555-8555-555555555555' }] });
  });
  await page.goto('/admin');
  await expect(page.getByRole('status')).toHaveText('Checking access...');
  await expect(page.getByRole('button', { name: 'Create Workshop', exact: true })).toHaveCount(0);
  release();
  await expect(page.getByRole('main').getByRole('button', { name: 'Workshops', exact: true })).toBeVisible();
});

test('sharing copies the workshop URL without query or fragment and handles clipboard failure', async ({ page }) => {
  await openWorkshop(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async (text: string) => { (window as Window & { copiedLink?: string }).copiedLink = text; },
    } });
  });
  await page.goto(`/workshops/${id}?access_token=fixture#private-fragment`);
  await page.getByTitle('Share Workshop', { exact: true }).click();
  await expect(page.getByText('Copied', { exact: true })).toBeAttached();
  expect(await page.evaluate(() => (window as Window & { copiedLink?: string }).copiedLink)).toBe('http://127.0.0.1:4174/workshops/routing-fixture');
  await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('Denied'); }; });
  await page.getByTitle('Share Workshop', { exact: true }).click();
  await expect(page.getByLabel('Workshop share link')).toHaveValue('http://127.0.0.1:4174/workshops/routing-fixture');
  await expect(page.getByText('Copied', { exact: true })).toHaveCount(0);
});

test('direct workshop request failures offer retry', async ({ page }) => {
  await openWorkshop(page);
  let failed = true;
  await page.route('**/rest/v1/workshops*', async route => {
    if (new URL(route.request().url()).searchParams.has('slug') && failed) {
      await route.fulfill({ status: 403, json: { message: 'Temporary test failure' } });
    } else await route.fallback();
  });
  await page.goto('/workshops/routing-fixture');
  await expect(page.getByRole('alert')).toContainText('Workshop details could not be loaded');
  failed = false;
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Routing fixture', exact: true })).toBeVisible();
});
