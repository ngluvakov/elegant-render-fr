# Deviations from the design handoff

## Homepage layout (owner override, 2026-07-06)

The handoff's §"Screens / Views → 1. Homepage" section spec is **superseded**.
Its claim that the "section order matches the Serbian home" was inaccurate:
the spec replaced the .rs interactive hero (right-side "Quick estimate"
service switcher + live pricing), `ResultsProof`, `NextIteration` and the
`MarketingServicesShowcase` catalog with static sections. The owner's binding
requirement is **layout parity with elegantrender.rs — only the design
language changes**.

The homepage therefore mirrors the .rs section order 1:1 (interactive
QuickOrderHero, search-intent columns, ResultsProof, PlatformPrinciples,
ModelFirst, NextIteration, FaqCards, MarketingServicesShowcase), plus the
IsoStrip kept from the handoff by owner decision. The handoff's approved
English hero copy ("See your space before you decide.") carries over into
the QuickOrderHero left column.

**Still binding from the handoff:** all design tokens (colors, Inter Tight +
JetBrains Mono, 4px radius, borders/shadows), the motion system, component
styling rules, and the final English copy blocks. Only the homepage *section
layout* deviates.
