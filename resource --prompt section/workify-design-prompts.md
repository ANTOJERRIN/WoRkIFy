# Workify — Screen Prompts (paste one at a time into Stitch's normal prompt box)

Use these inside the SAME Stitch project you pasted DESIGN.md into ("Start with your design" step) — the design tokens, nav rules, and content rules below are now inherited from that file, so these prompts only need to describe each screen's content and layout.

---

## Prompt 1 — Landing page (logged-out)

```
Design the logged-out landing page for Workify — the public entry point, before sign-in.

Header: logo only, left. "Sign in" button, right. No other nav items (per DESIGN.md's logged-out rule).

Hero: eyebrow "THE NEXT ERA OF WORK," headline "AI is moving from answers to action," supporting line "Learn to build what comes next," body: "Workify turns AI learning into hands-on workshops, real projects and opportunity — so you don't just learn what AI can do. You learn how to build with it." Primary CTA "Get started," secondary CTA "Sign in to continue." On the right, a floating glass panel: title "AI is becoming a teammate," pills "AI AGENTS" / "GEN AI," line "Human + AI collaboration." No robot illustration, no AI-brain graphic.

Why Workify: dark section, eyebrow "WHY WORKIFY," heading "Learn by building. Build for what comes next." Three numbered cards: "Learn by building — Hands-on experiences instead of passive tutorials," "Work with what's next — AI agents, GenAI, automation and cloud," "Turn skills into opportunity — Projects become proof of what you can do."

AI Landscape: light section, eyebrow "THE AI LANDSCAPE," heading "From copilots to autonomous agents," supporting line "The tools are changing quickly. Workify is designed around learning how to use, build and collaborate with them." Four theme cards: AGENTS, GENERATIVE AI, AUTOMATION, HUMAN + AI.

F1 Forge section: left — "Built by F1 Forge." / "A team building practical technology experiences for the next generation of builders." Right — a glass profile panel: "F1 Forge," "Led by Jerrin Anto," "View profile →" linking to jerrin-ai.onrender.com.

Footer: minimal — "© 2026 Workify," optional LinkedIn/X/Contact links.

No workshop listing, no sample workshops, no testimonials or stats on this page.
```

---

## Prompt 2 — Workshop listing + detail (logged-in)

```
Design two connected screens, shown after sign-in — use the logged-in header from DESIGN.md.

Screen A — Workshop listing: filterable grid of workshop cards (filter by domain and date). Each card: title, host name/logo, date/time, domain tag, mode tag. "View details" action.

Screen B — Workshop detail: workshop title, host name and logo, full description, domain tag, mode tag, date/time, a prominent "Register" button, a secondary "Add to Google Calendar" action. Once registered: "Registered ✓" state and a "Join" button that activates near start time.
```

---

## Prompt 3 — Dashboard (logged-in)

```
Design the dashboard screen, shown after sign-in — same logged-in header as the workshop screens.

Two sections:
- "Hosting" — workshops the user created, each with edit/cancel actions
- "Attending" — workshops the user registered for, each with a Join button enabled only near start time

Empty state for each section (e.g. "You haven't hosted any workshops yet — Create one," pointing at the "+ Host" button).
```
