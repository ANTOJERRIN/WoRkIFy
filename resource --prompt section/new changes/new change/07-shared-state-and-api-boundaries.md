# Separate application responsibilities and data state

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

**Architecture modules:** WorkifyContext.tsx → session/catalog/registration/profile/theme hooks or equivalent → typed API modules.

**Run:** After 05 and 06.

## Role

Act as a React/TypeScript engineer making Workify easier to maintain without adding unnecessary infrastructure.

## Architecture-specific refinement

Own shared state decomposition and API consistency. Session-specific lifecycle belongs to 06; do not implement a second auth provider. Catalog, registration, profile and admin operations must retain clear ownership. Consolidate duplicate registration access between workshops.ts and registrations.ts in cooperation with 09. Model async errors explicitly, cancel/ignore stale requests and prevent user-data leakage on identity change. Keep an error boundary/configuration error presentation where appropriate, without concealing operational failures.

## Task

Reduce the responsibilities combined in WorkifyContext.

### 1. Separate responsibilities

Provide clear ownership for:

- Authentication/session and admin permission.
- Workshop listing and refresh.
- User registrations.
- Profile data.
- Theme.
- Modal state.

Use routing for navigation rather than keeping a parallel page-navigation state.

You do not need a separate provider for every value. Choose the simplest organization that prevents unrelated features from being tightly coupled.

### 2. Preserve the data layer

- Keep database calls in the API/data layer.
- Keep database-to-frontend mapping in a consistent location.
- Reuse shared types.
- Replace avoidable broad any types in affected code.
- Avoid duplicating the same query logic across pages.

### 3. Correct asynchronous behavior

- Prevent stale requests from overwriting newer state.
- Clear user-specific data when sessions change or logout occurs.
- Avoid refetch loops caused by unstable dependencies.
- Handle initial loading and refresh loading intentionally.
- Make errors visible where the user can act on them.
- Do not silently represent failed requests as successful empty results.
- Avoid introducing a caching library unless its benefits justify it.

### 4. Profile and registration accuracy

- Ensure the dashboard reads only the current user’s registrations.
- Ensure profile updates refresh the displayed data.
- Handle missing profile records explicitly.
- Avoid fake fallback identity details.
- Keep server permissions authoritative.

### 5. Theme consistency

- Verify that the existing dark-mode toggle matches the CSS framework configuration.
- Confirm the theme changes the actual rendered interface.
- Preserve the user’s preference across reloads if appropriate.
- Keep the current palette and styling.

## Validation

Test:

- Initial load.
- Slow request.
- Failed request and retry.
- Switching sessions.
- Logout.
- Profile update.
- Registration refresh.
- Theme toggle and reload.

## Format

Create a focused pull request with:

1. Responsibility map.
2. Changed modules.
3. Data lifecycle explanation.
4. Tests and results.
5. Any remaining known issue.

Do not merge or deploy.
