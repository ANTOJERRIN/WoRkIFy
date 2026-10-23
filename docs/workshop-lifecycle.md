# Prompt 08: workshop lifecycle contract

This stage continues the reviewed local prompt 07 state. All code and migration
sources stay local for user review. No commit, push, PR, cloud mutation or
deployment was performed.

## Scope and rules

The prompt's architecture refinement assigns the shared lifecycle contract,
listing/schedule behavior and compatible schema changes to 08. Registration
service enforcement belongs to 09 and meeting access enforcement to 10. This
stage defines and tests their predicates; it does not present those predicates
or browser controls as installed authorization policies.

`WorkshopPublicationStatus` retains `open`, `coming_soon`, `cancelled` and
`archived`. The existing `WorkshopStatus` name is a compatibility alias. Time
phases are derived; no ongoing/completed columns or duplicate publication flags
are stored. Start/end are explicit instants stored as `timestamptz`. A valid
schedule has two finite instants with end strictly after start.

| Publication | Schedule/clock condition | Discovery | Registration / self-cancellation contract | Registered meeting contract | History |
| --- | --- | --- | --- | --- | --- |
| `coming_soon` | Both dates null | Shown last, Coming soon | Denied | Denied | Registration record, if present |
| `coming_soon` | Valid future/ongoing schedule | Shown, Coming soon | Denied | Denied | Publication remains unavailable |
| `open` | Valid, before start | Shown in start order | Allowed to the owner | From 15 minutes before start | Registered, without attendance claims |
| `open` | Start ≤ now < end | Shown first, Ongoing | Closed at start | Allowed inside window | Registered, without attendance claims |
| Either active publication | Now ≥ valid end | Excluded | Denied | Denied | Completed session / Registration history |
| `cancelled` | Any dates | Excluded; direct safe metadata remains | Denied; preserve history | Denied | Cancelled workshop / Registration history |
| `archived` | Any dates | Excluded; direct safe metadata remains | Denied; preserve history | Denied, including admin client access | Archived workshop / Registration history |
| Unknown publication / invalid or partial schedule | Any clock | Excluded; explanatory detail state | Denied | Denied | Schedule unavailable |

Cancellation/archival override timestamps. A completed session means the event's
scheduled end passed; it does not mean that the user attended, earned a
certificate or passed an assessment. Ongoing registration is intentionally
closed, while already registered users may join. Coming-soon rows with past
valid schedules become completed and disappear from discovery.

The meeting interval is **[start − 15 minutes, end)**. There is no invented
one-hour duration and no unscheduled join exception. Prompts 09/10 must use a
server timestamp such as `statement_timestamp()` consistently for the operation,
never a client-supplied clock or a stale transaction-start timestamp. A supplied
controlled timestamp in a private pure predicate is a testing/service contract,
not authority for a browser caller.

## Shared modules and UI

- `src/domain/workshopLifecycle.ts`: strict instant parsing, schedule validity,
  lifecycle/eligibility derivation, discovery sorting and timezone formatting.
- `src/hooks/useWorkshopClock.ts`: updates presentation without refetching data.
- Workshop discovery, cards, details, dashboard and profile consume the same
  rules. The public catalog still contains safe metadata needed by details and
  admin; discovery applies the lifecycle filter without destroying that catalog.
- Scheduled discovery orders by instant, with stable ID ties; open ongoing
  sessions come first and unscheduled coming-soon records last. Search operates
  on this eligible list. No workshops were added to production content.
- Archived/cancelled details omit registration, Calendar and meeting actions.
  Completed/invalid details cannot offer registration or Calendar. History is
  retained; cancellation controls appear only when the contract allows them.
- Meeting presentation in `src/api/links.ts` consumes the lifecycle instead of
  inventing durations. The UI requests a link only for a registered user inside
  the advisory window, ignores stale results and removes the link at end.
- Display uses the stored timezone, with an explicit UTC fallback label when
  it is unavailable. Cross-midnight ranges show both dates. The old IST-only
  formatter was removed rather than retained as a second implementation.
- Admin shows publication plus derived phase. Create defaults to Coming Soon.
  Full create/update payloads receive the same schedule validation. The date
  controls are explicitly UTC, preserve the existing display timezone, and
  convert instants consistently regardless of the browser's timezone. Calendar
  links also encode actual UTC instants rather than stripping an offset.

## Local migration and compatibility

The cached Supabase CLI generated:

`backend/supabase/migrations/20261021181340_workshop_lifecycle_contract.sql`

It adds `workshops_lifecycle_schedule_check` as **NOT VALID**. Existing rows are
not rewritten or deleted. New rows and updates must supply a complete valid
schedule for an open publication; coming soon may have both dates absent.
Cancelled/archived history is retained without forcing old dates to be invented.
Any already-installed stricter constraint remains in force.

Before a future release, inspect schema/history drift and legacy inconsistent
rows. Remediate them deliberately, then run `VALIDATE CONSTRAINT` separately.
An update to an existing invalid open row will be checked; cancelling/archiving
or correcting its dates is the intended remediation. Do not replay the original
schema's seeds on the live project.

The migration also adds pure, invoker-rights SQL predicates under
`workify_private` for valid schedules, phase, registration and join eligibility.
They read no tables, expose no URL, and have no `PUBLIC`, `anon` or
`authenticated` execute grant. They are not a public RPC authorization path.
The next services must choose narrowly scoped execution privileges and install
authoritative policies/RPCs using the actual server clock and user identity.
No permissive grant or RLS replacement is introduced here.

If this unapplied migration is later rolled back, review its dependencies first
and remove its named constraint/functions explicitly. Do not use a cascading
schema deletion. No data restoration is required by this migration itself.

`NOT VALID` preserves existing rows while enforcing subsequent writes; see
[PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html).
The timestamp choices follow [PostgreSQL date/time functions](https://www.postgresql.org/docs/current/functions-datetime.html).

## Archival reconciliation and read-only cloud evidence

A read-only check on 21 October 2026 against the previously diagnosed project
`epgsgvwdlwarktbjrdfn` reconfirmed the exact target:

- ID `be33c1fc-e4c4-4def-b33e-078fdf662400`, slug `linkedin-workshop`.
- Title LinkedIn Workshop, host **F1 Forge**.
- Start `2026-10-02T14:00:00Z`, end `2026-10-02T15:00:00Z`.
- Status was still `open`; the project's status constraint still listed only
  open, coming_soon and cancelled. Its existing date-order constraint permits
  missing dates. The inspected workshop count was one, with a complete schedule.

The unapplied archival source incorrectly guarded host `ForMa`, contradicting
its report and fixtures. It now guards **F1 Forge**, matching both inspections.
All UUID/slug/title/date checks and failure-on-mismatch behavior remain. Tests
also reject ForMa as mismatched metadata. No archival or lifecycle migration
was applied to the cloud and no historical data was modified.

## Validation and remaining enforcement

Results are recorded in `docs/prompt-history.md`. A shared controlled-time JSON
matrix drives TypeScript expectations and SQL predicate tests. Tests cover
boundary instants, invalid/missing dates, overrides, stable discovery order,
timezone display, legacy-row preservation and new-write constraints. Existing
anonymous denial, ownership, duplicate uniqueness, admin access and archival
checks run against disposable PostgreSQL. Browser requests are intercepted.

Final results: **104 desktop/mobile browser tests**, **26 domain tests**, **6
disposable database tests** and **5 configuration tests** passed, as did
application/test TypeScript and the production build with isolated public test
values. Lint has 0 errors and 12 warnings (5 active-source, 7 in the existing
`.review-stage05` snapshot). The diff whitespace check also passed.

Commands run:

```powershell
npm.cmd run test:domain
npm.cmd run test:db
npm.cmd run test:config
npx.cmd tsc -p tsconfig.tests.json
npm.cmd run lint
git diff --check
$env:PLAYWRIGHT_CHANNEL='chrome'
npx.cmd playwright test --config=playwright.review.local.ts --workers=2 --reporter=line
$env:VITE_SUPABASE_URL='https://workify-browser-test.supabase.co'
$env:VITE_SUPABASE_ANON_KEY='isolated-browser-test-key'
npm.cmd run build
```

The following are **still release blockers owned by the next stages**:

- 09: enforce registration/self-cancellation eligibility and concurrency on the
  server. Existing ownership/unique constraints remain, but ordinary registration
  policies still do not implement the full time/status contract.
- 10: enforce registered/admin meeting retrieval with the server clock, explicit
  unavailable/error states, and cancelled/archived vetoes. Current browser
  presentation cannot prevent a manipulated caller from querying the older
  endpoint outside its window. `getWorkshopMeetUrl` still has its older null-on-
  error behavior pending that service change.
- The public-read and archival migrations, this lifecycle migration, schema
  drift review, deployment target/rewrites and live verification remain unapplied
  or unverified. This is a local contract implementation, not a production launch.
