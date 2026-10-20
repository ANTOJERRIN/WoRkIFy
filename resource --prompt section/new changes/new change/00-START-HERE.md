# Workify — Architecture-aligned prompt sequence

Prepared 20 October 2026. These files refine and supersede the earlier eight prompts, using the supplied diagram and the user's reported failures. RTF means **Role, Task, Format**.

## How to use

1. Give Codex this guide and the architecture image for context.
2. Run 01 as a read-only diagnosis. Review the evidence before implementation.
3. Use one numbered function prompt at a time. Review each stage's diff, tests and explanation.
4. Carry approved contracts and renamed file paths forward. If previous changes remain unmerged, explicitly use a reviewed dependent branch or a clear stacked PR; never silently work from an older baseline.
5. Each stage is authorized to implement its stated scope and open a PR. No prompt authorizes automatic merging or deployment.
6. Report inaccessible cloud checks as unverified. Source migrations, applied migrations and deployed behavior are different things.
7. Preserve the current visual style. All active functionality must use real data; isolated test fixtures are allowed, fabricated production content is not.

## Original intention and revised scope

Public discovery → workshop detail → authenticated registration → personal dashboard → authorized external meeting access.

Profile editing and admin operations support that journey. Hosting stays contact-first/admin-controlled. Google sign-in stays removed; replacement authentication is a separate future decision. New visitors can browse but cannot use private account functions until a legitimate authentication method is provided. This limitation must be explained accurately, not bypassed.

Retire the LinkedIn workshop and specialized AI review branch from active use while preserving historical data and normal LinkedIn profile contact links. A future general assessment system is outside this work.

## Architecture reading

The diagram maps:
- App routing and page shell: App.tsx, LandingPage.tsx, Navbar.tsx.
- Shared state: WorkifyContext.tsx.
- Features: workshops, details, host contact, attendee dashboard, profile/editor, admin, authentication dialog.
- Data services: workshops.ts, registrations.ts, links.ts, profile.ts, admin.ts, reviews.ts.
- Infrastructure: supabase.ts, database/storage, review edge function.

File paths may change during consolidation. Codex must provide an old-to-new path map. Diagram arrows must be checked against source: crossing lines are not evidence that meeting access invokes a review function. The active review branch is being retired.

## Function and execution map

| Order | File | Specific responsibility |
| --- | --- | --- |
| 01 | [01-architecture-and-runtime-diagnosis.md](01-architecture-and-runtime-diagnosis.md) | Confirm causes, diagram mapping, deployment and database evidence; no edits |
| 02 | [02-public-catalog-and-overlay-fix.md](02-public-catalog-and-overlay-fix.md) | Fix public browsing, query states, retry and blurred overlay |
| 03 | [03-retire-linkedin-review-branch.md](03-retire-linkedin-review-branch.md) | Archive old workshop and retire assessment UI/service callers |
| 04 | [04-canonical-project-layout.md](04-canonical-project-layout.md) | One authoritative frontend setup and documented build layout |
| 05 | [05-url-routing-and-page-shell.md](05-url-routing-and-page-shell.md) | Stable URLs, browser navigation, page shell and sharing |
| 06 | [06-auth-session-and-modal.md](06-auth-session-and-modal.md) | Existing session lifecycle, guards and accessible unavailable-auth dialog |
| 07 | [07-shared-state-and-api-boundaries.md](07-shared-state-and-api-boundaries.md) | Separate data responsibilities, async handling and typed API boundaries |
| 08 | [08-workshop-lifecycle-contract.md](08-workshop-lifecycle-contract.md) | One schedule/status/visibility contract and compatible schema |
| 09 | [09-registration-service.md](09-registration-service.md) | Registration/cancellation ownership, eligibility and race-safe mutations |
| 10 | [10-meeting-link-access.md](10-meeting-link-access.md) | Server-enforced meeting eligibility and shared join states |
| 11 | [11-attendee-dashboard.md](11-attendee-dashboard.md) | Accurate personal workshop workspace and protected join controls |
| 12 | [12-profile-editor-and-avatar.md](12-profile-editor-and-avatar.md) | Profile editing, validation, ownership and avatar uploads |
| 13 | [13-admin-and-contact-hosting.md](13-admin-and-contact-hosting.md) | Admin workshop lifecycle and contact-first hosting |
| 14 | [14-integration-review-and-release-plan.md](14-integration-review-and-release-plan.md) | Integrated evidence, student walkthrough and deployment/rollback plan |

## Boundaries that prevent duplicate work

- 02 fixes the immediate public regression; 05 owns routing; 06 owns session behavior.
- 07 owns shared state boundaries, not a second session implementation.
- 08 owns lifecycle definitions; 09 enforces registration; 10 enforces meeting retrieval.
- 11, 12 and 13 consume those services instead of duplicating database logic.
- 03 handles archival/review retirement; 08 reconciles it into the final lifecycle model.
- 14 reviews the final integrated result and does not automatically deploy it.

## Student review habit

For each stage, read the diff and explain one request from UI to data service to backend policy. Test one success and one denied/failure case. Review data migrations separately. Ask for an explanation of code you cannot explain yourself. Your product decisions plus evidence-based review are a sound development practice; logs alone are not a substitute for understanding and tests.
