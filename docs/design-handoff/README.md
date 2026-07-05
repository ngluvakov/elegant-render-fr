# Handoff: Elegant Render — International Rebrand

**Target codebase:** `ngluvakov/elegant-render-platform` (Next.js 16 App Router, React 19, Tailwind CSS 4, shadcn/ui)
**Scope:** Visual re-skin only. Pages, content structure, pricing engine, checkout, portal, Supabase, NestPay and Bitrix24 sync are untouched.

## Overview

Elegant Render's international sites (Western Europe / English-speaking markets) keep every page, image and backend flow of the Serbian platform (elegantrender.rs) but adopt the **White Rook design system**: white canvas, near-black text, grey structure, one green accent (`#00D98A`), Inter Tight + JetBrains Mono. The warm ivory/clay/sage identity (Cormorant Garamond + Manrope) is fully retired on international builds.

The Elegant Render logo is kept unchanged (classical serif mark — the one deliberate contrast in the system). White Rook appears exactly once per page: footer attribution.

## About the Design Files

The files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior, **not production code to copy directly**. The task is to recreate these designs inside the existing Next.js + Tailwind 4 + shadcn codebase using its established patterns (route groups, `src/components/marketing/*`, `src/lib/content/site.ts`, shadcn primitives).

- `Homepage.dc.html` — full international homepage reference (open in a browser from this folder root)
- `Brand Guidelines.dc.html` — the complete brand guideline document (sections 01–09)
- `globals-international.css` — a **drop-in replacement** for `src/app/globals.css`, annotated old→new per token. This one IS production-intended.
- `support.js`, `assets/`, `public/artwork/` — runtime + assets so the HTML references open locally. Artwork files are copies from the repo's own `public/artwork/`.

## Fidelity

**High-fidelity.** Colors, typography, spacing, radii, copy and motion values are final. Recreate pixel-perfectly with the codebase's existing Tailwind semantic classes (`bg-background`, `text-muted-foreground`, `border-border`, …) — after the token swap below, most existing components restyle themselves.

## Implementation strategy (recommended order)

1. **Token swap:** replace `src/app/globals.css` with `globals-international.css` (keep filename `globals.css`).
2. **Font swap** in `src/app/layout.tsx` (next/font):
   - `--font-heading`: Cormorant Garamond → **Inter Tight** (weights 400/500/600)
   - `--font-sans`: Manrope → **Inter Tight**
   - NEW `--font-mono`: **JetBrains Mono** (weights 400/500) — expose as a CSS variable and wire into the `@theme`.
3. **Content:** English copy (below + in the mock). Prices displayed in EUR via the existing `display-currency` mechanism.
4. **Component-level sweeps** (grep list at the bottom).

## Design Tokens

### Colors

| Role | Value | Tailwind semantic |
|---|---|---|
| Canvas | `#ffffff` | `--background`, `--card` |
| Section grey (alternating sections, muted surfaces) | `#fafafa` | `--secondary`, `--muted` |
| Dark surface (footer, hero protection, one feature panel per page, portal sidebar) | `#0a0a0a` | — |
| Text primary | `#111111` | `--foreground`, `--primary` |
| Text secondary | `#525252` | `--muted-foreground` |
| Accent green | `#00D98A` | `--accent` |
| Text ON green (never white) | `#06120C` | `--accent-foreground` |
| Green hover / press | `#00C77E` / `#00B372` | — |
| Border subtle | `#e8e8e8` | `--border` |
| Border default (hover, inputs) | `#d4d4d4` | `--input` |
| Focus ring | `#00D98A` at 25%, 3px | `--ring` |

Green rules: primary CTA fill, mono eyebrows on dark, active states, focus, one key metric per view, single-accent charts. **Never:** large fills, gradients, body text on white, white text on green, tinting logos or imagery.

### Typography

| Style | Spec |
|---|---|
| Display / H1 | Inter Tight 500, 64–68px, line-height 1.05, letter-spacing −0.025em |
| H2 | Inter Tight 500, 40–44px, lh 1.1, ls −0.02em |
| H3 | Inter Tight 500, 18–22px, ls −0.01em |
| Body | Inter Tight 400, 15–16px, lh 1.5–1.6 |
| Eyebrow (signature) | JetBrains Mono 500, 12px, UPPERCASE, letter-spacing +0.08em |
| Spec / price / file names | JetBrains Mono 400, 12–13px, `tabular-nums` |

Signature pairing: all-caps mono eyebrow directly above a sentence-case display headline. Sentence case everywhere (headings, buttons, nav). Numbers stay numeric (€169, 3–5 days, 4K).

### Spacing, radius, borders, shadows

- 8px base grid; content max-width **1280px**, side padding 48px
- Section vertical padding: **128px** desktop (96px for denser sections) / 64px tablet / 48px mobile
- Radius: **4px** for buttons, inputs, cards (`--radius: 0.25rem`). Images: **0**. Pills only for status chips / ISO badges
- Borders 1px `#e8e8e8`; 2px reserved for focus rings and selected-tab underlines
- Cards: white, 1px border, **no shadow at rest**; hover → border `#d4d4d4` + `0 1px 3px rgba(17,17,17,0.06)`, 200ms; images bleed flush to card edge; content padding 24px

### Motion system

- Easing, always: `cubic-bezier(0.2, 0, 0, 1)`
- Durations: **120ms** press · **200ms** hover/tabs · **360ms** drawers, modals, image reveals
- Fades over slides. No springs, bounce, parallax, or looping/idle animations. Respect `prefers-reduced-motion`.

Migration of existing animations (all handled in `globals-international.css`, comments inline):

| Current (Serbian globals.css) | International |
|---|---|
| `.flash-new` clay ring pulse | KEEP — recolored to `rgba(0,217,138,0.35)`, standard curve. The only attention cue allowed. |
| `.sidebar-attention-pulse` looping wave | REMOVE — active category gets a 2px near-black underline |
| `.orbit-glow` rotating red comet | REMOVE — static 1px green border + mono "−33%" tag on discounted rows |
| `.grain-soft` paper grain | REMOVE — flat surfaces |
| `body` warm radial gradients | REMOVE — flat `#ffffff` |
| `.ai-history-flight` 840ms spring | KEEP mechanic — retime 360ms standard curve, green border, straight path |
| Card hover scale/lift | REMOVE — border+shadow shift only; image inside a card may scale 1.02 over 360ms |

## Screens / Views

### 1. Homepage (`/`) — see `Homepage.dc.html`

Section order matches the Serbian home (`src/app/(marketing)/page.tsx`). All copy below is final English.

**Header** (sticky, `rgba(255,255,255,0.85)` + `backdrop-filter: blur(12px)`, 1px bottom border, 72px tall)
- Left: ER logo 48px + "Elegant Render" Inter Tight 500 15px
- Nav center: Services · Pricing · Our work · FAQ · Contact — 14px, `#525252`, hover: underline + `#111111`
- Right: "Sign in" (secondary: white fill, 1px `#111111` border, 36px, radius 4px) + "Start a project" (primary: green fill, `#06120C` text)
- The Serbian header's "powered by White Rook" badge is **removed** — White Rook lives in the footer only.

**Hero** (full-bleed image, 680px, `detail-interior-static.webp`)
- Protection gradient: `linear-gradient(to top, rgba(10,10,10,0.72), rgba(10,10,10,0.25) 45%, transparent 70%)` — never a flat wash
- Eyebrow (green mono): "ARCHITECTURAL VISUALIZATION · DELIVERED ACROSS EUROPE"
- H1 68px white: "See your space before you decide."
- Sub 19px `rgba(255,255,255,0.78)`: "Hand-crafted renders, virtual staging and visual makeovers for homes and properties — with prices you can see up front. A beautiful image, a clear price, an easier decision."
- CTAs 52px: "See prices" (primary green) + "View our work" (1px white 55% border, hover 100%)

**Spec strip** (below hero, 1px borders, mono 12px uppercase, space-between): "First drafts in 3–5 working days · 3 revision rounds included · Interiors from €169 · TÜV Rheinland certified"

**Intent columns** (3-col grid, gap 40px; each: 1px `#d4d4d4` border-top, 24px padding-top)
- "Architectural visualization" / "Virtual staging & renovation" / "Interactive plans & tours" — H 22px, body 15px `#525252`, link "SEE PRICING →" mono 12px. Links target the configurator groups (`/cene?group=…#configurator` equivalents).

**Before/after** (on `#fafafa` section): heading "The same room, ready to sell." + draggable comparison slider (16:9, `ai-tool-virtual_staging-before/after.webp`), 2px white divider, mono labels AFTER (left) / BEFORE (right) in `rgba(10,10,10,0.55)` chips. Implemented as an invisible `<input type=range>` overlay driving the clip width — reuse the existing `--reveal` mechanic if preferred.

**Model-first pricing** (white, 128px padding): grid `0.9fr 1.1fr`
- Left: dark `#0a0a0a` panel, radius 4px, padding 48px — green mono eyebrow "MORE RENDERS, LOWER PRICE PER RENDER", H2 40px white "We build the model once. Everything after it costs less.", body `rgba(255,255,255,0.65)`
- Right: 2×2 white cards (mono index 01–04): "A new camera angle" (exteriors from €249, additional angles 81% less) / "More floors" (30% discount) / "Animation" (33% less) / "Residential buildings" (up to 44%)

**Services** (`#fafafa`): heading "Everything comes straight from the official price list." + 4 image cards (3:2 image flush, 24px content): Interior renders From €169 · Exterior renders From €249 · Floor plans & site plans · 360° virtual tours From €294

**Process** (white, 128px): heading "From estimate to final files — no guessing what happens next." + 4 columns, each 2px `#111111` border-top: 01 Get your estimate · 02 Send your materials · 03 Receive first drafts (3–5 working days) · 04 Finalize through revisions (3 rounds included)

**ISO strip**: "Certified by TÜV Rheinland — audited annually, not self-declared." + three pill badges (mono 12px, 1px `#d4d4d4`, radius 999px): ISO 9001:2015 · ISO/IEC 27001:2022 · ISO 50001:2018

**FAQ** (`#fafafa`, grid 0.8fr/1.2fr): left heading "Before you ask"; right: 5 native `<details>` rows, 1px bottom borders, question 17px/500, "+" marker mono. Questions/answers: see `FAQ_ITEMS` adaptation inside `Homepage.dc.html` logic.

**Closing CTA** (white, centered, 128px): eyebrow "READY WHEN YOU ARE", H2 52px "Send us your space. We'll send back a price — not a sales call.", CTAs "Send your space" (primary) + "See prices first" (secondary)

**Footer** (`#0a0a0a`): grid 1.4fr/1fr/1fr/1fr — ER white logo 96px + description; Services / Company / Legal link columns (mono uppercase column labels `rgba(255,255,255,0.4)`, links 14px `rgba(255,255,255,0.75)`). Bottom row above 1px `rgba(255,255,255,0.12)` border: **`wr-logo-horizontal-white.png` 26px + "Elegant Render is part of White Rook DOO — 3D visualization & digital assets."** + "© 2026 White Rook DOO" mono right.

### 2. All other pages

Restyle via the token swap; follow the same section grammar (mono eyebrow + display heading, white/#fafafa alternation, one dark panel max per page). Portal sidebar goes dark (`--sidebar: #0a0a0a`, green active item) per White Rook's client-portal pattern — tokens already set in the CSS.

## Interactions & Behavior

- Buttons: primary hover darkens one step (`#00C77E`), press `#00B372`, 120ms; no scale/lift anywhere
- Links: underline appears on hover, color unchanged
- Cards: border → `#d4d4d4` + hairline shadow, 200ms; image inside may scale 1.02 over 360ms
- Focus: 3px green ring at 25% opacity (`--ring`), never a shadow
- Sticky header blurs (12px) once scrolled past hero
- Before/after slider: pointer-drag (range input), clamps 2–98%
- FAQ: single-open not required; native disclosure is fine

## State Management

No new state. Existing quote-context, checkout wizard and portal state are unchanged. The before/after slider needs one local `pos` (0–100) state if rebuilt as a React component.

## Assets

- `assets/er-logo-black.png` / `er-logo-white.png` — Elegant Render logo (from client's master; white variant is a recolor with alpha preserved)
- `assets/wr-logo-horizontal-black.png` — White Rook horizontal, black lettering (light backgrounds)
- `assets/wr-logo-horizontal-white.png` — White Rook horizontal, white lettering (dark backgrounds). **The rook stays white on its black field in both variants — never recolor the badge.**
- `assets/wr-icon-black.png` / `wr-icon-white.png` — badge-only marks
- `public/artwork/*.webp` — copied from the repo's own `public/artwork/`; production uses the originals in place

## Grep list — component-level sweeps after the token swap

- `powered-by-whiterook` in `site-header.tsx` → remove (footer-only attribution)
- `rounded-2xl|rounded-3xl` in `marketing/*` and `portal/*` → these flatten automatically via the radius multipliers; visually verify cards land at 4–8px
- `shadow-[0_20px_55px` / `shadow-[0_30px_70px` custom warm shadows → replace with rest: none / hover: `shadow-[0_1px_3px_rgba(17,17,17,0.06)]`
- `sidebar-attention-pulse|orbit-glow|grain-soft` class usages → remove (classes no longer exist)
- `SectionKicker` component → mono font + green tick (restyled by `.section-kicker` in the new CSS; verify)
- `tracking-[0.2em]|tracking-[0.28em]` eyebrows → standardize to `+0.08em` with `font-mono`
- Serbian strings in `src/lib/content/site.ts` → English adaptations (hero, principles, ordering steps, FAQ — final copy in `Homepage.dc.html` logic block and Brand Guidelines §08)

## Files

- `CLAUDE.md` — entry point for Claude Code: reading order + non-negotiables
- `Homepage.dc.html` — homepage reference (open from this folder)
- `Components.dc.html` — every UI primitive redefined (buttons, chips, forms, stepper, switch, cards, accordion, tabs, portal sidebar, before/after with demo swipe + cursor tracking)
- `Brand Guidelines.dc.html` — brand guideline document
- `globals-international.css` — drop-in `src/app/globals.css` replacement (production-intended)
- `screenshots/` — full page renders (`NN-homepage/components/guidelines.png`, numbered top-to-bottom) — visual ground truth
- `FIGMA-MCP.md` — building the Figma file via cursor-talk-to-figma-mcp from Claude Code
- `support.js` — runtime for the HTML references (design-tool artifact; do not ship)
- `assets/`, `public/artwork/` — logo + imagery assets
