# Admin workshop operations and contact-first hosting

## Architecture contract and working rules

- Repository: `ANTOJERRIN/WoRkIFy`. RTF = Role, Task, Format.
- Reference: the supplied `diagram.png` maps routing/layout, shared state, feature pages, API modules, the Supabase client, database and review function. Treat it as a map to validate against current code, not evidence that every arrow is correct.
- Preserve the restored blue/violet UI, mobile layouts and useful existing behavior. This is functional repair and structural improvement, not a visual redesign.
- Public: landing, workshop discovery and safe workshop details. Protected: personal data, registration, meeting links, administration. Hosting remains contact-first and admin-controlled.
- Google sign-in remains removed. Do not select or implement a replacement method, fake authentication or privileged anonymous access.
- Retire the completed LinkedIn workshop and its specialized review experience; preserve historical data and ordinary LinkedIn contact links.
- Keep feature pages dependent on typed API modules; keep database calls in the data layer. Server authorization remains authoritative.
- Recheck the current branch and approved prior-stage outputs. The filenames below refer to the reviewed architecture; follow renamed equivalents after consolidation.
- Make focused commits and a reviewable pull request. No merging, deployment, destructive cleanup, new paid services or invented sample workshops.
- Report separately: code implemented, tests run, migrations applied, cloud configuration verified, and live behavior verified. Do not claim any unperformed check passed.

## Scope and dependency

**Owns:** Admin workshop operations and contact-first hosting.

**Architecture modules:** components/admin/AdminPage.tsx; components/workshops/HostWorkshopModal.tsx; api/admin.ts; config/site.ts; admin_users/workshops/workshop_links policies.

**Run:** After 06, 08, 09 and 10.

## Role

Act as a senior full-stack engineer and student coding mentor. Implement this function with typed, testable boundaries and explain the code decisions.

## Task

Own workshop administration and the existing host-contact entry point.

1. Keep the host flow contact-first. Do not add public self-service publishing, new host accounts or a payments system.
2. Preserve the existing signed-in hosting access boundary unless a product decision explicitly changes it. Public visitors may still browse workshops.
3. Admin permission must come from an authoritative server-controlled role source. User-editable profile/auth metadata must never grant access.
4. Allow authorized admins to create/edit/schedule/cancel/archive workshops, manage protected Meet links and view registrations where permitted.
5. Validate slug uniqueness, required title/host, descriptions/tags, timezone and valid start/end order on the backend and in forms.
6. Use 08's lifecycle contract and 10's meeting-link rules. Do not invent conflicting status meanings.
7. Publish/list only the intended safe fields. Protect attendee contact details and meeting URLs.
8. Preserve history when archiving; avoid destructive workshop deletion with related registrations.
9. Remove retired review administration/reset controls without deleting historical review records.
10. Every save must show pending, success and failure states accurately. Refresh the affected public listing after successful admin operations.
11. Keep F1 Forge's actual destination configurable. A placeholder must not become a clickable broken link.
12. Verify a valid admin-created scheduled workshop can appear in public browsing after the required cloud changes. Use an isolated test database/transaction fixture, not persistent fake production workshops.

## Acceptance checks

- Anonymous/non-admin direct mutation attempts denied.
- Admin create/edit/archive and link updates.
- Duplicate slug and invalid schedules.
- Public listing reflects an eligible created workshop.
- Historical registrations remain after archive.
- Host contact action resolves and no new self-service publishing is introduced.

## Format

First identify the current implementation, confirmed gaps and the smallest change plan; then implement within this scope. Provide:

1. Responsibility and request/data-flow summary.
2. Actual files and important functions changed; distinguish existing names from proposed names.
3. Backend policy/migration impact and deployment steps left pending.
4. Meaningful tests, commands run and results; report skipped checks.
5. A manual student-review checklist and explanation of one normal and one denied/failing request.
6. Focused commit and pull request links. Do not merge or deploy.
