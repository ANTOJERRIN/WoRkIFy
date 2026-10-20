# Prompt 04: canonical project layout

## Choice and baseline

Use the existing repository-root package, lockfile, Vite configuration and HTML.
Move active `frontend/src` modules to `src` and replace the root forwarding
components/styles/configuration. This preserves the working build location while
removing the competing setup. No monorepo or framework change is needed.

This local change carries forward prompt 02 and the uncommitted prompt-03 work.
No older baseline was substituted. No commit, push, PR, migration application or
deployment is part of prompt 04.

Before: root HTML loaded root `src/main.tsx`, wrappers forwarded to `frontend/src`,
and root/frontend both contained package, HTML, Vite and duplicate logo files.
After: root HTML loads one `src/main.tsx` bootstrap and the real `src/App.tsx`;
one stylesheet, public directory, package/lockfile and Vite config are authoritative.

## Architecture migration map

Files under `frontend/src/` moved to the same relative path under `src/`, except
the duplicate bootstrap, consolidated into `src/main.tsx`.

| Old path/module | Canonical path or disposition |
| --- | --- |
| Root `src/App.tsx` wrapper | Replaced with the actual application shell |
| `frontend/src/App.tsx` | `src/App.tsx` |
| Root/frontend `src/main.tsx` | One `src/main.tsx` bootstrap |
| `frontend/src/context/WorkifyContext.tsx` | `src/context/WorkifyContext.tsx` |
| `frontend/src/components/landing/*` | `src/components/landing/*` |
| `frontend/src/components/layout/*` | `src/components/layout/*` |
| `frontend/src/components/workshops/*` | `src/components/workshops/*` |
| `frontend/src/components/dashboard/*` | `src/components/dashboard/*` |
| `frontend/src/components/profile/*` | `src/components/profile/*` |
| `frontend/src/components/admin/*` | `src/components/admin/*` |
| `frontend/src/components/auth/*` | `src/components/auth/*` |
| `frontend/src/api/{workshops,registrations,links,profile,admin}.ts` | `src/api/`, same filenames |
| `frontend/src/lib/supabase.ts` | `src/lib/supabase.ts` |
| Root config re-export and `frontend/src/config/site.ts` | One `src/config/site.ts` |
| `frontend/src/types/index.ts` | `src/types/index.ts` |
| `frontend/src/data/mockData.ts` | `src/data/mockData.ts`, existing profile initialization |
| Root CSS forwarding import / `frontend/src/index.css` | One `src/index.css` |
| Unused starter `src/App.css` | Removed after confirming no imports |
| `frontend/public/workify-logo.png` | Removed identical duplicate; root `/workify-logo.png` retained |
| `frontend/{package.json,index.html,vite.config.ts}` | Removed; root equivalents authoritative |
| Review API/modal/types/function | Retired in prompt 03; no replacement service |
| `backend/supabase/migrations/` and `backend/supabase/tests/` | Locations and SQL unchanged |
| Historical prompt/planning files | Kept under `resource --prompt section/` |

Existing design images/assets remain. Ignored generated output such as an old
`frontend/dist/` was not deleted and is not canonical.

## Configuration and source checking

`src/config/runtime.ts` validates public configuration without echoing credentials.
Vite rejects known server secret keys before serving/building and rejects
missing/placeholder values for production builds. The bootstrap renders a setup
message before importing modules that create clients. `.env.example` contains
placeholders only; root README documents names, purposes and exact commands.

`tsconfig.app.json` covers all application TypeScript under `src` directly.
`tsconfig.node.json` checks Vite and Playwright configuration;
`tsconfig.tests.json` checks browser/config tests and the harness. The canonical
build checks all three projects. Database tests remain executable Node JavaScript.

The Vite build guard checks emitted chunk module IDs and rejects imports from
project `backend/` or `tests/`. No SQL/test harness is bundled into the browser.
This stage changes layout/configuration, preserving UI styles and the existing
database/service boundaries.

## Deployment and validation

From `.`: `npm ci`, configure the public environment, `npm run build`, publish
root `dist/`. Any hosting settings pointing to `frontend/` need changing during a
separately authorized release. No actual hosting settings were available to
verify or change.

Local checks: clean root install; production build with isolated test values;
TypeScript coverage; lint; 28 desktop/mobile browser checks; five configuration
and build-rejection checks; three disposable database regression checks. The
build guard passes and the built logo matches the canonical public asset.
Lint retains nine existing warnings. Test configuration is not release
configuration, and deployed behavior remains unverified.

The clean install initially hit a Windows native-module lock held by the existing
Workify Vite dev server. That verified local server was stopped for installation
and restored on its original port after checks.
