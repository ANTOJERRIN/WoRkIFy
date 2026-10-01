# Workify — Remaining Changes (RTF prompts)

Audit of the live repo (`frontend/` subfolder) confirms ① and ⑧ are done. Below covers ②–⑦, each as its own Role/Task/Format prompt — paste one at a time into Antigravity, review the diff, then move to the next.

Two extra issues turned up while reading the code, not in your notes — fixed inside the relevant prompt below:
- The F1 Forge section uses a stock Unsplash photo for "Jerrin Anto" — stock photography is banned by DESIGN.md.
- The hero still has a leftover "Verified credentials" micro-badge — a small claim that doesn't belong until ⑦ is actually real.

---

## Prompt A — Workshops: real data only (covers ④)

**Role:** You are editing `frontend/src/data/mockData.ts` in the Workify repo, a Vite + React + TypeScript app.

**Task:** Replace the four fabricated `INITIAL_WORKSHOPS` entries (LangGraph, RAG, AST agent, WebGPU — all with fake hosts, fake attendee counts, fake stock photos) with exactly two entries: (1) the real LinkedIn workshop — title "LinkedIn Workshop", host "F1 Forge", mode "Online — Google Meet", date "Date to be announced", no fabricated attendee count or made-up agenda; (2) a non-interactive "Other tracks — coming soon" placeholder entry, clearly flagged in the data (e.g. `comingSoon: true`) so `WorkshopCard.tsx` and `WorkshopsPage.tsx` can render it as disabled/greyed rather than clickable. Update those two components minimally if needed to handle the `comingSoon` flag. Do not invent any other workshop.

**Format:** Only touch `mockData.ts`, `WorkshopCard.tsx`, `WorkshopsPage.tsx`, `WorkshopDetailPage.tsx`, and `types/index.ts` if a new field is needed. Do not change styling, colors, or layout beyond what the removed/changed data requires. Run `npm run build` after to confirm no type errors from the removed fields (attendeesCount, maxAttendees, fake agenda, etc. on the deleted entries). Stop and ask if removing those fields breaks a type other components still rely on.

---

## Prompt B — Profile: dev-mode notice, not fake credentials (covers ⑥ and ⑦)

**Role:** You are editing `frontend/src/components/profile/ProfilePage.tsx` and `frontend/src/data/mockData.ts` in the Workify repo.

**Task:** The current profile page shows fabricated "Verified Proof of Builds" credentials (fake hashes, fake badge types, fake issuer) and a fake "DID" verification ID — remove all of it. Replace the "Verified Proof of Builds" section with a single card titled "Verified proof of skills" containing the text "In development — coming soon" and no functional logic. Remove the `credentials` array from `mockData.ts` and the `verifiedId` field along with every place that renders them (including the "Verified Builder" badge and DID line in the profile header, and the "My Workshops & Proofs" label in the navbar avatar menu — rename it to something that doesn't imply proofs exist yet, e.g. "My Workshops"). Keep the real fields: name, headline, bio, location, skills, links.

**Format:** Only touch `ProfilePage.tsx`, `mockData.ts`, `types/index.ts` (remove unused credential types), and `Navbar.tsx` for the one label change. Keep the existing card styling (radius, borders, glass rules) — only the content and the removed section change. Run `npm run build` to confirm removing the credential types doesn't break anything elsewhere. Stop and ask if `credentials`/`verifiedId` are referenced anywhere outside these files.

---

## Prompt C — Hosting by contact only, not self-serve (covers ③)

**Role:** You are editing `frontend/src/components/workshops/HostWorkshopModal.tsx`, `Navbar.tsx`, and `DashboardPage.tsx` in the Workify repo.

**Task:** Hosting must not be self-serve. Replace `HostWorkshopModal`'s current form (title/domain/description/date/meet-link fields that publish directly) with a simple message: "Want to host a workshop? Contact us to get it listed." plus a tel: link using `HOST_CONTACT_NUMBER` from `frontend/src/config/site.ts`. Remove the `hostNewWorkshop` publish logic this modal currently calls — the "+ Host" button in the Navbar and the "Host new workshop" / "Create workshop" buttons in `DashboardPage.tsx` should all open this same contact-only modal instead of a creation form.

**Format:** Only touch the three files named above. Do not remove the "Hosting" section of the dashboard in this prompt — that's handled separately. Do not add any backend call; this is a static contact prompt. If `HOST_CONTACT_NUMBER` is still the placeholder string, render it as-is rather than inventing a number. Run `npm run build` after.

---

## Prompt D — One generic signed-in identity, not a hardcoded person (covers ⑤)

**Role:** You are editing `frontend/src/context/WorkifyContext.tsx` and `frontend/src/data/mockData.ts` in the Workify repo.

**Task:** Right now `login()` just flips a boolean and every signed-in session shows the same hardcoded `INITIAL_USER` ("Jerrin Anto"). Since there's no real auth system yet, make the demo session generic rather than impersonating a specific real person: change `INITIAL_USER`'s name to something neutral like "Your name", headline/bio to generic placeholder copy, and remove the specific personal bio details (Bengaluru, F1 Forge lead, etc.) — this is a stand-in for "whoever signs in," not a specific person's profile. Leave the data shape (fields/types) unchanged so a real per-user system can slot in later without a rewrite.

**Format:** Only touch `WorkifyContext.tsx` (if the default state lives there) and `mockData.ts`. No styling changes. This is a placeholder-data change only — do not build real multi-user accounts or auth in this pass. Run `npm run build` after.

---

## Prompt E — Remove the leftover "Verified credentials" hero badge and the stock founder photo

**Role:** You are editing `frontend/src/components/landing/HeroSection.tsx` and `frontend/src/components/landing/F1ForgeSection.tsx` in the Workify repo.

**Task:** In `HeroSection.tsx`, remove the "Verified credentials" micro-metadata chip (the one next to "Interactive workshops") — it implies a feature that doesn't exist yet. Keep "Interactive workshops" alone, or remove the whole micro-metadata row if one item looks unbalanced. In `F1ForgeSection.tsx`, remove the Unsplash stock photo used for "Jerrin Anto" — replace the image with a simple initial-based avatar (e.g. a circle with "J" or "JA") using the existing color tokens, rather than any stock or placeholder photo.

**Format:** Only touch these two files. Keep spacing and layout intact — removing the chip or photo shouldn't leave a visible gap; adjust alignment minimally if needed. Run `npm run build` after.

---

Agentic output warning: these prompts give an agent real filesystem access. Review each one's scope before pasting, and check the diff after each before moving to the next — don't queue all five at once.

**Not a prompt (on you):** ② just needs the real F1 Forge URL and the real hosting contact number pasted into `frontend/src/config/site.ts`, replacing the two `[FILL: ...]` placeholders. No agent needed for that — it's already wired into the F1 Forge link and will be wired into Prompt C's contact link.
