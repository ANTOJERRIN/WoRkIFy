# Prompt 03: retire the LinkedIn workshop and assessment branch

## Exact identity and read-only cloud evidence

The target was confirmed on 20 October 2026 in Supabase project
`epgsgvwdlwarktbjrdfn`, the project identified during the initial diagnosis:

| Field | Verified value |
| --- | --- |
| ID | `be33c1fc-e4c4-4def-b33e-078fdf662400` |
| Slug | `linkedin-workshop` |
| Title | LinkedIn Workshop |
| Host | F1 Forge |
| Start | 2026-10-02 14:00 UTC / 7:30 pm IST |
| End | 2026-10-02 15:00 UTC / 8:30 pm IST |
| Cloud status at inspection | `open` |

The read-only snapshot found zero registrations and zero reviews for this exact
ID. The implementation nevertheless preserves historical records and is tested
with nonempty history. No cloud data was updated.

## One archived publication state

Prompt 08 reconciliation (21 October 2026): a new read-only check reconfirmed
host **F1 Forge** for the same exact target. The unapplied migration's erroneous
`ForMa` guard was corrected to F1 Forge, retaining the UUID, slug, title and
timestamp guards. The earlier fixture/report discrepancy is resolved locally;
changed metadata, including ForMa, is still rejected. Nothing was archived in
the cloud. See `docs/workshop-lifecycle.md` for the current lifecycle contract.

The local migration is:

`backend/supabase/migrations/20261020123021_archive_linkedin_workshop.sql`

It extends the existing status check with `archived`; there is no second flag,
archival table or replacement record. Stage 08 must reuse this same status when
it centralizes lifecycle behavior.

The data update locks and checks the exact UUID, slug, title, organizer and both
timestamps before setting `status = 'archived'`. An identity mismatch aborts the
migration. If that UUID is absent in another database, it reports a notice and
does not create or archive a different workshop. Existing status values remain
compatible.

Additive restrictive policies veto new registrations and meeting-link reads for
archived workshops alongside the existing ownership/admin policies. They add no
grants and preserve cancellation/ownership rules for later lifecycle work. The
archival link restriction also applies to client requests by admins; the stored
link remains in the database.

No profiles, registrations, reviews, meeting rows or users are deleted. Existing
schema migrations and historical review storage remain intact.

## Discovery, direct access and history

- `listWorkshops` explicitly requests `status != archived`. The upcoming UI also
  excludes archived rows defensively.
- `getWorkshop(idOrSlug)` deliberately returns safe archived metadata so an old
  reference can explain what happened rather than appear missing.
- Details missing from discovery resolve through that API. Archived details show
  an archived message and omit registration, Calendar and meeting controls.
- `?workshop=<UUID-or-slug>` resolves a historical reference directly. This is a
  small compatibility entry point; stage 05 still owns full URL routing, browser
  history and canonical sharing links.
- Registration queries retain archived workshops in joined results. Dashboard
  and profile show registration history, not proof of attendance or completion.
  Archived dashboard cards do not fetch meeting links or offer cancellation.
- Ordinary profile LinkedIn URLs remain editable and clickable. Admin
  registration contact links are retained.

## Removed executable assessment dependencies

| Area | Local change |
| --- | --- |
| Dashboard | Removed review loading, scores, actions and modal state |
| Profile | Removed review/score cards, rubric actions, prompts and modal state |
| Admin | Removed review tab, review loading and reset controls; retained workshop and registration controls |
| Admin API | Removed `listWorkshopReviews` and `resetLinkedInReview` |
| Shared types | Removed assessment-only review, band, criteria and admin-review types |
| `frontend/src/api/reviews.ts` | Removed unused endpoint and historical-review service calls |
| `frontend/src/components/reviews/LinkedInReviewModal.tsx` | Removed assessment modal |
| `backend/supabase/functions/review-linkedin/index.ts` | Removed executable function source |

The admin form no longer defaults new workshops to LinkedIn-related tags. Its
registration heading now says “Registrations” instead of “Attendees.” Unsupported
verified-proof comments were removed from the profile layout. The inaccurate
claim that current RLS already enforced the meeting time window was corrected;
stage 10 owns server-side time-window enforcement.

No shared credentials or external services were removed. References in the
original schema migration describe historical storage, not an active writer.
Planning/prompt files remain historical instructions and were not rewritten.

## Endpoint status and separately authorized release

The read-only edge-function listing returned **no functions** in the inspected
project. No deployed endpoint was deleted or disabled in this stage. Removing a
source file does not disable any separately deployed copy.

The actual hosting target and deployed frontend remain unverified. At a future
authorized release:

1. Confirm the hosting environment's Supabase project and inspect its migration
   history/schema drift. Do not blindly replay the original schema or seeds.
2. Review and apply the specific archival migration through the agreed migration
   process. Prompt 02's public-read migration is also still required where absent.
3. Inspect that target's Edge Functions. If `review-linkedin` exists, delete that
   function through the project's Functions dashboard or the current CLI. Keep
   the `linkedin_reviews` table, ownership policies and historical rows.
4. Verify no deployed application calls the retired endpoint, archived history
   stays visible to its owner, and no archived registration/join action succeeds.

Cloud archival and endpoint retirement on any uninspected deployment remain
pending. Nothing was deployed, applied, pushed or opened as a GitHub PR.

## Validation

- Production build passed.
- Lint passed with nine existing warnings; two assessment-component warnings
  disappeared when that component was removed.
- All 24 desktop/mobile browser checks passed, including public browsing,
  archived ID/slug links, preserved registration history, LinkedIn contact links
  and absence of review/reset controls or assessment HTTP requests.
- All three disposable PGlite PostgreSQL tests passed: exact-ID archival with
  nonempty history and access restrictions; absent-ID behavior; metadata mismatch.
  They also run the existing public/ownership/admin SQL regression suite after
  applying the archival policy changes in memory.
- Browser fixtures and database fixtures are local only. They create no cloud
  accounts or workshops and do not establish deployed-site verification.

Run `npm.cmd run test:db` for the disposable database checks. For browser setup
and commands, see `docs/public-browsing.md`.
