# Prompt 07: shared state and API boundaries

Implemented locally on top of the reviewed prompt 06 working tree and prompt
05 commit `5c1fb28`. The same checkout includes the uncommitted prompt 06 work.
The user owns review, commits and GitHub publication. No new commit, push,
pull request, merge, migration application or deployment was performed.

## Responsibility map

| Responsibility | Owner |
| --- | --- |
| Session and admin permission | Existing `src/auth/useSession.ts`, from prompt 06 |
| URL and browser navigation | Existing `src/routing/useUrlRoute.ts` |
| Public catalog and refresh | New `src/hooks/useCatalog.ts` → `src/api/workshops.ts` |
| Profile data and refresh | New `src/hooks/useProfile.ts` → `src/api/profile.ts` |
| Current-user registrations and mutations | New `src/hooks/useRegistrations.ts` → `src/api/registrations.ts` |
| Request lifetime, cancellation and errors | New `src/hooks/useResource.ts` |
| Theme and persisted preference | New `src/hooks/useTheme.ts` |
| Auth/hosting dialogs and dismissal | New `src/hooks/useModals.ts` |
| Composition and feature interface | `src/context/WorkifyContext.tsx` |
| Administrative operations | Existing `AdminPage.tsx` and `src/api/admin.ts` |
| Startup/configuration errors | Existing `src/main.tsx` |
| Runtime render failures | New `AppErrorBoundary.tsx` |

The context composes these hooks instead of implementing their requests. It
keeps one consumer interface without adding a separate provider for every
value. Session has one owner. URL routing remains the navigation authority.
Database queries and row-to-frontend mapping remain in the API layer. No
caching library or new dependency was added.

## Data lifecycle

Public catalog, theme and routing live outside the private store. A change of
identity replaces the private store and its feature tree. Profile, registrations,
dialogs and component-local account state start fresh; callbacks from the old
store cannot address the new store. Same-account token events do not trigger
profile/registration refetch loops. Private hooks remain disabled until a user
is established.

`useResource` distinguishes initial loading from refresh. Refresh retains the
previous snapshot while showing progress; an error is shown with retry instead
of an empty-success message. Superseded requests are aborted and invalidated.
Cleanup prevents late updates. A 15-second deadline bounds reads, including the
identity lookup before a database request. The current request alone may write
its result. Loading functions have stable dependencies.

`src/api/request.ts` verifies the current SDK user and, when supplied, checks
the expected account ID before a private operation. Database ownership filters
and backend RLS remain authoritative; this helper grants no permission.

### Registrations

Registration reads and mutations formerly split across `workshops.ts` and
`registrations.ts` now live in `registrations.ts`. A single current-user query
returns `RegistrationSnapshot`: all registration workshop IDs plus the joined
workshop cards that are available. IDs are retained when a workshop join is
null. Dashboard and profile explain unavailable details instead of claiming
the account has no registrations.

Dashboard and profile now consume the same snapshot instead of fetching
independently. Navigating between them does not issue another registration
query. Explicit refresh and a confirmed mutation reload that snapshot for all
consumers. Mutation failures remain visible and do not remove a dashboard row
or invent a successful registration. A failed follow-up read remains a read
error with retry; it does not claim the write was rolled back. The hook prevents
overlapping local mutations. Server-side eligibility, transactional races and
the full registration contract remain prompt 09 work.

### Profile

The profile is nullable. Loading, request failure, missing row and loaded data
have distinct presentations. Missing rows do not become profiles fabricated
from auth metadata; there is no editor for an absent record. Retry is available.
The navigation menu uses a generic Account label until profile data exists.

Saving passes the expected account ID to the API, accepts the returned profile,
invalidates older reads and refreshes the displayed record. An old account's
save callback cannot update a newly mounted account store. The editor no longer
overwrites the API's saved avatar value with an older preview. Full profile
provisioning, avatar validation and storage policy work remain prompt 12.

### Admin, theme and error handling

Admin detail reads reject stale selection results and show a retryable error.
An associated-profile query error is propagated instead of returning a
successful registration list with silently missing profiles. Admin mutation
flows and the broader admin feature review remain prompt 13.

The existing Tailwind class-based dark variant is retained. `useTheme` persists
`workify-theme` in browser storage, handles blocked storage and applies the
document's `dark` class. `index.html` now supplies the matching dark body
utilities: its fixed light utilities previously overrode the base dark body
style. The existing light and navy/blue/violet palette is preserved.

`AccountFeedback` exposes mutation/read failures where workshop actions are
used. Registration controls do not claim a known status during a failed or
initial read. The runtime boundary provides a reload screen for render errors;
operational API failures retain their feature-specific messages and retry.
The startup configuration validation remains in place.

## Validation and review

Final results: **92 browser cases passed**, **5 configuration checks passed**,
application/test TypeScript passed, and the production build passed using
isolated public test values. Lint reports 0 errors and 13 warnings (6 in active
source, 7 in the existing `.review-stage05` snapshot). `git diff --check` passed.
Browser fixtures intercept all backend traffic and never create live accounts,
workshops or registrations. Existing auth, routing, browsing and retirement
checks run alongside new shared-state tests.

Commands (PowerShell):

```powershell
$env:PLAYWRIGHT_CHANNEL='chrome'
npx.cmd playwright test --config=playwright.review.local.ts --workers=2 --reporter=line
npx.cmd tsc -p tsconfig.tests.json
npm.cmd run test:config
npm.cmd run lint
git diff --check
$env:VITE_SUPABASE_URL='https://workify-browser-test.supabase.co'
$env:VITE_SUPABASE_ANON_KEY='isolated-browser-test-key'
npm.cmd run build
```

The ignored local Playwright config reuses the existing isolated test servers
to avoid the previously observed Windows web-server teardown hang.

Review one normal flow: session resolves → private store mounts → one joined
registration read → profile and dashboard consume it → a confirmed cancellation
refreshes both views. Review one denied flow: cancellation returns a permission
error → the error is visible and the previous registration remains. Also check
profile error/missing/retry, a delayed response overtaken by a newer refresh,
account change/logout, and actual dark colors before and after reload.

## Remaining release work

No schema or backend permission change is required by this refactor. Cloud
provider settings, applied schema/migrations, hosting rewrites and live
authenticated behavior were not verified in this stage. Earlier documented
public-read/schema drift and archival identity mismatch remain unresolved.
Prompts 08–14 retain their separate lifecycle, registration, meeting-access,
feature and release responsibilities. In particular, this stage does not make
the current client-side meeting-time calculation server-enforced.
