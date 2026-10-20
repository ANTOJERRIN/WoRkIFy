# Final integration review and student walkthrough

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

**Architecture modules:** All architecture layers; deployed frontend configuration; migrations; external meeting integration.

**Run:** After 01–13.

## Role

Act as a release reviewer and coding mentor assessing the completed Workify changes.

Report actual evidence. Do not describe an untested feature as working.

## Architecture-specific refinement

This is the integration/release-review stage. Review the final integrated baseline rather than an old source snapshot. Include an updated architecture diagram in repository documentation that matches the final code and removes the active LinkedIn assessment branch. List unresolved product decisions separately, especially replacement authentication and any future assessment/approved-host self-service features. Test private behavior with authorized test sessions in an isolated environment; if sessions are unavailable, explicitly mark those checks unverified. Do not add a backdoor to complete a test. Treat a clean build as build evidence, not proof that the full deployed app works.

## Task

Review the integrated changes from the preceding stages.

### 1. Verify the main public journey

Confirm:

- Landing page opens.
- Explore workshops works without authentication.
- No unexpected modal/backdrop blocks public browsing.
- Workshops load from the intended database.
- Empty and error states are correct.
- Workshop details have direct URLs.
- Refresh and browser history work.
- Shared workshop links resolve.

### 2. Verify protected behavior

Confirm:

- Anonymous users cannot access private data or perform protected actions.
- Existing authenticated sessions are preserved.
- Logout clears private state.
- Admin access requires actual admin permission.
- Meeting-link restrictions are enforced by the backend.
- Sign-in availability is represented honestly.
- No replacement authentication method was accidentally introduced.

### 3. Verify LinkedIn retirement

Confirm:

- The retired workshop is not in active discovery.
- Historical data remains preserved.
- Review controls and unsupported proof claims are gone.
- No frontend requests call the retired assessment endpoint.
- Endpoint retirement status is documented.
- Ordinary LinkedIn profile links remain if applicable.

### 4. Verify structure and build

- Confirm the canonical project setup.
- Perform a clean installation and production build.
- Run lint and the relevant tests.
- Inspect direct-route hosting requirements.
- Check environment variable names and configuration instructions.
- Check desktop/mobile and light/dark presentation.
- Confirm the browser bundle contains no server secrets.
- Check for remaining placeholders, dead buttons and broken assets.

### 5. Explain the code for a student developer

Walk me through:

- Application entry point.
- Route definitions.
- Session loading and access guards.
- One public workshop request from click to database response.
- One protected registration request.
- Profile data ownership.
- Meeting-link authorization.
- Database migrations.
- Error handling and retry.
- How to add a future workshop safely.

For each walkthrough, identify the actual files/functions and explain why they exist.

### 6. Prepare deployment instructions

Provide:

- Required frontend build settings.
- Required public environment variable names.
- Required migrations and application order.
- Retired-function actions.
- SPA route fallback requirements.
- Post-deployment smoke tests.
- A rollback approach that accounts for both source changes and database compatibility.

Do not deploy automatically.

## Format

Return:

1. Ready/not-ready assessment with reasons.
2. Checklist showing passed, failed and unverified checks.
3. Pull request and commit references.
4. Remaining blockers ordered by importance.
5. Student code walkthrough.
6. Exact deployment steps.
7. Post-deployment validation checklist.

Clearly separate:

- Implemented in source.
- Tested locally.
- Applied to the cloud.
- Verified on the deployed website.

## Review and learning reminder

You own the product decisions, review the code, test the behavior, and decide when to deploy. Review each stage separately. Explain what changed, why, and how the tests support it. Reading logs helps; tracing requests and trying failure cases teaches more.
