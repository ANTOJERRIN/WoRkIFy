import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { assembleRelease, releaseFile } from '../../scripts/build-release.mjs';
import { observedDatabase, seedHistory, users, signIn, retired } from './release-fixture.mjs';

const { sql, manifest } = await assembleRelease();
const inspection = await readFile(new URL('../../backend/release/inspect-schema.sql',import.meta.url),'utf8');
const before = db => db.query(inspection).then(result => result.rows[0].snapshot);
async function migrated() {
  const db = await observedDatabase();
  try { await seedHistory(db); await db.exec(sql); return db; }
  catch (error) { await db.close(); throw error; }
}
async function activeWorkshop(db) {
  await db.exec(signIn(users.admin));
  return (await db.query(`insert into public.workshops(slug,title,host_name,status,starts_at,ends_at,timezone)
    values ('release-fixture','Release fixture','Fixture host','open',clock_timestamp()+interval '1 hour',clock_timestamp()+interval '2 hours','Asia/Kolkata') returning id`)).rows[0].id;
}

test('release artifact is reproducible and records every source input',async()=>{
  assert.equal((await readFile(await releaseFile(),'utf8')).replace(/\r\n/g,'\n'),sql);
  const saved = JSON.parse(await readFile(new URL('../../backend/release/manifest.json',import.meta.url),'utf8'));
  assert.deepEqual(saved,manifest);
  assert.ok(!sql.includes('public.is_admin()'));
  assert.ok(!manifest.inputs.some(input=>input.path.includes('full_schema') || input.path.includes('avatars_storage')));
});

test('observed-schema release preserves history and extra timestamp columns without seed replay',async()=>{
  const db = await observedDatabase();
  try {
    await seedHistory(db);
    const history = (await db.query('select * from public.linkedin_reviews')).rows;
    const registrations = (await db.query('select * from public.registrations')).rows;
    const photos = (await db.query('select * from storage.objects')).rows;
    const admin = (await db.query('select * from public.admin_users')).rows;
    await db.exec(sql);
    assert.deepEqual((await db.query('select * from public.linkedin_reviews')).rows,history);
    assert.deepEqual((await db.query('select * from public.registrations')).rows,registrations);
    assert.deepEqual((await db.query('select * from storage.objects')).rows,photos);
    assert.deepEqual((await db.query('select * from public.admin_users')).rows,admin);
    assert.deepEqual((await db.query('select id,status from public.workshops')).rows,[{id:retired,status:'archived'}]);
    assert.ok((await db.query('select created_at,updated_at from public.workshop_links')).rows[0].created_at);
    assert.equal((await db.query("select to_regprocedure('public.is_admin()')::text as helper")).rows[0].helper,null);
    assert.equal((await db.query("select has_function_privilege('anon','public.get_workshop_join_state(uuid)','execute') as allowed")).rows[0].allowed,false);
    await db.exec(signIn(users.admin));
    await assert.rejects(db.exec('delete from public.linkedin_reviews'),/permission denied/);
    await assert.rejects(db.exec('delete from public.workshops'),/permission denied/);
    await assert.rejects(db.exec(`update public.workshops set status='open' where id='${retired}'`),/retired workshop/);
  } finally { await db.close(); }
});

test('reconciled backend supports public discovery, owned registration, server-time joining and Meet clearing',async()=>{
  const db = await migrated();
  try {
    const id = await activeWorkshop(db);
    await db.query("insert into public.workshop_links(workshop_id,meet_url) values ($1,'https://meet.google.com/abc-defg-hij')",[id]);
    await db.query("update public.workshop_links set meet_url='' where workshop_id=$1",[id]);
    assert.equal((await db.query('select meet_url from public.workshop_links where workshop_id=$1',[id])).rows[0].meet_url,'');
    await db.query("update public.workshop_links set meet_url='https://meet.google.com/abc-defg-hij' where workshop_id=$1",[id]);
    await db.exec("set role anon; select set_config('request.jwt.claim.sub','',false);");
    assert.equal((await db.query("select count(*)::int as n from public.workshops where status <> 'archived'")).rows[0].n,1);
    await assert.rejects(db.query('select * from public.workshop_links'),/permission denied/);
    await assert.rejects(db.query('select * from public.profiles'),/permission denied/);
    await db.exec(signIn(users.owner));
    await db.query('insert into public.registrations(user_id,workshop_id) values ($1,$2)',[users.owner,id]);
    assert.equal((await db.query('select public.get_workshop_join_state($1) as access',[id])).rows[0].access.status,'upcoming');
    assert.deepEqual((await db.query('select * from public.workshop_links where workshop_id=$1',[id])).rows,[]);
    await assert.rejects(db.query('insert into public.registrations(user_id,workshop_id) values ($1,$2)',[users.other,id]),/own registration|row-level security/);
    await db.exec(`reset role; create or replace function workify_private.meeting_access_now() returns timestamptz
      language sql volatile security invoker set search_path='' as $$ select starts_at-interval '10 minutes' from public.workshops where id='${id}' $$;
      ${signIn(users.owner)}`);
    assert.equal((await db.query('select public.get_workshop_join_state($1) as access',[id])).rows[0].access.status,'joinable');
    await db.exec(signIn(users.other));
    assert.equal((await db.query('select public.get_workshop_join_state($1) as access',[id])).rows[0].access.status,'unauthorized');
    assert.deepEqual((await db.query('select * from public.workshop_links where workshop_id=$1',[id])).rows,[]);
    await db.exec(signIn(users.admin));
    await db.query("update public.workshops set status='archived' where id=$1",[id]);
    assert.deepEqual((await db.query('select * from public.workshop_links where workshop_id=$1',[id])).rows,[]);
    await db.exec(signIn(users.owner));
    assert.equal((await db.query('select public.get_workshop_join_state($1) as access',[id])).rows[0].access.status,'unavailable');
    await assert.rejects(db.query('delete from public.registrations where workshop_id=$1',[id]),/only for open workshops/);
  } finally { await db.close(); }
});

test('reconciled profile links can be cleared while identity, unsafe URLs and avatar ownership stay protected',async()=>{
  const db = await migrated();
  try {
    await db.exec(signIn(users.owner));
    await db.query("update public.profiles set linkedin_url='',x_url='',website_url='',handle='@STUDENT' where id=$1",[users.owner]);
    assert.deepEqual((await db.query('select handle,linkedin_url,x_url,website_url from public.profiles where id=$1',[users.owner])).rows[0],{handle:'student',linkedin_url:'',x_url:'',website_url:''});
    await db.query("update public.profiles set linkedin_url='https://www.linkedin.com/in/student',x_url='https://x.com/student',website_url='https://example.test/' where id=$1",[users.owner]);
    for (const value of ['javascript:alert(1)','http://example.test','https://user:password@example.test','https://example.test\\bad']) {
      await assert.rejects(db.query('update public.profiles set website_url=$1 where id=$2',[value,users.owner]),/valid HTTPS|check constraint/);
    }
    await assert.rejects(db.query("update public.profiles set email='changed@fixture.test' where id=$1",[users.owner]),/permission denied/);
    await db.query("insert into storage.objects(bucket_id,name) values ('avatars',$1)",[`${users.owner}/new.png`]);
    await db.exec(signIn(users.other));
    assert.deepEqual((await db.query("update public.profiles set name='Intrusion' where id=$1 returning id",[users.owner])).rows,[]);
    await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values ('avatars',$1)",[`${users.owner}/intrusion.png`]),/row-level security/);
    assert.deepEqual((await db.query('delete from storage.objects where name=$1 returning id',[`${users.owner}/new.png`])).rows,[]);
  } finally { await db.close(); }
});

for (const [name,change] of [
  ['policy', 'create policy unexpected on public.profiles for select to authenticated using (true);'],
  ['grant', 'grant select on public.profiles to anon;'],
  ['column grant', 'grant update(email) on public.profiles to anon;'],
  ['constraint', 'alter table public.workshops drop constraint workshops_dates_check;'],
  ['helper', "create or replace function private.is_admin() returns boolean language sql stable security definer set search_path='' as $$ select true $$;"],
  ['bucket', "update storage.buckets set public=false where id='avatars';"],
  ['storage RLS', 'alter table storage.objects disable row level security;'],
  ['role inheritance', 'grant service_role to authenticated;'],
  ['nullability', 'alter table public.profiles alter column skills drop not null;'],
]) test(`release rejects unexpected ${name} drift before any changes`,async()=>{
  const db = await observedDatabase();
  try {
    await db.exec(change);
    const original = await before(db);
    await assert.rejects(db.exec(sql),/Release baseline drift/);
    await db.exec('rollback;');
    assert.deepEqual(await before(db),original);
    assert.equal((await db.query("select has_table_privilege('anon','public.workshops','select') as allowed")).rows[0].allowed,false);
  } finally { await db.close(); }
});

test('retired identity mismatch rolls back every earlier release change',async()=>{
  const db = await observedDatabase();
  try {
    await seedHistory(db);
    await db.query("update public.workshops set host_name='Different host' where id=$1",[retired]);
    const original = await before(db);
    await assert.rejects(db.exec(sql),/identity mismatch/);
    await db.exec('rollback;');
    assert.deepEqual(await before(db),original);
    assert.equal((await db.query('select status from public.workshops where id=$1',[retired])).rows[0].status,'open');
  } finally { await db.close(); }
});

test('release preserves legacy unsafe rows but denies meeting disclosure and rejects replay',async()=>{
  const db = await observedDatabase();
  try {
    await seedHistory(db);
    await db.query("update public.workshop_links set meet_url='https://legacy.example.test/meeting' where workshop_id=$1",[retired]);
    await db.exec(sql);
    assert.equal((await db.query('select meet_url from public.workshop_links where workshop_id=$1',[retired])).rows[0].meet_url,'https://legacy.example.test/meeting');
    await db.exec(signIn(users.owner));
    assert.deepEqual((await db.query('select * from public.workshop_links')).rows,[]);
    await db.exec('reset role;');
    const migratedSchema = await before(db);
    await assert.rejects(db.exec(sql),/Release baseline drift/);
    await db.exec('rollback;');
    assert.deepEqual(await before(db),migratedSchema);
  } finally { await db.close(); }
});
