import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';
import { database } from './fixture.mjs';

const read = name => readFile(new URL(`../../backend/supabase/migrations/${name}`,import.meta.url),'utf8');
const migrations = await Promise.all(['20261020123021_archive_linkedin_workshop.sql','20261021181340_workshop_lifecycle_contract.sql','20261022170525_registration_service.sql','20261022172429_meeting_link_access.sql','20261023081331_admin_workshop_contract.sql'].map(read));
const admin='55555555-5555-4555-8555-555555555555', attendee='66666666-6666-4666-8666-666666666666';
const workshop='77777777-7777-4777-8777-777777777777';
const signIn = id => `set role authenticated; select set_config('request.jwt.claim.sub','${id}',false);`;
const fields = 'slug,title,host_name,status,starts_at,ends_at,timezone';
const values = "'admin-fixture','Admin fixture','Test host','open',clock_timestamp()+interval '1 hour',clock_timestamp()+interval '2 hours','Asia/Kolkata'";
async function fixture() {
  const db=await database();
  for (const migration of migrations) await db.exec(migration);
  await db.exec(`insert into auth.users(id,email) values ('${admin}','admin@fixture.test'),('${attendee}','attendee@fixture.test');
    insert into public.admin_users values ('${admin}');`);
  return db;
}

test('admin create/update becomes publicly readable while private links and attendees stay protected',async()=>{
  const db=await fixture();
  try {
    await db.exec(signIn(admin));
    const created=(await db.query(`insert into public.workshops(${fields}) values (${values}) returning id,slug,title`)).rows[0];
    await db.exec(`update public.workshops set title='Edited fixture' where id='${created.id}';
      insert into public.workshop_links(workshop_id,meet_url) values ('${created.id}','https://meet.google.com/abc-defg-hij')
      on conflict(workshop_id) do update set workshop_id=excluded.workshop_id,meet_url=excluded.meet_url;`);
    await db.exec(`set role anon; select set_config('request.jwt.claim.sub','',false);`);
    assert.equal((await db.query(`select title from public.workshops where id='${created.id}' and status <> 'archived'`)).rows[0].title,'Edited fixture');
    assert.deepEqual((await db.query('select * from public.workshop_links')).rows,[]);
    assert.deepEqual((await db.query('select * from public.profiles')).rows,[]);
    assert.deepEqual((await db.query('select * from public.registrations')).rows,[]);
    await db.exec(signIn(admin));
    assert.equal((await db.query('select meet_url from public.workshop_links')).rows[0].meet_url,'https://meet.google.com/abc-defg-hij');
  } finally {await db.close();}
});

test('anonymous/non-admin direct writes are denied even with metadata or a permissive policy',async()=>{
  const db=await fixture();
  try {
    await db.exec(`insert into public.workshops(id,${fields}) values ('${workshop}',${values});
      create policy broad_workshop_insert on public.workshops for insert to authenticated with check(true);
      create policy broad_workshop_update on public.workshops for update to authenticated using(true) with check(true);
      create policy broad_link_insert on public.workshop_links for insert to authenticated with check(true);
      update auth.users set raw_user_meta_data='{"admin":true}' where id='${attendee}';
      set role anon;`);
    await assert.rejects(db.exec(`insert into public.workshops(${fields}) values (${values})`),/permission denied/);
    await db.exec(signIn(attendee));
    assert.equal((await db.query('select public.is_admin() as admin')).rows[0].admin,false);
    await assert.rejects(db.exec(`insert into public.workshops(${fields}) values (${values})`),/row-level security/);
    assert.deepEqual((await db.query(`update public.workshops set title='Intrusion' where id='${workshop}' returning id`)).rows,[]);
    await assert.rejects(db.exec(`insert into public.workshop_links(workshop_id,meet_url) values ('${workshop}','https://meet.google.com/abc-defg-hij')`),/row-level security/);
    await assert.rejects(db.exec(`insert into public.admin_users values ('${attendee}')`),/permission denied/);
  } finally {await db.close();}
});

test('backend validates metadata, timezone, uniqueness and schedule before publication',async()=>{
  const db=await fixture();
  try {
    await db.exec(signIn(admin));
    const id=(await db.query(`insert into public.workshops(${fields}) values (${values}) returning id`)).rows[0].id;
    await assert.rejects(db.exec(`insert into public.workshops(${fields}) values (${values})`),/unique/);
    for (const assignment of ["slug='bad--slug'","title=''","host_name=''","title=repeat('x',161)","short_description=repeat('x',501)","full_description=repeat('x',12001)","tags=array[repeat('x',41)]","tags=array_fill('x'::text,array[11])","timezone='Not/AZone'","starts_at=null","ends_at=starts_at-interval '1 hour'","full_description='https://meet.google.com/abc-defg-hij'"]) {
      await assert.rejects(db.exec(`update public.workshops set ${assignment} where id='${id}'`),/limit|slug|Title|Tags|tags|timezone|check constraint|row-level security/);
    }
    await assert.rejects(db.exec(`update public.workshops set id='${workshop}' where id='${id}'`),/permission denied/);
    await assert.rejects(db.exec('select workify_private.validate_admin_workshop()'),/permission denied/);
  } finally {await db.close();}
});

test('cancel/archive preserve history and hard-delete is unavailable even for admins',async()=>{
  const db=await fixture();
  try {
    await db.exec(signIn(admin));
    const id=(await db.query(`insert into public.workshops(${fields}) values (${values}) returning id`)).rows[0].id;
    await db.exec(signIn(attendee));
    await db.exec(`insert into public.registrations(user_id,workshop_id) values ('${attendee}','${id}'); ${signIn(admin)}`);
    for(const status of ['cancelled','archived']) {
      await db.exec(`update public.workshops set status='${status}' where id='${id}'`);
      assert.equal((await db.query(`select count(*)::int as n from public.registrations where workshop_id='${id}'`)).rows[0].n,1);
      await assert.rejects(db.exec(`delete from public.workshops where id='${id}'`),/permission denied/);
      await assert.rejects(db.exec(`insert into public.workshop_links(workshop_id,meet_url) values ('${id}','https://meet.google.com/abc-defg-hij')`),/row-level security/);
    }
    await db.exec(signIn(attendee));
    assert.equal((await db.query(`select count(*)::int as n from public.registrations where workshop_id='${id}'`)).rows[0].n,1);
    assert.equal((await db.query(`select status from public.workshops where id='${id}'`)).rows[0].status,'archived');
    await db.exec('set role anon;');
    assert.deepEqual((await db.query(`select id from public.workshops where id='${id}' and status <> 'archived'`)).rows,[]);
    await db.exec(`reset role; insert into public.workshops(id,slug,title,host_name,status) values ('be33c1fc-e4c4-4def-b33e-078fdf662400','retired-fixture','Retired fixture','Test host','archived'); ${signIn(admin)}`);
    await assert.rejects(db.exec("update public.workshops set status='open' where id='be33c1fc-e4c4-4def-b33e-078fdf662400'"),/retired workshop/);
  } finally {await db.close();}
});

test('Meet updates enforce canonical addresses, clearing, immutable identity and closed-publication veto',async()=>{
  const db=await fixture();
  try {
    await db.exec(signIn(admin));
    const id=(await db.query(`insert into public.workshops(${fields}) values (${values}) returning id`)).rows[0].id;
    const upsert=value=>`insert into public.workshop_links(workshop_id,meet_url) values ('${id}','${value}') on conflict(workshop_id) do update set workshop_id=excluded.workshop_id,meet_url=excluded.meet_url returning meet_url`;
    await db.exec(upsert('https://meet.google.com/abc-defg-hij'));
    await db.exec(upsert('https://meet.google.com/xyz-abcd-efg'));
    await assert.rejects(db.exec(upsert('javascript:alert(1)')),/row-level security|check constraint/);
    assert.equal((await db.query(upsert(''))).rows[0].meet_url,'');
    await assert.rejects(db.exec(`update public.workshop_links set workshop_id='${workshop}' where workshop_id='${id}'`),/identity|row-level security/);
    await db.exec(`update public.workshops set status='cancelled' where id='${id}'`);
    assert.deepEqual((await db.query('select * from public.workshop_links')).rows,[]);
    await assert.rejects(db.exec(upsert('https://meet.google.com/abc-defg-hij')),/row-level security/);
  } finally {await db.close();}
});
