import { test, expect, type Page } from '@playwright/test';
import { setupSession, profile } from './session-fixture';
import type {} from './session-control';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l1cAAAAASUVORK5CYII=', 'base64');
const image = { name: 'untrusted-name.svg', mimeType: 'image/png', buffer: png };
async function setup(page: Page) {
  await setupSession(page, true);
  await page.route('**/storage/v1/object/public/avatars/**', route => route.fulfill({ contentType: 'image/png', body: png }));
  let saved = { ...profile };
  let patches = 0;
  let failure: 'duplicate' | 'network' | null = null;
  await page.route('**/rest/v1/profiles*', async route => {
    expect(new URL(route.request().url()).searchParams.get('id')).toBe(`eq.${profile.id}`);
    if (route.request().method() === 'PATCH') {
      patches++;
      if (failure === 'duplicate') return route.fulfill({ status: 409, json: { code: '23505', message: 'duplicate key' } });
      if (failure === 'network') return route.fulfill({ status: 403, json: { message: 'Isolated denied save' } });
      const payload = route.request().postDataJSON();
      expect(payload).not.toHaveProperty('email'); expect(payload).not.toHaveProperty('id'); expect(payload).not.toHaveProperty('is_admin');
      saved = { ...saved, ...payload };
      return route.fulfill({ json: saved });
    }
    return route.fulfill({ json: [saved] });
  });
  return { saved: () => saved, patches: () => patches, fail: (mode: typeof failure) => { failure = mode; } };
}
async function edit(page: Page) {
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Edit Profile', exact: true }).click();
}

test('profile saves normalized fields and real contact links, survives reload and offers no sharing', async ({ page }) => {
  const state = await setup(page);
  await edit(page);
  await page.getByLabel('Full Name *', { exact: true }).fill(' Updated student ');
  await page.getByPlaceholder('handle', { exact: true }).fill('@Mixed_Case');
  await page.getByLabel('Bio (max 500 chars)', { exact: true }).fill('Building useful things.');
  await page.getByLabel('College / Institution', { exact: true }).fill('Engineering college');
  await page.getByLabel('Location', { exact: true }).fill('Chennai');
  await page.getByPlaceholder('Type a skill and press Enter or click Add').fill('React');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByLabel('Website URL', { exact: true }).fill('https://münich.example/student');
  await page.getByRole('button', { name: 'Save Profile', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Updated student', exact: true })).toBeVisible();
  expect(state.saved().handle).toBe('mixed_case'); expect(state.saved().skills).toEqual(['React']);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Updated student', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Website', exact: true })).toHaveAttribute('href', 'https://xn--mnich-kva.example/student');
  await expect(page.getByRole('button', { name: /share/i })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /share/i })).toHaveCount(0);
  expect(await page.locator('main').evaluate(element => element.scrollWidth <= window.innerWidth)).toBe(true);
});

test('field errors prevent writes and duplicate/network failures retain editable drafts', async ({ page }) => {
  const state = await setup(page);
  await edit(page);
  await page.getByLabel('Website URL', { exact: true }).fill('https://');
  await page.getByPlaceholder('Your name', { exact: true }).fill('Unsaved draft');
  await page.getByRole('button', { name: 'Save Profile', exact: true }).click();
  await expect(page.getByLabel('Website URL', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  expect(state.patches()).toBe(0);
  await page.getByLabel('Website URL', { exact: true }).fill('https://example.test');
  state.fail('duplicate');
  await page.getByRole('button', { name: 'Save Profile', exact: true }).click();
  await expect(page.getByPlaceholder('handle', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByPlaceholder('Your name', { exact: true })).toHaveValue('Unsaved draft');
  state.fail('network');
  await page.getByPlaceholder('handle', { exact: true }).fill('another_handle');
  await page.getByRole('button', { name: 'Save Profile', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Profile save was not confirmed');
  await expect(page.getByPlaceholder('Your name', { exact: true })).toHaveValue('Unsaved draft');
  state.fail(null);
  await page.getByRole('button', { name: 'Save Profile', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Unsaved draft', exact: true })).toBeVisible();
});

test('invalid avatars never upload; selected photos and text are discarded by Cancel', async ({ page }) => {
  const state = await setup(page);
  let uploads = 0;
  await page.route('**/storage/v1/object/avatars/**', route => { uploads++; return route.fulfill({ json: {} }); });
  await edit(page);
  for (const file of [
    { name: 'bad.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') },
    { name: 'spoof.png', mimeType: 'image/png', buffer: Buffer.from('<svg/>') },
    { name: 'large.png', mimeType: 'image/png', buffer: Buffer.alloc(2 * 1024 * 1024 + 1) },
  ]) {
    await page.getByLabel('Change photo', { exact: true }).setInputFiles(file);
    await expect(page.getByLabel('Change photo', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  }
  await page.getByLabel('Change photo', { exact: true }).setInputFiles(image);
  await expect(page.getByText('Photo selected. It will upload when you save.', { exact: true })).toBeVisible();
  await page.getByPlaceholder('Your name', { exact: true }).fill('Cancelled draft');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('heading', { name: profile.name, exact: true })).toBeVisible();
  await expect(page.getByRole('main').getByRole('img', { name: profile.name, exact: true })).toHaveAttribute('src', profile.avatar_url);
  expect(uploads).toBe(0); expect(state.patches()).toBe(0);
});

test('photo replacement uses an owner-scoped fresh MIME-derived path and confirms the saved avatar', async ({ page }) => {
  const state = await setup(page);
  let uploadPath = '';
  await page.route('**/storage/v1/object/avatars/**', route => {
    uploadPath = new URL(route.request().url()).pathname;
    expect(uploadPath).toMatch(new RegExp(`/avatars/${profile.id}/[0-9a-f-]+\\.png$`));
    expect(route.request().headers()['x-upsert']).toBe('false');
    return route.fulfill({ json: { Id: 'object-fixture', Key: uploadPath.split('/object/')[1] } });
  });
  await edit(page);
  await page.getByLabel('Change photo', { exact: true }).setInputFiles(image);
  await expect(page.getByText('Photo selected. It will upload when you save.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Save Profile', exact: true }).click();
  await expect(page.getByRole('heading', { name: profile.name, exact: true })).toBeVisible();
  expect(state.saved().avatar_url).toContain(uploadPath.replace('/object/', '/object/public/'));
  await expect(page.getByRole('main').getByRole('img', { name: profile.name, exact: true })).toHaveAttribute('src', state.saved().avatar_url);
  await page.reload();
  await expect(page.getByRole('main').getByRole('img', { name: profile.name, exact: true })).toHaveAttribute('src', state.saved().avatar_url);
});

test('uploaded photo with failed profile save reports partial progress and retains the draft', async ({ page }) => {
  const state = await setup(page);
  state.fail('network');
  await page.route('**/storage/v1/object/avatars/**', route => route.fulfill({ json: { Id: 'uploaded', Key: 'fixture' } }));
  await edit(page);
  await page.getByPlaceholder('Your name', { exact: true }).fill('Photo draft');
  await page.getByLabel('Change photo', { exact: true }).setInputFiles(image);
  await expect(page.getByText('Photo selected. It will upload when you save.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Save Profile', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('photo may have uploaded, but profile save was not confirmed');
  await expect(page.getByPlaceholder('Your name', { exact: true })).toHaveValue('Photo draft');
  expect(state.saved().avatar_url).toBe(profile.avatar_url);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('main').getByRole('img', { name: profile.name, exact: true })).toHaveAttribute('src', profile.avatar_url);
});

test('upload failure never submits profile changes and save timeout restores retry controls', async ({ page }) => {
  const state = await setup(page);
  await page.route('**/storage/v1/object/avatars/**', route => route.fulfill({ status: 403, json: { statusCode: '403', message: 'Denied upload', error: 'Unauthorized' } }));
  await edit(page);
  await page.getByLabel('Change photo', { exact: true }).setInputFiles(image);
  await expect(page.getByText('Photo selected. It will upload when you save.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Save Profile', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Photo upload failed');
  expect(state.patches()).toBe(0);
  await page.clock.install();
  await page.route('**/storage/v1/object/avatars/**', () => new Promise<void>(() => {}));
  await page.getByRole('button', { name: 'Save Profile', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Saving...', exact: true })).toBeDisabled();
  await page.clock.fastForward(15100);
  await expect(page.getByRole('alert')).toContainText('profile save was not confirmed');
  await expect(page.getByRole('button', { name: 'Save Profile', exact: true })).toBeEnabled();
  await page.unrouteAll({ behavior: 'ignoreErrors' });
});

test('logout during upload discards the draft and cannot start a late profile write', async ({ page }) => {
  const state = await setup(page);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let uploads = 0;
  await page.route('**/storage/v1/object/avatars/**', async route => {
    uploads++; await gate; await route.fulfill({ json: { Id: 'late', Key: 'fixture' } }).catch(() => {});
  });
  await page.goto('/tests/browser/harness.html?session=controlled');
  await page.evaluate(() => window.sessionTest.resolve(window.sessionTest.initial));
  await page.getByRole('button', { name: 'Private profile', exact: true }).click();
  await page.getByRole('button', { name: 'Edit Profile', exact: true }).click();
  await page.getByLabel('Change photo', { exact: true }).setInputFiles(image);
  await expect(page.getByText('Photo selected. It will upload when you save.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Save Profile', exact: true }).click();
  await expect.poll(() => uploads).toBe(1);
  await page.evaluate(() => window.sessionTest.emit(null));
  release();
  await expect(page.getByRole('button', { name: 'Save Profile', exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Profile name')).toHaveText('No profile loaded');
  expect(state.patches()).toBe(0);
});

test('legacy unsafe contact links are hidden and history makes no attendance or skill-proof claim', async ({ page }) => {
  await setupSession(page, true);
  await page.route('**/rest/v1/profiles*', route => route.fulfill({ json: [{ ...profile,
    linkedin_url: 'javascript:alert(1)', x_url: 'https://user:password@example.test', website_url: 'https://',
  }] }));
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: profile.name, exact: true })).toBeVisible();
  await expect(page.getByRole('main').getByRole('link', { name: /LinkedIn|Twitter|Website/ })).toHaveCount(0);
  await expect(page.getByText('Registration history does not confirm attendance or completion.', { exact: true })).toBeVisible();
  await expect(page.getByRole('main').getByText(/verified proof|AI profile critique|rubric breakdown/i)).toHaveCount(0);
});
