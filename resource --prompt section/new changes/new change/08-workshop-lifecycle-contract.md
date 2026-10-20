# Implement consistent workshop lifecycle and access rules

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

**Architecture modules:** types/index.ts; workshops.ts; workshop queries/status constraints; schedule display helpers.

**Run:** After 03 and 07; before 09, 10 and 13.

## Role

Act as a full-stack engineer implementing workshop lifecycle rules consistently across UI, APIs and database authorization.

## Architecture-specific refinement

Own the single lifecycle/status contract, shared schedule derivation, listing eligibility and compatible schema changes. Specify a state table with publication status, schedule condition, public visibility, registration eligibility, join eligibility and history presentation. Specify valid date ordering and server timestamp behavior. The separate registration service (09) and meeting service (10) implement mutations/access enforcement; define their contracts here, then verify them through those stages instead of duplicating work. Reconcile the earlier archival change from 03. Unknown/invalid schedules must fail safely, and cancelled/archived states override schedule-derived status.

## Task

Workify must distinguish workshop publication status from schedule-based state.

### 1. Define lifecycle behavior

Inspect existing status values and propose a compatible model.

Account for:

- Unscheduled/coming soon.
- Scheduled and open for registration.
- Ongoing.
- Completed.
- Cancelled.
- Archived.

Prefer deriving time-based states from timestamps rather than storing duplicate values that can drift out of sync.

Document how archived/cancelled states override schedule-based presentation.

### 2. Correct public discovery

- Upcoming lists must exclude completed, cancelled and archived workshops.
- Define how ongoing workshops appear.
- Keep unscheduled workshops clearly labelled.
- Sort scheduled workshops predictably.
- Handle missing and invalid dates explicitly.
- Keep search compatible with lifecycle filtering.
- Use consistent timezone formatting.

Do not create fake workshops to populate the page.

### 3. Enforce registration rules

At the backend:

- Require a valid authenticated user.
- Allow users to register only themselves.
- Prevent duplicate registrations.
- Deny registration for ended, cancelled or archived workshops.
- Deny registration where dates/status make it unavailable.
- Define cancellation behavior explicitly.
- Prevent a manipulated frontend from bypassing these rules.

Keep UI button states consistent with backend rules.

### 4. Protect meeting links

- Keep meeting URLs separate from public workshop descriptions.
- Require registration or explicitly authorized admin access.
- If the product rule is access from 15 minutes before start until workshop end, enforce that on the backend.
- Deny meeting access for cancelled or archived workshops.
- Handle unscheduled workshops explicitly.
- Do not rely on the visitor’s browser clock for authorization.
- Provide useful upcoming, joinable, ended and unavailable states.

### 5. Keep history accurate

- Preserve registered workshop history.
- Show ended sessions as completed by schedule, without claiming the user attended.
- Do not equate registration with attendance, certification or assessment success.
- Preserve historical records when workshops are archived.

### 6. Add meaningful tests

Cover:

- Anonymous access denial for private operations.
- Cross-user registration attempts.
- Duplicate registration.
- Ended/cancelled/archived registration denial.
- Meeting access before, during and after the allowed window.
- Registered versus unregistered access.
- Admin behavior.
- Missing schedules.
- Public workshop discovery rules.

Use controlled timestamps so time-window tests are deterministic.

## Format

Create a pull request containing:

1. Lifecycle rules table.
2. Database/API enforcement details.
3. Migration compatibility notes.
4. UI behavior changes.
5. Test cases and results.
6. Any unapplied cloud migrations.

Do not merge or deploy.
