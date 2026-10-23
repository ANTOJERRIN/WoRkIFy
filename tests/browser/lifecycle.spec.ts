import { test, expect, type Page } from '@playwright/test';
import { setupSession, archived, profile } from './session-fixture';

// Lifecycle and display must not depend on the browser's local timezone.
test.use({ timezoneId: 'America/Los_Angeles' });
const base = { ...archived, id: '11111111-1111-4111-8111-111111111111', slug: 'lifecycle-fixture',
  title: 'Lifecycle fixture', status: 'open', starts_at: '2030-01-02T12:00:00Z' as string | null,
  ends_at: '2030-01-02T13:00:00Z' as string | null };
type Row = typeof base;

async function freezeClock(page: Page, instant: string) {
  await page.clock.install({ time: new Date(Date.parse(instant) - 1000) });
  await page.clock.pauseAt(new Date(instant));
}

async function mockWorkshops(page: Page, rows: Row[]) {
  await page.route('**/rest/v1/workshops*', route => {
    const params = new URL(route.request().url()).searchParams;
    const result = rows.filter(row => (!params.has('id') || params.get('id') === `eq.${row.id}`)
      && (!params.has('slug') || params.get('slug') === `eq.${row.slug}`));
    return route.fulfill({ json: result });
  });
}

test('discovery orders ongoing and scheduled rows, labels unscheduled rows, and excludes unsafe/history states', async ({ page }) => {
  await setupSession(page);
  await freezeClock(page, '2030-01-02T12:30:00Z');
  const rows: Row[] = [
    { ...base, id: 'unscheduled', title: 'Unscheduled fixture', status: 'coming_soon', starts_at: null, ends_at: null },
    { ...base, id: 'later', title: 'Later fixture', starts_at: '2030-01-03T12:00:00Z', ends_at: '2030-01-03T13:00:00Z' },
    { ...base, id: 'earlier', title: 'Earlier fixture', starts_at: '2030-01-02T14:00:00Z', ends_at: '2030-01-02T15:00:00Z' },
    { ...base, id: 'ongoing', title: 'Ongoing fixture' },
    { ...base, id: 'completed', title: 'Completed fixture', ends_at: '2030-01-02T12:15:00Z' },
    { ...base, id: 'cancelled', title: 'Cancelled fixture', status: 'cancelled' },
    { ...base, id: 'archived', title: 'Archived fixture', status: 'archived' },
    { ...base, id: 'invalid', title: 'Invalid fixture', ends_at: null },
  ];
  await mockWorkshops(page, rows);
  await page.goto('/workshops');
  await expect(page.locator('main h3')).toHaveText(['Ongoing fixture', 'Earlier fixture', 'Later fixture', 'Unscheduled fixture']);
  await expect(page.getByText('Ongoing · Registration closed', { exact: true })).toBeVisible();
  await expect(page.getByText('Date to be announced', { exact: true })).toBeVisible();
  await page.getByPlaceholder('Search by title, host, or tags...').fill('completed');
  await expect(page.getByText('No workshops match your search.', { exact: true })).toBeVisible();
});

test('registration closes at start and discovery drops the completed session without a refresh', async ({ page }) => {
  await setupSession(page);
  await freezeClock(page, '2030-01-02T11:59:59Z');
  await mockWorkshops(page, [base]);
  await page.goto('/workshops');
  await expect(page.getByRole('button', { name: 'Register', exact: true })).toBeVisible();
  await page.clock.fastForward(1100);
  await expect(page.getByRole('button', { name: 'Register', exact: true })).toHaveCount(0);
  await expect(page.getByText('Ongoing · Registration closed', { exact: true })).toBeVisible();
  await page.clock.fastForward(60 * 60 * 1000);
  await expect(page.getByText('No upcoming workshops yet.', { exact: true })).toBeVisible();
});

test('direct completed, cancelled and invalid-schedule details cannot offer registration or Calendar actions', async ({ page }) => {
  const requests = await setupSession(page);
  await freezeClock(page, '2030-01-02T12:30:00Z');
  for (const row of [
    { ...base, status: 'cancelled' },
    { ...base, ends_at: '2030-01-02T12:15:00Z' },
    { ...base, ends_at: null },
  ]) {
    await mockWorkshops(page, [row]);
    await page.goto(`/workshops/${base.id}`);
    await expect(page.getByRole('heading', { name: base.title, exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Register for workshop|Cancel registration|Add to Google Calendar/ })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Join/ })).toHaveCount(0);
    await page.unroute('**/rest/v1/workshops*');
  }
  expect(requests.some(url => /workshop_links|registrations/.test(url.pathname))).toBe(false);
});

test('registered meeting presentation opens at minus fifteen minutes and removes the link at the exact end', async ({ page }) => {
  await setupSession(page, true);
  await freezeClock(page, '2030-01-02T11:44:59Z');
  await mockWorkshops(page, [base]);
  await page.route('**/rest/v1/registrations*', route => route.fulfill({ json: [{
    id: 'lifecycle-registration', user_id: profile.id, workshop_id: base.id,
    created_at: '2030-01-01T12:00:00Z', workshops: base,
  }] }));
  let linkRequests = 0;
  let serverState: 'upcoming' | 'joinable' | 'ended' = 'upcoming';
  await page.route('**/rest/v1/rpc/get_workshop_join_state', route => {
    linkRequests++;
    return route.fulfill({ json: serverState === 'joinable'
      ? { status: serverState, meet_url: 'https://meet.google.com/abc-defg-hij', refresh_after_ms: 30000 }
      : { status: serverState, ...(serverState === 'upcoming' ? { refresh_after_ms: 1000 } : {}) } });
  });
  await page.goto(`/workshops/${base.id}`);
  await expect(page.getByText(/Join opens 15m prior/)).toBeVisible();
  await expect.poll(() => linkRequests).toBeGreaterThan(0);
  serverState = 'joinable';
  await page.clock.fastForward(1100);
  await expect(page.getByRole('link', { name: /Join Google Meet/ })).toBeVisible();
  expect(linkRequests).toBeGreaterThan(1);
  serverState = 'ended';
  await page.clock.fastForward(75 * 60 * 1000);
  await expect(page.getByRole('link', { name: /Join/ })).toHaveCount(0);
  await expect(page.getByText('Completed session · Registration history', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancel registration', exact: true })).toHaveCount(0);
});

test('completed and cancelled registrations stay in history without implying attendance or requesting links', async ({ page }) => {
  const requests = await setupSession(page, true);
  await freezeClock(page, '2030-01-02T14:00:00Z');
  await page.route('**/rest/v1/registrations*', route => route.fulfill({ json: ['open', 'cancelled'].map((status, index) => ({
    id: `history-${index}`, user_id: profile.id, workshop_id: `${index}`, created_at: '2030-01-01T12:00:00Z',
    workshops: { ...base, id: `${index}`, status, title: `${status} history fixture` },
  })) }));
  await page.goto('/dashboard');
  await expect(page.getByText('Completed session · Registration history', { exact: true })).toBeVisible();
  await expect(page.getByText('Cancelled workshop · Registration history', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toHaveCount(0);
  await expect(page.getByText(/Attended|Certified|Assessment passed/i)).toHaveCount(0);
  expect(requests.some(url => url.pathname === '/rest/v1/workshop_links')).toBe(false);
});

test('admin UTC controls preserve instants across browser timezone and reject partial open schedules', async ({ page }) => {
  await setupSession(page, true, true);
  await mockWorkshops(page, [base]);
  let update: Record<string, unknown> | null = null;
  await page.route('**/rest/v1/workshops*', async route => {
    if (route.request().method() === 'PATCH') {
      update = route.request().postDataJSON();
      await route.fulfill({ json: { ...base, ...update } });
    } else await route.fallback();
  });
  await page.goto('/admin');
  await page.getByTitle('Edit', { exact: true }).click();
  await expect(page.getByLabel('Starts At (UTC)', { exact: true })).toHaveValue('2030-01-02T12:00');
  await expect(page.getByLabel('Ends At (UTC)', { exact: true })).toHaveValue('2030-01-02T13:00');
  await page.getByLabel('Ends At (UTC)', { exact: true }).fill('');
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await expect(page.getByText(/Provide valid start and end times/)).toBeVisible();
  expect(update).toBeNull();
  await page.getByLabel('Ends At (UTC)', { exact: true }).fill('2030-01-02T14:00');
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await expect.poll(() => update?.ends_at).toBe('2030-01-02T14:00:00.000Z');
  await expect.poll(() => update?.starts_at).toBe('2030-01-02T12:00:00.000Z');
});
