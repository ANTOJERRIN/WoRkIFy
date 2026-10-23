# Prompt 06: authentication and session boundary

Implemented locally on top of prompt 05 (`5c1fb28`). The user will review and
push the code. No new commit, pull request, push, merge or deployment was made
for this stage. Prompts 07–14 remain separate stages.

## Confirmed gaps and implementation

Previously, restoration failures became ordinary signed-out state, sign-out
ignored the SDK's returned error, and late private-data responses could write
into a different account's state. Session handling also lived alongside the
catalog in the main context.

- New `src/auth/useSession.ts` owns session initialization, auth events, logout
  and the separate admin permission check. It exports `SessionAccess`,
  `SessionStatus` and `PermissionStatus`; it owns no workshop-list state.
- Session states are `loading`, `authenticated`, `signed-out` and `failed`.
  Admin states are `pending`, `allowed`, `denied` and `failed`. Session and
  permission resolution each stop waiting after 12 seconds. A later valid
  auth result can recover the session. A timed-out permission request stays
  denied until the session boundary is recreated or the identity changes.
- The auth listener is synchronous and unsubscribes on cleanup. A newer auth
  event takes precedence over an older initialization result. Inactive
  subscriptions and completed requests cannot update an unmounted boundary.
- `WorkifyContext.tsx` consumes that interface. Identity changes clear profile,
  registrations, registration progress and dialogs. Request generations reject
  late profile/registration reads and mutation results. Profile updates and
  reloads from an earlier account are also ignored.
- `checkIsAdmin` in `src/api/admin.ts` now distinguishes a failed request from
  a confirmed absence of permission. Neither failure nor pending status grants
  access. User-editable metadata is used only for profile display fallback.
- `App.tsx` remounts personal pages, workshop details and navigation menus when
  identity changes so component-local private data cannot survive an account
  switch. It shows sign-out errors. Navbar disables sign-out while pending.
- `RouteGuard.tsx` displays restoration/permission failures and lets a visitor
  open the existing unavailable-auth dialog. Public pages bypass this guard.
- The reset profile in `src/data/mockData.ts` now contains empty fields and a
  generic user label instead of fabricated skills, biography and identity.

The existing `AuthModal.tsx` and `useModalDialog.ts` already provided Close,
Escape, Tab containment, background isolation and focus restoration; these were
retained and tested. The blue/violet styling is preserved.

## Requests and access

Normal request: the SDK restores a valid session → the boundary publishes the
identity → profile and registration reads begin, and a separate admin lookup
runs → ordinary personal routes become available. The backend still enforces
ownership and authorization; a browser guard is not a backend permission.

Denied request: a visitor requests `/profile` → the guard waits for restoration
→ signed-out or failed state displays the explanation without mounting the
profile component → Sign-in information opens the dismissible dialog → Explore
workshops navigates to the fixed internal `/workshops` path. Public Explore
buttons never request authentication. No `returnTo` parameter is consumed, no
external return destination is accepted, and protected actions are not retried
automatically. The requested private URL remains in place until navigation.

Successful logout clears private state and navigates home. A rejected logout
does not manufacture success or clear a still-valid identity. The installed
SDK can emit `SIGNED_OUT` and remove the local session before returning a
remote sign-out error; in that case the UI removes private content and explains
that sign-out on other devices could not be confirmed. It never restores the
old session to hide that error.

## Validation

- Full browser suite: **64 passed**, desktop and mobile, using installed Chrome
  and intercepted test-only auth/API responses.
- Final focused session run, including the additional expired stored-session
  check and final identity guards: **20 passed**.
- Configuration suite: **5 passed**.
- Production build: passed with isolated public test environment values.
  These values are not a real release configuration.
- Application and browser-test TypeScript checks: passed.
- Lint: 0 errors, 16 warnings across the checkout; 9 are in active source and
  7 come from the pre-existing untracked `.review-stage05` review snapshot.
- `git diff --check`: passed. The existing archival database identity mismatch
  described in `docs/prompt-history.md` was not changed or retested here.

The normal Playwright runner again stalled during Windows server teardown.
The completed full run used ignored `playwright.review.local.ts` to reuse the
same isolated servers; that run exited successfully. The production entry
never imports the test controller or stored-session fixtures.

Commands run (PowerShell; browser tests used `PLAYWRIGHT_CHANNEL=chrome`):

```powershell
npx.cmd playwright test --config=playwright.review.local.ts --workers=2 --reporter=line
npx.cmd playwright test tests/browser/auth-session.spec.ts --config=playwright.review.local.ts --workers=2 --reporter=line
npm.cmd run test:config
npm.cmd run lint
npx.cmd tsc -p tsconfig.tests.json
git diff --check
$env:VITE_SUPABASE_URL='https://workify-browser-test.supabase.co'
$env:VITE_SUPABASE_ANON_KEY='isolated-browser-test-key'
npm.cmd run build
```

## Backend and release status

No schema/policy changes or migration applications are required by this stage.
No auth provider was added and Google sign-in entry points remain removed.
Connected Supabase project listing was read successfully. Historical diagnosis
identifies `epgsgvwdlwarktbjrdfn`; the local release environment remains absent.
The connected tools do not expose an auth-provider configuration read, so the
cloud Google-provider enabled/disabled state remains **unverified**. No provider
setting was changed. Review that setting in the confirmed project's dashboard
separately from the app's removed button.

Previously documented public-read migration/schema drift and deployment
rewrite checks remain release prerequisites. Live authenticated behavior,
hosting configuration and deployed refresh behavior were not verified.

Auth event and cleanup behavior was checked against the installed SDK and
[Supabase's auth-event reference](https://supabase.com/docs/reference/javascript/auth-onauthstatechange).

## Manual student review

1. Read `useSession` and trace initialization → identity → permission. Explain
   why session loading and admin permission loading are different.
2. Open landing and workshops without a session. Confirm Explore stays public.
3. Request `/profile`, open Sign-in information, cycle Tab/Shift+Tab, press
   Escape and verify focus returns. Reopen and use Close and Explore workshops.
4. With an existing valid session in an isolated environment, inspect profile
   and logout. Confirm private content disappears after expiry/sign-out.
5. Review the delayed-account-response and logout-failure browser tests. Explain
   why late results are ignored and a remote logout failure can coexist with
   local sign-out.
6. Review the local diff before making your own commit and push. No PR link is
   provided because GitHub publication is reserved for the user.
