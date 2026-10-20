# Consolidate the application structure

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

**Architecture modules:** Root src wrappers + frontend/src + duplicate Vite/index/public/package files + backend/supabase.

**Run:** After 03.

## Role

Act as a senior frontend engineer improving maintainability for a small React/TypeScript application maintained by student developers.

Prefer clear organization and a small number of well-defined modules.

## Architecture-specific refinement

Own physical layout, build configuration and documentation. Do not couple this change to a design rewrite or database schema redesign. Trace each diagram module to its final path and provide a migration map from old to new paths so later prompts can locate renamed files. Verify install/build from the documented location and preserve backend isolation. A monorepo/workspace is optional, not a requirement; choose the simplest working setup.

## Task

Consolidate Workify’s duplicate root/frontend setup into one documented application setup.

Preserve existing behavior, styling and backend connections.

### 1. Map the current structure

Inspect:

- Root package.json and lockfile.
- Root and frontend entry files.
- Root and frontend Vite configuration.
- TypeScript configuration.
- Stylesheet imports.
- Public assets.
- Root wrapper components.
- Configuration re-exports.
- Backend functions and migrations.
- Any deployment settings.

Choose the canonical structure based on the working build and deployment requirements. Explain the choice.

### 2. Consolidate safely

- Establish one authoritative frontend entry point.
- Establish one clear dependency/install strategy.
- Remove redundant wrappers and configuration only after references are updated.
- Consolidate duplicate public assets.
- Preserve image paths and font loading.
- Keep backend code clearly separate.
- Preserve the dependency lockfile and reproducible installation.
- Keep historical planning documents separate from active application code.

Do not rewrite the UI or change frameworks.

### 3. Keep modules understandable

Organize responsibilities such as:

- Application bootstrap and routing.
- Feature components.
- Shared layout and UI.
- API/data access.
- Shared types.
- Runtime configuration.
- Authentication/session state.
- Backend migrations/functions/tests.

Use feature folders where useful. Avoid creating abstractions that do not solve an actual problem.

### 4. Improve configuration handling

- Document required environment variable names and purposes.
- Never expose server secrets through browser-prefixed variables.
- Keep example configuration free of credentials.
- Provide a clear startup/configuration error when required public configuration is missing.
- Ensure the canonical build location is explicit.

### 5. Update documentation

Document:

- Installation command.
- Local development command.
- Production build command.
- Preview command.
- Required environment setup.
- Frontend location.
- Backend location.
- Migration workflow.
- Deployment root/build/output settings.
- Which features currently work and which remain unavailable.

## Validation

- Install from a clean dependency state.
- Run the canonical build.
- Verify assets resolve.
- Verify backend imports/functions are not accidentally included in the browser bundle.
- Confirm no application source is omitted from the intended TypeScript checking.
- Run lint and relevant tests.

## Format

Create a pull request with:

1. Before/after structure.
2. Reasons for the chosen layout.
3. Moved/removed files and updated references.
4. Exact run/build instructions.
5. Validation results.
6. Any deployment setting that must change after review.

Do not merge or deploy.
