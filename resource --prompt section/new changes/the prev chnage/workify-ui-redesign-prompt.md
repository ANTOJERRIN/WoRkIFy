# Workify — UI Redesign, Pass 1

RTF prompt for Codex: Role–Task–Format.

## ROLE

You are a senior product designer and frontend engineer redesigning Workify, a marketplace for live workshops run by F1 Forge and other hosts.

Create a distinctive, credible workshop product with restrained glossy surfaces, clear typography, and useful information hierarchy.

## TASK

Inspect the current repository, then implement the first UI redesign pass: the public landing page and shared navigation/footer only.

### Project context

- Repository: ANTOJERRIN/WoRkIFy.
- React 19, TypeScript, Vite, Tailwind CSS.
- Application code lives in `frontend/src`.
- Root `src` forwards into `frontend/src`; root `package.json` controls the build.
- Navigation uses `currentPage` in `WorkifyContext`. Preserve this approach.
- Supabase already supplies authentication and application data.
- Earlier design prompts are historical references. This prompt supersedes their visual styling restrictions for this pass.

### 1. Establish the visual direction

Aim for a professional workshop marketplace with a lightly glossy finish:

- Warm off-white page background, deep ink text, and one restrained blue accent.
- Dark mode with charcoal/navy surfaces and readable contrast.
- Use the existing Inter font consistently.
- Subtle top-edge highlights, fine borders, and layered soft shadows on selected surfaces.
- Keep reading surfaces opaque. Use restrained glass effects only where they improve the composition, such as navigation.
- Use a clear spacing scale and deliberate typography hierarchy.
- Prefer moderately rounded controls and cards; reserve pill shapes for compact tags.
- Avoid repeated gradient cards, neon glows, floating decorative panels, oversized empty sections, and excessive badges.
- Preserve the supplied Workify logo.

### 2. Redesign the landing page

Make the product understandable immediately:

- Main headline: “Find your next hands-on workshop.”
- Supporting copy: “Learn directly from people who build. Explore live sessions, practice new skills, and connect with other learners.”
- Primary action: “Explore workshops.”
- Connect this action to the existing authentication/navigation flow.
- Include a compact explanation of the actual journey: discover a session, register, join live.
- Retain a concise “Built by F1 Forge” section.
- Remove or rewrite claims about working sandboxes, verified credentials, project showcases, hiring outcomes, or other features that are not implemented.
- Replace the current AI-heavy marketing sections with useful workshop-focused content.
- Do not invent workshops, dates, prices, attendance counts, testimonials, partners, or ratings.
- Do not add a public workshop feed or change database access policies in this pass.
- Use typography and layout for visual interest rather than stock photos or fabricated product screenshots.

### 3. Refine navigation and footer

- Signed-out navigation: Workify branding and a clear sign-in action.
- Signed-in navigation: preserve Workshops, Dashboard, Profile, the Host action, and conditional Admin access.
- Retain the contact-based hosting flow.
- Improve desktop and mobile spacing, active states, and menu usability.
- Hide the F1 Forge website link everywhere, including the footer, while its configuration contains a placeholder.
- Preserve the configured hosting contact number.

### 4. Make the design usable

- Check layouts at approximately 390px, 768px, and 1440px.
- Provide visible keyboard focus and accessible names for icon buttons.
- Keep touch targets comfortable and text readable.
- Respect reduced-motion preferences.
- Fix the theme wiring so the existing toggle controls Tailwind dark variants consistently.
- Persist the theme preference, using system preference only when no choice has been saved.
- Scope landing-specific styles so existing dashboard and workshop screens remain usable.

### Scope boundaries

- Edit landing components, Navbar, Footer, shared styles, and minimal theme logic in WorkifyContext.
- Do not redesign workshop, profile, review, or admin page bodies yet.
- Do not remove Google sign-in in this pass. Replacing authentication is a separate task; preserve access to the existing app.
- Do not introduce mock sessions, fake signed-in users, or fabricated data to demonstrate the design.
- Do not modify Supabase schema, RLS, Edge Functions, credentials, or AI logic.
- Do not add dependencies.
- Do not push or deploy.

## FORMAT

Implement the changes, rather than returning only a design proposal.

Before editing, briefly state your visual direction and intended files.

After implementation:

1. Run `npm run lint` and `npm run build` from the repository root.
2. If browser tooling is available, inspect the landing page in light and dark modes at mobile and desktop widths. Report any checks you could not perform.
3. Summarize the visible changes, files changed, and validation results.
4. Provide screenshots or a local preview if supported.
5. Stop for my visual review before extending the style to other screens.
