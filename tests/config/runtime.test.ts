import test from 'node:test';
import assert from 'node:assert/strict';
import { readPublicConfig } from '../../src/config/runtime.ts';
import { validateWorkshop, validateMeetUrl, fromIST, toIST } from '../../src/domain/workshop.ts';
const valid = { title:'Workshop', slug:'workshop', hostName:'Admin', status:'open' as const, startsAt:'2026-11-10T14:00:00Z', endsAt:'2026-11-10T15:00:00Z', shortDescription:'', fullDescription:'', tags:[], timezone:'Asia/Kolkata' };
test('server secrets are rejected even when they are JWT encoded', () => {
  for (const key of ['sb_secret_sensitive', `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify({role:'service_role'}))}.signature`]) {
    assert.throws(() => readPublicConfig({VITE_SUPABASE_URL:'https://example.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY:key}), /Server secret/);
  }
});
test('configuration rejects placeholders, credentials, and insecure remote URLs', () => {
  assert.throws(() => readPublicConfig({}), /Configure/);
  for (const url of ['http://example.com','https://user:pass@example.com','https://example.com/api','https://your-project-ref.supabase.co']) assert.throws(() => readPublicConfig({VITE_SUPABASE_URL:url,VITE_SUPABASE_ANON_KEY:'public-test-key'}));
  assert.equal(readPublicConfig({VITE_SUPABASE_URL:'https://example.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test'}).url,'https://example.supabase.co');
});
test('workshop validation rejects malformed slugs, missing hosts, invalid schedules and unknown statuses', () => {
  assert.doesNotThrow(() => validateWorkshop(valid));
  for (const bad of [{slug:'bad--slug'},{hostName:' '},{endsAt:valid.startsAt},{startsAt:null},{timezone:'Invalid/Zone'},{tags:Array(13).fill('tag')},{status:'invented'}]) assert.throws(() => validateWorkshop({...valid,...bad} as typeof valid));
  assert.doesNotThrow(() => validateWorkshop({...valid,status:'coming_soon', startsAt:null,endsAt:null}));
});
test('IST editing round trips without depending on machine timezone', () => {
  assert.equal(fromIST('2026-11-10T19:30'),'2026-11-10T14:00:00.000Z');
  assert.equal(toIST('2026-11-10T14:00:00Z'),'2026-11-10T19:30');
});
test('meeting URL validation rejects script URLs, lookalike hosts and credentials', () => {
  for (const url of ['javascript:alert(1)','https://meet.google.com.evil.test/abc-defg-hij','https://evil@meet.google.com/abc-defg-hij','http://meet.google.com/abc-defg-hij','https://meet.google.com/abc-defg-hij?redirect=evil']) assert.throws(() => validateMeetUrl(url));
  assert.doesNotThrow(() => validateMeetUrl('https://meet.google.com/abc-defg-hij'));
  assert.doesNotThrow(() => validateMeetUrl(''));
});
