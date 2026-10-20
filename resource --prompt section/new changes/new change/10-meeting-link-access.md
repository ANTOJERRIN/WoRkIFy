# Protected external meeting access

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

**Owns:** Protected external meeting access.

**Architecture modules:** api/links.ts; components/workshops/WorkshopDetailPage.tsx; components/dashboard/DashboardPage.tsx; workshop_links policies/functions.

**Run:** After 08 and 09; before final integrated review.

## Role

Act as a senior full-stack engineer and student coding mentor. Implement this function with typed, testable boundaries and explain the code decisions.

## Task

Own retrieval and presentation of protected Google Meet links.

1. Keep meeting URLs out of public workshop descriptions, public responses, metadata, logs and page source for unauthorized visitors.
2. Fetch links only after authentication and eligibility are resolved. Enforce authorization in the database/server.
3. Registered users may retrieve a link only from 15 minutes before a valid start until the workshop end, unless an explicitly documented existing product rule differs. Define inclusive/exclusive boundary behavior.
4. Use server time for access decisions. Browser clock manipulation must not unlock a link.
5. Deny cancelled and archived sessions. Unscheduled or invalid schedules must not create unrestricted access.
6. Explicitly document admin exceptions needed to manage links without exposing them to other users.
7. Return a typed safe state: upcoming, joinable, ended, unavailable or unauthorized. Return a URL only for an authorized joinable response.
8. Share the same join-state rules between detail and dashboard. Avoid duplicate independent implementations.
9. Refresh the join state at meaningful boundaries and clean up timers. Session expiry and transient network failures must be handled.
10. Validate allowed meeting URL format/scheme on the server. Open external links safely.
11. Verify the diagram's edges: links.ts is the meeting-link service; the LinkedIn review edge function belongs to the retired review API. Do not implement a mistaken diagram arrow connecting meeting access to assessment.

## Acceptance checks

- Registered/unregistered/anonymous access.
- Before, at and after window boundaries using controlled server time.
- Ended, cancelled, archived, missing link and unscheduled cases.
- Direct database/API requests cannot bypass timing.
- Admin behavior matches the documented exception.
- No protected URL returned in denied responses.

## Format

First identify the current implementation, confirmed gaps and the smallest change plan; then implement within this scope. Provide:

1. Responsibility and request/data-flow summary.
2. Actual files and important functions changed; distinguish existing names from proposed names.
3. Backend policy/migration impact and deployment steps left pending.
4. Meaningful tests, commands run and results; report skipped checks.
5. A manual student-review checklist and explanation of one normal and one denied/failing request.
6. Focused commit and pull request links. Do not merge or deploy.
