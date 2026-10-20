# Personal profile and avatar management

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

**Owns:** Personal profile and avatar management.

**Architecture modules:** components/profile/ProfilePage.tsx; components/profile/ProfileEditForm.tsx; api/profile.ts; profiles and avatars storage policies.

**Run:** After 06 and 07; use 11 for workshop history dependencies.

## Role

Act as a senior full-stack engineer and student coding mentor. Implement this function with typed, testable boundaries and explain the code decisions.

## Task

Own personal profile display/editing and avatar upload.

1. Read and update only the current user's profile. Display a clear recoverable state for missing profile rows rather than invented identity information.
2. Preserve name, handle, bio, skills, college, location and normal LinkedIn/X/website contact links.
3. Validate lengths, handle normalization/uniqueness and URL formats consistently. Show field-level errors and retain unsaved edits on failure.
4. Do not allow profile fields or editable auth metadata to change admin privileges.
5. Validate avatar size and explicitly allowed image types; keep client validation consistent with storage policy. Preserve ownership for upload and replacement.
6. Handle upload success followed by profile-update failure without falsely claiming completion. Avoid leaving the displayed avatar out of sync.
7. Prevent one user from modifying another user's avatar or profile through direct API/storage calls.
8. Remove specialized LinkedIn assessment cards and unsupported verified-proof claims.
9. Keep workshop history honest: registration is not proof of attendance.
10. Disable/remove profile sharing until a real public-profile route and safe public data contract are approved. Do not expose private profile email through a new route.
11. Verify reload, save, cancellation and logout behavior. Keep avatar access policy explicit; existing intentionally public avatar images are different from private profile records.

## Acceptance checks

- Valid edits and duplicate handle.
- Invalid URL, overlong fields and invalid image types/sizes.
- Upload replacement ownership and cross-user denial.
- API/network failure retains useful form state.
- Save persists after reload.
- No broken share link, stale-user data or retired review controls.

## Format

First identify the current implementation, confirmed gaps and the smallest change plan; then implement within this scope. Provide:

1. Responsibility and request/data-flow summary.
2. Actual files and important functions changed; distinguish existing names from proposed names.
3. Backend policy/migration impact and deployment steps left pending.
4. Meaningful tests, commands run and results; report skipped checks.
5. A manual student-review checklist and explanation of one normal and one denied/failing request.
6. Focused commit and pull request links. Do not merge or deploy.
