# Login and admin implementation — 3 November 2026

## Changes

The repository head had root wrappers importing a deleted `frontend/src` tree.
Its architecture documentation described moved files that were missing from Git.
The working modules were recovered from commit `5b12acc` into root `src`, and the
canonical entry/configuration/style boundaries were repaired. Retired LinkedIn
review UI/API/types were removed during recovery; historical SQL/data remain.

Authentication now has an independent AuthProvider. Identity is checked with
Supabase `getUser`; admin membership is separately read under RLS. Session events
revoke UI privileges before deferred identity/role work, request generations
ignore stale results, and requests are bounded. Logout failures remain visible.
Public catalog reads use a distinct nonpersistent anonymous client.

A direct `/login` page and an accessible action dialog share one AuthForm. The
form supports email/password login, account creation, confirmation, password reset
and recovery. Name metadata is display-only. No role selector, first-user admin
assignment, social login or service key is included. Forms preserve input after
failure, prevent duplicate submissions and support password visibility.

Native History API routes preserve refresh and Back/Forward behavior. Protected
URLs render login inline until signed in; a permission lookup failure fails closed.
Workshop links use the workshop URL instead of copying arbitrary query credentials.

The admin console creates/edits workshops, schedules in explicit IST, cancels or
archives without deleting history, saves/removes validated private Meet links,
and lists registrations. Public/member UI has no workshop publishing controls.
API writes recheck membership; database RLS remains the security boundary.

## Owner and cloud state

- Repository: ANTOJERRIN/WoRkIFy; branch: codex/login-owner-workshops.
- Cloud connection and verified owner assignment remain pending.
- No cloud SQL, migration, provider change, account or admin assignment was made.
- Confirm the owner’s verified Supabase Auth UUID before granting membership.

## Database contract and pending release

The CLI generated `20261103015917_owner_workshop_access.sql`. A constant unique
index allows at most one admin; client mutation privileges on admin_users are
revoked. The membership SELECT policy reads only the caller's own row.
`is_admin` uses invoker security, avoiding role-policy recursion and privileged
public RPCs. Signup never modifies roles. Existing multiple admins cause a clear
migration failure without removing anyone.

Workshop insert/update is admin-only. Workshop deletion is disallowed so history
survives. Schedule, slug, text, tag, timezone and Meet URL validations are enforced
in PostgreSQL as well as forms. NOT VALID constraints avoid rejecting historical
rows at migration application, but apply to future inserts and updates.

This migration assumes the existing canonical tables/functions. The project was
previously documented with schema/history drift, so inspect actual remote schema
and advisors before applying. Do not blindly replay the baseline or all migrations.
No new persistent demo workshops are included. Owner assignment is a trusted
server operation using a verified user ID, illustrated in `owner-setup.sql`.

The database lets registered attendees read valid links for open scheduled
workshops; the UI enables joining around the session time. It does not claim
that registration proves attendance/completion or that the link is a certificate.

## Live setup still required

1. Make the confirmed existing backend available and verify project identity.
2. Inspect its tables, policies, migration history, current admins and auth users.
   Review/apply the targeted access migration after reconciling drift.
3. Configure the project's publishable key locally and in the hosting build.
4. Check email/password provider, email confirmation/delivery and origin-specific
   `/login` redirect allowlist. Complete actual confirmation/recovery emails.
5. Confirm the owner email/verified Auth UUID and provision the single role.
6. Run advisors and live anonymous/member/admin denial checks. Deploy only when
   separately requested, with the correct static-host SPA fallback.

## Local validation

Configuration/domain checks and disposable PostgreSQL authorization checks cover
secret rejection, malformed schedules/URLs, IST conversion, sole ownership,
member/anonymous write denial, private links and preserved registration history.
Browser fixtures cover public browsing, dialog keyboard controls, login/signup/
reset, role loading/failure, metadata escalation denial, protected routes and
admin operations on desktop/mobile. Final command results are recorded in the PR.
These are local tests; real email and cloud behavior remain unverified.

## Handoff

This change delivers the code. Backend availability, live configuration and owner
assignment will be completed separately.

## Final local results

- Production build/type-check passed with isolated public test configuration.
- 38 Playwright checks passed across desktop/mobile Edge layouts.
- Five configuration/domain checks and three disposable PostgreSQL checks passed.
- Lint exited successfully with 16 warnings and no errors.
- Production dependency audit reported zero vulnerabilities.
- Login desktop/mobile screenshots were inspected; Git whitespace checks passed.
- Cloud migration, owner assignment, real email delivery and deployment remain pending.
