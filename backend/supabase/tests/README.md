# Database authorization checks

Run `npm run test:db` from the repository root. The runner creates disposable
PGlite PostgreSQL instances, provides local Auth-role shims, applies the baseline
schema and the targeted owner-access migration, and exercises actual grants/RLS.
No cloud credentials, accounts or workshops are created.

Checks cover anonymous/private access, a single admin, denied self-promotion,
member publishing denial, owner create/update, invalid schedules/duplicate slugs,
private meeting links, closed-workshop registration denial, and archival history.
The standalone `public_workshop_browsing.sql` suite is also run inside PGlite.

That SQL suite may be run as postgres against a fresh disposable Supabase database
with the owner-access migration applied. It rolls back its fixtures. Never run
fixtures against production or against a project containing an existing admin.

PGlite tests PostgreSQL policies; it does not validate Supabase Auth configuration,
email delivery, PostgREST caching or production schema drift. Those require the
confirmed project's restoration, live inspection, advisors and targeted checks.
