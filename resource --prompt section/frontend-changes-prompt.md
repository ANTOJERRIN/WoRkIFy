## Context (carry forward)
- Repo: WoRkIFy — Vite + React 19 + TypeScript. Frontend-only pass.
- The existing design (Stitch/Figma + DESIGN.md tokens) is the source of truth. Keep all colors, typography, spacing, radius, and glass rules unchanged. Light and dark mode must keep working on every screen touched.
- Content rule: never invent workshops, stats, testimonials, numbers, URLs, or contact details.
- Values I will supply (replace before running, or leave as-is and the placeholders below apply):
  - HOST_CONTACT_NUMBER: [FILL: contact number for hosting requests]
  - F1FORGE_URL: [FILL: F1 Forge website URL]

Objective:
Apply the changes from my design review to the existing frontend in two groups — A (landing page, logged out) then B (logged-in screens) — pausing for review after each group.

Starting State:
The landing page is built (header, hero with a glass panel titled "AI is becoming a teammate", Why Workify, AI Landscape, Built by F1 Forge, footer). Logged-in screens exist to whatever extent the repo shows. Inspect the repo first to see what actually exists, including how sign-in and session state are currently handled, and reuse that. Do not replace or add an auth provider.

Target State:

Group A — Landing page (logged out)
1. Remove the hero glass panel titled "AI is becoming a teammate" entirely (its icon, title, pills, and supporting lines). Rebalance the hero as a single-column, text-led layout using existing spacing tokens; keep the atmospheric background glow.
2. Remove every GitHub link, icon, redirect, and mention from every page in the app (header, footer, F1 Forge section, profile, anywhere else). Links that do not point to GitHub stay.
3. Remove the "Verifiable proof guarantee" element from every page. If it is its own component, leave the file in place but unused so it can be restored later; otherwise delete the markup.
4. In the "Built by F1 Forge" section, keep the existing name/credit and add a link to the F1 Forge website using F1FORGE_URL. Do not change the other sections' content.
5. Page flow stays: what Workify is, then "get started" by signing in, then who built it.

Group B — Logged-in screens
6. Header nav: Workshops, Dashboard, Profile, plus the standalone "+ Host" pill button.
7. After a successful sign-in, redirect to /workshops.
8. /workshops shows an "Upcoming" list covering all tracks, containing exactly two entries and nothing else:
   - a LinkedIn workshop card: title "LinkedIn Workshop", host "F1 Forge", mode "Online", date "Date to be announced", with the existing Register behavior
   - an "Other tracks — coming soon" placeholder card, non-interactive
   Keep this data in one file, src/data/workshops.ts, so it can be updated later without touching components. Remove any other sample workshop data.
9. /dashboard is available to every signed-in user and shows only that user's registered workshops, with an empty state ("You haven't registered for any workshops yet" with a link to /workshops). Remove the "Hosting" section. Signed-out visitors are redirected to /signin.
10. /profile shows the signed-in user's details that are already available (name, email, avatar), plus a "Verified proof of skills" section rendered as an "In development — coming soon" notice. No functional logic for that section yet.
11. Hosting is not self-serve. The "+ Host" button goes to /host (add the route if missing), which shows a short message asking people to contact HOST_CONTACT_NUMBER to have a workshop listed, with the number as a tel: link. Remove any workshop-creation form or flow that exists.

Put HOST_CONTACT_NUMBER and F1FORGE_URL in a single file, src/config/site.ts. If a value is still in [FILL] brackets, use a clearly named placeholder constant there and do not invent a value.

Allowed Actions:
- Create and edit files inside src/, including src/config/site.ts and src/data/workshops.ts
- Add the /host route
- Run npm run lint and npm run build to verify

Forbidden Actions:
- Do NOT add any dependency
- Do NOT add or change any backend, database, or auth-provider code
- Do NOT change design tokens, colors, typography, or the light/dark mode setup
- Do NOT touch package.json or package-lock.json
- Do NOT run the dev server, deploy, or push to git
- Do NOT invent workshops, dates, URLs, phone numbers, or statistics

Stop Conditions:
Pause and ask before proceeding when:
- An element named in the change list cannot be found in the repo
- Removing an element breaks the layout in a way that needs a redesign rather than a rebalance
- The source of the signed-in user's details for /profile is unclear
- An error can't be resolved in 2 attempts
- Anything outside src/ needs to change

Checkpoints:
After Group A and after Group B, output: ✅ what was completed, every file touched, and anything skipped and why. At the end, output a full summary of all files changed and a list of any placeholders still unfilled.

This prompt is for an agentic tool with real system access. Review the scope locks, forbidden actions, and stop conditions before pasting. Confirm file paths, directories, and permissions match the actual project.
