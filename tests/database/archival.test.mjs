import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';
import { database } from './fixture.mjs';

const archiveMigration = await readFile(new URL('../../backend/supabase/migrations/20261020123021_archive_linkedin_workshop.sql', import.meta.url), 'utf8');
const existingRlsTests = await readFile(new URL('../../backend/supabase/tests/public_workshop_browsing.sql', import.meta.url), 'utf8');
const targetId = 'be33c1fc-e4c4-4def-b33e-078fdf662400';
const owner = '55555555-5555-4555-8555-555555555555';
const otherUser = '66666666-6666-4666-8666-666666666666';

async function insertTarget(db, host = 'F1 Forge') {
  await db.query(`insert into public.workshops
    (id,slug,title,host_name,starts_at,ends_at,status)
    values ($1,'linkedin-workshop','LinkedIn Workshop',$2,'2026-10-02 14:00:00+00','2026-10-02 15:00:00+00','open')`, [targetId, host]);
}

test('archives only the verified ID, preserves history and enforces archival restrictions', async () => {
  const db = await database();
  try {
    await insertTarget(db);
    await db.exec(`
      insert into auth.users(id,email) values ('${owner}','owner@fixture.test'),('${otherUser}','other@fixture.test');
      insert into public.registrations(user_id,workshop_id) values ('${owner}','${targetId}');
      insert into public.linkedin_reviews(user_id,workshop_id,overall_score) values ('${owner}','${targetId}',42);
      insert into public.workshop_links(workshop_id,meet_url) values ('${targetId}','https://meet.google.com/isolated-test');
    `);
    const history = () => db.query(`select json_build_object(
      'registrations',(select json_agg(r) from public.registrations r),
      'profiles',(select json_agg(p) from public.profiles p),
      'reviews',(select json_agg(r) from public.linkedin_reviews r),
      'links',(select json_agg(l) from public.workshop_links l)) as snapshot`);
    const before = (await history()).rows;
    await db.exec(archiveMigration);
    assert.deepEqual((await history()).rows, before);
    assert.equal((await db.query('select status from public.workshops where id=$1', [targetId])).rows[0].status, 'archived');
    assert.equal((await db.query("select status from public.workshops where slug='unrelated-linkedin-fixture'")).rows[0].status, 'open');

    await db.exec(`set role anon;`);
    assert.equal((await db.query('select status from public.workshops where id=$1', [targetId])).rows[0].status, 'archived');
    assert.equal((await db.query("select count(*)::int as n from public.workshops where status <> 'archived' and id=$1", [targetId])).rows[0].n, 0);
    assert.equal((await db.query('select count(*)::int as n from public.workshop_links')).rows[0].n, 0);
    await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub','${owner}',false);`);
    assert.equal((await db.query('select count(*)::int as n from public.registrations where workshop_id=$1', [targetId])).rows[0].n, 1);
    assert.equal((await db.query('select count(*)::int as n from public.workshop_links where workshop_id=$1', [targetId])).rows[0].n, 0);
    assert.equal((await db.query('select overall_score from public.linkedin_reviews where workshop_id=$1', [targetId])).rows[0].overall_score, 42);
    await db.exec(`select set_config('request.jwt.claim.sub','${otherUser}',false);`);
    await assert.rejects(db.query('insert into public.registrations(user_id,workshop_id) values ($1,$2)', [otherUser,targetId]), /row-level security/);
    await db.exec('reset role;');
    // Recheck existing public reads, private/ownership denial and normal admin
    // operations after applying the additive restrictive archival policies.
    await db.exec(existingRlsTests.replace(/^\uFEFF/, ''));
  } finally { await db.close(); }
});

test('an absent exact ID does not archive similar workshops or create a replacement', async () => {
  const db = await database();
  try {
    const before = (await db.query('select id,status from public.workshops order by id')).rows;
    await db.exec(archiveMigration);
    assert.deepEqual((await db.query('select id,status from public.workshops order by id')).rows, before);
  } finally { await db.close(); }
});

test('changed identity metadata aborts archival', async () => {
  const db = await database();
  try {
    await insertTarget(db, 'Different organizer');
    await assert.rejects(db.exec(archiveMigration), /identity mismatch/);
    await db.query("update public.workshops set host_name='ForMa' where id=$1", [targetId]);
    await assert.rejects(db.exec(archiveMigration), /identity mismatch/);
    assert.equal((await db.query('select status from public.workshops where id=$1', [targetId])).rows[0].status, 'open');
  } finally { await db.close(); }
});
