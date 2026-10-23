import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeMeetingAccess, isAllowedMeetingUrl } from '../../src/domain/meetingAccess.ts';

test('meeting URLs accept only canonical HTTPS Google Meet codes', () => {
  assert.equal(isAllowedMeetingUrl('https://meet.google.com/abc-defg-hij'), true);
  for (const value of ['javascript:alert(1)', 'http://meet.google.com/abc-defg-hij',
    'https://meet.google.com.evil.test/abc-defg-hij', 'https://meet.google.com@evil.test/abc-defg-hij',
    'https://meet.google.com/abc-defg-hij?redirect=evil', 'https://meet.google.com/abc-defg-hij#x',
    'https://meet.google.com:443/abc-defg-hij', '//meet.google.com/abc-defg-hij',
    ' https://meet.google.com/abc-defg-hij', 'https://meet.google.com/abc-defg-hij\n', null]) {
    assert.equal(isAllowedMeetingUrl(value), false, String(value));
  }
});

test('denied safe states never retain a URL, even in a malformed server payload', () => {
  for (const status of ['ended', 'unauthorized', 'unavailable', 'upcoming']) {
    const result = decodeMeetingAccess({ status, meet_url: 'https://meet.google.com/abc-defg-hij', refresh_after_ms: 1000 });
    assert.equal('meetUrl' in result, false);
  }
});

test('joinable responses require an allowed URL and a bounded positive lease', () => {
  assert.deepEqual(decodeMeetingAccess({ status: 'joinable', meet_url: 'https://meet.google.com/abc-defg-hij', refresh_after_ms: 1000 }),
    { status: 'joinable', meetUrl: 'https://meet.google.com/abc-defg-hij', refreshAfterMs: 1000 });
  for (const refresh_after_ms of [0, -1, 30001, 1.1, '1000', null, undefined]) {
    assert.throws(() => decodeMeetingAccess({ status: 'joinable', meet_url: 'https://meet.google.com/abc-defg-hij', refresh_after_ms }));
  }
  assert.throws(() => decodeMeetingAccess({ status: 'joinable', meet_url: 'javascript:alert(1)', refresh_after_ms: 1000 }));
  assert.throws(() => decodeMeetingAccess(null));
  assert.throws(() => decodeMeetingAccess({ status: 'active' }));
});
