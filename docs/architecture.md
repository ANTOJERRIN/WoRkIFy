# Workify: reviewed source architecture

Prompt 14, 23 October 2026. This describes the local implementation, not an
assertion that the inspected cloud database or an unknown deployed frontend has
these contracts. The release review records the observed differences.

```mermaid
flowchart TD
  Entry["index.html → src/main.tsx"] --> Config["config/runtime.ts: public configuration validation"]
  Config --> Shell["App.tsx: shared shell, Navbar, Footer, dialogs"]
  Shell --> Router["routing/routes.ts + useUrlRoute.ts"]
  Router --> Public["Landing / discovery / safe workshop detail"]
  Router --> Guard["routing/RouteGuard.tsx"]
  Guard --> Personal["Dashboard / profile / contact hosting"]
  Guard --> Admin["AdminPage: independent management list"]
  Shell --> State["WorkifyContext.tsx"]
  State --> Session["auth/useSession.ts: identity and admin permission"]
  State --> Catalog["hooks/useCatalog.ts: public metadata"]
  State --> Scope["identity-keyed private provider"]
  Scope --> Profiles["hooks/useProfile.ts"]
  Scope --> Registrations["hooks/useRegistrations.ts"]
  State --> UX["useTheme / useModals / useModalDialog"]
  Public --> WorkshopAPI["api/workshops.ts: explicit safe projection"]
  Catalog --> WorkshopAPI
  Personal --> Profiles
  Personal --> Registrations
  Profiles --> ProfileAPI["api/profile.ts + profileValidation.ts"]
  Registrations --> RegistrationAPI["api/registrations.ts"]
  Personal --> MeetUI["MeetingAccessControl + useMeetingAccess"]
  Public --> MeetUI
  MeetUI --> MeetAPI["api/links.ts: typed safe states and expiring access"]
  Admin --> AdminAPI["api/admin.ts: verified membership and confirmed writes"]
  Session --> AdminAPI
  WorkshopAPI --> PublicClient["lib/supabase.ts: independent public client"]
  ProfileAPI --> SessionClient["lib/supabase.ts: session client"]
  RegistrationAPI --> SessionClient
  MeetAPI --> SessionClient
  AdminAPI --> SessionClient
  PublicClient --> DB["Supabase: tables, grants, RLS and triggers"]
  SessionClient --> DB
  ProfileAPI --> Storage["Supabase avatars bucket: intentionally public images, owner writes"]
  DB --> RPC["get_workshop_join_state: server identity/time and registration"]
  RPC --> External["Authorized external Google Meet link"]
  Domain["domain/workshopLifecycle.ts + workshopInput.ts"] --> Public
  Domain --> Personal
  Domain --> Admin
```

The public detail page can display the shared meeting control, but it fetches
protected access only for an authenticated registered user. Workshop metadata
queries do not include the URL. Meeting access does not call an assessment system.
No active review/assessment function branch exists in this architecture.

`useResource` owns read timeout, abort, latest-request-wins and explicit error /
refresh states. Mutation owners reconcile shared snapshots after a result; they
do not infer success from a click or an empty affected-row response. A new account
gets a fresh private provider and feature tree; the safe public catalog, theme
and URL can persist. Client lifecycle/route checks explain actions; server grants,
ownership, validation and server time authorize them.

The canonical application is the repository root with `src/`, `public/`, one
lockfile and one Vite build. `frontend/` is retired. The `.review-stage05/`
historical local snapshot is ignored and preserved. Tailwind source detection
is explicitly restricted to `src/` and root `index.html`, so prompt documents,
tests and old snapshots cannot change production CSS.

`backend/supabase/migrations/` contains historical and pending SQL sources.
`tests/database/integration.test.mjs` applies the combined contracts only in a
disposable PGlite instance with minimal auth/storage fixtures. Browser fixtures
are test-only entry points and are excluded from production output by the Vite
module boundary. Neither test setup creates a production session or bypass.

Historical review rows remain in `linkedin_reviews`; archival preserves them.
The exact retired workshop stays archived in the local contract. A future
assessment or approved-host self-service product requires a separate decision.
Google sign-in remains removed and no replacement authentication was introduced.
