# DESIGN.md — Workify

## Product
Workify — a premium AI-native learning and workshop platform. Companies and student clubs host short expert-led workshops that turn into hands-on builds and, eventually, hiring opportunities.

## Look and feel
Premium SaaS quality — modern, clean, trustworthy, slightly futuristic, restrained rather than flashy. Reference quality: Linear, Vercel, premium AI SaaS products. Explicitly not: generic AI-template landing pages, generic hackathon-platform look, enterprise-innovation-consultancy tone.

## Logo
Use the supplied Workify logo asset exactly as provided — do not regenerate, recolor, or simplify it into a generic mark.

## Color
| Token | Hex |
|---|---|
| Deep Navy | #070C1F |
| Secondary Navy | #0B1533 |
| Blue (primary) | #2F6BFF |
| Secondary Blue | #1F54E0 |
| Violet (accent) | #8B4CFF |
| Secondary Violet | #6E36D6 |
| Neutral Background | #FAFAFC |
| Light Neutral | #F3F4F7 |
| Border | #DDE0E8 |
| Muted Text | #636875 |
| White | #FFFFFF |

Blue is for primary CTAs, links, and major interactive elements. Violet is an accent only — labels, highlights, gradient touches, glass details. Navy is for headings and dark sections. The blue-to-violet gradient should never cover large surfaces — it earns attention by contrast, not repetition.

## Typography
Font: Inter.

| Style | Size | Weight | Line height |
|---|---|---|---|
| Display | 64px | Extra Bold | ~66px |
| H1 | 48px | Bold | ~52px |
| H2 | 32px | Bold | ~36px |
| H3 | 24px | Bold | — |
| Body Large | 18px | Regular | 27px |
| Body | 16px | Regular | 24px |
| Small | 14px | Regular | 20px |
| Label | 12px | Semibold | uppercase where appropriate |
| Button | 15px | Semibold | — |

Strong and editorial, not decorative.

## Spacing
8px-based scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96. Generous between major sections — spacious, never empty.

## Radius
12px small elements · 16px normal cards · 20px medium cards · 28px large cards · 32px major sections · 999px pills. Not every element should be equally rounded.

## Glassmorphism
Used sparingly — one or two highlight surfaces per screen (e.g. a hero panel, a featured card), never the whole layout.
- Background: rgba(255,255,255,0.5–0.7)
- Border: rgba(255,255,255,0.6–0.8)
- Backdrop blur: 16–24px
- Shadow: large radius, low opacity
- Sits on a soft blue/violet atmospheric glow, not a flat surface

## Navigation states
- **Logged out:** logo + "Sign in" only. No Workshops, Host, Dashboard, or Profile.
- **Logged in:** logo, Workshops, Profile nav links, a standalone "+ Host" pill button (999px radius, set apart from regular nav — not blended in), and the user's avatar.

## Component conventions
- Workshop cards: title, host name/logo, date/time, domain tag, delivery-mode tag ("Online" — workshops run over Google Meet).
- Buttons: primary = solid blue; secondary = outline/ghost; hover states are subtle (slightly darker blue, small shadow) — no bouncing, no exaggerated motion.
- Empty states are required wherever a list can be empty (e.g. dashboard with no hosted workshops yet) — never fill with placeholder/fake data instead.

## Content rules
Never invent workshops, users, testimonials, statistics, or company logos. No placement-rate or attendee-count callouts — no real numbers exist yet. The product should read as real and in-progress, not artificially populated.

## Modes
Every screen needs both a light mode (near-white #FAFAFC background, deep navy text) and a dark mode (#0B1533 background, off-white text, same accent palette slightly desaturated so it doesn't glow).

## Motion
Restrained only: subtle button hover transitions, small card hover elevation (translateY(-3px) with a soft shadow), a very subtle floating effect on hero glass panels, slow ambient background glow. No bouncing, no spinning, no constant moving gradients, no heavy parallax.
