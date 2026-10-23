# Workify

Workify supports workshop discovery, registration history, profiles and
admin-controlled workshop hosting. The frontend uses React, TypeScript, Vite and
Tailwind; Supabase provides database, session and storage services.

## One application setup

Run frontend commands from the **repository root**, using Node.js 24 and npm
(verified with Node 24.14.1 / npm 11.11.0). Vite declares Node 20.19+ or 22.12+
support; the native TypeScript configuration tests use Node 24.

```powershell
npm.cmd ci
Copy-Item .env.example .env
# Fill in .env with your project's public configuration.
npm.cmd run dev
```

On other shells, use `npm` and `cp .env.example .env`. `npm ci` installs the exact
root lockfile. There is no separate frontend install or workspace package.

## Public configuration

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Your Supabase project API URL |
| `VITE_SUPABASE_ANON_KEY` | Public publishable key, or legacy anon key |
| `VITE_HOST_CONTACT_NUMBER` | Optional public contact number; omission preserves the local host-dialog number; an empty/invalid value disables the tel link |
| `VITE_F1FORGE_URL` | Optional approved HTTPS partner URL; empty/invalid values render plain F1 Forge text |

The example contains placeholders only. Set real values in the ignored root
`.env` file or the hosting build environment. Restart Vite after changing them.
Vite embeds `VITE_` variables in browser output: never use service-role keys,
`sb_secret_` keys, database passwords or other server secrets there.

Development shows a readable setup error for missing/invalid configuration.
Production builds reject missing/placeholder values. Known server secret keys
are rejected before serving or bundling. Validation checks setup shape, not key
validity or cloud permissions.

## Commands from the root

| Command | Purpose |
| --- | --- |
| `npm.cmd ci` | Clean, reproducible dependency installation |
| `npm.cmd run dev` | Local development |
| `npm.cmd run build` | Type-check application/tests/configuration; build `dist/` |
| `npm.cmd run preview` | Serve the existing production build locally |
| `npm.cmd run lint` | Lint source and tests |
| `npm.cmd run test:config` | Configuration and build rejection checks |
| `npm.cmd run test:db` | Disposable PostgreSQL migration/authorization checks |
| `npm.cmd run test:domain` | Controlled-time workshop lifecycle and schedule checks |
| `npm.cmd run test:browser` | Desktop/mobile browser regression checks |

Install Chromium once with `npx.cmd playwright install chromium`. To use installed
Edge on Windows, set `$env:PLAYWRIGHT_CHANNEL = 'msedge'` before browser tests.
Fixtures do not create cloud accounts or workshops.

## Locations

```text
index.html                  HTML entry, favicon and fonts
package.json / lockfile     One dependency and command setup
vite.config.ts              One frontend build configuration
src/main.tsx                Bootstrap and configuration error presentation
src/App.tsx                 Page shell and current navigation rendering
src/components/             Features and shared layout
src/context/                Existing session/shared state
src/api/                    Database/storage access
src/lib/supabase.ts         Session client and public catalog client
src/config/                 Public runtime configuration and site settings
src/types/                  Shared contracts
src/data/                   Existing profile initialization
src/index.css               Active Tailwind/theme stylesheet
public/                     Runtime assets, including workify-logo.png
backend/supabase/            Migrations and SQL tests
tests/                      Browser, configuration and disposable DB tests
docs/                       Current implementation/release notes
resource --prompt section/  Historical plans and staged instructions
```

The browser build rejects imports from backend/test directories. The old
`frontend/` setup is retired; an ignored historical `frontend/dist/` on an
existing workstation is not deployment output. See the
[old-to-new module map](docs/project-layout.md).

## Backend migrations

Keep SQL under `backend/supabase/`; frontend access stays in `src/api/` and
`src/lib/supabase.ts`. Create a migration from the repository root with:

```powershell
npx.cmd supabase --workdir backend migration new descriptive_name
```

Review SQL and run relevant disposable tests. Applying migrations requires a
separate release decision, confirmed project identity and verified schema/history.
The inspected cloud project has schema/history drift; do not blindly replay the
original schema, seeds or all local migrations. See
[public browsing](docs/public-browsing.md) and
[LinkedIn retirement](docs/linkedin-retirement.md) for pending migrations.

## Deployment settings after review

| Setting | Canonical value |
| --- | --- |
| Root directory | Repository root (`.`), not `frontend/` |
| Install | `npm ci` |
| Build | `npm run build` |
| Output/publish directory | `dist` |
| Build environment | Node 24 and both public Supabase variables |

`npm run preview` is for local verification. No hosting provider/deployed commit
has been confirmed, and no hosting settings have been changed.

## Current feature limits

Prompt 14 completes the local integration review. **Production release is not
ready:** the inspected backend has schema/history drift and lacks the pending
access contracts; the actual host and real-account smoke checks are unverified.
See the [readiness assessment and student walkthrough](docs/release-review.md),
[architecture](docs/architecture.md), and [release/rollback plan](docs/release-plan.md).
All source changes remain local and no live migration or deployment was performed.

Release preparation now includes a [tested backend compatibility package](backend/release/README.md)
for the inspected existing database, with schema drift guards and source hashes.
The next external step is an identified staging clone, followed by real-account
and hosting acceptance. The candidate has not been applied to the cloud.

Prompt 13 adds an independent admin workshop list (including archived history),
confirmed saves, status-only cancellation/archival, protected meeting management
and validated contact destinations. Its migration remains unapplied. See
[the admin and hosting review](docs/admin-hosting.md).

Prompt 12 adds validated profile drafts and staged avatar uploads with confirmed
owner-scoped saves. Its profile/storage migration remains unapplied. See
[the profile editor review](docs/profile-editor.md) for failure handling and public
avatar visibility. Stage 13 continues this work below the same local baseline.

Prompt 11 groups personal registrations into ongoing, upcoming and past/closed
sessions, with a separate invalid-schedule section, host/status information and
keyboard-accessible detail navigation. See [the attendee dashboard review](docs/attendee-dashboard.md).
Stage 12 follows this dashboard work in the one-stage-at-a-time sequence.

Prompt 10 adds local server-enforced meeting access and a shared detail/dashboard
control. Its migration is unapplied. See [meeting access](docs/meeting-link-access.md)
for time boundaries, admin management exceptions and remaining release checks.

Prompt 09 adds local registration/cancellation enforcement and shared refresh
handling; its database migration is unapplied. See
[the registration service report](docs/registration-service.md) for authorization,
cancellation/history rules, tests and pending live verification.

Public discovery/details are implemented; deployed anonymous access still needs
the pending public-read migration and correct configuration. Existing valid
sessions support protected registration/history/profile/admin/contact-hosting
flows, subject to backend policies. Google sign-in remains removed; replacement
login is unavailable.

The LinkedIn review feature is retired from source. Its archival migration is
unapplied in the inspected project; historical data remains. Meeting URLs stay
private. URL routing is implemented in prompt 05; further session and
lifecycle/access work are implemented locally. See [routing and hosting requirements](docs/url-routing.md)
and the current [integration review](docs/release-review.md) for release limitations.
Registration does not prove attendance, completion, certification or assessment
success. No cloud migration or deployment is part of these local edits.
