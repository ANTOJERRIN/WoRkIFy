# Prompt 14: integration review

Review date: 23 October 2026. **Ready for local source review; not ready for a
production release.** The local contracts work together, but the inspected cloud
database lacks the pending security/runtime contracts and has incompatible legacy
constraints. The deployed frontend, hosting target and real-session behavior are
not verified. No deployment, GitHub push or live migration was performed.

Read alongside [the architecture](architecture.md) and
[the release/rollback plan](release-plan.md). Earlier stage reports are historical
checkpoints; this report assesses the current combined working tree.

**Release-preparation continuation, 23 October:** the schema compatibility
package is now implemented and tested under
[backend/release](../backend/release/README.md). Fresh metadata checks reconfirmed
the known backend baseline. This advances the first blocker from an unwritten
delta to a locally tested candidate; staging execution and real-account/host
acceptance are still pending. The historical prompt 14 findings below remain
useful context and do not imply that the candidate has been applied.

## Baseline and references

- Repository: `ANTOJERRIN/WoRkIFy`; local branch `fix/url-routing-page-shell`.
- Local HEAD: `5c1fb28ef14c722217290cdee851e52a123dd591` (routing/page shell).
  The completed later stages are **uncommitted working-tree changes**, not part
  of that commit. Do not release HEAD alone or omit the new untracked source,
  tests, migrations, scripts and documentation.
- Earlier dependency repair: `5546517`; canonical-layout history: `4e44491`;
  public-browsing fix: `5b12acc`. The latter layout commit alone omitted moved
  source additions; it is not a complete runnable baseline.
- [Historical Google sign-in removal PR #4](https://github.com/ANTOJERRIN/WoRkIFy/pull/4)
  is prior history, not a PR for this final working tree. No new commit/PR link
  exists: the user explicitly reserved review and GitHub pushes for themselves.
- Lockfile SHA-256:
  `50F0742FBF66ACD5297A2D09654A9DD50C7E19DF6B685BF19100AA6E7899DC2A`.

## Evidence checklist

| Check | Local evidence | Cloud/deployed status |
| --- | --- | --- |
| Canonical root install/build | Clean isolated `npm ci --offline --ignore-scripts --no-audit --no-fund` and build passed using the existing lock/cache | Normal online/lifecycle-script install not run; hosting setup unknown |
| Reproducible frontend assets | Isolated-copy and working-tree asset hashes matched after explicit Tailwind source scoping | Release must rebuild with actual approved public configuration |
| Combined migration compatibility | All local migration contracts apply together in disposable PostgreSQL; integrated student journey passes | Observed live schema differs; pending SQL cannot be replayed blindly |
| Public routes, history, details/sharing | Desktop/mobile intercepted-traffic browser checks | Actual deployed origin/direct refresh unverified |
| Session restoration, logout/identity switch | Test-only session controls and owner-scoped SQL checks | Real existing-account sessions unverified |
| Registration ownership/lifecycle | Real disposable SQL grants/RLS/trigger tests and browser failure/race fixtures | New registration contract absent from inspected cloud policies |
| Meeting authorization | Server-clock SQL boundary tests, typed UI states and URL validation | Join-state RPC absent; current read policy lacks the new time window |
| Profile/avatar ownership | Validation, staged-photo/browser checks and SQL ownership tests | Public bucket size/MIME settings confirmed; actual upload HTTP/CDN unverified |
| Admin/hosting | Authoritative membership checks, confirmed operations, preserved-history tests and contact dialog | New admin restrictions unapplied; real host call/destination reachability not attempted |
| Retired assessment branch | No executable frontend endpoint/table references in built assets; source function removed | Edge Function listing empty in inspected project; other targets unknown |
| Retired workshop/history | Exact-ID archival and preserved registrations/reviews in disposable tests | Exact cloud target still has status `open` |
| Build secret/boundary checks | Configuration rejects known server keys; Vite excludes backend/test modules; `node scripts/review-bundle.mjs` reported no findings | No audit of an unknown deployed artifact or production build variables |
| Desktop/mobile and themes | Existing regression coverage plus rendered fixture screenshots | Live devices/site not verified |
| Hosting SPA/static behavior | Public document routes work in local production preview; missing asset and API-shaped paths incorrectly return HTML 200 there | Host exclusions are a failed preview check and an unverified deployment gate |

Final command counts and the production-preview result are recorded in the
prompt 14 continuation in [prompt history](prompt-history.md). Browser fixtures
intercept backend traffic and never establish a real cloud login. PGlite supplies
minimal auth/storage fixtures; it does not emulate the Storage HTTP engine or CDN,
and overlapping operations on its single connection do not prove independent
PostgreSQL connection lock races.

## Read-only cloud findings

Inspected only the previously identified project `epgsgvwdlwarktbjrdfn`, named
`F1 FoRgE company`, on 23 October 2026. The project listing reported healthy/active.
This identifies the inspected backend; it does **not** prove that an unknown
deployed frontend uses it. No private user records or meeting URL values were
exported. Checks used system catalogs, policies, migration/function inventory,
the public retired-workshop identity and avatar bucket metadata.

1. Migration history returned an empty list despite existing application tables.
   That is schema/history drift, not an empty database.
2. The current admin helper is `private.is_admin()`. `public.is_admin()`, which
   several local migration expressions require, is absent. Resolve this interface
   explicitly in a reviewed compatibility delta before dependent migrations.
3. Anonymous `SELECT` privilege on `public.workshops` is false, and its inspected
   SELECT policy targets authenticated users only. The local anonymous discovery
   contract is therefore not established in this backend.
4. `public.get_workshop_join_state(uuid)` is absent. The current private-link
   SELECT policy checks registration/admin membership but has no new join-window
   restriction. New registration lifecycle, profile-column and admin restrictions
   are not present in the inspected policy list. Catalog checks also found
   authenticated profile-email UPDATE and workshop DELETE privileges still true.
5. Exact retired target `be33c1fc-e4c4-4def-b33e-078fdf662400` still matches slug
   `linkedin-workshop`, title `LinkedIn Workshop`, host `F1 Forge`, and the verified
   2 October 2026 14:00–15:00 UTC schedule, but still has status `open`.
6. Existing constraint differences include:
   - `workshops_status_check` allows only open/coming_soon/cancelled, not archived.
   - `workshops_dates_check` allows partial schedules, unlike the new open-session
     contract. Cloud also has mode and differently named profile constraints.
   - `workshop_links_meet_url_https_check` requires HTTPS and rejects empty-string
     clearing, which the new UI/service deliberately supports.
   - `profiles_linkedin_url_format_check`, `profiles_x_url_format_check` and
     `profiles_website_url_format_check` accept NULL or their URL patterns, so
     the new optional empty-string payloads can conflict. Domain-specific patterns
     differ from the new parsed HTTPS field contract. Inspect actual definitions
     and legacy rows before choosing compatible replacements; do not just remove
     security checks or loosen policies.
   - `admin_users` and `workshop_links` include additional timestamp columns absent
     from the original local baseline. Preserve them and inspect defaults/triggers.
7. The existing `avatars` bucket is public, has a 2097152-byte limit and the four
   expected JPEG/PNG/WebP/GIF MIME types. That confirms configuration metadata,
   not actual uploads, cross-account HTTP denial, image decoding or CDN behavior.
8. Edge Function inventory returned no functions. No endpoint was deleted. Source
   removal alone never proves retirement in another project/deployment.
9. The security advisor returned one warning: leaked-password protection disabled.
   [Supabase remediation guidance](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
   Password authentication is not introduced by this work; review the warning
   alongside the separately chosen authentication policy. No setting was changed.

## Remaining blockers, ordered

1. **Backend reconciliation and verification.** Export/compare the actual schema,
   grants, policies, functions, constraints and migration history; prepare and test
   a compatible delta on a restored staging copy. Resolve the helper namespace,
   optional-link constraints and Meet clearing before applying dependent contracts.
   Do not run the original full schema/seeds or blanket `db push` against this DB.
2. **Identify the release target and rollback artifact.** Confirm the hosting
   provider/origin, reviewed source snapshot, actual public backend variables,
   static-first SPA rewrites, caching and a compatible previous artifact/fallback.
   None has been identified or changed here.
3. **Real-account acceptance.** After approved staging migrations, verify public
   REST, two legitimate existing accounts, an admin, logout/session expiry,
   independent connection races, meeting windows and Storage HTTP ownership/limits.
   Local fixtures cannot replace these checks.
4. **Explicit authentication scope.** Google sign-in remains removed and new
   sign-in is unavailable. Decide whether an existing-session-only release is
   acceptable; otherwise design authentication separately. No provider is selected
   or enabled as part of this review.
5. **Optional product configuration.** Supply the actual approved F1 Forge HTTPS
   destination before enabling its links. Confirm the public host phone. Empty or
   invalid destinations safely remain unlinked; no website/phone ownership or
   outbound contact was verified.

Non-blocking local limits: four existing lint warnings remain; old/abandoned avatar
objects may remain public and need separately reviewed reference-aware cleanup;
timezone catalogs may differ between browser and server. A future general
assessment, approved-host publishing, payments or new role model is outside this
work and requires a separate decision.

## Review fixes and scope

The combined SQL regression expected RLS to return zero rows for all anonymous
operations. Later stages also revoke grants, so it now correctly accepts either
zero visible/affected rows or `insufficient_privilege`, while still failing on
data exposure or an allowed mutation. Its UTF-8 BOM was removed for direct SQL
execution. New integration tests apply every local contract together and cover
public discovery → registration → server-authorized joining → profile/avatar
ownership → archival with both registration and historical review preservation.

The clean-copy build exposed CSS sensitivity to unrelated files. Tailwind now
scans only `src/` and root `index.html`; the old local review snapshot is ignored,
preserved and excluded from normal lint. Root/clean build assets then matched.
The missing-logo path now uses a local monogram instead of a remote sample-image
URL, with browser coverage. No replacement auth, self-service hosting, dependency
or lockfile change, migration application or cloud write was introduced.

## Student code walkthrough

| Trace | Actual files/functions and purpose |
| --- | --- |
| Entry | `index.html` loads `src/main.tsx`; `readPublicConfig` runs before dynamically importing `App.tsx`, preventing an invalid backend client from replacing a readable setup error |
| Routes | `routing/routes.ts` (`readRoute`, `pagePath`, `workshopPath`) parses URLs; `useUrlRoute` owns push/pop/history and legacy URL normalization; `AppContent` renders one shared shell |
| Session/guards | `auth/useSession.ts` resolves SDK restoration/auth events and calls `checkIsAdmin`; `RouteGuard` distinguishes loading, unavailable sign-in and denied admin access. It is presentation, not database authorization |
| Private state | `WorkifyProvider` keys `ScopedWorkifyProvider` by identity version; private `useProfile`/`useRegistrations` snapshots and feature callbacks are discarded on account change/logout |
| Public request | Navbar/landing navigation → `WorkshopsPage`/`useCatalog` → `listWorkshops` or detail `getWorkshop` → independent `publicSupabase` client → explicit `PUBLIC_WORKSHOP_FIELDS` projection and database read policies; no meeting/contact fields |
| Registration | Detail Register → context `registerForWorkshop` → hook mutation owner → API `requireUser`, owner/workshop insert and duplicate confirmation → RLS plus `guard_registration_mutation` server-clock/row-lock checks → shared registration/catalog refresh |
| Profile/avatar | `ProfilePage`/`ProfileEditForm` keep an unsaved draft; `profileValidation` checks fields and selected bytes; `updateProfile` verifies identity, optionally uploads a fresh owner-path object, confirms one owner-filtered profile write, and updates/reloads shared state |
| Meeting | Detail/dashboard `MeetingAccessControl` → `useMeetingAccess` → `getWorkshopMeetingAccess` in `api/links.ts` → invoker `get_workshop_join_state` RPC and RLS. Attendees require registration, open valid schedule and server time in [start−15m,end). Cached URLs expire; closed states never retain a URL |
| Admin | `AdminPage` owns an independent management list and keyed private details; `api/admin.ts` checks actual membership and confirms write results. Status-only archival preserves history; no hard-delete UI/API exists |
| Errors/retry | `useResource` bounds/aborts reads and prevents stale responses; feature components render distinct loading/empty/error/refresh states. Mutation owners separate confirmed saves from failed reconciliation, retain drafts and explain uncertain writes |
| Migrations | `backend/supabase/migrations/` defines source contracts; disposable tests prove the fresh combined baseline. Those files are not evidence of cloud application and require the reconciled release process |
| Future workshop | Use a legitimate admin account after server contracts are applied. Create Coming Soon with no dates or Open with valid UTC instants/IANA timezone, real title/host/descriptions/tags and unique slug; save a canonical Meet address separately; verify anonymous safe discovery and a permitted/denied registration in staging |

For review, explain both a normal and denied request before approving release.
Do not use mock sessions, persistent invented workshops or a service-role key in
the browser to make a live smoke check pass.
