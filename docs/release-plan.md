# Workify release and rollback plan

Prepared in prompt 14 on 23 October 2026. **This is a plan, not an applied
deployment.** The [release review](release-review.md) identifies blockers and
current evidence. The user owns source review, commit/push and the release decision.

**23 October continuation:** the compatibility delta is now prepared under
[backend/release](../backend/release/README.md), with an inspected schema snapshot,
an atomic guarded candidate, source hashes and disposable tests. An identified
staging clone, real-account acceptance and verified Render settings remain required.
Nothing has been applied to the cloud.

The user has now identified the frontend as
`https://workify-x6pd.onrender.com`. [Render release preparation](render-release.md)
records the confirmed deep-link 404s, older bundle markers, observed backend
origin and proposed route settings. Workspace/service/deploy verification remains
pending; public HTTP checks alone do not establish the account configuration.

## 1. Capture the approved candidate

1. Review the working tree stage by stage, including untracked source, tests,
   scripts, documentation and migrations. Local HEAD alone does not contain the
   completed implementation. Keep `.env`, `node_modules`, `dist`, browser output,
   `.review-stage05` and backend CLI temporary data out of the eventual commit.
2. The user creates/pushes the reviewed candidate and records its immutable commit
   ID. Record the intended production origin, hosting account/project and backend
   project ID independently. The prior inspected backend is
   `epgsgvwdlwarktbjrdfn`; do not assume a deployed site points there.
3. Preserve a compatible previous frontend artifact and database/storage backup
   references, plus their public configuration and static rewrite/cache settings.
   If no prior release exists, prepare a static maintenance/public-information
   fallback. No rollback artifact or hosting provider has been identified here.

## 2. Reconcile the database in staging first

Do not run `db push`, replay `20261002000000_full_schema.sql`, or reapply its seed
rows against the inspected existing database merely because migration history is
empty. Export/inspect live DDL, grants, RLS, triggers, function privileges,
constraints, storage policies and history; restore an authorized staging copy.
Create and review a compatibility delta against that actual baseline.

The delta must explicitly resolve these observed interfaces:

- Local `public.is_admin()` references versus existing `private.is_admin()`.
  Either provide a reviewed compatible wrapper backed by the same authoritative
  membership source, or consistently adapt the pending definitions. Verify
  invoker/definer rights and role grants; never replace this with editable metadata.
- Existing Meet HTTPS-only check versus allowed empty-string clearing, while
  retaining the canonical-address validation and all time/publication vetoes.
- Existing profile optional-link/domain constraints versus the intended
  normalized optional field payloads and HTTPS validation. Inspect real legacy
  values and NULL/empty behavior before replacing any constraint.
- Existing constraint/trigger names, extra timestamp columns/defaults and column
  grants. Preserve valid existing data. Reconcile known invalid schedules/text
  explicitly rather than silently validating NOT VALID constraints over bad rows.
- Exact retired-workshop identity, current status, and registration/review history.
  Keep the original UUID/slug/title/host/time identity guard before archival.

The local source dependency order is:

| Order | Source contract | Release treatment |
| --- | --- | --- |
| Baseline | `20261002000000_full_schema.sql` | Fresh disposable DB reference only; existing tables must be reconciled, not recreated/reseeded |
| Baseline storage | `20261002000001_avatars_storage.sql` | Compare existing bucket/policies; public bucket settings already match at inspection |
| 02 | `20261013172822_public_workshop_browsing.sql` | Approved anonymous metadata grant/read policy |
| 03 | `20261020123021_archive_linkedin_workshop.sql` | Compatible archived status, exact-ID guard and archival vetoes |
| 08 | `20261021181340_workshop_lifecycle_contract.sql` | Schedule constraint and private lifecycle predicates/schema |
| 09 | `20261022170525_registration_service.sql` | Registration ownership/privileges and locking server-clock trigger |
| 10 | `20261022172429_meeting_link_access.sql` | Meeting validation/RLS, safe-state RPC and public-text protection |
| 12 | `20261023070718_profile_editor_contract.sql` | Profile editable columns/ownership/validation and avatar path boundaries |
| 13 | `20261023081331_admin_workshop_contract.sql` | Admin mutation/identity validation, retired guard and no client hard-delete |

Use only the reviewed reconciled equivalents on staging. Do not mark migrations
applied just to silence history drift. After verifying schema equivalence, record
the baseline/history through the agreed migration process and document exactly
which compatibility SQL and source contracts were applied. Any SQL repair is a
new release change requiring review and local/staging validation. The continuation
provides that candidate in `backend/release/`; it has local tests and has not been
applied to staging or production. Its README supersedes the placeholder delta
command below with the actual candidate path and transaction behavior.

For an approved SQL file on an explicitly authorized **staging** database, a
transactional execution pattern is:

```powershell
# REVIEW_DATABASE_URL is a securely supplied environment variable, not a chat value.
# reviewed-staging-delta.sql must be the already reviewed compatible file.
psql "$env:REVIEW_DATABASE_URL" -v ON_ERROR_STOP=1 --single-transaction -f reviewed-staging-delta.sql
```

This historical placeholder command was not run. Use the actual candidate and
execution instructions in `backend/release/README.md`, and use the
organization's migration runner if applicable; verify current CLI options with
`--help` before any live command. A constraint failure must abort, not be ignored.
Run security/performance advisors after the approved changes and verify no extra
public trigger/function grants were introduced. Refresh the API schema cache
through the supported project process if its function/table contract is stale.

Before advancing, run local tests, the rolled-back
`backend/supabase/tests/public_workshop_browsing.sql` only on a disposable/staging
DB, real anonymous REST checks, two legitimate existing user sessions and an admin.
Exercise actual Storage HTTP upload/replacement ownership, MIME/size limits and
server meeting boundaries. Use approved removable fixtures/transactions, never
persistent fabricated production workshops or a browser service-role key.

## 3. Retired endpoint and authentication decisions

- Inspect the actual target's Edge Functions and any old deployment configuration.
  The inspected project's function listing was empty. If another target still
  has `review-linkedin`, retire that executable endpoint through its approved
  function-management process. Keep the historical `linkedin_reviews` table/data.
  Verify deployed network traffic never calls the assessment endpoint.
- Keep Google sign-in absent. No replacement method was chosen. Record explicit
  acceptance of existing-session-only private access, or scope authentication
  separately before claiming new-user registration is available. Verify real
  provider/session behavior; UI removal alone does not prove cloud provider state.
- Review the leaked-password advisor warning with the selected authentication
  policy. Do not enable or redesign authentication automatically as a migration
  side effect.

## 4. Build the approved frontend

Use Node 24 and the single repository-root lockfile. The normal candidate commands
are:

```powershell
npm.cmd ci
npm.cmd run test:config
npm.cmd run test:domain
npm.cmd run test:db
$env:PLAYWRIGHT_CHANNEL='chrome' # Or a supported installed browser channel.
npm.cmd run test:browser
npm.cmd run lint
npm.cmd run build
node scripts/review-bundle.mjs
```

The review used an isolated offline install with lifecycle scripts disabled, then
the installed locked toolchain. The frontend build validates configuration before
bundling. Set the following through the host's public build configuration:

| Setting | Exact value/purpose |
| --- | --- |
| Build root | Repository root `.` |
| Install | `npm ci` |
| Build | `npm run build` |
| Publish directory | `dist` |
| Runtime | Node 24 for build tooling; output is a static SPA |
| `VITE_SUPABASE_URL` | Actual approved target's public API URL |
| `VITE_SUPABASE_ANON_KEY` | That project's public publishable/legacy anon key |
| `VITE_HOST_CONTACT_NUMBER` | Optional public phone; omit to retain the local default, empty to disable |
| `VITE_F1FORGE_URL` | Optional actual approved HTTPS partner destination; blank disables links |

Never use a service-role/secret key, database password or private API key in a
`VITE_` variable. These values are bundled into the browser. The current local
`dist` was built using isolated test configuration and is **not a production
release artifact**. Rebuild after choosing the actual public target variables.
The bundle scanner checks known secret/token patterns and test/retired references;
it does not replace review of every production variable or arbitrary secret type.

## 5. Configure the actual host and release

1. Confirm root-domain deployment: the router assumes `/`, not an unconfigured
   subdirectory. Upload only the reviewed `dist` artifact to the confirmed host.
2. Serve real files first. Return `index.html` with HTTP 200 for document routes
   `/`, `/workshops`, `/workshops/<ID-or-slug>`, `/dashboard`, `/profile`, `/admin`
   and unknown application routes (the app renders its own not-found screen).
3. Exclude `/assets/*`, missing static files and any actual `/api`, `/functions`,
   `/rest`, `/auth` namespaces from that fallback. They must return their real
   resource/error/upstream response rather than HTML. See the explicit Nginx
   example in [URL routing](url-routing.md). Use the provider's equivalent only
   after identifying it; no provider configuration was fabricated here.
4. Use immutable caching for content-hashed assets and revalidation/no stale
   long-lived caching for `index.html`. Keep the previous hashed files available
   during the release overlap so already-open clients can finish loading.
5. Prefer applying the approved backward-compatible backend contracts before the
   dependent frontend. Validate the staging artifact against the migrated staging
   DB, record approval, then perform the agreed production release. This review
   neither grants deployment permission nor performs these steps.

Local Vite dev/preview servers prove only local rendering/fallback behavior. In
this review, `/assets/not-present.js` and `/api/not-present` both returned the
application HTML with HTTP 200 from Vite preview. That strict-static/error check
failed locally and must pass on the actual host before release. Do not use the
preview server's generic fallback as the production routing configuration.

### Reproduce the verified Windows browser run

The final run reused isolated dev servers to avoid the previously observed Windows
runner shutdown hang. In two separate local terminals:

```powershell
# Terminal A, from the repository root:
$env:VITE_SUPABASE_URL='https://workify-browser-test.supabase.co'
$env:VITE_SUPABASE_ANON_KEY='isolated-browser-test-key'
npm.cmd run dev -- --host 127.0.0.1 --port 4174 --strictPort
```

```powershell
# Terminal B, from the repository root (deliberately missing configuration):
$env:VITE_SUPABASE_URL=''
$env:VITE_SUPABASE_ANON_KEY=''
npm.cmd run dev -- --host 127.0.0.1 --port 4176 --strictPort
```

The ignored local `playwright.review.local.ts` contains:

```typescript
import { defineConfig } from '@playwright/test';
import config from './playwright.config';
export default defineConfig({ ...config, webServer: undefined });
```

With those servers running, a third root terminal executes:

```powershell
$env:PLAYWRIGHT_CHANNEL='chrome'
node node_modules/@playwright/test/cli.js test --config playwright.review.local.ts --workers 4
```

Stop these test servers afterward. These keys/hosts are isolated fixtures and
must not become release configuration. Normal `npm run test:browser` uses the
tracked config to manage equivalent servers; it was not the final Windows runner
command used for the reported 182-case result.

## 6. Post-release smoke checks

- [ ] Confirm expected origin, reviewed commit/build hash and intended backend
  project in host settings. Check public variables without exposing secrets.
- [ ] Anonymous fresh browser: landing → workshop listing → real detail; no stale
  modal/backdrop. Check empty, search and permission/network failure/retry states.
- [ ] Paste both a real UUID and slug URL into a new tab; reload, Back/Forward,
  sharing and unknown-route recovery. Real assets work; missing assets and backend
  paths do not return the app HTML accidentally.
- [ ] Confirm anonymous callers cannot read profile/email, registrations or Meet
  links, mutate workshops/register, or access admin functions directly.
- [ ] Existing account A: restore session, register for a real permitted future
  session, inspect dashboard/profile, cancel only when allowed, refresh/reload.
- [ ] Account B cannot read/modify A's registration/profile/avatar; editable
  metadata cannot grant admin. Logout/expiry clears private UI and late responses.
- [ ] Meet: canonical-only address; unauthorized/no-link/upcoming/joinable/ended
  states; server interval [start−15m,end); exact end removes cached access; changing
  browser time never grants access. Cancelled/archived vetoes apply to admins too.
- [ ] Profile: valid/invalid and duplicate handle, optional-link clearing, real
  photo upload, partial save failure, retry/Cancel, ownership, size/MIME and reload.
- [ ] Authorized admin: create/edit a real approved session, set/clear its private
  Meet address, verify public safe listing, then archive without deleting history.
  Do not create persistent invented production content just to satisfy a check.
- [ ] Retired exact workshop is absent from active discovery but owner history is
  retained. No retired endpoint requests or review/unsupported proof controls.
- [ ] Signed-in host dialog resolves to the approved contact destination; phone
  and partner configuration are intentional. No self-service publishing/payment.
- [ ] Desktop/mobile, keyboard dialogs/focus, light/dark, readable errors and
  horizontal scrolling confined to tables. Check actual client/API logs for errors.
- [ ] Record real-account tests, advisors and migration history. A clean build or
  fixture test alone does not close these deployment checks.

## 7. Rollback without losing history or weakening access

1. If smoke checks fail, stop promotion/new writes through the agreed operational
   control and identify whether the failure is frontend configuration, schema,
   policy or data. Retain diagnostic evidence without collecting credentials.
2. Restore the previously verified **compatible** frontend artifact/configuration
   and rewrite/cache settings, or use the prepared maintenance/public-information
   fallback. Do not deploy arbitrary old HEAD: it omits later working-tree changes
   and may reintroduce retired UI or incompatible meeting/profile calls.
3. Keep new ownership, meeting-window, immutable identity and no-delete protections
   while fixing forward. Do not re-enable broad grants, expose private tables,
   restore assessment endpoints or reopen the retired workshop to make an old
   client appear functional.
4. Database rollback requires its own approved compatibility plan. New publication
   values, preserved registrations and profile/avatar references may no longer fit
   old constraints. Prefer an audited forward repair; no destructive down migration
   is supplied. A snapshot restore must account for writes since the snapshot and
   requires explicit data-loss assessment/approval.
5. Do not delete newly uploaded avatar objects on an uncertain response: a profile
   update may have committed. Old URLs are intentionally public; a frontend rollback
   cannot revoke them. Use separately reviewed reference-aware cleanup if needed.
6. Repeat anonymous/private/admin/meeting and direct-route smoke tests after the
   rollback, record the active artifact/schema, and obtain a new release decision.

Replacement authentication, general assessments, new host roles or payments remain
separate product work. Nothing in this document merges, deploys, applies SQL or
sends an external message automatically.
