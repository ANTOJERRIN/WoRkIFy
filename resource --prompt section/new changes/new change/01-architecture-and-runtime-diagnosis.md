# Diagnose public workshop access and application failures

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

**Architecture modules:** App.tsx → WorkifyContext.tsx → feature pages → API modules → supabase.ts → database; reviews.ts → review edge function.

**Run:** First; read-only.

## Role

Act as a senior full-stack engineer reviewing Workify with a student developer.

Base findings on the current code, actual responses and available deployment configuration. Explain your findings clearly enough that I can trace the relevant code myself.

This stage is an investigation. Do not modify application code, database policies, cloud configuration or deployed services.

## Architecture-specific refinement

Validate every major diagram connection against code. Specifically check that meeting links use links.ts and protected database access; do not assume links.ts invokes the LinkedIn review function just because of visually crossing diagram lines. Record the diagram as an architectural reference, not a runtime verification. Check API responsibilities and duplicate registration implementations. Produce an ownership map for routing, session, catalog, lifecycle, registrations, meeting access, dashboard, profile and admin. Identify the current deployed version if accessible; do not treat the local checkout as current without checking the remote.

## Task

Understand the intended product:

Workify lets visitors discover workshops hosted by ForMa and other approved organizers. Users should eventually sign in, register, access personal dashboards, attend through an external meeting link, and view relevant learning results.

Google sign-in was intentionally removed. A replacement authentication method has not been selected.

Investigate these reported failures:

- Opening Explore workshops sometimes shows an authentication-unavailable dialog and a blurred background.
- The workshop listing sometimes displays a loading/access failure with a Try again button.
- A previously created LinkedIn workshop is missing.
- Public browsing is expected to work without sign-in.

### 1. Establish the current source and deployment

- Identify the default branch, current commit and relevant merged pull requests.
- Check whether frontend restoration and Google sign-in removal are present.
- Identify the app’s actual build root and entry point.
- Identify the deployed website from repository/deployment evidence. Do not guess its address.
- Determine whether the deployed version corresponds to the current source, if evidence is available.
- Inspect configuration variable names and availability without printing their values or secrets.

### 2. Trace the public navigation flow

Follow these actions from UI click to rendered page:

- Landing-page Explore workshops.
- Navbar workshop browsing action.
- Workshop card opening a detail page.
- Retry after a workshop loading failure.

Identify:

- Event handlers.
- Context functions.
- Navigation guards.
- Modal state changes.
- Authentication checks.
- API calls and error handling.

Determine whether an authentication modal is incorrectly triggered or left open during public navigation.

### 3. Inspect workshop data access

- Identify the workshop API query and expected response shape.
- Check whether database errors are distinguishable from an empty result.
- Inspect grants and RLS policies in repository migrations.
- If authorized cloud access is available, verify the target project, applied migrations and effective anonymous permissions.
- Use a read-only query to determine whether workshop records exist.
- Locate the LinkedIn workshop and inspect its dates/status if possible.
- Distinguish missing data from hidden data, wrong-project configuration and failed queries.

Do not assume a migration is applied because its file exists.

### 4. Check access boundaries

Confirm which operations are intended to be public:

- Landing page.
- Workshop listing.
- Public workshop details.

Confirm which require authentication or admin permission:

- Registration and cancellation.
- Personal dashboard.
- Profile editing.
- Meeting-link retrieval.
- Hosting requests.
- Workshop administration.
- Assessment submission.

Identify mismatches without weakening security.

## Format

Return:

1. A short description of the current architecture.
2. A table containing each reported issue, supporting evidence, confirmed cause or remaining uncertainty, and proposed correction.
3. Relevant repository file links and function names.
4. A distinction between source inspection, local reproduction and deployed verification.
5. A recommended implementation order.
6. Any access or configuration evidence still needed.

Do not change or deploy anything in this stage.
