# Prompt 13: admin workshops and contact-first hosting

Implemented locally on 23 October 2026 above the saved prompt 01–12 working tree.
No commit, push, PR, merge, deployment, live migration or cloud configuration
change was performed. The user reviews and pushes the accumulated local changes.

## Confirmed baseline gaps

The old admin page consumed the public catalog, whose query excludes archived
workshops. It could therefore not provide a complete management/history list.
Cancellation and meeting saves did not confirm affected rows; some errors used
browser alerts and a failed refresh could obscure whether a save succeeded.
The editor lacked its own timezone field and complete metadata validation.
Private details were loaded together even when not requested. The host dialog
contained the locally edited phone number while site configuration contained a
different old number, and the footer linked directly to a placeholder F1 Forge URL.

The existing authoritative `admin_users` role source, route guard, publication
contract, registration service, server-enforced meeting rules, original palette
and signed-in contact-host boundary remain the foundations of this stage.

## Files and responsibilities

| File | Responsibility |
| --- | --- |
| `src/api/admin.ts` | Verified identity/membership before private reads or writes; explicit projections; confirmed create/update/status/Meet results; abortable, bounded requests |
| `src/components/admin/AdminPage.tsx` | Separate admin list, selected-workshop private details, accessible editor, pending/save/error/refresh feedback and status-only cancel/archive actions |
| `src/domain/workshopInput.ts` | Normalized slug/text/tags and shared input validation; exact retired workshop ID |
| `src/domain/siteContacts.ts`, `src/config/site.ts` | Validated optional public destinations; preserves the local host-dialog phone default |
| `src/components/workshops/HostWorkshopModal.tsx` | Signed-in contact-only dialog using shared configuration |
| `src/components/layout/Footer.tsx`, `src/components/landing/F1ForgeSection.tsx` | Render only configured, parsed HTTPS F1 Forge links; otherwise plain brand text |
| `.env.example`, `src/vite-env.d.ts` | Optional public phone/F1 Forge configuration |
| `backend/supabase/migrations/20261023081331_admin_workshop_contract.sql` | Unapplied validation, admin-only mutation privileges, immutable meeting identity and history-preserving deletion restrictions |
| `tests/domain/workshop-input.test.ts` | Input/timezone/schedule/metadata and destination validation |
| `tests/database/admin.test.mjs` | Disposable real SQL authorization, creation/public reads, validation, archival/history and Meet policy checks |
| `tests/browser/admin-hosting.spec.ts` | Desktop/mobile administration, public refresh, errors/retries, host contact and private-data isolation |

## Request and state flow

1. The existing route guard waits for session and permission resolution. Permission
   comes from `admin_users` under RLS, never profile or editable auth metadata.
2. `listAdminWorkshops` loads a separate identity-scoped management list using the
   explicit safe workshop projection. Unlike the public catalog, it does not
   exclude archived records. No attendee contacts or meeting URL is part of it.
3. The workshop picker derives a valid selection from that list. A keyed private
   detail component loads only the requested tab: protected meeting management,
   or registrations plus authorized attendee profiles. Changing workshop, tab,
   status or identity discards the prior private component and aborts old work.
4. The form validates and normalizes metadata before calling the API. Every API
   action rechecks the expected account and authoritative membership; database
   policies remain the final authority if permission changes during a request.
5. Create, edit, cancel/archive and Meet upsert request the resulting record.
   A missing/wrong-ID result or mismatched status/Meet value is unconfirmed,
   never success. Slug uniqueness has specific retry feedback. Forms keep drafts
   after a denied, duplicate or uncertain save.
6. One shared mutation owner blocks repeated operations, disables competing
   controls and owns a 15-second mutation budget. On success it refreshes the
   admin list and shared public catalog. A confirmed save followed by a failed
   refresh is explicitly reported as saved with stale lists. On failure it also
   reconciles lists because a timed-out request might have committed.
7. Logout/unmount aborts the current request, clears the identity-scoped feature
   tree and suppresses old responses/callbacks. Browser role visibility alone
   never authorizes an operation.

Admin list/details use the existing `useResource` loading, error, timeout, refresh
and retry handling. A failed attendee read does not become zero registrations.
Closed publications display no meeting field, and prior private values are not
carried into another selected workshop. Missing attendee profiles are labelled
unavailable rather than given an invented identity; legacy unsafe contact links
are filtered before rendering.

## Input and lifecycle contract

- Slugs: 3–80 lowercase letters/numbers, separated by single hyphens; database
  uniqueness resolves competing submissions. Title: required, at most 160;
  host: required, at most 100.
- Descriptions: at most 500/12000 characters for short/full text. Up to 10 tags,
  each 40 characters. Public text cannot contain Google Meet addresses.
- UTC inputs are instants; the separate IANA display timezone determines attendee
  formatting. UI validates through Intl; the backend checks its timezone catalog.
  Browser and database timezone catalogs can differ, so server validation remains
  authoritative. Open publications require a valid ordered start/end; Coming Soon
  can be unscheduled. The existing lifecycle constraint enforces this in SQL.
- Cancel and Archive update status only. There is no workshop DELETE operation.
  Registrations and historical review rows are not deleted. General archived
  workshops remain in the management picker and can be inspected or corrected.
- The exact previously verified retired LinkedIn workshop must remain archived.
  Its form status is locked and API/server writes reject reactivation. No review
  tabs, reset controls, new assessments or fake completion claims were added.
- Meet addresses retain prompt 10's canonical Google Meet format and active
  publication vetoes. Empty saves clear the private address. Admin management
  outside attendee join windows remains restricted to open/coming-soon records;
  cancelled/archived vetoes still win.

## Unapplied migration and release checks

The installed CLI created `20261023081331_admin_workshop_contract.sql` locally.
It requires the earlier archival, lifecycle, registration and meeting contracts.
It adds restrictive admin checks to workshop/link INSERT/UPDATE and limits
workshop writes to editable columns. Client hard-delete/truncate and membership
writes are revoked. Workshop IDs/timestamps are not client-editable.

Meet upserts include the conflict key in their UPDATE projection, so that column
is granted for this operation while an invoker trigger rejects actually changing
its identity. A second invoker trigger with fixed search path validates workshop
metadata. Neither trigger is an executable public RPC or security-definer bypass.
Status-only closure may retain legacy metadata; existing lifecycle and public
description constraints still independently apply. No workshop/history rows are
rewritten or deleted by the migration.

Before any release, inspect actual schema/history/column-grant/policy drift,
check the migration dependencies and verify the intended project. Do not replay
the original schema/seeds or run a blanket migration push. Legacy public text
containing meeting addresses remains hidden by prompt 10's restrictive policy,
including for admins; correcting those hidden legacy records may require a
separately reviewed server-side repair. Run cloud advisors and actual REST checks
with two legitimate accounts, an admin and an anonymous visitor after the approved
migrations. Independent-connection races, cloud settings and deployed behavior
remain unverified here.

Implementation references: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
and [returned update rows](https://supabase.com/docs/reference/javascript/update).

## Host and partner destinations

Hosting remains signed-in and contact-first. No public publishing, host-role
accounts, payment flow or outbound message was introduced. The existing local
dialog's `9566298639` is preserved as the default; the unused old configuration
number is removed. `VITE_HOST_CONTACT_NUMBER` can override it. An explicitly
empty or invalid number shows unavailable contact text instead of a broken tel
link. This is public contact configuration, not a secret.

`VITE_F1FORGE_URL` accepts only an actual parsed HTTPS URL without credentials.
It defaults to empty. The footer and landing section then show F1 Forge as text,
with no clickable placeholder or invented website. Setting a valid destination
enables their links after restarting/rebuilding the frontend. The actual external
destination was not provided or independently verified in this stage.

## Student review

- Inspect the local diff alongside earlier uncommitted stages. No PR/commit link
  exists for this stage because the user will review and push the work.
- Normal path: authorized Create → normalized metadata → API identity/membership
  checks → RLS/validation/unique constraint → returned row → admin/public refresh.
  With an isolated fixture, confirm a future open workshop appears in discovery.
- Denied path: bypass the form and POST/PATCH as a non-admin, even with admin-like
  editable metadata. The restrictive policy rejects the write. A revoked admin
  gets no confirmed success from an empty affected-row response.
- Edit schedule in UTC and its display timezone separately. Try invalid slug,
  reversed/partial schedule, unknown timezone, overlong description and a duplicate
  slug. Confirm no lost draft and an honest failure state.
- Cancel/archive a registered workshop: keep the registration/history, close
  meeting management, remove archived sessions from public discovery, and retain
  the archived record in the admin picker. Confirm hard-delete is unavailable.
- Save/replace/clear a canonical Meet URL. Try unsafe addresses and a closed
  publication. Confirm addresses never appear in public workshop payloads.
- Deny a private attendee read, then retry. Switch workshop and sign out while a
  private request is delayed. No stale contact/link data may appear afterward.
- Open the host dialog with a legitimate session, check the configured tel target,
  press Escape and check focus restoration. Check mobile and both themes. Leave
  the partner URL unconfigured: no FILL link or visit button should be clickable.

Commands and final validation results are recorded in `docs/prompt-history.md`.
Prompt 14, integration review and release planning, remains next. Nothing in this
stage applies a live migration or authorizes deployment automatically.
