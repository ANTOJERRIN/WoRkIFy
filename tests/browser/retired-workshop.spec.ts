import { test, expect } from '@playwright/test';

import { setupSession as setup } from './session-fixture';

const workshopId = 'be33c1fc-e4c4-4def-b33e-078fdf662400';
const profile = { linkedin_url: 'https://www.linkedin.com/in/history-fixture' };

test('archived workshop is absent from discovery and ID/slug URLs explain retirement', async ({ page }) => {
  const requests = await setup(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Browse upcoming sessions', exact: true }).click();
  await expect(page.getByText('No upcoming workshops yet.', { exact: true })).toBeVisible();
  expect(requests.some(url => url.searchParams.get('status') === 'neq.archived')).toBe(true);
  for (const key of [workshopId, 'linkedin-workshop']) {
    await page.goto(`/?workshop=${key}`);
    await expect(page.getByText('Archived workshop', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'LinkedIn Workshop', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Register for workshop|Add to Google Calendar/ })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Join/ })).toHaveCount(0);
  }
  expect(requests.some(url => /workshop_links|review/.test(url.pathname))).toBe(false);
});

test('registered history survives and profile LinkedIn contact remains usable', async ({ page }) => {
  const requests = await setup(page, true);
  await page.goto('/tests/browser/harness.html');
  await page.getByRole('button', { name: 'Private dashboard', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'My Registered Workshops', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'LinkedIn Workshop', exact: true })).toBeVisible();
  await expect(page.getByText('Archived workshop · Registration history', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /review|Cancel/i })).toHaveCount(1); // Only the test driver's cancellation control.
  await page.getByRole('button', { name: 'Private profile', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Registered Workshops', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'LinkedIn Workshop', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'LinkedIn', exact: true })).toHaveAttribute('href', profile.linkedin_url);
  await expect(page.getByText(/AI profile critique|LinkedIn Review|rubric breakdown|verified proof/i)).toHaveCount(0);
  expect(requests.some(url => /workshop_links|review/.test(url.pathname))).toBe(false);
});

test('admin no longer offers review tabs or reset controls', async ({ page }) => {
  const requests = await setup(page, true, true);
  await page.goto('/tests/browser/harness.html');
  await expect(page.getByLabel('Admin status')).toHaveText('true');
  await page.getByRole('button', { name: 'Private admin', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Workshops', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /review|reset/i })).toHaveCount(0);
  await expect(page.getByText(/LinkedIn Reviews|assessments|certification/i)).toHaveCount(0);
  expect(requests.some(url => /review/.test(url.pathname))).toBe(false);
});
