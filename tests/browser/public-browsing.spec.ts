import { test, expect, type Page } from '@playwright/test';

// Isolated HTTP fixtures. These never create workshops or accounts in Supabase.
const workshop = {
  id: '11111111-1111-4111-8111-111111111111', slug: 'browser-fixture',
  title: 'Browser fixture workshop', host_name: 'Test host', mode: 'Online — Google Meet',
  starts_at: '2099-10-20T14:00:00Z' as string | null, ends_at: '2099-10-20T15:00:00Z' as string | null,
  timezone: 'Asia/Kolkata', status: 'open', short_description: 'Isolated browser fixture',
  full_description: 'This response is intercepted in tests only.', tags: ['Testing'],
};

async function mockCatalog(page: Page, rows = [workshop]) {
  const requests: string[] = [];
  await page.route('https://workify-browser-test.supabase.co/**', async route => {
    requests.push(route.request().url());
    if (new URL(route.request().url()).pathname === '/rest/v1/workshops') {
      await route.fulfill({ json: rows });
    } else {
      await route.fulfill({ status: 401, json: { message: 'No test session' } });
    }
  });
  return requests;
}

async function browse(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Browse upcoming sessions', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Upcoming Workshops', exact: true })).toBeVisible();
}

test('protected action dialog dismisses with Escape and restores focus', async ({ page }, testInfo) => {
  await mockCatalog(page);
  await browse(page);
  const host = page.getByRole('button', { name: 'Host a workshop', exact: true });
  await host.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
  await page.screenshot({ path: testInfo.outputPath('auth-dialog.png') });
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Explore workshops', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(host).toBeFocused();
});

test('all public CTAs and workshop details work without a session', async ({ page, isMobile }, testInfo) => {
  const requests = await mockCatalog(page);
  const labels = ['Browse upcoming sessions'];
  for (const label of labels) {
    await page.goto('/');
    await page.getByRole('button', { name: label, exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Upcoming Workshops', exact: true })).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  for (let index = 0; index < 4; index++) {
    await page.goto('/');
    await page.getByText('Browse tracks', { exact: true }).nth(index).click();
    await expect(page.getByRole('heading', { name: 'Upcoming Workshops', exact: true })).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  for (const region of ['header', 'main']) {
    await page.goto('/');
    await page.locator(region).getByRole('button', { name: 'Explore workshops', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Upcoming Workshops', exact: true })).toBeVisible();
  }
  if (isMobile) {
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle navigation' }).click();
    await page.locator('header').getByRole('button', { name: 'Explore workshops', exact: true }).last().click();
  }
  await expect(page.getByRole('heading', { name: workshop.title, exact: true })).toBeVisible();
  const beforeDetails = requests.length;
  await page.getByRole('button', { name: 'View Details' }).click();
  await expect(page.getByRole('heading', { name: workshop.title, exact: true })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const before = requests.length;
  await page.getByRole('button', { name: 'Register for workshop', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(requests.slice(before)).toEqual([]);
  await page.getByRole('dialog').getByRole('button', { name: 'Explore workshops', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Upcoming Workshops', exact: true })).toBeVisible();
  expect(requests.every(url => new URL(url).pathname === '/rest/v1/workshops')).toBe(true);
  expect(requests.length).toBe(beforeDetails);
  await page.screenshot({ path: testInfo.outputPath('public-catalog.png'), fullPage: true });
  for (const url of requests) {
    const fields = new URL(url).searchParams.get('select');
    expect(fields).not.toContain('*');
    expect(fields).not.toMatch(/meet_url|registrations|profiles/);
  }
});

test('coming-soon cards expose safe public details', async ({ page }) => {
  await mockCatalog(page, [{ ...workshop, status: 'coming_soon', starts_at: null, ends_at: null }]);
  await browse(page);
  await page.getByRole('button', { name: 'View Details' }).click();
  await expect(page.getByRole('heading', { name: workshop.title, exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Register for workshop', exact: true })).toHaveCount(0);
});

test('empty catalog and unmatched search have separate messages', async ({ page }) => {
  await mockCatalog(page, []);
  await browse(page);
  await expect(page.getByText('No upcoming workshops yet.', { exact: true })).toBeVisible();
  await page.getByPlaceholder('Search by title, host, or tags...').fill('missing');
  await expect(page.getByText('No upcoming workshops yet.', { exact: true })).toBeVisible();
  await page.unrouteAll();
  await mockCatalog(page);
  await browse(page);
  await expect(page.getByRole('heading', { name: workshop.title, exact: true })).toBeVisible();
  await page.getByPlaceholder('Search by title, host, or tags...').fill('missing');
  await expect(page.getByText('No workshops match your search.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear search', exact: true }).click();
  await expect(page.getByRole('heading', { name: workshop.title, exact: true })).toBeVisible();
});

test('loading and database failure remain distinct; retry recovers', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let fail = true;
  await page.route('https://workify-browser-test.supabase.co/rest/v1/workshops**', async route => {
    await gate;
    await route.fulfill(fail
      ? { status: 403, json: { code: '42501', message: 'permission denied for table workshops' } }
      : { json: [workshop] });
  });
  await browse(page);
  await expect(page.getByText('Loading workshops...', { exact: true })).toBeVisible();
  release();
  await expect(page.getByRole('heading', { name: 'Failed to load workshops', exact: true })).toBeVisible();
  await expect(page.getByText('No upcoming workshops yet.', { exact: true })).toHaveCount(0);
  fail = false;
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('heading', { name: workshop.title, exact: true })).toBeVisible();
});

async function harness(page: Page, query = '') {
  await page.goto(`/tests/browser/harness.html?${query}`);
}

test('public catalog is independent of rejected or pending session restoration', async ({ page }) => {
  for (const session of ['reject', 'pending']) {
    await mockCatalog(page);
    await harness(page, `session=${session}`);
    await page.getByRole('button', { name: 'Public navigation', exact: true }).click();
    await expect(page.getByRole('heading', { name: workshop.title, exact: true })).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.unroute('https://workify-browser-test.supabase.co/**');
  }
});

test('ended and cancelled workshops do not populate the upcoming catalog', async ({ page }) => {
  await mockCatalog(page, [
    { ...workshop, starts_at: '2020-01-01T10:00:00Z', ends_at: '2020-01-01T11:00:00Z' },
    { ...workshop, id: '22222222-2222-4222-8222-222222222222', status: 'cancelled' },
  ]);
  await browse(page);
  await expect(page.getByText('No upcoming workshops yet.', { exact: true })).toBeVisible();
});

test('stale dialogs close on public navigation and logout; private actions stay guarded', async ({ page }) => {
  const requests = await mockCatalog(page);
  await harness(page);
  for (const label of ['Private dashboard', 'Private profile', 'Private admin', 'Open host']) {
    await page.getByRole('button', { name: label, exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Sign-in temporarily unavailable' })).toBeVisible();
    await page.keyboard.press('Escape');
  }
  const before = requests.length;
  await page.getByRole('button', { name: 'Cancel registration', exact: true }).click();
  expect(requests.slice(before)).toEqual([]);
  await page.getByRole('button', { name: 'Open auth', exact: true }).click();
  // Programmatic navigation represents a route change while a dialog is open.
  await page.getByRole('button', { name: 'Public navigation', exact: true, includeHidden: true }).evaluate(button => (button as HTMLButtonElement).click());
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Open auth', exact: true }).click();
  await page.getByRole('button', { name: 'Logout', exact: true, includeHidden: true }).evaluate(button => (button as HTMLButtonElement).click());
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(requests.every(url => new URL(url).pathname === '/rest/v1/workshops')).toBe(true);
});

test('missing workshop is distinct from a loading or database error', async ({ page }) => {
  await mockCatalog(page);
  await harness(page);
  await expect(page.getByRole('heading', { name: workshop.title, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Missing detail', exact: true }).click();
  await expect(page.getByText('Workshop not found.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Back to all workshops', exact: true }).click();
  await expect(page.getByRole('heading', { name: workshop.title, exact: true })).toBeVisible();
});
