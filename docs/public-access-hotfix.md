# Public browsing hotfix — 23 October 2026

## Confirmed failure

Production returned HTTP 401 / PostgreSQL 42501 for anonymous workshop reads.
The workshops table had RLS enabled but only authenticated SELECT access.
The live Explore workshops page reproduced the same permission error.

## Applied to Supabase

Project: epgsgvwdlwarktbjrdfn. Applied the existing public-read and archival migrations plus a narrow public visibility fix:

- `20261013172822_public_workshop_browsing.sql`: SELECT grant and anonymous read policy on public workshop metadata.
- `20261020123021_archive_linkedin_workshop.sql`: identity-checked archival of the completed LinkedIn workshop; preserve historical records and deny new registrations/meeting-link access for archived workshops.

`backend/hotfix/20261023182101_hide_archived_workshops_from_public_catalog.sql`
was then applied to hide archived rows from anonymous clients, including the old
deployed frontend which does not filter them. Authenticated history access remains.
The live browser now shows an empty catalog without a permission error. There are
no upcoming workshops in the database; no fake workshops were inserted.

No account, registration, meeting URL or private record was exported. Anonymous
SELECT remains denied for profiles, registrations and workshop_links; anonymous
workshop INSERT remains denied. RLS remains enabled.

## Frontend fix

The hosting dialog only presents contact information, so it now opens without a
session. Registration, personal dashboard, profile and administration remain
protected. Public workshop browsing already uses a separate anonymous client.
Browser regression assertions now require the hosting dialog for signed-out
visitors, including Escape, focus restoration and route-change dismissal.

## Validation and review

- Production browser: Explore workshops loads without the previous permission error.
- Production build passed with isolated test configuration.
- Database suite: 47 passed in disposable databases.
- Configuration suite: 8 passed. Domain suite: 36 passed.
- Lint: zero errors, four existing warnings.
- Diff review: both host gates removed; no registration or admin guard removed.
- Automated browser execution blocked: installed Playwright browser unavailable,
  and browser download returned a truncated archive. Updated browser tests are
  not claimed as passing.
- Requested Code Review plugin was not available in the exposed tools/skills or
  plugin search. Review above is direct inspection, not a plugin-generated review.

## Deployment and remaining work

This branch is based on fix/url-routing-page-shell. Main is missing the canonical
source modules; do not deploy main as-is. The live Render bundle is older and
needs a separately reviewed frontend deployment. Direct /workshops URLs still
require the route rewrites documented in render-release.md. The hosting fix is
not live until deployed. Authentication remains intentionally unavailable.

The prior backend/release snapshot is stale after these three hotfixes. Its drift
guard must remain in place. Inspect production again and assemble the remaining
unapplied migrations against that baseline before any full backend release.
