# Prompt 12: profile editing and avatar uploads

Local implementation, 23 October 2026. Continues the existing prompt 01–11
working tree and the user's instruction to keep review and GitHub pushes local.
No commit, push, PR, merge, deployment, cloud schema/configuration change or
migration application was performed.

## Baseline and changes

The existing implementation already had an owner-scoped profile read, explicit
missing/read-error/retry states, an identity-keyed private provider, ordinary
contact links and honest registration history. Profile sharing and the specialized
LinkedIn review experience were already removed. Those boundaries are retained.

The old editor uploaded and saved an avatar as soon as a file was selected,
accepted any `image/*` MIME type, took the extension from the filename, and only
checked whether contact links started with `https://`. Most labels were not
associated with their fields. Upload success followed by a failed profile update
could leave the displayed profile and avatar inconsistent.

Changed boundaries:

| File | Responsibility |
| --- | --- |
| `src/domain/profileValidation.ts` | Shared field limits, normalized handles/skills, HTTPS URL parsing, safe legacy-link presentation and avatar type/size/signature validation |
| `src/api/profile.ts` | Verified current-user reads and confirmed saves; explicit field projection and payload; optional new avatar upload before a single profile write |
| `src/components/profile/ProfileEditForm.tsx` | Editable draft, associated labels/errors, local photo preview, pending guards and draft retention on failure |
| `src/components/profile/ProfilePage.tsx` | Shared profile reconciliation after Save or Cancel, protected refresh while editing, keyboard-accessible history and explicit attendance disclaimer |
| `backend/supabase/migrations/20261023070718_profile_editor_contract.sql` | Unapplied profile column/ownership/validation and avatar ownership contract |
| `tests/domain/profile-validation.test.ts` | Normalization, limits, unsafe URLs and allowed/spoofed/empty/oversized avatar cases |
| `tests/database/profile.test.mjs` | Real disposable PostgreSQL policy/trigger checks with a minimal storage-schema fixture |
| `tests/browser/profile-editor.spec.ts` | Desktop/mobile save, reload, field errors, cancellation, upload outcomes, logout and legacy-link checks |

Name is required when editing (50 characters maximum), optional handles use
3–20 lowercase letters/numbers/underscores, bio is limited to 500, college and
location to 100, and up to 10 skills may contain 30 characters each. Handles are
trimmed, lowercased and stripped of one leading `@`; database uniqueness decides
whether the handle is available. The UI associates errors with each field and
retains the draft after uniqueness, permission or network failures. Empty handles
save as SQL NULL. Contact URLs use HTTPS, have no embedded credentials or
whitespace/backslashes/control characters, and are limited to 2048 characters.
Unsafe historical contact values are hidden from links when reading profiles.

## Request flow

1. The protected profile route consumes `useProfile` through the identity-scoped
   provider. `getProfile` verifies the expected user, selects explicit columns,
   filters the current ID and rejects an unexpected response ID. Missing rows
   stay a recoverable missing-record state; no profile is invented from metadata.
2. Selecting a photo validates it and creates a local object URL only. It does
   not call storage or save anything. Preview URLs are revoked on replacement
   and unmount. Cancel discards the draft and refreshes the persisted profile.
3. Save validates the complete draft, disables repeated submission and verifies
   the expected user. If a photo is selected, the API uploads it with `upsert:
   false` to `<verified-user-id>/<random-uuid>.<mime-derived-extension>`. Filenames
   from the input are not used as storage paths.
4. After upload, identity is checked again. One owner-filtered profile update
   sends editable fields and the optional new avatar URL, then requests the saved
   row. An error, missing/wrong-user response or unconfirmed avatar is a failure;
   an empty affected-row result never means success.
5. A confirmed response updates the shared profile, closes editing and reloads
   persisted data. The navigation avatar and profile consume that same snapshot.
   A failed response retains text and the selected photo, with explicit partial
   progress when upload may have completed.

The save has a 15-second request budget. Unmount/logout aborts the profile request
and prevents a late upload result from starting a profile write or updating the
new account's UI. The installed storage SDK's upload method does not accept an
AbortSignal, so its transport may finish after timeout/logout; the orchestration
stops waiting and never continues to the profile write after abort.

## Avatar and failure semantics

JPEG, PNG, WebP and GIF are allowed; files must be nonempty and at most 2 MiB.
Client checks include their identifying header bytes, not just the declared MIME
type. The extension comes from the allowlist. These checks are not a malware
scanner or a complete image decoder. The bucket independently limits MIME types
and upload size; direct-client bypasses must still pass storage authorization.

A fresh object path preserves the old image's bytes and avoids replacing a cached
image before profile save succeeds. An uncertain profile response may already
have committed. The API reports this uncertainty and does not automatically
delete either the old object or the uploaded object. Therefore replacement and
failed/abandoned saves can retain unused public files. A reviewed cleanup process
with confirmed references remains future work; the UI never claims that cleanup
occurred. Avatar URLs are intentionally public, including previously known URLs;
profile rows and email are private. The editor explains photo visibility.

## Unapplied backend contract

The CLI created `20261023070718_profile_editor_contract.sql` locally. It requires
the existing profile/storage schema and `workify_private` schema. It:

- Restricts authenticated profile writes to named editable columns, revokes
  client insert/delete/truncate and protects ID/email/timestamps. Owner UPDATE
  checks are restrictive, so another permissive update policy cannot bypass them.
  Existing owner SELECT and admin SELECT behavior remains; no public-profile route
  or anonymous profile read is introduced.
- Adds an invoker-rights update trigger with fixed search path and no table
  lookup/RPC. It normalizes handles, enforces lengths/skills and structurally
  validates HTTPS contact links. Browser URL parsing is stricter than the SQL
  structural guard; the renderer also refuses unsafe/malformed legacy values.
  Database uniqueness still serializes competing handle claims.
- Validates edits rather than rewriting old profiles. Initial auth bootstrap may
  still create an empty name; the first edit requires the user to supply one.
- Verifies that the existing avatar bucket is public before synchronizing its
  2 MiB/four-MIME settings. It does not silently make a private bucket public.
  Restrictive object INSERT/UPDATE/DELETE checks require the current user's path;
  new/updated avatar paths have one filename segment and an allowed extension.
  Other buckets keep their existing model; avatar public SELECT remains unchanged.

Admin membership still comes exclusively from `admin_users`, not editable profile
fields or auth `user_metadata`. The tests change editable metadata to an admin-like
value and confirm that it grants no admin permission.

Before applying, inspect actual cloud schema/history, existing column grants,
permissive policies, bucket visibility and legacy invalid profiles. Do not replay
the original schema/seeds over the drifted cloud project. Apply only the reviewed
compatible migrations in their dependency order, run cloud advisors, then verify
real REST/storage calls for two legitimate accounts, an admin and an anonymous
visitor. No live bucket, cloud advisor, deployed configuration or production
authorization check was performed here. The PGlite fixture tests SQL policies,
not Supabase Storage's HTTP engine, object bytes, CDN or bucket-limit enforcement.

Implementation references: [Supabase storage access control](https://supabase.com/docs/guides/storage/security/access-control)
and [standard uploads](https://supabase.com/docs/guides/storage/uploads/standard-uploads),
plus the installed storage SDK source. Existing public avatar behavior follows the
original local bucket migration; this stage does not create new public profiles.

## Student review

- Compare these files with the prompt 11 checkpoint; the checkout also contains
  earlier uncommitted stages. No GitHub PR link exists because the user will push.
- Edit each field, enter an invalid URL and try a duplicate handle. Confirm the
  field error, retained draft and successful retry. Reload after a confirmed save.
- Choose a valid photo, then Cancel: no upload should occur. Choose SVG, spoofed
  PNG and a file over 2 MiB: validation should reject them without storage traffic.
- Check the image, selected-file message, field labels and keyboard Save/Cancel
  at a narrow viewport and in both themes.
- Normal request: Save → verified identity → optional owner-path upload → owner
  profile PATCH → returned row → shared state and persisted reload.
- Denied request: attempt a direct write to another user's profile/object or to
  email/identity columns. RLS/column privileges must deny it even if UI validation
  is bypassed. A duplicate handle must fail through the unique constraint.
- Simulate upload success followed by profile denial: keep the draft and show
  partial progress, retain the old shared avatar, and refresh on Cancel. Simulate
  logout during upload: no late profile write or stale-user UI may appear.
- Confirm that ordinary contact links work, sharing stays absent, and registration
  history makes no attendance, certification or verified-skill claim.

Final validation commands/results are recorded in `docs/prompt-history.md`.
Prompt 13 (admin and contact-first hosting) is next; prompts 13–14 remain pending.
