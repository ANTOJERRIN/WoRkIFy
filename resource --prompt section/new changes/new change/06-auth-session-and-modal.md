# Authentication/session boundary

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

**Owns:** Authentication/session boundary.

**Architecture modules:** App.tsx; context/WorkifyContext.tsx; components/auth/AuthModal.tsx; components/layout/Navbar.tsx; lib/supabase.ts.

**Run:** After 05; before private feature acceptance checks.

## Role

Act as a senior full-stack engineer and student coding mentor. Implement this function with typed, testable boundaries and explain the code decisions.

## Task

Own session initialization, session change handling, logout, admin-status resolution and the authentication-unavailable dialog. No replacement sign-in method is authorized.

1. Represent session initialization explicitly as loading, authenticated, signed-out or failed. Resolve initialization errors without an endless spinner.
2. Keep public pages independent of session loading or failure. Do not fetch private profile/registration data before identity is established.
3. Keep initial session loading and admin permission loading distinct; deny admin operations until permission is known.
4. Preserve valid sessions. Subscribe/unsubscribe cleanly and avoid duplicate listeners, stale callbacks or updates after unmount.
5. Clear profile, registration, admin and modal state on logout or identity change. Report logout failure honestly.
6. Protected route/action attempts show a dismissible, accessible temporary-authentication message. Public Explore workshops never opens that message.
7. The unavailable dialog supports close, Escape, focus containment, focus restoration and a working public-browsing action.
8. Return destinations must be internal and must not create a redirect loop. Do not auto-retry protected actions without a valid session.
9. Verify whether the cloud Google provider remains enabled separately from removal of the app button; do not change provider settings in this stage.
10. Export a small session/permission interface for features. Keep workshop list state out of this module.

## Acceptance checks

- Public pages with no session, slow initialization and session failure.
- Existing valid and expired sessions.
- Identity change clears all previous-user data.
- Admin status pending, denied and failed.
- Dialog keyboard controls and no residual blurred overlay.
- Logout success and failure; no private content flash.

## Format

First identify the current implementation, confirmed gaps and the smallest change plan; then implement within this scope. Provide:

1. Responsibility and request/data-flow summary.
2. Actual files and important functions changed; distinguish existing names from proposed names.
3. Backend policy/migration impact and deployment steps left pending.
4. Meaningful tests, commands run and results; report skipped checks.
5. A manual student-review checklist and explanation of one normal and one denied/failing request.
6. Focused commit and pull request links. Do not merge or deploy.
