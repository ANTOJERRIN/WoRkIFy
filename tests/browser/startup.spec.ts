import { test, expect } from '@playwright/test';

test('missing public configuration shows a readable startup error without backend requests', async ({ page }) => {
  const backendRequests: string[] = [];
  page.on('request', request => {
    if (request.url().includes('.supabase.co')) backendRequests.push(request.url());
  });
  await page.goto('http://127.0.0.1:4176');
  await expect(page.getByRole('heading', { name: 'Workify configuration is incomplete' })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('VITE_SUPABASE_URL');
  await expect(page.getByRole('alert')).toContainText('VITE_SUPABASE_ANON_KEY');
  await expect(page.getByRole('alert')).toContainText('.env.example');
  expect(backendRequests).toEqual([]);
});

test('the canonical entry loads local logo assets', async ({ page, request }) => {
  await page.route('https://workify-browser-test.supabase.co/**', route => route.fulfill({ json: [] }));
  await page.goto('/');
  const logo = page.getByRole('img', { name: 'Workify Logo', exact: true }).first();
  await expect(logo).toHaveAttribute('src', '/workify-logo.png');
  await expect.poll(() => logo.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  const asset = await request.get('/workify-logo.png');
  expect(asset.ok()).toBe(true);
  expect(asset.headers()['content-type']).toContain('image/png');
});

test('a missing local logo uses a local fallback without a remote image request', async ({ page }) => {
  const remoteImages: string[] = [];
  page.on('request', request => { if (request.resourceType() === 'image' && !request.url().startsWith('http://127.0.0.1:4174/')) remoteImages.push(request.url()); });
  await page.route('https://workify-browser-test.supabase.co/**', route => route.fulfill({ json: [] }));
  await page.route('**/workify-logo.png', route => route.abort());
  await page.goto('/');
  await expect(page.getByRole('banner').getByText('W', { exact: true })).toBeVisible();
  expect(remoteImages).toEqual([]);
});
