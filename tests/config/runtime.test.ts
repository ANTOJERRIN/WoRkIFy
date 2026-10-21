import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { PublicConfigurationError, readPublicConfig } from '../../src/config/runtime.ts';

test('public configuration reports missing names without creating backend clients', () => {
  assert.throws(() => readPublicConfig({}), /VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY/);
  assert.throws(() => readPublicConfig({ VITE_SUPABASE_URL: 'https://fixture.supabase.co' }), /VITE_SUPABASE_ANON_KEY/);
});

test('template placeholders and malformed URLs are rejected', () => {
  assert.throws(() => readPublicConfig({
    VITE_SUPABASE_URL: 'https://your-project-ref.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'your-supabase-publishable-key',
  }), /Replace the placeholders/);
  for (const url of ['not-a-url', 'file:///example', 'https://name:password@fixture.supabase.co']) {
    assert.throws(() => readPublicConfig({ VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: 'isolated-test-key' }), PublicConfigurationError);
  }
});

test('server secret and legacy service-role keys are rejected without echoing them', () => {
  const legacyKey = `fixture.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.fixture`;
  for (const key of ['sb_secret_isolated_test_fixture', legacyKey]) {
    assert.throws(() => readPublicConfig({
      VITE_SUPABASE_URL: 'https://fixture.supabase.co', VITE_SUPABASE_ANON_KEY: key,
    }), error => error instanceof PublicConfigurationError && !error.message.includes(key));
  }
});

test('public configuration preserves the trimmed project URL and public key', () => {
  assert.deepEqual(readPublicConfig({
    VITE_SUPABASE_URL: ' https://fixture.supabase.co ', VITE_SUPABASE_ANON_KEY: ' isolated-test-key ',
  }), { supabaseUrl: 'https://fixture.supabase.co', supabaseAnonKey: 'isolated-test-key' });
});

test('production builds stop before bundling missing configuration or server keys', () => {
  for (const key of ['', 'sb_secret_isolated_build_fixture']) {
    const result = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], {
      encoding: 'utf8',
      env: { ...process.env, VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: key },
    });
    assert.notEqual(result.status, 0);
    const output = result.stdout + result.stderr;
    assert.match(output, key ? /Server secret keys cannot be used/ : /Missing public configuration/);
    if (key) assert.ok(!output.includes(key));
  }
});
