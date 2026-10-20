# Workify — Remove Google sign-in before backend work

## Copy-and-paste implementation prompt

Work in `ANTOJERRIN/WoRkIFy`. Temporarily remove the Google sign-in option from the landing-page authentication flow and all other authentication entry points. Preserve Workify's previous blue/violet frontend restored in PR #3 (`fix/restore-original-frontend`). Do not redesign the website.

### Required behavior

1. Remove the **Continue with Google** button, Google logo, and Google OAuth handler from `frontend/src/components/auth/AuthModal.tsx`.
2. Inspect `frontend/src/context/WorkifyContext.tsx`: its current `login()` calls `supabase.auth.signInWithOAuth({ provider: 'google' })`. Remove this Google OAuth implementation and update its context interface and callers so no remaining UI action can initiate Google OAuth.
3. Keep the landing page visible to visitors. Change its **Get started** and **Sign in to continue** actions, and the logged-out navbar **Sign in** action, so none opens an empty or broken sign-in screen. Provide an **Explore workshops** action that opens the existing public workshop listing. Reuse the existing component styling and layout.
4. If another feature requires authentication, show a clear message: **“Sign-in is temporarily unavailable while we update authentication.”** Give users a working close/back action. Do not redirect them to Google or leave a dead button.
5. Preserve existing authenticated sessions, session restoration, logout, and authenticated user/admin permissions. Anonymous browsing must not permit registration, hosting, private profile access, admin actions, or access to gated meeting links. Enforce these restrictions on the backend as well as in the UI.
6. Do not introduce mock login, fake users, hardcoded admin access, or an unrequested replacement authentication method. Email/password or OTP will be handled in a separate backend task.

### Files to inspect

- `frontend/src/components/auth/AuthModal.tsx`
- `frontend/src/context/WorkifyContext.tsx`
- `frontend/src/components/landing/HeroSection.tsx`
- `frontend/src/components/layout/Navbar.tsx`
- Any other callers of `login` or `setIsAuthModalOpen`, plus route and API authorization checks.

### Scope boundaries

- Use PR #3's restoration as the frontend baseline; inspect current Git history before editing to avoid accidentally reintroducing yesterday's redesign.
- Do not remove the landing page itself.
- Keep Google Meet workshop links and Google Calendar integration. These are unrelated to Google sign-in.
- Preserve the existing design, light/dark modes, mobile layouts, workshop data, database schema, and server-side authorization.
- This task removes the app's Google sign-in entry points. Do not claim the Supabase Google provider has been disabled unless its configuration was actually changed and verified. Report any remaining provider configuration separately.
- Do not delete existing users or credentials, run destructive migrations, or expose secrets.

### Acceptance checks

- No Google sign-in button or actionable Google OAuth call remains in the app.
- Landing page and public workshops load for signed-out visitors.
- Every affected CTA has a working destination or clear temporary-unavailability message.
- Existing signed-in users retain normal session behavior and logout.
- Protected actions and private data remain inaccessible to anonymous visitors.
- Google Meet and Calendar features remain intact.
- Run the production build and lint; distinguish existing warnings from new failures.
- Check desktop/mobile and light/dark presentation, and the signed-out CTA flow.

Create a focused commit and pull request. Summarize the changed files, checks performed, and any remaining authentication configuration work. Do not merge or deploy as part of this prompt.
