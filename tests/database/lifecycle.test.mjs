import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';
import { database } from './fixture.mjs';

const migration = await readFile(new URL('../../backend/supabase/migrations/20261021181340_workshop_lifecycle_contract.sql', import.meta.url), 'utf8');
const archive = await readFile(new URL('../../backend/supabase/migrations/20261020123021_archive_linkedin_workshop.sql', import.meta.url), 'utf8');
const matrix = JSON.parse(await readFile(new URL('../fixtures/workshop-lifecycle.json', import.meta.url), 'utf8'));
const publicChecks = await readFile(new URL('../../backend/supabase/tests/public_workshop_browsing.sql', import.meta.url), 'utf8');

test('SQL lifecycle predicates match the shared controlled-time contract, without a public authorization endpoint', async () => {
  const db = await database();
  try {
    await db.exec(archive);
    await db.exec(migration);
    for (const row of matrix.cases.filter(row => !row.skipSql)) {
      const values = [row.status, row.startsAt === undefined ? matrix.startsAt : row.startsAt,
        row.endsAt === undefined ? matrix.endsAt : row.endsAt, row.now];
      const { rows } = await db.query(`select
        workify_private.workshop_lifecycle_state($1,$2,$3,$4) as phase,
        workify_private.workshop_registration_eligible($1,$2,$3,$4) as register,
        workify_private.workshop_join_eligible($1,$2,$3,$4) as "join"`, values);
      assert.deepEqual(rows[0], { phase: row.phase, register: row.register, join: row.join }, row.name);
    }
    const { rows: grants } = await db.query(`select
      has_function_privilege('anon','workify_private.workshop_join_eligible(text,timestamptz,timestamptz,timestamptz)','execute') as anon,
      has_function_privilege('authenticated','workify_private.workshop_join_eligible(text,timestamptz,timestamptz,timestamptz)','execute') as authenticated`);
    assert.deepEqual(grants[0], { anon: false, authenticated: false });
  } finally { await db.close(); }
});

test('schedule constraint preserves legacy rows and rejects unsafe new publication schedules', async () => {
  const db = await database();
  try {
    await db.exec(archive);
    await db.exec("insert into public.workshops(slug,title,host_name) values ('legacy-invalid','Legacy fixture','Test host');");
    const before = (await db.query('select * from public.workshops order by id')).rows;
    await db.exec(migration);
    assert.deepEqual((await db.query('select * from public.workshops order by id')).rows, before);
    assert.equal((await db.query("select convalidated from pg_constraint where conname='workshops_lifecycle_schedule_check'")).rows[0].convalidated, false);
    await assert.rejects(db.exec("insert into public.workshops(slug,title,host_name) values ('new-invalid','New fixture','Test host');"), /workshops_lifecycle_schedule_check/);
    await assert.rejects(db.exec("insert into public.workshops(slug,title,host_name,starts_at,ends_at) values ('backwards','Fixture','Test host','2030-01-03','2030-01-02');"), /workshops_lifecycle_schedule_check/);
    await assert.rejects(db.exec("insert into public.workshops(slug,title,host_name,starts_at,ends_at) values ('infinite','Fixture','Test host','-infinity','infinity');"), /workshops_lifecycle_schedule_check/);
    await db.exec("update public.workshops set status='archived' where slug='legacy-invalid';");
    await db.exec("insert into public.workshops(slug,title,host_name,status) values ('new-unscheduled','Fixture','Test host','coming_soon');");
    await db.exec("alter table public.workshops validate constraint workshops_lifecycle_schedule_check;");
  } finally { await db.close(); }
});

test('existing private ownership, duplicate protection, archived veto and public browsing survive the lifecycle migration', async () => {
  const db = await database();
  try {
    await db.exec(archive);
    await db.exec(migration);
    await db.exec(publicChecks.replace(/^\uFEFF/, ''));
    await db.exec(`insert into auth.users(id,email) values
      ('55555555-5555-4555-8555-555555555555','owner@fixture.test'),
      ('66666666-6666-4666-8666-666666666666','other@fixture.test');
      insert into public.workshops(id,slug,title,host_name,starts_at,ends_at) values
      ('77777777-7777-4777-8777-777777777777','ownership-fixture','Fixture','Test host','2030-01-02T12:00:00Z','2030-01-02T13:00:00Z');
      set role authenticated;
      select set_config('request.jwt.claim.sub','55555555-5555-4555-8555-555555555555',false);`);
    await assert.rejects(db.exec("insert into public.registrations(user_id,workshop_id) values ('66666666-6666-4666-8666-666666666666','77777777-7777-4777-8777-777777777777');"), /row-level security/);
    const insert = "insert into public.registrations(user_id,workshop_id) values ('55555555-5555-4555-8555-555555555555','77777777-7777-4777-8777-777777777777');";
    await db.exec(insert);
    await assert.rejects(db.exec(insert), /duplicate key/);
    await db.exec("reset role; update public.workshops set status='archived' where id='77777777-7777-4777-8777-777777777777'; set role authenticated;");
    assert.equal((await db.query("select count(*)::int as n from public.registrations where workshop_id='77777777-7777-4777-8777-777777777777'")).rows[0].n, 1);
  } finally { await db.close(); }
});
