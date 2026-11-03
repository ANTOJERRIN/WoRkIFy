import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const owner='11111111-1111-4111-8111-111111111111', member='22222222-2222-4222-8222-222222222222', other='33333333-3333-4333-8333-333333333333';
async function setup(withFixtures=true) {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema public,auth to anon,authenticated;
    grant execute on function auth.uid() to anon,authenticated;`);
  await db.exec(await readFile('backend/supabase/migrations/20261002000000_full_schema.sql','utf8'));
  await db.exec(`grant select,insert,update,delete on all tables in schema public to anon,authenticated;`);
  const migration=(await readdir('backend/supabase/migrations')).find(name=>name.endsWith('_owner_workshop_access.sql'));
  await db.exec(await readFile(`backend/supabase/migrations/${migration}`,'utf8'));
  if (withFixtures) await db.exec(`insert into auth.users (id,email) values ('${owner}','owner@example.test'),('${member}','member@example.test'),('${other}','other@example.test');
    insert into public.admin_users values ('${owner}');`);
  return db;
}
test('standalone SQL authorization regression remains valid with owner-only policies',async()=>{
  const db=await setup(false);
  try { await db.exec(await readFile('backend/supabase/tests/public_workshop_browsing.sql','utf8')); }
  finally { await db.close(); }
});
async function asUser(db, role, id='') { await db.exec(`reset role; set role ${role}; select set_config('request.jwt.claim.sub','${id}',false);`); }
const create = `insert into public.workshops(slug,title,host_name,starts_at,ends_at) values ('new-workshop','Workshop','Owner','2099-01-01T14:00:00Z','2099-01-01T15:00:00Z') returning id`;
test('only one admin can exist, and members cannot promote themselves or publish', async () => {
  const db=await setup();
  try {
    await assert.rejects(db.exec(`insert into public.admin_users values ('${member}')`),/unique/);
    await asUser(db,'anon');
    assert.ok((await db.query('select * from public.workshops')).rows.length);
    for (const table of ['admin_users','profiles','registrations','workshop_links']) await assert.rejects(db.query(`select * from public.${table}`), /permission denied/);
    await assert.rejects(db.exec(create), /permission denied/);
    await asUser(db,'authenticated',member);
    assert.equal((await db.query('select public.is_admin() as admin')).rows[0].admin,false);
    await assert.rejects(db.exec(`insert into public.admin_users values ('${member}')`), /permission denied/);
    await assert.rejects(db.exec(create), /row-level security/);
    assert.equal((await db.query(`update public.workshops set title='Hijacked' returning id`)).rows.length,0);
    await assert.rejects(db.exec(`delete from public.workshops`), /permission denied/);
    await assert.rejects(db.exec(`update public.admin_users set user_id='${member}'`),/permission denied/);
    await db.exec(`update public.profiles set name='admin' where id='${member}'`);
    assert.equal((await db.query('select public.is_admin() as admin')).rows[0].admin,false);
  } finally { await db.close(); }
});
test('owner creates/edits sessions; links stay private; archival preserves history',async()=>{
  const db=await setup();
  try {
    await asUser(db,'authenticated',owner);
    assert.equal((await db.query('select public.is_admin() as admin')).rows[0].admin,true);
    const id=(await db.query(create)).rows[0].id;
    await db.exec(`insert into public.workshop_links values ('${id}','https://meet.google.com/abc-defg-hij');`);
    await assert.rejects(db.exec(`update public.workshops set ends_at=starts_at where id='${id}'`),/check constraint/);
    await assert.rejects(db.exec(`update public.workshops set timezone='Invalid/Zone' where id='${id}'`),/valid IANA/);
    await assert.rejects(db.exec(create),/unique/);
    await asUser(db,'authenticated',member);
    assert.equal((await db.query('select * from public.workshop_links')).rows.length,0);
    await db.exec(`insert into public.registrations(user_id,workshop_id) values ('${member}','${id}')`);
    assert.equal((await db.query('select * from public.workshop_links')).rows.length,1);
    await assert.rejects(db.exec(`insert into public.registrations(user_id,workshop_id) values ('${other}','${id}')`),/row-level security/);
    assert.equal((await db.query(`update public.workshop_links set meet_url='https://meet.google.com/xyz-aaaa-bbb' where workshop_id='${id}' returning *`)).rows.length,0);
    await asUser(db,'authenticated',owner);
    await db.exec(`update public.workshops set title='Updated',status='archived' where id='${id}'`);
    assert.equal((await db.query(`select * from public.registrations where workshop_id='${id}'`)).rows.length,1);
    await asUser(db,'authenticated',member);
    assert.equal((await db.query('select * from public.workshop_links')).rows.length,0);
    await asUser(db,'authenticated',other);
    await assert.rejects(db.exec(`insert into public.registrations(user_id,workshop_id) values ('${other}','${id}')`),/row-level security/);
  } finally { await db.close(); }
});
