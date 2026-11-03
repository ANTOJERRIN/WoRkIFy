# Workify login and owner workshop tools

Workify uses React, TypeScript, Vite and Supabase. Visitors can browse workshops;
member accounts can register and manage their own profile. One server-managed
admin account can create, schedule, edit, cancel and archive workshops, manage
private Google Meet links and view workshop registrations.

## Run locally

Use Node 24 and run commands from the repository root:

```powershell
npm.cmd ci
Copy-Item .env.example .env.local
# Set the confirmed project's API URL and public publishable key.
npm.cmd run dev
```

`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are public browser
configuration. The legacy `VITE_SUPABASE_ANON_KEY` name remains supported. Never
put a service-role key, secret API key or database password in a `VITE_` variable.
Missing configuration renders a setup message; production builds reject missing,
placeholder or privileged credentials.

## Application boundaries

- `src/main.tsx`: validates configuration before importing the application.
- `src/routing/useAppRoute.ts`: URL routes and Back/Forward behavior.
- `src/context/AuthContext.tsx`: verified identity, session events, logout and
  independent server-controlled admin permission resolution.
- `src/context/WorkifyContext.tsx`: public catalog, navigation and account data.
- `src/components/auth/`: sign-in page/dialog, signup and password reset/recovery.
- `src/components/admin/`: workshop library, editor, meeting links and attendees.
- `src/api/`: typed Supabase operations; `src/domain/`: workshop validation and IST
  conversions; `src/lib/supabase.ts`: session and independent anonymous clients.
- `backend/supabase/`: migrations and owner setup; these are never browser modules.

Routes: `/`, `/workshops`, `/workshops/:slug-or-id`, `/login`, `/dashboard`,
`/profile`, `/admin`. Protected pages wait for verified identity. Admin pages also
wait for permission and deny access when the lookup fails. Login on a protected
page keeps that destination. Login at `/login` opens the admin console for the
owner and the dashboard for members. Unknown routes show a not-found page.

Deploy static output from root `dist/` with an SPA fallback to `index.html` for
application routes. No deployment provider has been configured in this change.

## Authentication and the single admin

Email/password login, attendee signup, email confirmation and password recovery
use Supabase Auth with PKCE. Configure the Supabase Site URL and allowlisted
redirects for each actual origin's `/login` URL, including localhost in development.
Keep email confirmation enabled. Email delivery and real callback completion still
need live verification. Existing accounts that originally used Google can set an
email password through the reset flow; no Google sign-in button is added.

The role source is `public.admin_users`, never profile fields, signup data or
`user_metadata`. Browser clients cannot add/change/remove memberships. The new
migration enforces at most one admin. After confirming the owner's verified Auth
UUID, provision it through the trusted SQL editor using
`backend/supabase/owner-setup.sql`. Existing ownership is never replaced
implicitly, and first signup never grants admin privileges.

## Database release status

The cloud connection remains pending. No cloud migration, role assignment, Auth
provider change or deployment was performed. Live schema and email delivery must
be verified during backend setup.

`20261103015917_owner_workshop_access.sql` is locally tested and unapplied. It
replaces publishing/meeting-link/admin policies, adds public metadata reads,
validates workshop inputs and preserves history by disallowing workshop deletion.
Old rows remain under NOT VALID constraints; new/updated rows must comply. Only
open, unended sessions accept new registrations. Only the owner and registered
attendees of open scheduled sessions can read private links. The UI opens attendee
joining 15 minutes before the session; the database protects membership/status,
not a time-based secrecy guarantee.

Before release, restore the confirmed project, inspect schema/policies/history,
resolve the known drift, review the migration against the live structure and run
security advisors. Do not replay the baseline schema/seeds or blindly run `db push`.
The new migration includes public-read/archival-status policy support; review older
pending archival work separately so historical data is not modified implicitly.

See [implementation notes](docs/login-admin.md).

## Validation

```powershell
npm.cmd run build           # Requires valid-shaped public configuration
npm.cmd run lint
npm.cmd run test:config
npm.cmd run test:db
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npm.cmd run test:browser -- --workers=2
```

Browser checks intercept Supabase HTTP requests; database checks use disposable
PGlite PostgreSQL instances. Neither writes test workshops/accounts to Supabase.
Fixtures are not evidence of cloud configuration or delivered email.
