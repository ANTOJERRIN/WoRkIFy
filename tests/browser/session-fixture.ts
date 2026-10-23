import type { Page } from '@playwright/test';

const workshopId = 'be33c1fc-e4c4-4def-b33e-078fdf662400';
const userId = '55555555-5555-4555-8555-555555555555';
export const archived = {
  id: workshopId, slug: 'linkedin-workshop', title: 'LinkedIn Workshop', host_name: 'F1 Forge',
  mode: 'Online — Google Meet', starts_at: '2026-10-02T14:00:00Z', ends_at: '2026-10-02T15:00:00Z',
  timezone: 'Asia/Kolkata', status: 'archived', short_description: 'Historical workshop fixture',
  full_description: 'Preserved historical metadata.', tags: ['LinkedIn'],
};
export const profile = {
  id: userId, name: 'History fixture user', email: 'history@fixture.test', handle: 'history_fixture',
  bio: '', avatar_url: '/workify-logo.png', college: '', location: '', skills: [],
  linkedin_url: 'https://www.linkedin.com/in/history-fixture', x_url: '', website_url: '',
};
const user = { id: userId, aud: 'authenticated', role: 'authenticated', email: profile.email,
  app_metadata: {}, user_metadata: { full_name: profile.name }, created_at: '2026-01-01T00:00:00Z' };

export async function setupSession(page: Page, signedIn = false, admin = false) {
  const requests: URL[] = [];
  if (signedIn) {
    // A stored-session fixture in a test-only origin; all auth/API traffic is
    // intercepted. This does not authenticate against any real backend.
    const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
    const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: userId, exp: 4102444800, role: 'authenticated' })}.isolated-test`;
    await page.addInitScript(({ accessToken, fixtureUser }) => {
      localStorage.setItem('sb-workify-browser-test-auth-token', JSON.stringify({
        access_token: accessToken, refresh_token: 'isolated-test', expires_at: 4102444800,
        expires_in: 3600, token_type: 'bearer', user: fixtureUser,
      }));
    }, { accessToken: token, fixtureUser: user });
  }
  await page.route('https://workify-browser-test.supabase.co/**', async route => {
    const url = new URL(route.request().url());
    requests.push(url);
    if (url.pathname.includes('review') || url.pathname.includes('linkedin_reviews')) {
      await route.fulfill({ status: 410, json: { error: 'Retired endpoint must not be called' } });
    } else if (url.pathname === '/rest/v1/workshops') {
      if (url.searchParams.get('status') === 'neq.archived') await route.fulfill({ json: [] });
      else await route.fulfill({ json: [archived] });
    } else if (url.pathname === '/rest/v1/rpc/get_workshop_join_state') {
      await route.fulfill({ json: { status: 'unavailable' } });
    } else if (url.pathname === '/auth/v1/user') {
      await route.fulfill(signedIn ? { json: user } : { status: 401, json: { message: 'No session' } });
    } else if (url.pathname === '/rest/v1/admin_users') {
      await route.fulfill({ json: admin ? [{ user_id: userId }] : [] });
    } else if (url.pathname === '/rest/v1/profiles') {
      await route.fulfill({ json: [profile] });
    } else if (url.pathname === '/rest/v1/registrations') {
      const joined = url.searchParams.get('select')?.includes('workshops:workshops');
      await route.fulfill({ json: joined ? [{
        id: '77777777-7777-4777-8777-777777777777', user_id: userId, workshop_id: workshopId,
        created_at: '2026-10-01T12:00:00Z', workshops: archived,
      }] : [{ workshop_id: workshopId }] });
    } else {
      await route.fulfill({ status: 403, json: { message: 'Private fixture endpoint denied' } });
    }
  });
  return requests;
}

