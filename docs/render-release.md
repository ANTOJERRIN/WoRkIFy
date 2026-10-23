# Workify Render release target

User-supplied origin: **https://workify-x6pd.onrender.com**.
Public HTTP inspection: 23 October 2026, 15:17 UTC. No Render settings, deployed
source or database were changed. Account-level inspection is pending confirmation
of the connected workspace `jeruuu`.

## Observed deployed behavior

| Check | Result |
| --- | --- |
| Homepage | 200; Workify application HTML |
| `/workshops` and a workshop detail URL | 404, plain text |
| `/dashboard`, `/profile`, `/admin` | 404, plain text |
| Missing `/assets/*.js`, `/api/*`, `/rest/*` probe paths | Genuine 404; no application HTML |
| Published entry JavaScript and CSS | Both 200 with correct content types |
| Public backend origin in entry JavaScript | `https://epgsgvwdlwarktbjrdfn.supabase.co` |
| Retired code markers | `review-linkedin` and `linkedin_reviews` present |
| New meeting-access marker | `get_workshop_join_state` absent from entry bundle |
| Entry assets | `/assets/index-D6hx5El0.js`, `/assets/index-C__DZDcY.css` |
| HTML/asset cache headers | `public, max-age=0, s-maxage=300` |

These observations identify the published bundle as containing older code. They
do not establish its commit ID, that a retired endpoint is currently called, or
that authenticated requests succeed. No login or private-data request was made.
The complete machine-readable result is ignored under
`test-results/render-host-check.json`.

## Reusable public smoke check

```powershell
node scripts/check-release-host.mjs https://workify-x6pd.onrender.com test-results/render-host-check.json
```

The script makes only public GET requests to the supplied origin and its entry
assets. It never executes downloaded JavaScript or prints API keys. It reports
route/content-type failures and returns a failing exit code until they are fixed.
Its local tests cover correct routing, an overbroad SPA fallback, and unsafe input.
It does not replace browser rendering, login, private data or lazy-chunk checks.

## Settings to prepare for the source release

Confirm the exact service ID, service type, linked repository, branch, live deploy,
build root and current settings after workspace confirmation. The URL alone does
not prove whether the account resource is a Static Site or a Web Service. Do not
create a replacement service or change its type merely from this inspection.

The current local application builds from repository root `.` with
`npm ci && npm run build`, producing `dist/`. Keep the existing public backend
configuration associated with the intended environment. A release must include
the complete reviewed working tree; the currently published bundle is not the
completed candidate. The user retains the earlier review/push instruction.

For a **confirmed Render Static Site**, prepare these rewrite rules, each with
destination `/index.html` and action **Rewrite**:

| Source | Purpose |
| --- | --- |
| `/workshops` | Discovery |
| `/workshops/` | Discovery with trailing slash |
| `/workshops/:identifier` | One workshop ID or slug |
| `/workshops/:identifier/` | Workshop detail with trailing slash |
| `/dashboard` | Attendee dashboard |
| `/dashboard/` | Dashboard with trailing slash |
| `/profile` | Profile |
| `/profile/` | Profile with trailing slash |
| `/admin` | Admin page |
| `/admin/` | Admin page with trailing slash |

Render serves real files before matching rewrite rules and supports named path
placeholders. See the [official rewrite rules](https://render.com/docs/redirects-rewrites).
These explicit rules keep missing assets and backend namespaces outside the SPA
fallback. Apply them with the new route-aware frontend; rewriting alone cannot
add route handling to an older bundle.

An arbitrary unknown path would still receive the host's 404 under these rules.
The local app already renders its own not-found view when it handles a path, but
a branded server-side 404 for all unknown paths is not established by this plan.
The earlier generic hosting document's all-unknown-path HTML fallback therefore
remains a separate acceptance item; do not add `/* -> /index.html` and silently
break genuine missing-resource responses to achieve it.

For cache settings, retain HTML revalidation and use long immutable caching only
for content-hashed `/assets/*` files. Confirm effective headers on the root and
rewritten document URLs, not just `/index.html`. See
[Render's header reference](https://render.com/docs/static-site-headers). Capture
the current rules and headers for rollback before modifying them.

If the account resource is a **Web Service**, inspect its existing server/start
command and implement equivalent static-first document routing there. Static-site
rewrite controls must not be assumed to apply to that service type.

## Remaining release sequence

1. Confirm workspace and inspect service/deploy settings and rollback artifact.
2. Test the [backend reconciliation candidate](../backend/release/README.md) on an
   authorized staging environment; verify real-account and Storage behavior.
3. Complete source review and the user-managed push, then coordinate the new
   frontend with its required backend contracts and Render route settings.
4. Re-run the public smoke script plus desktop/mobile browser, real-session,
   registration, profile, admin and meeting-access acceptance tests.

Google sign-in remains removed. A replacement login method and new-user access
have not been approved or introduced. No paid staging resource has been created.
