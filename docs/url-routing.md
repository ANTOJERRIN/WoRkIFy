# Prompt 05: URL routing and page shell

The browser address now selects the page. Previously, a React state variable
selected the page and disappeared on refresh. Navigation now adds a browser
history entry; Back/Forward rereads the address. No routing dependency was added.

| URL | Page | Access |
| --- | --- | --- |
| `/` | Landing | Public, including existing signed-in visitors |
| `/workshops` | Workshop discovery | Public |
| `/workshops/:idOrSlug` | Safe workshop details | Public, including archived metadata |
| `/dashboard` | Personal registrations | Existing session |
| `/profile` | Own profile | Existing session; no public profiles |
| `/admin` | Administration | Existing session plus separate admin permission |
| Other paths | Page not found, with workshop navigation | Public |

Trailing slashes are accepted. Historical `/?workshop=<ID-or-slug>` links replace
their history entry with `/workshops/<ID-or-slug>`. Opening a record from a card
uses its stable database ID; shared links prefer its existing slug, falling back
to ID. Route segments are encoded. Malformed encoding and encoded path separators
are rejected by the parser; the HTTP server may reject malformed escapes first.

## Guards and ownership

`src/routing/RouteGuard.tsx` consumes the existing session interface. It renders
only a checking state while the session resolves. Admin pages additionally wait
for the role result for the current account; outdated account requests are
ignored. Denials stay at the requested URL and show an explanation and public
navigation. Private feature components never mount while access is unresolved
or denied. Session expiry removes private content; logout returns to `/`.

The initial anonymous-session callback no longer overwrites a requested private
route. Signed-in visitors can remain on the landing route. The shared shell in
`src/App.tsx` renders Navbar, Footer and existing dialogs once. Navigation and
Back/Forward dismiss stale overlays. The sign-in-unavailable dialog for protected
actions remains; no replacement sign-in method was added. Stage 06 still owns
the broader session lifecycle. Database policies remain authoritative; this
client guard does not grant access to data.

## Sharing and data flow

Workshop sharing constructs a new URL from the current origin and the workshop
path, without query strings or fragments. It awaits clipboard success before
showing Copied. If clipboard access fails, it displays a selectable URL. Profile
sharing was removed because no public-profile route or privacy contract exists.

Example: `/workshops/some-slug` -> route parser -> selected workshop identifier
-> existing `getWorkshop` in `src/api/workshops.ts` -> public metadata client ->
backend read policy. A missing row shows Workshop not found; a failed request
offers retry. Meeting URLs and private data are not part of this public query.

## Hosting requirements

No hosting provider configuration or deployed commit was identified in this
checkout. Repository root remains the build root, and `dist/` the publish
directory. No deployment configuration was applied remotely.

The host must serve existing static files first, then return `dist/index.html`
with HTTP 200 for application document paths. Keep API/function namespaces and
asset requests outside that fallback. For example, on an Nginx static host:

```nginx
# In the server block; root must point to the published dist directory.
# If backend services use this origin, replace these 404 handlers with their
# actual upstream handlers. Never send backend requests to index.html.
location ~ ^/(api|functions|rest|auth)(/|$) { return 404; }
location /assets/ { try_files $uri =404; }
location ~* \.(js|css|png|jpg|jpeg|svg|ico|woff|woff2|map)$ { try_files $uri =404; }
location / { try_files $uri $uri/ /index.html; }
```

For another platform, configure the equivalent static-first SPA rewrite after
its backend/function rules. This sample is documentation, not an identified live
server configuration. The app assumes deployment at the origin root.

Before release, verify `/workshops/<real-ID-or-slug>` in a fresh browser tab and
refresh it on the deployed origin. Check that unknown app routes reach the
not-found page, real assets still load, missing assets return 404, and backend
paths still reach their actual handlers. Local Vite navigation does not prove
the deployed host has these rewrites.

## Baseline and validation

This stage carries forward the local source consolidation. Commit `4e44491`
contains prior-stage deletions/configuration/reports but omitted many moved
source files; the working-tree additions are required dependencies. Do not use
that commit alone as a runnable baseline or label this entire working tree as
only a routing change. The missing files are now saved separately in dependency
commit `5546517`; prompt 05 is stacked on `fix/canonical-frontend-dependency`.

Build: passed with isolated public test configuration. Real build environment
variables are absent; an unconfigured production build correctly stops.
Lint: no errors, ten effect/export warnings (nine were recorded previously).
Configuration checks: 5 passed. Browser verification results are recorded in
`docs/prompt-history.md` after the final run.

An unrelated prior-stage database check currently fails: the archival migration
expects host `ForMa`, whereas its test fixture and retirement report use
`F1 Forge`. The absent-ID and identity-mismatch tests pass. This stage leaves
the migration and fixture unchanged; verify the intended identity before
reconciling the prior report/tests or applying any migration.

No schema changes, migration applications, cloud configuration changes or
deployments were performed in prompt 05. Live refresh behavior is unverified.
