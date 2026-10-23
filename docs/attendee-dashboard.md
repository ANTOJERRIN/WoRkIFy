# Prompt 11: personal attendee dashboard

Implemented locally on 23 October 2026, continuing the existing prompt 01–10
working tree. The active prompt is
`resource --prompt section/new changes/new change/11-attendee-dashboard.md`.
The user will review and push the work. No commit, push, PR, merge, deployment,
cloud configuration change or migration application was performed in this stage.

## Existing baseline and focused changes

Earlier stages already supplied the identity-scoped registration snapshot,
loading/error/refresh states, mutation reconciliation, shared schedule formatter,
and server-authoritative meeting access. This stage consumes those services;
it does not add another registration query, meeting implementation or session store.

`src/components/dashboard/DashboardPage.tsx` now:

- Groups registrations into ongoing, upcoming, past/closed, and invalid-schedule
  sections using `workshopLifecycle` and the existing one-second workshop clock.
  Coming-soon and unscheduled reservations stay upcoming; cancelled and archived
  reservations remain history regardless of their dates. Invalid schedules do
  not silently become past sessions.
- Sorts upcoming sessions by start, with unscheduled sessions last. History uses
  descending start times. Registration IDs break equal-time ties deterministically.
  Sorting uses new section arrays and does not mutate the shared snapshot.
- Shows the host, shared timezone-aware date range and lifecycle status.
  History explicitly explains that registration does not confirm attendance or
  completion. No assessment, certificate, score or fabricated metric is added.
- Makes title navigation a native keyboard-accessible button inside its heading.
  Cards are named articles; groups are labelled sections. Cancellation controls
  identify their workshop for assistive technology and retain the shared pending
  guard. Refresh is disabled during the initial load as well as a refresh.

Counts continue to use actual returned registration rows, including reservations
whose joined workshop metadata is unavailable. Group counts describe the cards
that can be displayed; the existing unavailable-details notice explains any
difference from the overall count. Read failures show an error and retry, never
an empty-account success. A background refresh retains the previous snapshot
until it succeeds or reports an error.

`tests/browser/dashboard.spec.ts` adds desktop/mobile coverage for grouping,
schedule ordering, host/count presentation, missing metadata, closed-history
restrictions, horizontal overflow, time transitions, keyboard detail navigation
with browser back, and loaded dashboard isolation across account switch/logout.
`tests/browser/shared-state.spec.ts` updates two selectors for the more explicit
cancellation accessible name; its denied/successful cancellation assertions remain.

## Responsibility and data flow

1. The route guard checks session state before rendering the dashboard.
2. `WorkifyContext` supplies `useRegistrations`' single owner-scoped snapshot.
   The existing `listUserRegistrations` verifies the current user and filters
   `user_id`; the database's ownership policies remain authoritative.
3. The joined workshop projection uses `PUBLIC_WORKSHOP_FIELDS`. It contains no
   meeting URL or assessment data. The dashboard derives presentation groups
   from that safe metadata and the shared lifecycle contract.
4. Cancellation delegates to `unregisterFromWorkshop`, then the registration API
   and server enforcement from prompt 09. The hook reconciles registration and
   catalog data after success or failure. The UI removes no reservation merely
   because a click occurred.
5. `MeetingAccessControl` uses prompt 10's service and safe response states.
   Server identity, ownership, publication and server time decide access. Closed
   history renders no join control. Registration queries never carry meeting URLs.
6. The identity-keyed private provider remounts when the account changes, aborting
   old requests and clearing the previous snapshot. Logout removes protected UI.

The browser clock controls grouping and cancellation presentation only. It cannot
grant meeting access or authorize a mutation.

## Backend and release status

No new migration, policy, dependency or lockfile change is needed for prompt 11.
The earlier public-read, archival, lifecycle, registration and meeting migrations
retain their previously documented unapplied status. Review cloud schema/history
drift and each prior stage's deployment notes before applying anything. These
browser tests use intercepted traffic, not real cloud accounts or real workshop
registrations. Live REST behavior, cloud configuration and production ownership
checks were not verified in this stage. No database test was rerun because this
stage changes only dashboard presentation and its browser coverage.

Google sign-in remains removed. A replacement login method remains a separate
decision; legitimate existing sessions can use the protected workspace. No test
session helper is imported by the production entry.

## Student review

- Open the diff for the dashboard and distinguish this stage's grouping, host,
  status and accessibility changes from the earlier uncommitted service changes.
- With an existing authorized account in a configured review environment, compare
  the overall count with actual reservations, including missing workshop metadata.
  Inspect an upcoming, ongoing, completed, cancelled and archived reservation.
- Tab to a title and press Enter; open details and use browser Back. Check a
  narrow viewport and a long workshop title/host in light and dark themes.
- Refresh a slow query: keep existing cards visible with a refresh notice. Deny
  the read: verify an error and retry rather than a zero-registration claim.
- Cancel a permitted future reservation: the hook waits for the service result,
  reloads shared data, and updates both dashboard and profile. A server denial
  produces the existing account error feedback and reconciles the saved state.
- Switch accounts or sign out while viewing the dashboard. Confirm that neither
  old cards nor a delayed old-account meeting response survives the identity change.
- Explain the normal path: title/button → detail route, or cancellation → shared
  hook → API → server authorization → shared refresh. Explain the denied path:
  a workshop starts before cancellation reaches the server, so the server rejects
  it even if the browser had previously displayed Cancel.

Validation commands and final results for this continuation are recorded in
`docs/prompt-history.md`. Prompt 12 (profile editor/avatar) is next in the
one-stage-at-a-time sequence; prompts 12–14 remain pending.
