# Prompt 09: registration service

This stage continues the reviewed local prompts 01–08. All changes stay in the
workspace for review: no commit, GitHub push, PR, merge or deployment. The
Supabase CLI generated a migration source; it was not applied to any cloud
database. Prompt 10 meeting access remains a separate stage.

## Findings and implemented contract

Registration already had one API module and a shared registration store after
07. The remaining gaps were direct database writes without lifecycle checks,
unconditional suppression of uniqueness errors, cancellation without confirmation,
unbounded mutations, and success reported even when refreshing failed.

The existing 08 rule is retained: an authenticated owner may register or cancel
only while a workshop is open, has finite ordered start/end times, and has not
started. Cancellation removes a future reservation. It cannot erase ongoing,
completed, cancelled or archived registration history. An absent reservation is
an idempotent cancellation result; deleting another user's row affects no rows.
Registration is not attendance, completion, certification or assessment success.
No attendance or review data is changed and no production workshops are added.

## Responsibilities and request flow

| File | Important functions and responsibility |
| --- | --- |
| `src/api/registrations.ts` | Existing `listUserRegistrations`, `registerForWorkshop`, `unregister`; newly typed mutation outcomes, ID validation, verified identity, bounded requests and actionable mutation errors |
| `src/hooks/useRegistrations.ts` | Existing shared store; one pending mutation, abort on identity-scope unmount, whole-operation timeout, no optimistic changes, refresh registration/catalog data, distinguish saved-but-refresh-failed |
| `src/context/WorkifyContext.tsx` | Supplies catalog invalidation to registration ownership; anonymous registration continues to explain unavailable authentication |
| `src/components/layout/AccountFeedback.tsx` | Separate error and saved-with-refresh-warning messages |
| `src/components/workshops/WorkshopDetailPage.tsx` | Re-resolves uncatalogued detail metadata when the shared catalog refreshes; meeting effect depends on ID/schedule rather than equivalent response objects |
| `backend/supabase/migrations/20261022170525_registration_service.sql` | New unapplied migration: restrictive ownership/immutability policies, limited table privileges and private lifecycle trigger |
| `tests/database/registrations.test.mjs` | Real disposable SQL tests of migration preservation, grants, ownership, lifecycle, uniqueness and server timing |
| `tests/browser/registrations.spec.ts` | Isolated browser tests for pending clicks, duplicates, denied requests, refresh behavior, timeout and sign-out races |
| `tests/browser/shared-state.spec.ts` | Existing cancellation fixture now returns confirmed deleted row IDs |

The host-contact modal also had an unused import after its existing local phone
edit. Only that unused import was removed; the user's displayed number remains.
No dependencies or lockfiles were changed.

A normal registration request goes from detail to the context wrapper to
`useRegistrations`, which immediately locks out repeated clicks. The API verifies
the SDK user against the current account and inserts only that user's ID and the
workshop ID. The backend checks RLS ownership and executes the private trigger.
After confirmation, the shared registration snapshot and catalog reload, so
detail, dashboard and profile consume the same confirmed data.

The unique user/workshop constraint arbitrates duplicate writes. A `23505` is
accepted only after a separate owner/workshop-scoped read confirms that exact
reservation. An unrelated conflict or failed confirmation remains an error.
Cancellation filters on both verified owner and workshop and requests deleted
IDs; it returns `cancelled` or `not_registered`, never silently equating a missing
response with a confirmed deletion.

For a denied request, a workshop cancelled after the page loaded may still show
an old registration button. The trigger rejects the write, an actionable error
appears, and catalog/registration reads reconcile the page. No optimistic
reservation was added. If a request times out, the client explicitly says its
outcome could not be confirmed and refreshes because the server may have saved it.
If the write succeeds but a refresh fails, the UI says the update was saved and
requests a refresh rather than incorrectly calling the mutation a failure.

## Database enforcement and concurrency

The migration retains existing unique constraints and owner/admin read policies.
New restrictive INSERT/DELETE policies require `auth.uid()` ownership; UPDATE
is denied and its privileges revoked. Anonymous write privileges and client
TRUNCATE/trigger privileges are revoked. No admin attendee-mutation bypass is
added. Ordinary current-user queries also explicitly filter by verified user ID;
explicit admin listing continues through the existing admin service.

The private trigger checks identity again and obtains `FOR SHARE` on the target
workshop. This conflicts with concurrent schedule/status updates while permitting
multiple attendee registrations. The trigger samples `clock_timestamp()` once
after acquiring that lock, so waiting behind a workshop edit or opening a long
transaction cannot reuse an earlier eligible timestamp. The existing 08 pure
predicate evaluates publication and schedule against this server timestamp;
the browser cannot supply it. Insert timestamps are also server-generated.

The trigger has `SECURITY DEFINER` solely because taking the required workshop
row lock must work without granting attendees workshop UPDATE privileges or
weakening workshop RLS. It lives in `workify_private`, has a fixed empty search
path and fully qualified database references, validates `auth.uid()` itself, and
has EXECUTE revoked from PUBLIC/anon/authenticated. It is attached as a trigger,
not exposed as a callable public RPC. Its only output is the registration trigger
row, never meeting links or other attendees' data. RLS remains enabled.
This follows the explicit privilege and search-path guidance in
[Supabase database functions](https://supabase.com/docs/guides/database/functions)
and [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

The lock serializes schedule/status decisions against workshop edits. It does
not claim that a request already accepted before the start must finish before
start: its eligibility decision occurs at the server check while holding the
lock. Concurrent duplicate attempts cannot produce two rows. An insert and
cancellation may complete in either legal database order; the client refetches
instead of guessing their final result. Deadlocks/transaction errors surface as
retryable failures, not false successes.

## Release work left pending

1. Confirm the intended project and inspect live schema, migration history,
   constraints, roles, column grants, policies and triggers. Previously diagnosed
   drift means the original schema/seeds or all migrations must not be replayed
   blindly. Review any policies granted to custom roles as well.
2. Review/apply the compatible public-read, archival and lifecycle changes in the
   intended order, then review/apply the new registration source. No data rewrite
   is needed by this migration. Do not validate legacy schedules without review.
3. Check security advisors and direct REST behavior with real attendee/admin
   identities. Run independent PostgreSQL connections to exercise duplicate
   inserts and registration/cancellation racing a status or schedule edit.
4. Deploy the frontend only after the backend enforcement is verified. The UI
   changes alone do not secure a database still running the old policies.
5. Continue prompt 10 before a release: meeting-link backend authorization is
   still pending. Replacement authentication also remains a separate decision.

Hard deletion of a workshop/user can cascade through registrations and reach
the same guard. This migration intentionally provides no privileged destructive
cleanup bypass; archive/cancel workshops instead. Any later account-erasure
workflow needs its own reviewed server procedure. Do not disable the trigger
in a browser path or broaden attendee grants to work around a denial.

Rollback must be deliberate: returning to the old frontend does not require
removing the stronger server checks. If removing this migration, review and drop
only its named trigger/function/policies and review necessary grants explicitly;
never grant blanket writes or drop registration history.

## Verification and limits

Final results: **122 desktop/mobile browser cases, 14 disposable database cases,
26 domain cases and 5 configuration cases passed**. Application/test TypeScript,
the production build with isolated public test values and diff whitespace checks
passed. Lint has 0 errors and 12 existing warnings (5 in active source, 7 in the
pre-existing `.review-stage05` snapshot). See `docs/prompt-history.md` for the
continuation record. Test data is isolated:
browser requests are intercepted against a test-only hostname, and PGlite runs
the migration SQL in disposable PostgreSQL databases. No real accounts or cloud
workshops are created.

Database tests verify anonymous and cross-user denials, eligible registration
and cancellation, duplicate uniqueness, owner/admin reads, unavailable publication
states, invalid legacy schedules, old-transaction clock rejection, timestamp
integrity, preservation of pre-existing history and absence of public trigger
EXECUTE privileges. The existing shared lifecycle matrix tests exact start/end
boundaries. PGlite has one queued connection: overlapping submissions exercise
real uniqueness, but independent-session lock waits are **unverified** here.
No cloud advisors, migration application, cloud policy audit or live authenticated
REST verification was performed. No hosting/deployment behavior was verified.

Commands used from the root:

```powershell
npm.cmd run test:db
npm.cmd run test:domain
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

The browser run uses separately started isolated Vite servers, retaining the
previous stage's Windows shutdown workaround. No dependencies were installed.

## Student review checklist

- Trace one eligible click through `requireUser`, INSERT, RLS, the trigger's
  locked server-clock check, unique constraint and shared refresh.
- Explain why an owner ID in a request is not authorization, why the trigger
  rechecks it, and why a uniqueness error alone cannot prove registration.
- Try an invalid/ended/cancelled workshop through a direct SQL request in a
  disposable database; confirm history and reservation counts do not change.
- Delay a request and click twice; inspect the pending control and single write.
- Fail a mutation and then retry; confirm detail/dashboard/profile agree.
- Fail only the post-success refresh and explain the saved-state warning.
- Sign out during a delayed mutation; confirm private state stays cleared.
- Review the migration separately from frontend changes. Identify its exact
  privilege boundary and explain why independent-session/live checks remain.

No commit or PR links exist for this stage: the user explicitly reserves GitHub
publication until after local review.
