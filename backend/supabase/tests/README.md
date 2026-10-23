# Public browsing regression checks

Prompt 10's meeting suite applies all source migrations and tests both the safe
RPC and direct table RLS with a controlled clock in disposable databases only.
It checks exact boundaries, identity/registration denials, admin management and
cancelled/archived vetoes, legacy schedules/data, canonical URL validation and
public metadata protection. Production clock behavior is unchanged. The SQL
suite below checks future-link denial when the new RPC is installed, while
retaining earlier-stage baseline checks when run without that migration.

The local archival regression runner applies the source schema, public-read and
archival migrations to disposable in-memory PostgreSQL, then runs this SQL suite:

```sh
npm run test:db
```

It also verifies historical record preservation, archived access restrictions,
exact-ID targeting, missing-ID behavior and metadata mismatch rejection. No cloud
credentials are used. See `docs/linkedin-retirement.md` for release limitations.

The lifecycle suite also applies prompt 08's local migration in disposable
PostgreSQL. It checks the shared controlled-time predicate matrix, private
function privileges, new-write schedule constraints, preservation of legacy
rows and the existing ownership/public-read policies. These are contract and
compatibility checks; server meeting-window enforcement remains assigned to
prompt 10. The prompt 09 registration suite additionally applies the registration
service migration and checks authoritative ownership/lifecycle denials, confirmed
cancellation, historical preservation, immutable fields, server timestamp checks,
privileges and overlapping duplicates. It reruns this SQL suite with all changes
applied. Fixture setup supplies its own authenticated owner and future schedule.
PGlite serializes one connection; independent-session lock races remain a live
release check. Run `npm run test:domain` for the matching TypeScript
matrix, discovery order and schedule formatting checks.

Run `public_workshop_browsing.sql` as postgres against a disposable Supabase
database with the migrations applied. For example:

```sh
psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/supabase/tests/public_workshop_browsing.sql
```

The transaction rolls back its fixtures. It checks public workshop reads,
anonymous private-data and write denial, registration-gated Meet links,
profile ownership, and admin permissions.

The public listing requires `20261013172822_public_workshop_browsing.sql`.
Apply that migration as part of a separately authorized release before exposing
the new visitor flow. It adds only anonymous SELECT access to workshop metadata;
Meet URLs remain in the protected `workshop_links` table. This change does not
disable or otherwise configure the Supabase Google provider.

Browser checks should cover desktop/mobile and both themes, each landing/navbar
workshop button, registration and hosting unavailability with Close/Explore
actions, existing session restoration, profile/admin authorization, registered
Meet access, Calendar, and logout. Live session/provider verification requires
the target project's environment and an existing authenticated test account.

Prompt 13 adds `tests/database/admin.test.mjs`: real disposable SQL checks for
admin create/edit and public safe reads, direct non-admin/metadata bypass denial,
slug/metadata/timezone/schedule validation, history-preserving cancel/archive,
hard-delete denial, retired-workshop non-reactivation, and canonical/empty Meet
upserts with immutable workshop identity. No production workshop is created.

Prompt 12 adds `tests/database/profile.test.mjs` to `npm run test:db`: profile
ownership and editable-column limits, normalization/validation/uniqueness,
metadata-independent admin permissions, and avatar cross-owner insert/update/
rename/delete denials. Its storage tables are a minimal local policy fixture;
these tests do not run the Supabase Storage HTTP engine, MIME/size enforcement
or CDN. Those remain release checks with two legitimate accounts. No cloud
profile data or storage objects are modified by the test runner.

Prompt 14 adds tests/database/integration.test.mjs, applying all local contracts
with minimal auth/storage fixtures in one disposable PostgreSQL instance. It
runs the shared SQL regression after profile/admin grant restrictions and traces
public discovery, protected registration/meeting access, profile/avatar ownership
and archival with registration/review preservation. Explicit privilege denial
and zero-row denial are both valid outcomes; visible private data or a successful
forbidden mutation still fail. See docs/release-review.md for current evidence.
