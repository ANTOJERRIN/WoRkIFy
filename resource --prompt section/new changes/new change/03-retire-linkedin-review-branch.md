# Retire the completed LinkedIn workshop experience

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

**Architecture modules:** DashboardPage/ProfilePage → LinkedInReviewModal → reviews.ts → review-linkedin/index.ts → linkedin_reviews.

**Run:** After 01 and 02.

## Role

Act as a full-stack engineer removing a completed product experiment while preserving historical user data.

## Architecture-specific refinement

This retires a full architecture branch, not just a button. Inventory all entry points, API exports, shared review types, admin reset controls, edge-function configuration and documentation references. Remove active dependencies without breaking unrelated profile/contact data or historical storage. Reuse the archived model later owned by 08 rather than adding a second archival mechanism. Explain what remains as historical data versus executable service. Cloud endpoint removal is pending unless separately authorized for deployment; do not claim deletion from source disables a deployed function.

## Task

The LinkedIn workshop is over. Remove it from the active Workify experience and retire its specialized AI review functionality.

This request does not authorize deleting historical registrations, user profiles or assessment records.

### 1. Find the correct workshop

- Locate the LinkedIn workshop using its actual ID and metadata.
- Confirm its identity before changing it.
- Do not identify records solely through broad text matching that could affect unrelated workshops.
- If the record is absent, report that finding and do not fabricate a replacement.

### 2. Archive it safely

- Use a documented archived state or an equivalent durable mechanism.
- Keep its historical record and relationships.
- Exclude it from active public discovery.
- Handle old direct URLs with a clear archived/unavailable presentation.
- Preserve registered users’ historical workshop references without exposing private data.
- Make archival behavior explicit in API queries.

If a schema change is needed, include a migration compatible with existing records.

### 3. Remove the specialized review experience

Remove active LinkedIn-assessment features from:

- Dashboard actions.
- Profile score/review cards.
- Workshop details.
- Review modals.
- Promotional text.
- Unused frontend API calls and imports.

Do not replace the feature with fake scores, placeholder results or a new assessment system.

### 4. Handle the backend endpoint

- Identify the existing review function, its callers and any active deployment.
- Remove application calls to the retired endpoint.
- Document the steps required to disable or remove its deployed endpoint.
- If deployment changes are outside the current access/scope, clearly mark retirement of that endpoint as pending.
- Do not remove shared credentials or services used elsewhere.
- Preserve historical review storage until a separate cleanup decision.

### 5. Preserve ordinary LinkedIn profile links

Keep a user’s normal LinkedIn social link where it is part of profile contact information.

Retiring a workshop and its grading feature is separate from removing LinkedIn as a social link.

### 6. Remove misleading claims

- Remove active “verified proof” or certification claims unsupported by actual functionality.
- Preserve useful workshop history.
- Do not imply that registration proves attendance or completion.

## Validation

- Archived LinkedIn workshop is absent from active discovery.
- Historical records remain intact.
- No active page offers the retired review.
- No remaining application request calls the retired review function.
- Normal profile social links still work.
- Build and relevant tests pass.

## Format

Create a focused pull request containing:

1. Exact workshop identity used.
2. Data changes and migration, if any.
3. UI and code removed.
4. Historical data preserved.
5. Endpoint retirement status.
6. Validation results.

Do not merge, deploy, drop historical tables or delete users.
