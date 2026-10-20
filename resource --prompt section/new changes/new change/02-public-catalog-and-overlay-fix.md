# Make public workshop browsing reliable

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

**Architecture modules:** LandingPage/HeroSection/Navbar → WorkshopsPage/WorkshopDetailPage → workshops.ts → safe workshops data.

**Run:** After 01.

## Role

Act as a senior React/TypeScript and Supabase engineer implementing the smallest complete correction for Workify’s public browsing flow.

Use the preceding diagnostic findings. Recheck the current branch before editing.

## Architecture-specific refinement

Own the immediate public-access regression only. Do not redesign the whole app or introduce routing/state refactors here. Define the safe catalog response fields explicitly; private meeting URLs and attendee information must never be part of it. Keep public browsing responsive while session resolution fails. Record a failing public-navigation case before the fix, then verify the corrected behavior. Lifecycle implementation will be centralized in 08; consume that contract when it is available.

## Task

Visitors must be able to open the landing page, browse workshops and read public workshop details without signing in.

Preserve the restored blue/violet frontend style.

### 1. Correct public entry points

- Make every Explore workshops/Browse workshops action navigate directly to the public listing.
- Ensure workshop cards open their public detail pages.
- Remove unintended authentication checks from those actions.
- Keep public browsing available when there is no authenticated session.
- Close any authentication-unavailable modal when its Explore workshops action is used.
- Prevent stale overlays from remaining after navigation or logout.

### 2. Correct modal behavior

- Render the backdrop only while its associated modal is open.
- Support the close button and Escape key.
- Move keyboard focus into an open dialog and restore it appropriately on close.
- Prevent keyboard focus from moving behind a modal.
- Preserve existing mobile layouts.
- Show the authentication-unavailable message only when a protected action is attempted.
- Explain that browsing remains available.
- Do not show a sign-in button that cannot lead to a working authentication method.

### 3. Correct database-backed browsing

- Use the real workshop API and database.
- Verify the required anonymous SELECT grant and workshop RLS policy.
- If the policy is missing, create the appropriate version-controlled migration.
- Keep meeting URLs and personal records outside public workshop responses.
- Do not grant anonymous access to profiles, registrations, reviews, admin records or meeting links.
- If a cloud change cannot be applied, provide the exact unapplied migration and state that deployed browsing remains unverified.

### 4. Implement honest UI states

Handle these separately:

- Initial loading.
- Successful listing with workshops.
- Successful listing with zero upcoming workshops.
- Search returning no matches.
- Network/database failure.
- Requested workshop not found.

Use appropriate messages:

- Empty upcoming list: “No upcoming workshops yet.”
- No search results: “No workshops match your search.”
- Loading failure: a concise error with a working retry action.

Do not turn errors into empty arrays that falsely suggest no workshops exist.

### 5. Preserve protected operations

Anonymous visitors must not be able to:

- Register or unregister.
- Open another user’s private information.
- Edit a profile.
- Access the personal dashboard or admin area.
- Retrieve protected meeting links.
- Create or manage workshops.

Enforce access at the backend as well as the UI.

## Validation

- Test public browsing with no existing session.
- Test navigation from every public CTA.
- Confirm no authentication dialog appears during ordinary browsing.
- Test modal dismissal and focus behavior.
- Test empty, error and successful data states.
- Test retry.
- Test that protected operations remain denied.
- Run the production build and lint.
- Report any checks that could not be performed.

## Format

Create a focused branch and pull request.

Include:

1. Root cause.
2. Changed behavior.
3. Files changed.
4. Test results.
5. Required deployment/migration steps.
6. A short explanation of the click → query → render flow.

Do not merge or deploy.
