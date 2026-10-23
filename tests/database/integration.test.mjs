import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';
import { database } from './fixture.mjs';

const read = name => readFile(new URL(`../../backend/supabase/migrations/${name}`,import.meta.url),'utf8');
const changes = await Promise.all([
  '20261002000001_avatars_storage.sql','20261020123021_archive_linkedin_workshop.sql',
  '20261021181340_workshop_lifecycle_contract.sql','20261022170525_registration_service.sql',
  '20261022172429_meeting_link_access.sql','20261023070718_profile_editor_contract.sql',
  '20261023081331_admin_workshop_contract.sql',
].map(read));
const regression=await readFile(new URL('../../backend/supabase/tests/public_workshop_browsing.sql',import.meta.url),'utf8');
const admin='55555555-5555-4555-8555-555555555555',owner='66666666-6666-4666-8666-666666666666',other='77777777-7777-4777-8777-777777777777';
const signIn = id => `set role authenticated; select set_config('request.jwt.claim.sub','${id}',false);`;
async function integrated() {
  const db=await database();
  await db.exec(`create schema storage;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,metadata jsonb,unique(bucket_id,name));
    create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;
    grant usage on schema storage to anon,authenticated;
    grant select,insert,update,delete on storage.objects to anon,authenticated;`);
  for(const change of changes) await db.exec(change);
  return db;
}

test('all migration contracts apply together and retain the shared public/private SQL regression',async()=>{
  const db=await integrated();
  try {
    await db.exec(regression);
    assert.equal((await db.query("select count(*)::int as n from public.workshops where slug='auth-regression'")).rows[0].n,0);
  } finally {await db.close();}
});

test('integrated student journey enforces ownership, joining, profile/avatar edits and historical archival',async()=>{
  const db=await integrated();
  try {
    await db.exec(`insert into auth.users(id,email) values ('${admin}','admin@fixture.test'),('${owner}','owner@fixture.test'),('${other}','other@fixture.test');
      insert into public.admin_users values ('${admin}'); ${signIn(admin)}`);
    const workshop=(await db.query(`insert into public.workshops(slug,title,host_name,status,starts_at,ends_at,timezone)
      values ('integrated-fixture','Integrated workshop','Fixture host','open',clock_timestamp()+interval '1 hour',clock_timestamp()+interval '2 hours','Asia/Kolkata') returning id,starts_at`)).rows[0];
    const id=workshop.id;
    await db.exec(`insert into public.workshop_links(workshop_id,meet_url) values ('${id}','https://meet.google.com/abc-defg-hij');
      set role anon; select set_config('request.jwt.claim.sub','',false);`);
    assert.equal((await db.query(`select title from public.workshops where id='${id}' and status<>'archived'`)).rows[0].title,'Integrated workshop');
    await assert.rejects(db.query('select email from public.profiles'),/permission denied/);
    assert.deepEqual((await db.query('select * from public.workshop_links')).rows,[]);
    await db.exec(signIn(owner));
    await db.exec(`insert into public.registrations(user_id,workshop_id) values ('${owner}','${id}');
      update public.profiles set name='Student',handle='@STUDENT',bio='Learning by building',linkedin_url='https://www.linkedin.com/in/student',skills=array['React'] where id='${owner}';
      insert into storage.objects(bucket_id,name) values ('avatars','${owner}/photo.png');
      update public.profiles set avatar_url='https://fixture.test/public/student.png' where id='${owner}';`);
    assert.equal((await db.query(`select handle from public.profiles where id='${owner}'`)).rows[0].handle,'student');
    assert.equal((await db.query(`select public.get_workshop_join_state('${id}')->>'status' as status`)).rows[0].status,'upcoming');
    await db.exec(`reset role; create or replace function workify_private.meeting_access_now() returns timestamptz
      language sql volatile security invoker set search_path='' as $$ select starts_at-interval '10 minutes' from public.workshops where id='${id}' $$; ${signIn(owner)}`);
    const access=(await db.query(`select public.get_workshop_join_state('${id}') as access`)).rows[0].access;
    assert.equal(access.status,'joinable'); assert.equal(access.meet_url,'https://meet.google.com/abc-defg-hij');
    await db.exec(signIn(other));
    assert.equal((await db.query(`select public.get_workshop_join_state('${id}')->>'status' as status`)).rows[0].status,'unauthorized');
    assert.deepEqual((await db.query(`select id from public.profiles where id='${owner}'`)).rows,[]);
    assert.deepEqual((await db.query(`update public.profiles set name='Intrusion' where id='${owner}' returning id`)).rows,[]);
    await assert.rejects(db.exec(`insert into storage.objects(bucket_id,name) values ('avatars','${owner}/intrusion.png')`),/row-level security/);
    await db.exec(`reset role; insert into public.linkedin_reviews(user_id,workshop_id) values ('${owner}','${id}'); ${signIn(admin)}`);
    assert.equal((await db.query(`select email from public.profiles where id='${owner}'`)).rows[0].email,'owner@fixture.test');
    await db.exec(`update public.workshops set status='archived' where id='${id}'`);
    await assert.rejects(db.exec(`delete from public.workshops where id='${id}'`),/permission denied/);
    await db.exec(signIn(owner));
    assert.equal((await db.query(`select count(*)::int as n from public.registrations where workshop_id='${id}'`)).rows[0].n,1);
    assert.equal((await db.query(`select count(*)::int as n from public.linkedin_reviews where workshop_id='${id}'`)).rows[0].n,1);
    assert.equal((await db.query(`select public.get_workshop_join_state('${id}')->>'status' as status`)).rows[0].status,'unavailable');
    assert.deepEqual((await db.query('select * from public.workshop_links')).rows,[]);
    await assert.rejects(db.exec(`delete from public.registrations where workshop_id='${id}'`),/only for open workshops/);
    await db.exec('set role anon;');
    assert.deepEqual((await db.query(`select id from public.workshops where id='${id}' and status<>'archived'`)).rows,[]);
  } finally {await db.close();}
});
