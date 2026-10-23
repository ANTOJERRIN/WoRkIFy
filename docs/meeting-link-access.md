# Prompt 10: protected meeting access

Implemented locally on the reviewed prompt 09 baseline. No commit, GitHub push,
PR, merge, deployment or cloud migration was performed. The user's instruction
to leave GitHub publication to them remains in force.

## Findings and resulting behavior

Previously `links.ts` queried `workshop_links` directly and returned null for
every error. Detail and dashboard separately derived timing from the browser
clock. Existing RLS allowed registered users to retrieve links outside the join
window. The new server endpoint returns a typed safe state; direct table reads
also enforce the window. No insecure fallback to the old endpoint is retained.

The attendee window is **[start − 15 minutes, end)**: opening is inclusive and
end is exclusive. Registration, an open publication and finite ordered dates
are required. Cancelled/archived, unscheduled, invalid, missing, unregistered and
anonymous cases reveal no URL. Registration is not attendance or completion.

Admins retain a management exception: the existing admin service can read/set
canonical links for open or coming-soon workshops outside attendee hours,
including unscheduled coming-soon workshops. Cancelled/archived workshops veto
every client read, including admins, and block link insert/update. Admin deletion
of a link remains available through existing permissions. The attendee RPC gives
admins no special joining exception: it still requires their own registration
and the attendee time window. Admin permission comes from `admin_users`, never
user-editable metadata.

## Responsibilities and request flow

| File | Change |
| --- | --- |
| `src/api/links.ts` | Replaces null-on-error `getWorkshopMeetUrl` and browser-derived `getJoinState` with `getWorkshopMeetingAccess`; verifies identity and calls the server RPC with only a workshop ID |
| `src/domain/meetingAccess.ts` | New discriminated `MeetingAccess` union, strict safe-response decoder and canonical Google Meet URL allowlist |
| `src/hooks/useMeetingAccess.ts` | New request/timer owner: timeout, stale-response cancellation, bounded leases, focus/visibility rechecks and retry |
| `src/components/workshops/MeetingAccessControl.tsx` | New shared detail/dashboard presentation for loading, upcoming, joinable, ended, unauthorized, unavailable and network-error states |
| `src/components/workshops/WorkshopDetailPage.tsx` | Consumes shared control; removes its independent link fetch/state |
| `src/components/dashboard/DashboardPage.tsx` | Consumes shared control; removes its independent link fetch/state |
| `src/api/admin.ts` | Validates canonical link format before writes and refuses unsafe returned URLs |
| `backend/supabase/migrations/20261022172429_meeting_link_access.sql` | New unapplied migration: restrictive policies, legacy-compatible checks, private server clock and invoker RPC |
| `tests/database/meeting-access.test.mjs` | Disposable SQL boundary, ownership, direct-request, management, validation, legacy and integration checks |
| `tests/domain/meeting-access.test.ts` | URL/response validation and denial-response redaction checks |
| `tests/browser/meeting-access.spec.ts` | Desktop/mobile server states, private URL handling, clock manipulation, lease expiry, failures, retry, session expiry and stale-response checks |

The existing lifecycle browser test now mocks the typed server endpoint, not
an unrestricted direct table read. The session fixture supplies a safe unavailable
default. The public/private/admin SQL suite uses a canonical fixture URL and
checks an upcoming registration denial when the new RPC exists; its earlier-stage
baseline assertions are retained for fixtures running only older migrations.

A normal request begins only after identity and registration loading resolve.
The shared control verifies the known registration, publication and schedule
shape; it does not use browser time to authorize access. The API verifies the
current SDK user, then calls `get_workshop_join_state(p_workshop_id)` with no
submitted user ID or time. The invoker-rights function checks `auth.uid()` and
the caller's reservation, reads safe workshop metadata, samples the server clock
and reads the link under RLS. It returns `meet_url` only in a joinable response.
The client revalidates that response and renders an external link with
`noopener noreferrer` and `no-referrer`.

For an unregistered/direct caller, the endpoint returns unauthorized without a
URL. For a registered caller before opening, it returns upcoming plus a bounded
recheck interval. A direct `workshop_links` query before opening returns no rows
even if the caller changes their browser clock or bypasses React entirely.
Expired sessions return unauthorized; request/transport errors show a retry
instead of becoming an apparently missing link. Raw server error text and
details never enter this UI or its logs.

## Backend boundaries and data preservation

The new RPC is `SECURITY INVOKER` with an empty fixed search path; it has EXECUTE
only for authenticated callers. There is no new security-definer function.
Restrictive policies add vetoes alongside existing owner/admin policies rather
than broadening ordinary read access. The existing archival veto is retained.

The private `meeting_access_now()` takes no arguments and always calls
`clock_timestamp()` in production. Unlike a transaction-start timestamp, it
does not freeze time for a long transaction. RPC time is sampled after metadata
reads and again after the protected link read. Direct table policies use the
same server-clock helper. Two existing pure schedule/join predicates receive
authenticated EXECUTE so the invoker RPC can use the 08 contract. These pure
helpers expose no table data; their optional test clock is never accepted by
the public authorization RPC. Private trigger privileges remain revoked.

Meeting URLs accept only `https://meet.google.com/abc-defg-hij`-shaped lowercase
codes. HTTP, other hosts, credentials, ports, lookup links, query parameters,
fragments and JavaScript URLs are rejected. An empty value clears a link. The
database enforces this for direct writes; the client check improves feedback.

Both URL and public-metadata checks are **NOT VALID** to preserve legacy rows.
Unsafe legacy link values are hidden, never returned as joinable. A restrictive
workshop SELECT policy hides legacy metadata containing a `meet.google.com`
address in any public text field or tags; a constraint prevents new/updated
metadata from becoming a second link channel. Those rows require deliberate
correction before constraint validation. No metadata, links, registration,
attendance or retired review history was rewritten or deleted.

The policy/function approach follows [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
and [database-function privileges](https://supabase.com/docs/guides/database/functions).

## Refresh and expiry

The server response grants at most a 30-second client lease, shortened to the
next opening/end boundary. The hook subtracts the full request elapsed time using
`performance.now()`. Moving the browser wall clock cannot extend a lease or turn
an upcoming response into a URL. A response arriving after its lease is not shown.

At renewal the old URL is removed before the request starts; failure cannot keep
an expired URL alive. Requests time out after 15 seconds. Identity, registration
or schedule changes invalidate the keyed result immediately; cleanup aborts old
requests and clears timers. Focus/visibility changes trigger a fresh check;
hidden pages clear cached URLs. Every response is checked against its request
version to prevent late previous-account results from restoring private data.

Remote status changes become visible on the next bounded recheck, or sooner on
shared-data refresh/focus. A URL already disclosed to an authorized user cannot
be retracted from their knowledge; this service gates retrieval, not Google
Meet's external admission controls. Dashboard history still uses the shared 08
presentation contract; browser-time history labels never authorize retrieval.

## Diagram and scope

Verified source edges are detail/dashboard → shared meeting control/hook →
`api/links.ts` → Supabase RPC/RLS → `workshop_links`. No meeting path calls an
assessment or LinkedIn review function. That API/edge-function branch remains
retired. No diagram asset was available in this checkout for a fresh visual
comparison; these edges were checked in actual source. Authentication replacement
and the stage 11 dashboard redesign remain outside this stage.

## Validation and pending release work

Final results: **140 desktop/mobile browser cases, 21 disposable database cases,
29 domain cases and 5 configuration cases passed**. Application/test TypeScript,
the production build with isolated public configuration and diff whitespace
checks passed. Lint has 0 errors and 12 existing warnings (5 active-source,
7 in `.review-stage05`). Details are recorded in `docs/prompt-history.md`. Browser traffic
is intercepted against the isolated test hostname, and database tests run actual
migration SQL in disposable PGlite databases. Only those disposable tests replace
the private clock helper with controlled server time. No deployed clock hook or
caller-controlled timestamp setting is introduced.

Tests check exact opening/start/end instants, anonymous/unregistered denials,
direct table reads, admin exceptions/vetoes, invalid legacy schedules, missing/
empty links, unsafe URL rejection, public metadata protection and old-row
preservation. Browser checks cover both consumers, altered client clocks, cached
URL removal before delayed renewal, session expiry, timeout, manual retry and
sign-out during delayed retrieval. Domain decoding discards URL fields in all
denied states, even if an invalid response includes one.

Commands from the root:

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

Release steps remain pending:

1. Verify intended project identity, effective schema/history, roles, policies,
   grants, functions and any views that might bypass RLS. Account for previously
   diagnosed drift; do not replay original schema/seeds blindly.
2. Audit legacy URLs/public metadata and schedules, correct deliberately using
   reviewed privileged SQL where restrictive policies hide unsafe legacy rows, review
   dependencies and apply the registration/meeting sources in order. Validate
   NOT VALID constraints only after remediation. Run security advisors.
3. Verify real authenticated/anonymous/admin REST requests and deployed server
   time boundaries. Independent PostgreSQL connection races and live behavior
   remain unverified; PGlite has one queued connection.
4. Deploy frontend only after the backend endpoint/policies are verified, then
   check the real hosted detail/dashboard journey. No deployment is done here.

Rollback requires explicit dependency/grant review; retaining stronger server
policies during a frontend rollback is preferable to restoring unrestricted link
reads. Do not drop historical data or relax RLS as a rollback shortcut.

## Student review checklist

- Trace a registered user's request through identity verification, server time,
  owner registration, restrictive RLS, safe decoding and rendered link.
- Query the table directly before opening and at exact end; explain why changing
  client time or submitting an extra timestamp cannot help.
- Explain the admin management exception and why archived/cancelled vetoes win.
- Delay renewal beyond the current lease and confirm the old URL disappears.
- Fail the request, retry and sign out during a pending request; inspect the UI
  and verify no stale URL returns.
- Review canonical URL validation and legacy metadata handling separately from
  migration application. Explain which live checks remain unperformed.

There are no commit/PR links: GitHub publication remains reserved for the user.
