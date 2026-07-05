# CLAUDE.md — Elegant Render International rebrand (design reference package)

You are implementing a visual re-skin of `ngluvakov/elegant-render-platform`
(Next.js 16 App Router, React 19, Tailwind CSS 4, shadcn/ui) for international
(Western Europe / English-speaking) deployments. **Pages, content structure,
pricing engine, checkout, portal flows, Supabase, NestPay and Bitrix24 sync are
untouched — tokens, fonts, copy and component styling change.**

## Read in this order

1. `README.md` — the full implementation spec: token map (old → new), font swap,
   homepage section-by-section spec with final English copy, motion migration
   table, and a grep list of component-level sweeps.
2. `globals-international.css` — production-intended drop-in replacement for
   `src/app/globals.css`. Start here; most components restyle via tokens.
3. `Components.dc.html` — every UI primitive redefined (buttons, chips, badges,
   inputs, switch, stepper, cards, accordion, tabs, portal sidebar, before/after).
   Read the inline styles for exact values; each section header names the repo
   file it replaces.
4. `Homepage.dc.html` / `Brand Guidelines.dc.html` — page-level references.
5. `FIGMA-MCP.md` — only if asked to build the Figma file via TalkToFigma MCP.

## Visual ground truth

`screenshots/` contains full renders: `NN-homepage.png`, `NN-components.png`,
`NN-guidelines.png` (numbered top-to-bottom scroll order). When in doubt about
how HTML should look, check the screenshot — the screenshots win over your
reading of the HTML.

## Non-negotiables

- Colors: white canvas, #111111 text, #525252 secondary, #fafafa section grey,
  #0a0a0a dark surfaces, ONE green #00D98A (text on green is #06120C, never white).
- Fonts: Inter Tight (400/500/600) for everything; JetBrains Mono (400/500) for
  eyebrows (12px, uppercase, +0.08em), prices, specs, file names.
- Radius 4px everywhere (0 on images; pill only on chips/status badges).
- No shadows at rest; hover = border #d4d4d4 + 0 1px 3px rgba(17,17,17,0.06).
- Motion: cubic-bezier(0.2,0,0,1); 120/200/360ms; no loops, springs, parallax.
- Before/after: demo swipe on viewport entry (50→100→0→50, 700/900/500ms,
  ease-in-out quad), then 135° diagonal tracks the cursor; back to 50 on leave;
  touch = scroll-driven; reduced-motion = static 50.
- The HTML files here are references, not production code — recreate their look
  with the codebase's existing Tailwind semantic classes and shadcn components.
- `support.js` is a design-tool runtime artifact. Do not ship or imitate it.

## Definition of done

After the token swap + font swap + copy pass, diff each page against the
screenshots. Then run the grep list at the bottom of README.md to catch
hardcoded warm-theme leftovers (rounded-2xl, warm shadows, orbit-glow,
sidebar-attention-pulse, tracking-[0.2em] eyebrows, "powered by White Rook"
header badge).
