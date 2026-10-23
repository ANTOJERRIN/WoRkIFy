import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { observedDatabase, seedHistory } from './release-fixture.mjs';

test('public hotfix serves catalog while hiding archived rows and private tables', async () => {
  const db = await observedDatabase();
  try {
    await seedHistory(db);
    for (const path of [
      'backend/supabase/migrations/20261013172822_public_workshop_browsing.sql',
      'backend/supabase/migrations/20261020123021_archive_linkedin_workshop.sql',
      'backend/hotfix/20261023182101_hide_archived_workshops_from_public_catalog.sql',
    ]) await db.exec(await readFile(path, 'utf8'));
    await db.exec("set role anon");
    assert.deepEqual((await db.query('select id from public.workshops')).rows, []);
    for (const table of ['profiles','registrations','workshop_links']) {
      await assert.rejects(db.query(`select * from public.${table}`), /permission denied/);
    }
    await db.exec('reset role');
    assert.equal((await db.query('select status from public.workshops')).rows[0].status, 'archived');
    await db.exec("insert into public.workshops(slug,title,host_name,status) values ('public-fixture','Public fixture','Test host','coming_soon'); set role anon");
    assert.equal((await db.query('select title from public.workshops')).rows[0].title, 'Public fixture');
  } finally { await db.close(); }
});
