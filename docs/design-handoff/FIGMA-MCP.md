# Building the Figma file with cursor-talk-to-figma-mcp

How to have Claude Code construct the Elegant Render International design as native Figma
frames, using https://github.com/grab/cursor-talk-to-figma-mcp.

The pipeline: `Claude Code ←(stdio)→ MCP server ←(WebSocket :3055)→ relay ←→ Figma plugin`.
Everything runs on your machine; nothing needs to be hosted.

## One-time setup

1. Install Bun: `curl -fsSL https://bun.sh/install | bash`
2. Clone the repo and set up:
   ```bash
   git clone https://github.com/grab/cursor-talk-to-figma-mcp.git
   cd cursor-talk-to-figma-mcp
   bun setup        # installs deps + writes .mcp.json for Claude Code
   ```
3. Register the MCP server with Claude Code (if you run Claude Code outside that repo):
   ```bash
   claude mcp add TalkToFigma -- bunx cursor-talk-to-figma-mcp@latest
   ```

## Every session

1. Terminal: `bun socket` (from the repo — starts the relay on port 3055)
2. Figma: install/run the **"Cursor Talk to Figma MCP Plugin"** from the Figma Community
   (or Plugins → Development → Link existing plugin → `src/cursor_mcp_plugin/manifest.json`).
   The plugin shows a **channel name** — copy it.
3. Claude Code: `join_channel` with that channel name. Then build.

## What to tell Claude Code

Open Claude Code in the folder containing this handoff package and paste:

> Join the Figma channel `<channel>`. Then build a Figma page for the Elegant Render
> International design system using the TalkToFigma tools. Source of truth: `README.md`
> (tokens, type scale, section specs) and the two HTML references (`Homepage.dc.html`,
> `Components.dc.html`, `Brand Guidelines.dc.html`) in this folder.
>
> Build order:
> 1. A "Foundations" frame: color styles (#ffffff, #fafafa, #0a0a0a, #111111, #525252,
>    #00D98A, #06120C, #e8e8e8, #d4d4d4) and the type scale (Inter Tight 500 display
>    64/44/30, Inter Tight 400 body 16/15/14, JetBrains Mono 500 eyebrow 12 uppercase
>    +8% tracking, JetBrains Mono 400 spec 13).
> 2. A "Components" frame reproducing Components.dc.html: buttons (variants × sizes,
>    44px default height, 4px radius), chips (pill, active = #111111 fill), status
>    badges, inputs (44px, 1px #d4d4d4, 4px radius), switch, stepper, cards, accordion
>    rows, tabs, portal sidebar items. Use auto-layout everywhere (set_layout_mode,
>    set_padding, set_item_spacing); name layers semantically (Button/Primary/Default).
> 3. A "Homepage / 1440" frame reproducing Homepage.dc.html section by section
>    (max content width 1280, side padding 48, section padding 96–128).
> 4. For the before/after component, place the two images side by side with a note —
>    the diagonal reveal is behavioral, not visual.
>
> Work in small batches, verify with get_node_info after each section, and use
> create_component_instance for repeated elements.

## Notes

- Figma colors are RGBA floats 0–1 (the tools handle conversion; specify hex in prompts).
- Fonts: make sure **Inter Tight** and **JetBrains Mono** are available in Figma
  (both are on Google Fonts; enable them in your Figma account or install locally).
- Images: the MCP can't upload image fills. Drop the files from `public/artwork/` and
  `assets/` into Figma manually after the frames exist (or keep grey placeholders).
- Complement, don't replace: the html.to.design import gives you pixel-accurate flat
  frames fast; this MCP route gives you semantic auto-layout components. A good combo:
  import pages via html.to.design, rebuild the component library via MCP.
