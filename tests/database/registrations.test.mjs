import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';
import { database } from './fixture.mjs';

const read = name => readFile(new URL(`../../backend/supabase/migrations/${name}`, import.meta.url), 'utf8');
const archive = await read('20261020123021_archive_linkedin_workshop.sql');
const lifecycle = await read('20261021181340_workshop_lifecycle_contract.sql');
const service = await read('20261022170525_registration_service.sql');
const publicChecks = await readFile(new URL('../../backend/supabase/tests/public_workshop_browsing.sql', import.meta.url), 'utf8');
const owner = '55555555-5555-4555-8555-555555555555';
const other = '66666666-6666-4666-8666-666666666666';
const workshop = '77777777-7777-4777-8777-777777777777';
const insert = `insert into public.registrations(user_id,workshop_id) values ('${owner}','${workshop}')`;
const remove = `delete from public.registrations where user_id='${owner}' and workshop_id='${workshop}' returning id`;
const signIn = `set role authenticated; select set_config('request.jwt.claim.sub','${owner}',false);`;

async function fixture() {
  const db = await database();
  await db.exec(archive);
  // Invalid legacy rows are deliberately retained by prompt 08's NOT VALID check.
  await db.exec(`insert into auth.users(id,email) values ('${owner}','owner@fixture.test'),('${other}','other@fixture.test');
    insert into public.workshops(id,slug,title,host_name,starts_at,ends_at) values
      ('${workshop}','registration-fixture','Registration fixture','Test host',clock_timestamp()+interval '1 hour',clock_timestamp()+interval '2 hours');
    insert into public.workshops(slug,title,host_name,starts_at,ends_at) values
      ('invalid-legacy','Invalid fixture','Test host',null,null),
      ('partial-legacy','Partial fixture','Test host',clock_timestamp(),null),
      ('backwards-legacy','Backwards fixture','Test host',clock_timestamp()+interval '1 hour',clock_timestamp()),
      ('infinite-legacy','Infinite fixture','Test host','-infinity','infinity');`);
  await db.exec(lifecycle);
  await db.exec(service);
  return db;
}

test('registration migration preserves history and exposes no trigger RPC or update privileges', async () => {
  const db = await database();
  try {
    await db.exec(archive); await db.exec(lifecycle);
    await db.exec(`insert into auth.users(id,email) values ('${owner}','history@fixture.test');
      insert into public.registrations(user_id,workshop_id) select '${owner}',id from public.workshops where slug='unrelated-linkedin-fixture';`);
    const before = (await db.query('select * from public.registrations')).rows;
    await db.exec(service);
    assert.deepEqual((await db.query('select * from public.registrations')).rows, before);
    const { rows } = await db.query(`select
      has_function_privilege('anon','workify_private.guard_registration_mutation()','execute') as anon,
      has_function_privilege('authenticated','workify_private.guard_registration_mutation()','execute') as attendee,
      has_table_privilege('authenticated','public.registrations','update') as update,
      has_table_privilege('anon','public.registrations','insert') as insert,
      has_table_privilege('authenticated','public.registrations','truncate') as truncate`);
    assert.deepEqual(rows[0], { anon: false, attendee: false, update: false, insert: false, truncate: false });
  } finally { await db.close(); }
});

test('direct anonymous/cross-user mutations are denied and ordinary reads stay owner-scoped', async () => {
  const db = await fixture();
  try {
    await db.exec('set role anon;');
    await assert.rejects(db.exec(insert), /permission denied/);
    await db.exec(signIn);
    await assert.rejects(db.exec(`insert into public.registrations(user_id,workshop_id) values ('${other}','${workshop}')`), /own registration|row-level security/);
    await db.exec(insert);
    await db.exec(`select set_config('request.jwt.claim.sub','${other}',false);`);
    assert.deepEqual((await db.query('select * from public.registrations')).rows, []);
    assert.deepEqual((await db.query(remove)).rows, []);
    await db.exec(`select set_config('request.jwt.claim.sub','',false);`);
    await assert.rejects(db.exec(insert), /Sign in|row-level security/);
    await db.exec('reset role;');
    assert.equal((await db.query('select count(*)::int as n from public.registrations')).rows[0].n, 1);
  } finally { await db.close(); }
});

test('eligible registration and cancellation are confirmed; user timestamps cannot fabricate history', async () => {
  const db = await fixture();
  try {
    await db.exec(signIn);
    await db.exec(`insert into public.registrations(user_id,workshop_id,created_at) values ('${owner}','${workshop}','1900-01-01')`);
    const { rows } = await db.query('select created_at > now() - interval \'1 minute\' as recent from public.registrations');
    assert.equal(rows[0].recent, true);
    assert.equal((await db.query(remove)).rows.length, 1);
    assert.equal((await db.query(remove)).rows.length, 0);
    await assert.rejects(db.exec(`update public.registrations set user_id='${other}'`), /permission denied/);
  } finally { await db.close(); }
});

test('overlapping duplicate submissions retain exactly one user/workshop reservation', async () => {
  const db = await fixture();
  try {
    await db.exec(signIn);
    // PGlite queues one connection. This checks real unique enforcement under
    // overlapping submissions, not independent Postgres connection lock waits.
    const outcomes = await Promise.allSettled([db.exec(insert), db.exec(insert), db.exec(insert)]);
    assert.equal(outcomes.filter(result => result.status === 'fulfilled').length, 1);
    for (const result of outcomes.filter(result => result.status === 'rejected')) assert.equal(result.reason.code, '23505');
    assert.equal((await db.query('select count(*)::int as n from public.registrations')).rows[0].n, 1);
  } finally { await db.close(); }
});

test('server denies all unavailable lifecycle states and preserves existing registrations on denied cancellation', async () => {
  const db = await fixture();
  try {
    await db.exec(signIn); await db.exec(insert);
    const changes = [
      "status='coming_soon'", "status='cancelled'", "status='archived'",
      "status='open',starts_at=clock_timestamp()-interval '1 hour',ends_at=clock_timestamp()+interval '1 hour'",
      "status='open',starts_at=clock_timestamp()-interval '2 hours',ends_at=clock_timestamp()-interval '1 hour'",
    ];
    for (const change of changes) {
      await db.exec(`reset role; update public.workshops set ${change} where id='${workshop}'; ${signIn}`);
      await assert.rejects(db.exec(insert), /only for open workshops before they start/);
      await assert.rejects(db.exec(remove), /only for open workshops before they start/);
      assert.equal((await db.query('select count(*)::int as n from public.registrations')).rows[0].n, 1);
    }
    for (const slug of ['invalid-legacy', 'partial-legacy', 'backwards-legacy', 'infinite-legacy']) {
      const invalid = (await db.query('select id from public.workshops where slug=$1', [slug])).rows[0].id;
      await assert.rejects(db.exec(`insert into public.registrations(user_id,workshop_id) values ('${owner}','${invalid}')`), /only for open workshops before they start/);
    }
    await assert.rejects(db.exec(`insert into public.registrations(user_id,workshop_id) values ('${owner}','99999999-9999-4999-8999-999999999999')`), /only for open workshops before they start/);
  } finally { await db.close(); }
});

test('admins may inspect registrations but cannot register for closed workshops or cancel someone else', async () => {
  const db = await fixture();
  try {
    await db.exec(signIn); await db.exec(insert);
    await db.exec(`reset role; insert into public.admin_users values ('${other}');
      update public.workshops set status='cancelled' where id='${workshop}';
      set role authenticated; select set_config('request.jwt.claim.sub','${other}',false);`);
    assert.equal((await db.query('select count(*)::int as n from public.registrations')).rows[0].n, 1);
    assert.deepEqual((await db.query(remove)).rows, []);
    await assert.rejects(db.exec(`insert into public.registrations(user_id,workshop_id) values ('${other}','${workshop}')`), /only for open workshops before they start/);
  } finally { await db.close(); }
});

test('a transaction opened before start cannot reuse its old timestamp to register after start', async () => {
  const db = await fixture();
  try {
    await db.exec(`update public.workshops set starts_at=clock_timestamp()+interval '150 milliseconds',ends_at=clock_timestamp()+interval '1 hour' where id='${workshop}'; ${signIn} begin;`);
    await new Promise(resolve => setTimeout(resolve, 200));
    await assert.rejects(db.exec(insert), /only for open workshops before they start/);
    await db.exec('rollback;');
  } finally { await db.close(); }
});

test('the existing public/private/admin SQL regression suite survives all registration changes', async () => {
  const db = await fixture();
  try { await db.exec(publicChecks.replace(/^\uFEFF/, '')); }
  finally { await db.close(); }
});
