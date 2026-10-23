import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const schema = await readFile(new URL('../../backend/supabase/migrations/20261002000000_full_schema.sql', import.meta.url), 'utf8');
const publicReads = await readFile(new URL('../../backend/supabase/migrations/20261013172822_public_workshop_browsing.sql', import.meta.url), 'utf8');

export async function database() {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema public, auth to anon, authenticated;
    alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;
  `);
  await db.exec(schema);
  await db.exec(publicReads);
  // The original random-ID seed is not the identity-verified archival target.
  await db.exec("update public.workshops set slug='unrelated-linkedin-fixture' where slug='linkedin-workshop';");
  return db;
}
