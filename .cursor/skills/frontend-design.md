# Frontend Design Principles

Use this whenever designing, building, or reviewing any UI for the Vendor Performance Intelligence Platform — screens, components, forms, tables, dashboards. Consult before writing markup/styling, and again as a review pass before considering a screen done.

---

## Register: this project is "product," not "brand"

Every design task falls into one of two registers:

- **Brand** — marketing pages, landing pages, campaigns. The design itself IS the product.
- **Product** — app UI, admin tools, dashboards. Design SERVES the underlying function; it should not call attention to itself.

**This entire project is Product register**, per SDD Section 5.1: "Clean, data-dense where needed (metric tables, dashboard), minimal chrome elsewhere... Desktop-primary." Every screen (Vendor List, Transaction List, Report Editor, Scorecard Dashboard) is a working tool, not a showcase. Default to restraint; a "boring but clear" data table beats a "visually interesting" one that's harder to scan.

---

## Shared design laws

### Color

- Use OKLCH color space where practical, not raw hex.
- Never use pure `#000` or `#fff`. Tint neutrals slightly toward one hue (a very small amount of chroma is enough) so the palette doesn't feel sterile.
- Pick a **color strategy** deliberately, don't just pick colors ad hoc:
  - **Restrained** — tinted neutrals + one accent color used sparingly (≤10% of the surface). **This is the default for this project** — an internal data tool doesn't need a bold color identity.
  - Committed / Full palette / Drenched (heavier color use) are for brand-driven marketing work — not applicable here unless there's a specific reason (e.g., a status color for "Finalized" vs "Draft" reports, or delivery-performance color-coding on the dashboard — small, purposeful accents, not a redesign of the whole palette).

### Theme (dark vs. light)

Don't default to either without reasoning. Before choosing, write one concrete sentence: who uses this, where, under what light, in what mood.

For this project specifically: a single developer, working at a desk, likely during normal working hours, reviewing tables of vendor/transaction data and reading AI-generated report text. This favors a **light or neutral theme with good contrast for extended reading of dense text/tables** — not a dark theme chosen just because "internal tools look more technical in dark mode." If a dark mode option is ever added, it should be a deliberate secondary option, not the unreasoned default.

### Typography

- Cap body text line length at 65–75 characters for readability — relevant for report narrative sections (Vendor Summary, Delivery Performance, etc.), which will contain real paragraphs of AI-generated text.
- Build hierarchy through real scale + weight contrast (at least a 1.25x ratio between heading levels), not just "slightly bigger text" everywhere.

### Layout

- Vary spacing deliberately for visual rhythm — identical padding on every element reads as monotonous, not clean.
- Don't reach for "cards" as the default container for everything. Data tables (Vendor List, Transaction List, Dashboard) are genuinely tables — render them as tables, not a grid of cards pretending to be a table.
- Never nest cards inside cards.
- Don't wrap every section in its own bordered container "just in case" — most things don't need one.

### Motion

- Never animate layout-affecting CSS properties directly (`width`, `height`, `top`, `left`) — this causes visible jank. Animate `transform` and `opacity` instead.
- Use ease-out curves for transitions (e.g., ease-out-quart), not bouncy or elastic effects — this is a data tool, not a playful consumer app.
- Loading states (AI generation, file upload processing — NFR-005) should feel calm and informative, not flashy.

### Absolute bans

If about to build any of these, stop and use a different structure instead:

- **Side-stripe borders** (`border-left`/`border-right` as a thick colored accent on cards or list items) — use full borders, background tints, or leading icons instead.
- **Gradient text** — use a single solid color; convey emphasis through weight or size, not a gradient clip effect.
- **Glassmorphism as a default style** — blurred/glass panels used purely decoratively. Not appropriate for a dense, functional data tool.
- **The "hero metric" SaaS template** (huge number, small label, gradient accent, supporting stats) — this project has real metrics to display (SDD 3.3.5's nine metrics); display them clearly and directly, not wrapped in a generic marketing-dashboard cliché.
- **Identical repeated card grids** — if displaying a list of similar items, prefer a real table or list, not a grid of visually-identical cards.
- **Modal as the first instinct** — for flows like the duplicate-vendor confirmation or the Finalized-report lock message, consider inline confirmation or a dedicated state before defaulting to a modal.

### Copy

- Every word should earn its place — no restated headings, no filler intros that repeat what a heading already says.
- Error messages should be specific and actionable (matches the project's own defensive-programming standard for API errors — the same discipline applies to UI copy: say exactly what's wrong and, where possible, how to fix it).

---

## The "AI slop test"

Before considering a screen finished, ask: **if someone looked at this, could they immediately tell "an AI generated this without real thought"?** If yes, it's failed and needs another pass.

Two levels to check, in order:

1. **First-order (category cliché):** could someone guess this design purely from knowing what kind of tool it is? (e.g., "internal data tool → generic dark-mode dashboard with a sidebar and card grid" is the obvious, uninteresting default.) If the design is exactly what anyone would guess sight-unseen, push past it — plain, unpretentious, but not a copy-paste of the most common template.
2. **Second-order (checking you didn't just avoid the obvious trap into a different obvious trap):** having avoided the first cliché, is what remains still generic in some other predictable way? A "product register, restrained color, light theme" data tool still has room for a thoughtful, deliberate layout instead of the second-most-obvious default.

Passing this test doesn't mean adding decoration — for a Product-register internal tool, "passing" usually means: clear information hierarchy, sensible use of whitespace and rhythm, and small deliberate details (consistent spacing scale, one well-chosen accent color for status/state, readable typography) rather than a bland, undifferentiated grey box.