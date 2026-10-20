# Implement URL-based navigation

## Architecture contract and working rules


- Repository: `ANTOJERRIN/WoRkIFy`. RTF = Role, Task, Format.
- Reference: the supplied `diagram.png` maps routing/layout, shared state, feature pages, API modules, the Supabase client, database and review function. Treat it as a map to validate against current code, not evidence that every arrow is correct.
- Preserve the restored blue/violet UI, mobile layouts and useful existing behavior. This is functional repair and structural improvement, not a visual redesign.
- Public: landing, workshop discovery and safe workshop details. Protected: personal data, registration, meeting links, administration. Hosting remains contact-first and admin-controlled.
- Google sign-in remains removed. Do not select or implement a replacement method, fake authentication or privileged anonymous access.
- Retire the completed LinkedIn workshop and its specialized review experience; preserve historical data and ordinary LinkedIn contact links.
- Keep feature pages dependent on typed API modules; keep database calls in the data layer. Server authorization remains authoritative.
- Recheck the current branch and approved prior-stage outputs. The filenames below refer to the reviewed architecture; follow renamed equivalents after consolidation.
- Make focused commits and a reviewable pull request. No merging, deployment, destructive cleanup, new paid services or invented sample workshops.
- Report separately: code implemented, tests run, migrations applied, cloud configuration verified, and live behavior verified. Do not claim any unperformed check passed.

## Scope and dependency

**Architecture modules:** App.tsx; Navbar; LandingPage; WorkshopDetailPage; DashboardPage; ProfilePage; AdminPage.

**Run:** After 04.

## Role

Act as a React engineer implementing predictable navigation while preserving Workify’s existing page components.

## Architecture-specific refinement

Own URL navigation, page shell and route-level guards, not session implementation. Consume the session interface owned by 06. Use route identifiers as the source of selected workshop identity, load by slug/ID, and handle direct-load failures. Layout renders Navbar/Footer once. Link sharing uses actual individual routes. Explicitly retain the landing page as a public route; do not replace it with a forced authentication screen. Verify hosting rewrites separately from local navigation.

## Task

Replace page selection based only on in-memory React state with URL-based routing.

### 1. Implement routes

Support clear routes for:

- Landing.
- Workshop listing.
- Individual workshop details.
- Personal dashboard.
- Personal profile.
- Admin.

Prefer stable workshop slugs or IDs already supported by the data model.

Do not introduce public user-profile access without defining its data and privacy requirements.

### 2. Preserve expected browser behavior

- Refreshing a route must keep the user on the same page.
- Directly opening a workshop URL must load that workshop.
- Back/Forward must follow navigation history.
- Unknown routes must show a useful not-found page.
- Missing workshop records must show a workshop-not-found state.
- Public pages must remain usable without authentication.

### 3. Implement protected routes

- Wait for initial session resolution before deciding access.
- Prevent private page content from briefly rendering for anonymous users.
- Keep admin permission separate from ordinary sign-in.
- Provide a clear unavailable-authentication message when a protected route is requested.
- Do not implement a new sign-in method in this task.
- Preserve existing valid sessions and logout.

### 4. Fix sharing

- Workshop sharing must copy the individual workshop URL.
- Handle clipboard failures gracefully.
- Remove or disable profile sharing if there is no implemented public-profile route.
- Do not generate links that the application cannot resolve.
- Ensure copied links do not include credentials or session tokens.

### 5. Configure deployment compatibility

- Identify the actual hosting platform/configuration when possible.
- Add or document the SPA fallback needed for direct routes.
- Do not blindly redirect API/function requests to index.html.
- Clearly distinguish local route verification from deployed refresh verification.

## Validation

Test:

- Direct workshop URL.
- Refresh on workshop details.
- Back/Forward.
- Unknown route.
- Missing workshop.
- Anonymous access to public routes.
- Denied access to private/admin routes.
- Session-loading behavior.
- Shared workshop links.
- Deployment fallback configuration.

## Format

Create a focused pull request with:

1. Route table.
2. Guard behavior.
3. Sharing behavior.
4. Hosting configuration requirements.
5. Test results.
6. A beginner-friendly explanation of URL routing versus previous page state.

Do not merge or deploy.
