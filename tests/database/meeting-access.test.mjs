import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';
import { database } from './fixture.mjs';

const owner = '55555555-5555-4555-8555-555555555555';
const other = '66666666-6666-4666-8666-666666666666';
const workshop = '77777777-7777-4777-8777-777777777777';
const url = 'https://meet.google.com/abc-defg-hij';
const files = ['20261020123021_archive_linkedin_workshop.sql', '20261021181340_workshop_lifecycle_contract.sql',
  '20261022170525_registration_service.sql', '20261022172429_meeting_link_access.sql'];
const migrations = await Promise.all(files.map(file => readFile(new URL(`../../backend/supabase/migrations/${file}`, import.meta.url), 'utf8')));

async function fixture() {
  const db = await database();
  await db.exec(migrations[0]);
  await db.exec(`insert into auth.users(id,email) values ('${owner}','owner@fixture.test'),('${other}','other@fixture.test');
    insert into public.workshops(id,slug,title,host_name,starts_at,ends_at) values
      ('${workshop}','meeting-fixture','Meeting fixture','Test host','2030-01-02T12:00:00Z','2030-01-02T13:00:00Z');
    insert into public.registrations(user_id,workshop_id) values ('${owner}','${workshop}');
    insert into public.workshop_links values ('${workshop}','${url}');`);
  await db.exec(migrations[1]); await db.exec(migrations[2]); await db.exec(migrations[3]);
  // Only this disposable database replaces the server clock. The production
  // helper calls clock_timestamp and accepts no parameters or client settings.
  await db.exec(`create or replace function workify_private.meeting_access_now()
    returns timestamptz language sql volatile security invoker set search_path = '' as
    $$ select current_setting('workify.test_now')::timestamptz $$;`);
  await now(db, '2030-01-02T11:45:00Z');
  await signIn(db, owner);
  return db;
}
async function now(db, instant) { await db.query("select set_config('workify.test_now',$1,false)", [instant]); }
async function signIn(db, id) { await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub','${id}',false);`); }
async function state(db) { return (await db.query('select public.get_workshop_join_state($1) as value', [workshop])).rows[0].value; }
async function links(db) { return (await db.query('select meet_url from public.workshop_links where workshop_id=$1', [workshop])).rows; }

test('RPC and direct RLS use controlled server time at every opening/end boundary', async () => {
  const db = await fixture();
  try {
    for (const [instant, expected] of [
      ['2030-01-02T11:44:59.999Z','upcoming'], ['2030-01-02T11:45:00Z','joinable'],
      ['2030-01-02T12:00:00Z','joinable'], ['2030-01-02T12:59:59.999Z','joinable'],
      ['2030-01-02T13:00:00Z','ended'], ['2030-01-02T13:00:00.001Z','ended'],
    ]) {
      await now(db, instant);
      const access = await state(db);
      assert.equal(access.status, expected, instant);
      assert.equal('meet_url' in access, expected === 'joinable');
      assert.equal((await links(db)).length, expected === 'joinable' ? 1 : 0);
    }
  } finally { await db.close(); }
});

test('anonymous, unregistered and fake ownership requests reveal no URL', async () => {
  const db = await fixture();
  try {
    await db.exec("reset role; set role anon; select set_config('request.jwt.claim.sub','',false);");
    assert.deepEqual(await links(db), []);
    await assert.rejects(state(db), /permission denied/);
    await signIn(db, other);
    assert.deepEqual(await state(db), { status: 'unauthorized' });
    assert.deepEqual(await links(db), []);
    await assert.rejects(db.query('select public.get_workshop_join_state($1,$2)', [workshop, owner]), /does not exist/);
    await assert.rejects(db.query('select public.get_workshop_join_state($1,$2::timestamptz)', [workshop, '2030-01-02T12:00:00Z']), /does not exist/);
    await db.exec("select set_config('request.jwt.claim.sub','',false);");
    assert.deepEqual(await state(db), { status: 'unauthorized' });
  } finally { await db.close(); }
});

test('missing/empty links and unavailable schedules fail closed; admin management never bypasses vetoes', async () => {
  const db = await fixture();
  try {
    await db.exec(`reset role; insert into public.admin_users values ('${other}'); delete from public.workshop_links where workshop_id='${workshop}';`);
    await signIn(db, owner); assert.equal((await state(db)).status, 'unavailable');
    await db.exec(`reset role; insert into public.workshop_links values ('${workshop}','');`);
    await signIn(db, owner); assert.equal((await state(db)).status, 'unavailable');
    await db.exec(`reset role; update public.workshop_links set meet_url='${url}' where workshop_id='${workshop}';`);
    for (const status of ['coming_soon', 'cancelled', 'archived']) {
      await db.exec(`reset role; update public.workshops set status='${status}' where id='${workshop}';`);
      await signIn(db, owner); assert.equal((await state(db)).status, 'unavailable'); assert.deepEqual(await links(db), []);
      await signIn(db, other);
      assert.equal((await links(db)).length, status === 'coming_soon' ? 1 : 0);
      assert.deepEqual(await state(db), { status: 'unauthorized' });
    }
    await db.exec(`reset role; update public.workshops set status='coming_soon',starts_at=null,ends_at=null where id='${workshop}';`);
    await signIn(db, owner); assert.equal((await state(db)).status, 'unavailable');
    await signIn(db, other); assert.equal((await links(db)).length, 1);
    await db.exec(`reset role; update public.workshops set status='open',starts_at='2030-01-02T12:00:00Z',ends_at='2030-01-02T13:00:00Z' where id='${workshop}';`);
    await now(db, '2030-01-02T10:00:00Z');
    await signIn(db, other); assert.equal((await links(db)).length, 1);
    await now(db, '2030-01-02T14:00:00Z'); assert.equal((await links(db)).length, 1);
  } finally { await db.close(); }
});

test('server URL validation rejects dangerous addresses and accepts clearing or canonical links', async () => {
  const db = await fixture();
  try {
    await db.exec(`reset role; insert into public.admin_users values ('${owner}');`);
    await signIn(db, owner);
    for (const bad of ['javascript:alert(1)', 'http://meet.google.com/abc-defg-hij',
      'https://meet.google.com.evil.test/abc-defg-hij', 'https://meet.google.com/abc-defg-hij?redirect=x', url + '\n']) {
      await assert.rejects(db.query('update public.workshop_links set meet_url=$1 where workshop_id=$2', [bad, workshop]), /workshop_links_google_meet_url_check|row-level security/);
    }
    await db.query('update public.workshop_links set meet_url=$1 where workshop_id=$2', ['', workshop]);
    assert.equal((await state(db)).status, 'unavailable');
    await db.query('update public.workshop_links set meet_url=$1 where workshop_id=$2', [url, workshop]);
    assert.equal((await state(db)).meet_url, url);
    await db.exec(`reset role; update public.workshops set status='cancelled' where id='${workshop}';`);
    await signIn(db, owner);
    assert.equal((await db.query('update public.workshop_links set meet_url=$1 where workshop_id=$2 returning workshop_id', [url, workshop])).rows.length, 0);
  } finally { await db.close(); }
});

test('the existing SQL regression suite passes with final meeting policies and a real server clock', async () => {
  const db = await fixture();
  try {
    await db.exec("reset role; select set_config('workify.test_now',clock_timestamp()::text,false);");
    const publicChecks = await readFile(new URL('../../backend/supabase/tests/public_workshop_browsing.sql', import.meta.url), 'utf8');
    await db.exec(publicChecks.replace(/^\uFEFF/, ''));
  } finally { await db.close(); }
});

test('legacy partial, reversed, infinite and missing schedules cannot expose URLs through RPC or RLS', async () => {
  const db = await database();
  try {
    await db.exec(migrations[0]);
    await db.exec(`insert into auth.users(id,email) values ('${owner}','invalid-schedule@fixture.test');
      insert into public.workshops(id,slug,title,host_name) values ('${workshop}','invalid-schedule','Invalid fixture','Test host');
      insert into public.registrations(user_id,workshop_id) values ('${owner}','${workshop}');
      insert into public.workshop_links values ('${workshop}','${url}');
      begin; savepoint legacy_case;`);
    for (const change of ["starts_at=null,ends_at=null", "starts_at='2030-01-02T12:00:00Z',ends_at=null",
      "starts_at='2030-01-02T13:00:00Z',ends_at='2030-01-02T12:00:00Z'", "starts_at='-infinity',ends_at='infinity'"]) {
      // Fresh schema constraint is installed only after each legacy row exists.
      await db.exec(`update public.workshops set ${change} where id='${workshop}';`);
      await db.exec(migrations[1]); await db.exec(migrations[2]); await db.exec(migrations[3]);
      await signIn(db, owner);
      assert.equal((await state(db)).status, 'unavailable');
      assert.deepEqual(await links(db), []);
      // Return this disposable schema to its pre-migration savepoint.
      await db.exec('reset role; rollback to savepoint legacy_case;');
    }
    await db.exec('rollback;');
  } finally { await db.close(); }
});

test('legacy unsafe data is preserved but hidden; public metadata cannot carry meeting links', async () => {
  const db = await database();
  try {
    await db.exec(migrations[0]); await db.exec(migrations[1]); await db.exec(migrations[2]);
    await db.exec(`insert into public.workshops(id,slug,title,host_name,status,short_description) values
      ('${workshop}','legacy-secret','Legacy fixture','Test host','coming_soon','Join ${url}');
      insert into public.workshop_links values ('${workshop}','javascript:alert(1)');`);
    const before = (await db.query('select * from public.workshops where id=$1', [workshop])).rows;
    await db.exec(migrations[3]);
    assert.deepEqual((await db.query('select * from public.workshops where id=$1', [workshop])).rows, before);
    await db.exec('set role anon;');
    assert.deepEqual((await db.query('select * from public.workshops where id=$1', [workshop])).rows, []);
    assert.deepEqual(await links(db), []);
    await db.exec('reset role;');
    await assert.rejects(db.query("update public.workshops set full_description=$1 where id=$2", [url, workshop]), /workshops_public_descriptions_check/);
    const { rows } = await db.query(`select prosecdef from pg_proc where oid='public.get_workshop_join_state(uuid)'::regprocedure`);
    assert.equal(rows[0].prosecdef, false);
  } finally { await db.close(); }
});
