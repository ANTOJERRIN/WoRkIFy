import { test, expect, type Page } from '@playwright/test';
import { setupSession, archived, profile } from './session-fixture';

const workshop = { ...archived, id: '11111111-1111-4111-8111-111111111111', slug: 'meeting-fixture', title: 'Meeting fixture',
  status: 'open', starts_at: '2030-01-02T12:00:00Z', ends_at: '2030-01-02T13:00:00Z' };
const meetUrl = 'https://meet.google.com/abc-defg-hij';
const joinable = { status: 'joinable', meet_url: meetUrl, refresh_after_ms: 30000 };
async function setup(page: Page, signedIn = true, registered = true) {
  await setupSession(page, signedIn);
  await page.route('**/rest/v1/workshops*', route => route.fulfill({ json: [workshop] }));
  await page.route('**/rest/v1/registrations*', route => route.fulfill({ json: registered ? [{
    id: '77777777-7777-4777-8777-777777777777', user_id: profile.id, workshop_id: workshop.id,
    created_at: '2029-01-01T00:00:00Z', workshops: workshop,
  }] : [] }));
}
const detail = `/workshops/${workshop.id}`;

for (const path of [detail, '/dashboard']) {
  test(`typed server states and safe external links are shared at ${path}`, async ({ page }) => {
    await setup(page);
    let response: object = { status: 'upcoming', refresh_after_ms: 30000 };
    await page.route('**/rest/v1/rpc/get_workshop_join_state', route => {
      expect(route.request().postDataJSON()).toEqual({ p_workshop_id: workshop.id });
      return route.fulfill({ json: response });
    });
    await page.goto(path);
    await expect(page.getByText('Join opens 15m prior to the workshop start.', { exact: true })).toBeVisible();
    expect(await page.content()).not.toContain(meetUrl);
    response = joinable;
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    const link = page.getByRole('link', { name: /^Join (Google Meet|Meet)$/ });
    await expect(link).toHaveAttribute('href', meetUrl);
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).toHaveAttribute('referrerpolicy', 'no-referrer');
    response = { status: 'unauthorized', meet_url: meetUrl };
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(page.getByText(/Meeting access is not authorized/)).toBeVisible();
    await expect(link).toHaveCount(0);
    expect(await page.content()).not.toContain(meetUrl);
  });
}

test('anonymous and unregistered visitors never fetch or render a protected URL', async ({ page }) => {
  for (const signedIn of [false, true]) {
    await setup(page, signedIn, false);
    let calls = 0;
    await page.route('**/rest/v1/rpc/get_workshop_join_state', route => { calls++; return route.fulfill({ json: joinable }); });
    await page.goto(detail);
    await expect(page.getByRole('heading', { name: workshop.title, exact: true })).toBeVisible();
    if (signedIn) await expect(page.getByRole('button', { name: 'Register for workshop', exact: true })).toBeVisible();
    expect(calls).toBe(0);
    expect(await page.content()).not.toContain(meetUrl);
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  }
});

test('changing the browser wall clock cannot turn a server upcoming response into a join link', async ({ page }) => {
  await setup(page);
  await page.clock.install({ time: new Date('2030-01-02T11:00:00Z') });
  await page.route('**/rest/v1/rpc/get_workshop_join_state', route => route.fulfill({ json: { status: 'upcoming', refresh_after_ms: 30000 } }));
  await page.goto(detail);
  await expect(page.getByText(/Join opens 15m prior to the workshop start/)).toBeVisible();
  await page.clock.setSystemTime(new Date('2030-01-02T12:30:00Z'));
  await page.clock.fastForward(1100);
  await expect(page.getByRole('link', { name: /^Join/ })).toHaveCount(0);
  expect(await page.content()).not.toContain(meetUrl);
});

test('the lease removes a cached URL before a delayed renewal completes', async ({ page }) => {
  await setup(page); await page.clock.install();
  let calls = 0;
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/rest/v1/rpc/get_workshop_join_state', async route => {
    if (++calls === 1) await route.fulfill({ json: { ...joinable, refresh_after_ms: 1000 } });
    else { await gate; await route.fulfill({ json: { status: 'ended' } }); }
  });
  await page.goto(detail);
  await expect(page.getByRole('link', { name: 'Join Google Meet', exact: true })).toBeVisible();
  await page.clock.fastForward(1100);
  await expect(page.getByText('Checking meeting access...', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /^Join/ })).toHaveCount(0);
  release();
  await expect(page.getByText('Workshop ended · Meeting access closed', { exact: true })).toBeVisible();
});

test('transient errors and invalid URLs fail closed and a manual retry recovers', async ({ page }) => {
  await setup(page);
  let mode = 'error';
  await page.route('**/rest/v1/rpc/get_workshop_join_state', route => route.fulfill(mode === 'error'
    ? { status: 400, json: { message: `Private error ${meetUrl}` } }
    : { json: mode === 'invalid' ? { ...joinable, meet_url: 'javascript:alert(1)' } : joinable }));
  await page.goto(detail);
  await expect(page.getByRole('alert')).toContainText('Meeting access could not be checked');
  expect(await page.content()).not.toContain(meetUrl);
  mode = 'invalid';
  await page.getByRole('button', { name: 'Retry meeting access', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Meeting access could not be checked');
  await expect(page.getByRole('link', { name: /^Join/ })).toHaveCount(0);
  mode = 'success';
  await page.getByRole('button', { name: 'Retry meeting access', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Join Google Meet', exact: true })).toBeVisible();
});

test('session expiry during meeting retrieval returns unauthorized without a URL', async ({ page }) => {
  await setup(page);
  await page.route('**/rest/v1/rpc/get_workshop_join_state', route => route.fulfill({ status: 401, json: { code: 'PGRST301', message: 'Expired fixture' } }));
  await page.goto(detail);
  await expect(page.getByText(/Meeting access is not authorized/)).toBeVisible();
  await expect(page.getByRole('link', { name: /^Join/ })).toHaveCount(0);
});

test('a stalled meeting request ends with retry instead of an endless spinner', async ({ page }) => {
  await setup(page); await page.clock.install();
  await page.route('**/rest/v1/rpc/get_workshop_join_state', () => new Promise<void>(() => {}));
  await page.goto(detail);
  await expect(page.getByText('Checking meeting access...', { exact: true })).toBeVisible();
  await page.clock.fastForward(15100);
  await expect(page.getByRole('button', { name: 'Retry meeting access', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /^Join/ })).toHaveCount(0);
  await page.unrouteAll({ behavior: 'ignoreErrors' });
});

test('sign-out discards a delayed authorized response from the old identity', async ({ page }) => {
  await setup(page);
  let calls = 0;
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/rest/v1/rpc/get_workshop_join_state', async route => {
    calls++; await gate; await route.fulfill({ json: joinable }).catch(() => {});
  });
  await page.goto('/tests/browser/harness.html?session=controlled');
  await page.evaluate(() => window.sessionTest.resolve(window.sessionTest.initial));
  await page.getByTitle('View Details', { exact: true }).click();
  await expect.poll(() => calls).toBeGreaterThan(0);
  await page.evaluate(() => window.sessionTest.emit(null));
  release();
  await expect(page.getByLabel('Session status')).toHaveText('signed-out');
  await expect(page.getByRole('link', { name: /^Join/ })).toHaveCount(0);
  expect(await page.content()).not.toContain(meetUrl);
});
