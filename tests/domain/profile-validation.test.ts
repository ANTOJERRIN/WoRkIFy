import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeProfile, validateProfile, safeContactUrl, validateAvatar, AVATAR_MAX_BYTES, type ProfileField } from '../../src/domain/profileValidation.ts';

const input = { name: ' Student ', handle: ' @STUDENT_1 ', bio: '', college: '', location: '', skills: [' React ', 'React', ''], links: {} };
test('profile normalization preserves editable fields and normalizes handles and skills', () => {
  const value = normalizeProfile(input);
  assert.equal(value.name, 'Student'); assert.equal(value.handle, 'student_1');
  assert.deepEqual(value.skills, ['React']); assert.equal(validateProfile(input).valid, true);
  assert.equal(normalizeProfile({ ...input, handle: ' @ ' }).handle, '');
});
test('profile validation returns field errors for invalid names, handles and length boundaries', () => {
  for (const [field, value] of Object.entries({ name: 'a'.repeat(51), bio: 'a'.repeat(501), college: 'a'.repeat(101), location: 'a'.repeat(101), handle: 'bad handle' })) {
    assert.ok(validateProfile({ ...input, [field]: value }).fields[field as ProfileField]);
  }
  assert.ok(validateProfile({ ...input, name: ' ' }).fields.name);
  assert.equal(validateProfile({ ...input, name: 'a'.repeat(50), bio: 'a'.repeat(500), college: 'a'.repeat(100), location: 'a'.repeat(100) }).valid, true);
  assert.ok(validateProfile({ ...input, skills: Array.from({ length: 11 }, (_, i) => String(i)) }).fields.skills);
  assert.ok(validateProfile({ ...input, skills: ['a'.repeat(31)] }).fields.skills);
});
test('contact URLs parse HTTPS and reject malformed, credentialed and unsafe legacy values', () => {
  for (const url of ['javascript:alert(1)', 'http://example.test', 'https://', 'https://a b.test', 'https://user:pass@example.test', 'https://example.test\\evil', 'https://example.test/\nsecret', 'https://example.test:99999', `https://example.test/${'x'.repeat(2048)}`]) {
    assert.equal(safeContactUrl(url), '', url);
    assert.ok(validateProfile({ ...input, links: { website: url } }).fields.website);
  }
  assert.equal(safeContactUrl(' https://example.test/path?q=one#two '), 'https://example.test/path?q=one#two');
  assert.equal(safeContactUrl('https://münich.example/'), 'https://xn--mnich-kva.example/');
  assert.equal(validateProfile({ ...input, links: { linkedin: '', x: '', website: '' } }).valid, true);
});
test('avatars reject SVG, spoofed content, empty and oversized files; use a fixed MIME allowlist', async () => {
  const png = new Uint8Array([137,80,78,71,13,10,26,10]);
  assert.equal(await validateAvatar(new File([png], 'untrusted.svg', { type: 'image/png' })), null);
  assert.ok(await validateAvatar(new File(['<svg/>'], 'a.svg', { type: 'image/svg+xml' })));
  assert.ok(await validateAvatar(new File(['<svg/>'], 'a.png', { type: 'image/png' })));
  assert.ok(await validateAvatar(new File([], 'a.png', { type: 'image/png' })));
  assert.ok(await validateAvatar(new File([new Uint8Array(AVATAR_MAX_BYTES + 1)], 'a.png', { type: 'image/png' })));
  const maximum = new Uint8Array(AVATAR_MAX_BYTES); maximum.set(png);
  assert.equal(await validateAvatar(new File([maximum], 'a.png', { type: 'image/png' })), null);
  for (const [type, bytes] of [['image/jpeg', new Uint8Array([255,216,255])], ['image/gif', 'GIF89a'], ['image/webp', 'RIFF1234WEBP']] as const) {
    assert.equal(await validateAvatar(new File([bytes], 'image', { type })), null);
  }
});
