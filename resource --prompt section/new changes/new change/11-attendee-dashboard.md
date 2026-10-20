# Personal attendee dashboard

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

**Owns:** Personal attendee dashboard.

**Architecture modules:** components/dashboard/DashboardPage.tsx; api/registrations.ts; api/links.ts; session/registration hooks.

**Run:** After 06, 08, 09 and 10.

## Role

Act as a senior full-stack engineer and student coding mentor. Implement this function with typed, testable boundaries and explain the code decisions.

## Task

Own the attendee dashboard shown in the architecture. This is a personal registration workspace, not a public workshop listing or a new host portal.

1. Load the signed-in user's real registrations and related safe workshop information.
2. Separate upcoming, ongoing and past registered sessions consistently with lifecycle rules. Handle cancelled and archived history explicitly.
3. Display dates, host, status and a route to workshop details. Reuse shared formatting.
4. Offer cancellation only when permitted by the registration service.
5. Use the meeting service for join eligibility; do not embed meeting URLs in registration queries.
6. Remove LinkedIn-review triggers and score dependencies. Do not replace them with generic fake assessments.
7. Show meaningful loading, empty, error and retry states. A failed query must not appear as zero registrations.
8. Keep registration counts based on actual returned data. Avoid claims of attendance, completion certification or proof of skill based on registration alone.
9. Update after registration changes and clear data immediately on identity change/logout.
10. Keep browser routes and public navigation working. A visitor cannot see cached private data.
11. Confirm mobile readability and keyboard access while preserving the current design.

## Acceptance checks

- Two users cannot see each other's registrations.
- Empty, slow, error and retry behavior.
- Registration/cancellation changes are reflected.
- Schedule/status transitions appear correctly.
- Join controls match the detail page and backend.
- No retired assessment controls or fabricated metrics.

## Format

First identify the current implementation, confirmed gaps and the smallest change plan; then implement within this scope. Provide:

1. Responsibility and request/data-flow summary.
2. Actual files and important functions changed; distinguish existing names from proposed names.
3. Backend policy/migration impact and deployment steps left pending.
4. Meaningful tests, commands run and results; report skipped checks.
5. A manual student-review checklist and explanation of one normal and one denied/failing request.
6. Focused commit and pull request links. Do not merge or deploy.
