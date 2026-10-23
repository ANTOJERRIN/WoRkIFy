// Reconstruct inspected application DDL, not production data. Managed auth and
// storage infrastructure are minimal local stand-ins, not a staging backup.
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const { schema } = JSON.parse(await readFile(new URL('../../backend/release/observed-schema.json', import.meta.url), 'utf8'));
const identifier = text => `"${text.replaceAll('"', '""')}"`;
const literal = text => `'${text.replaceAll("'", "''")}'`;

export async function observedDatabase() {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create schema storage; create schema private;
      create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema public,auth,storage to anon,authenticated,service_role;
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,metadata jsonb,unique(bucket_id,name));
      alter table storage.objects enable row level security;
      create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;
      grant select,insert,update,delete on storage.objects to anon,authenticated,service_role;`);
    for (const table of schema.tables) {
      const columns = schema.columns.filter(column => column.table_name === table.name).map(column => {
        const type = column.data_type === 'ARRAY' ? 'text[]' : column.data_type;
        return `${identifier(column.column_name)} ${type}${column.column_default ? ` default ${column.column_default}` : ''}${column.is_nullable === 'NO' ? ' not null' : ''}`;
      });
      await db.exec(`create table public.${identifier(table.name)} (${columns.join(',')});`);
    }
    // All tables must exist before their foreign keys and dependent functions.
    for (const constraint of [...schema.constraints.filter(c => c.type !== 'f'), ...schema.constraints.filter(c => c.type === 'f')]) {
      await db.exec(`alter table public.${identifier(constraint.table_name)} add constraint ${identifier(constraint.name)} ${constraint.definition};`);
    }
    for (const index of schema.indexes.filter(index => !schema.constraints.some(c => ['p','u'].includes(c.type) && c.name === index.indexname))) {
      await db.exec(`${index.indexdef};`);
    }
    for (const fn of schema.functions) {
      await db.exec(fn.definition);
      const signature = `${identifier(fn.schema)}.${identifier(fn.name)}(${fn.args})`;
      await db.exec(`revoke all on function ${signature} from public,anon,authenticated,service_role;`);
      for (const role of ['anon','authenticated','service_role']) {
        if (fn.acl.split(',').some(entry => {
          const [grantee,permissions] = entry.replace(/[{}]/g,'').split('=');
          return (grantee === '' || grantee === role) && permissions.split('/')[0].includes('X');
        })) await db.exec(`grant execute on function ${signature} to ${role};`);
      }
    }
    for (const table of schema.tables) if (table.rls) await db.exec(`alter table public.${identifier(table.name)} enable row level security;`);
    for (const trigger of schema.triggers) await db.exec(`${trigger.definition};`);
    for (const policy of schema.policies) {
      await db.exec(`create policy ${identifier(policy.policyname)} on ${identifier(policy.schemaname)}.${identifier(policy.tablename)} as ${policy.permissive} for ${policy.cmd}
        to ${policy.roles.map(role => role === 'public' ? 'public' : identifier(role)).join(',')}
        ${policy.qual ? `using (${policy.qual})` : ''} ${policy.with_check ? `with check (${policy.with_check})` : ''};`);
    }
    for (const grant of schema.grants) {
      await db.exec(`grant ${grant.privilege_type} on public.${identifier(grant.table_name)} to ${grant.grantee === 'PUBLIC' ? 'public' : identifier(grant.grantee)};`);
    }
    const bucket = schema.storage_bucket;
    await db.query('insert into storage.buckets values ($1,$2,$3,$4,$5)', [bucket.id,bucket.name,bucket.public,bucket.file_size_limit,bucket.allowed_mime_types]);
    return db;
  } catch (error) { await db.close(); throw error; }
}

export const users = {admin:'55555555-5555-4555-8555-555555555555',owner:'66666666-6666-4666-8666-666666666666',other:'77777777-7777-4777-8777-777777777777'};
export const signIn = id => `set role authenticated; select set_config('request.jwt.claim.sub',${literal(id)},false);`;
export const retired = 'be33c1fc-e4c4-4def-b33e-078fdf662400';
export async function seedHistory(db) {
  for (const [name,id] of Object.entries(users)) await db.query("insert into auth.users(id,email,raw_user_meta_data) values ($1,$2,$3)",[id,`${name}@fixture.test`,{name}]);
  await db.query('insert into public.admin_users(user_id) values ($1)',[users.admin]);
  await db.query(`insert into public.workshops(id,slug,title,host_name,status,starts_at,ends_at,timezone)
    values ($1,'linkedin-workshop','LinkedIn Workshop','F1 Forge','open','2026-10-02 14:00:00+00','2026-10-02 15:00:00+00','Asia/Kolkata')`,[retired]);
  await db.query('insert into public.registrations(user_id,workshop_id) values ($1,$2)',[users.owner,retired]);
  await db.query(`insert into public.linkedin_reviews(user_id,workshop_id,linkedin_url,overall_score,band) values ($1,$2,'https://www.linkedin.com/in/fixture',75,'Strong')`,[users.owner,retired]);
  await db.query("insert into public.workshop_links(workshop_id,meet_url) values ($1,'https://meet.google.com/abc-defg-hij')",[retired]);
  await db.query("insert into storage.objects(bucket_id,name) values ('avatars',$1)",[`${users.owner}/existing.png`]);
}
