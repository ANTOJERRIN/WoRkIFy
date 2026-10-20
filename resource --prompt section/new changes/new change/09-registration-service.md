# Workshop registration and cancellation

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

**Owns:** Workshop registration and cancellation.

**Architecture modules:** api/registrations.ts; api/workshops.ts; components/workshops/WorkshopDetailPage.tsx; context/WorkifyContext.tsx or its replacement; database registration policies.

**Run:** After 08 lifecycle contract; before 11 dashboard.

## Role

Act as a senior full-stack engineer and student coding mentor. Implement this function with typed, testable boundaries and explain the code decisions.

## Task

Own registration mutations and current-user registration queries. Make one authoritative registration data module: current code has registration behavior spread between workshops.ts and registrations.ts.

1. Define typed operations such as listMyRegistrations, registerForWorkshop and cancelMyRegistration; adapt names to project conventions.
2. The server derives or validates the user identity. Never trust a submitted user_id without ownership checks.
3. Enforce lifecycle eligibility using the schedule/status contract from 08. Anonymous, cross-user, cancelled, archived and ended registrations must be denied.
4. Preserve database uniqueness for a user/workshop pair. Handle simultaneous duplicate attempts safely.
5. Define cancellation availability explicitly. Keep an existing product rule if documented; otherwise explain a reasonable rule, including history consequences, before implementation.
6. Avoid accidental loss of attendance/history data. Registration and actual attendance are different facts.
7. Disable duplicate clicks while a mutation is pending; update visible state only after success or roll back optimistic changes.
8. Show actionable errors and handle session expiry. Refetch/invalidate the affected workshop and dashboard data after a successful mutation.
9. Queries must return only the current user's registrations, except explicitly authorized admin queries.
10. Keep RLS and backend checks effective for direct API requests, not just component guards.

## Acceptance checks

- Anonymous and cross-user requests denied.
- Valid registration and cancellation.
- Duplicate and concurrent duplicate registration.
- Ended/cancelled/archived eligibility and schedule boundaries.
- Failed mutations leave correct UI state.
- Dashboard and detail state agree after mutation.

## Format

First identify the current implementation, confirmed gaps and the smallest change plan; then implement within this scope. Provide:

1. Responsibility and request/data-flow summary.
2. Actual files and important functions changed; distinguish existing names from proposed names.
3. Backend policy/migration impact and deployment steps left pending.
4. Meaningful tests, commands run and results; report skipped checks.
5. A manual student-review checklist and explanation of one normal and one denied/failing request.
6. Focused commit and pull request links. Do not merge or deploy.
