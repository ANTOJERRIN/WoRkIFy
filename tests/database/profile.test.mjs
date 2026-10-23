import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';
import { database } from './fixture.mjs';

const source = name => readFile(new URL(`../../backend/supabase/migrations/${name}`, import.meta.url), 'utf8');
const migration = await source('20261023070718_profile_editor_contract.sql');
const storage = await source('20261002000001_avatars_storage.sql');
const owner = '55555555-5555-4555-8555-555555555555';
const other = '66666666-6666-4666-8666-666666666666';
const signIn = id => `set role authenticated; select set_config('request.jwt.claim.sub','${id}',false);`;
async function fixture() {
  const db = await database();
  await db.exec(`create schema workify_private; create schema storage;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,metadata jsonb,unique(bucket_id,name));
    create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;
    grant usage on schema storage to anon,authenticated;
    grant select,insert,update,delete on storage.objects to anon,authenticated;
    insert into auth.users(id,email) values ('${owner}','owner@fixture.test'),('${other}','other@fixture.test');
    update public.profiles set name='Existing profile';`);
  await db.exec(storage);
  await db.exec(migration);
  return db;
}

test('profile contract preserves existing data and blocks email/identity/privilege edits', async () => {
  const db = await fixture();
  try {
    await db.exec(signIn(owner));
    assert.equal((await db.query('select * from public.profiles')).rows.length, 1);
    await db.exec(`update public.profiles set name='Updated name',handle='@NORMALIZED',skills=array['React'] where id='${owner}'`);
    assert.equal((await db.query('select handle from public.profiles')).rows[0].handle, 'normalized');
    for (const statement of [`update public.profiles set email='fake@test'`, `update public.profiles set id='${other}'`,
      'delete from public.profiles', `insert into public.admin_users values ('${owner}')`,
      `insert into public.profiles(id) values ('${other}')`, 'truncate public.profiles']) {
      await assert.rejects(db.exec(statement), /permission denied|row-level security/);
    }
    await db.exec(`reset role; update auth.users set raw_user_meta_data='{"admin":true}' where id='${owner}'; ${signIn(owner)}`);
    assert.equal((await db.query('select public.is_admin() as admin')).rows[0].admin, false);
    await db.exec(signIn(other));
    assert.deepEqual((await db.query(`update public.profiles set name='Intrusion' where id='${owner}' returning id`)).rows, []);
    await db.exec('set role anon;');
    await assert.rejects(db.query('select email from public.profiles'), /permission denied/);
  } finally { await db.close(); }
});

test('server validates direct profile edits, uniqueness and immutable noneditable columns', async () => {
  const db = await fixture();
  try {
    await db.exec(`update public.profiles set handle='taken' where id='${other}'; ${signIn(owner)}`);
    for (const payload of ["name=''", "name=repeat('a',51)", "handle='x'", "bio=repeat('a',501)",
      "college=repeat('a',101)", "location=repeat('a',101)", "website_url='javascript:alert(1)'", "linkedin_url='https://'",
      "x_url='https://user:pass@example.test'", "skills=array[repeat('x',31)]", "skills=array_fill('x'::text,array[11])"]) {
      await assert.rejects(db.exec(`update public.profiles set ${payload} where id='${owner}'`), /must|limit|skills|HTTPS|handle_format/);
    }
    await assert.rejects(db.exec(`update public.profiles set handle='TAKEN' where id='${owner}'`), /unique/);
    await db.exec(`update public.profiles set website_url='https://example.test/path?q=1',name='Valid',handle=null where id='${owner}'`);
    assert.equal((await db.query('select name from public.profiles')).rows[0].name, 'Valid');
    await assert.rejects(db.exec('select workify_private.validate_profile_edit()'), /permission denied/);
  } finally { await db.close(); }
});

test('avatar policies preserve public reads and deny cross-owner upload, overwrite, rename and delete', async () => {
  const db = await fixture();
  try {
    const bucket = (await db.query("select * from storage.buckets where id='avatars'")).rows[0];
    assert.equal(Number(bucket.file_size_limit), 2097152);
    assert.deepEqual(bucket.allowed_mime_types, ['image/jpeg','image/png','image/webp','image/gif']);
    await db.exec(signIn(owner));
    await db.exec(`insert into storage.objects(bucket_id,name) values ('avatars','${owner}/avatar.png')`);
    await db.exec(`update storage.objects set metadata='{"replacement":true}' where name='${owner}/avatar.png'`);
    await assert.rejects(db.exec(`insert into storage.objects(bucket_id,name) values ('avatars','${other}/avatar.png')`), /row-level security/);
    await assert.rejects(db.exec(`update storage.objects set name='${other}/avatar.png' where name='${owner}/avatar.png'`), /row-level security/);
    await assert.rejects(db.exec(`insert into storage.objects(bucket_id,name) values ('avatars','${owner}/nested/file.png')`), /row-level security/);
    await assert.rejects(db.exec(`insert into storage.objects(bucket_id,name) values ('avatars','${owner}/photo.svg')`), /row-level security/);
    await db.exec(signIn(other));
    assert.deepEqual((await db.query(`update storage.objects set metadata='{}' where name='${owner}/avatar.png' returning id`)).rows, []);
    assert.deepEqual((await db.query(`delete from storage.objects where name='${owner}/avatar.png' returning id`)).rows, []);
    await db.exec('set role anon;');
    assert.equal((await db.query('select name from storage.objects')).rows.length, 1);
    await assert.rejects(db.exec(`insert into storage.objects(bucket_id,name) values ('avatars','${owner}/new.png')`), /row-level security/);
  } finally { await db.close(); }
});

test('restrictive ownership survives unrelated permissive policies and admins only read other profiles', async () => {
  const db = await fixture();
  try {
    await db.exec(`create policy broad_profile_update on public.profiles for update to authenticated using(true) with check(true);
      create policy broad_storage_insert on storage.objects for insert to authenticated with check(true);
      insert into public.admin_users values ('${other}'); ${signIn(other)}`);
    assert.equal((await db.query('select * from public.profiles')).rows.length, 2);
    assert.deepEqual((await db.query(`update public.profiles set name='Intrusion' where id='${owner}' returning id`)).rows, []);
    await assert.rejects(db.exec(`insert into storage.objects(bucket_id,name) values ('avatars','${owner}/other.png')`), /row-level security/);
  } finally { await db.close(); }
});
