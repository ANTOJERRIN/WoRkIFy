# Prompt 02: public catalog and overlay repair

## Root cause and scope

Public landing/navbar actions already navigated without authentication, but the
context did not close an existing dialog on navigation. Dialogs also lacked
keyboard focus management and Escape dismissal. Coming-soon cards blocked their
safe detail pages, and the catalog used the same message for an empty response
and an unmatched search.

The catalog callback depended on the selected workshop, so selecting a workshop
could reload the catalog. Catalog requests used the session client and selected
every table column. They now use an independent anonymous client, an explicit
metadata field list, a 15-second request timeout and a stable reload callback.
Only the latest request updates catalog state. Session restoration errors do not
block browsing or open an authentication dialog.

The full catalog remains available to existing account/detail consumers. The
upcoming listing excludes cancelled rows and rows with a past `ends_at`, using
the existing fields. Stage 08 owns the complete lifecycle contract. No data is
archived or deleted here; stage 03 owns LinkedIn retirement.

## Click → query → render

1. Landing, navbar and track-card actions call `setCurrentPage('workshops')`.
   Public navigation closes auth/hosting dialogs without requiring a session.
2. `WorkifyProvider.loadWorkshops` calls `api/workshops.listWorkshops`.
3. The public client selects only ID, slug, title, host, mode, schedule, timezone,
   status, descriptions and tags from `workshops`. It never reads meeting links
   or attendee records. Registration and account APIs retain the session client.
4. The listing separately renders loading, failure with retry, upcoming cards,
   no upcoming workshops, or no search matches. Card/detail navigation does not
   reload the catalog. A missing detail is distinct from a failed/loading query.
5. Registration and other protected actions retain their existing guards and
   backend policies. The unavailable-auth message offers Close and Explore.

## Changed areas

- `src/api/workshops.ts`, `src/lib/supabase.ts`: public response
  contract and independent anonymous reads.
- `src/context/WorkifyContext.tsx`: stable/race-safe catalog loading,
  failed-session handling and overlay cleanup on navigation/logout.
- Auth and hosting modals plus `components/layout/useModalDialog.ts`: Escape,
  focus containment/restoration, inert background and scroll locking.
- Workshop listing/card/detail and app shell: honest states, safe detail access,
  focus fallback and unchanged blue/violet styling.
- Playwright config, isolated browser fixtures, test script and pinned test
  dependency. No existing source files were moved or renamed.

## Reproduce browser checks

```powershell
npm.cmd ci
npx.cmd playwright install chromium
npm.cmd run test:browser
```

On this Windows workstation an installed Edge browser can be used instead:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npm.cmd run test:browser
```

The test server uses a test-only URL/key. Every Supabase HTTP request in these
tests is intercepted; no workshop/account fixtures are written to any cloud
database. The production entry does not import the browser-test harness.

Before the application fix, browser tests failed for dialog focus, coming-soon
detail access, and the empty catalog message. The suite covers desktop/mobile
public CTAs, details, keyboard dismissal/focus, protected guards, stale overlays,
loading/error/retry, empty/search states, session failures and missing details.

Run `npm.cmd run build` and `npm.cmd run lint` separately. The repository's
existing SQL ownership/RLS regression suite is documented in
`backend/supabase/tests/README.md`; browser fixtures do not prove database RLS.
The SQL suite was not rerun against a disposable database in this stage; cloud
authorization checks inspected effective privileges without attempting writes.

Final local results: 18 browser checks passed across desktop and mobile using
Edge/Chromium; the production build passed; lint passed with the same 11
pre-existing warnings and no new warnings. Desktop/mobile screenshots were
inspected. These are local fixture results, not deployed-site verification.

## Required release steps; no deployment performed

Read-only checks on 20 October 2026 against the project identified during the initial diagnosis (`epgsgvwdlwarktbjrdfn`) found:

- `anon` has no `SELECT` privilege or read policy for `workshops`.
- `anon` has no SELECT/INSERT/UPDATE/DELETE privileges for profiles,
  registrations, reviews, admin records or meeting links.
- Workshop reading is currently allowed for `authenticated` only.
- Migration history was empty during prompt 01, and effective policies differ
  from the repository baseline. Do not replay the full schema against this
  existing database.

The exact existing unapplied migration is:

`backend/supabase/migrations/20261013172822_public_workshop_browsing.sql`

It grants only `SELECT` on `public.workshops` to `anon` and creates the visitor
read policy. A duplicate migration is unnecessary. At a separately authorized
release, confirm the hosting environment targets this project, review its schema
drift, apply this specific migration through the agreed migration process, then
verify anonymous catalog success and private-data/write denial. Deploy the
frontend with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` configured.

No migration, provider setting or cloud policy was changed in prompt 02. The
actual deployed website/commit and authenticated live behavior remain
unverified. Public browsing in the cloud remains blocked until the required
grant/policy is applied to the confirmed deployment target.
