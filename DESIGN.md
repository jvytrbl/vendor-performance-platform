---
name: Vendor Performance Platform
description: A daylight work tool for vendor records and performance reports.
colors:
  canvas: "oklch(98% 0 0)"
  surface: "oklch(98% 0 0)"
  surface-muted: "oklch(95% 0 0)"
  border: "oklch(88% 0 0)"
  foreground: "oklch(24% 0.02 50)"
  foreground-muted: "oklch(45% 0.016 50)"
  foreground-subtle: "oklch(56% 0.012 50)"
  accent: "oklch(48% 0.13 152)"
  accent-hover: "oklch(42% 0.135 152)"
  accent-foreground: "oklch(98% 0.015 152)"
  accent-soft: "oklch(92% 0.05 152)"
  success: "oklch(48% 0.13 152)"
  info: "oklch(40% 0.055 188)"
  info-soft: "oklch(95% 0.02 188)"
  warning: "oklch(48% 0.09 75)"
  warning-hover: "oklch(42% 0.095 75)"
  warning-muted: "oklch(52% 0.065 75)"
  warning-soft: "oklch(95.5% 0.028 75)"
  danger: "oklch(46% 0.1 27)"
  danger-muted: "oklch(50% 0.065 27)"
  danger-soft: "oklch(95.5% 0.02 27)"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "2.25rem"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "normal"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 500
    lineHeight: 1.375
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "normal"
rounded:
  sm: "4px"
  lg: "8px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  control: "44px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
    height: "{spacing.control}"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "{colors.accent-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
    height: "{spacing.control}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
    height: "{spacing.control}"
  button-secondary-hover:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
    height: "{spacing.control}"
  button-danger:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
    height: "{spacing.control}"
  button-danger-hover:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
    height: "{spacing.control}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    height: "{spacing.control}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.sm}"
    padding: "20px 24px"
  badge-draft:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.foreground-muted}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-finalized:
    backgroundColor: "{colors.info-soft}"
    textColor: "{colors.info}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  banner-error:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
  banner-warning:
    backgroundColor: "{colors.warning-soft}"
    textColor: "{colors.warning}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.foreground-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "10px 12px"
    height: "{spacing.control}"
  nav-item-active:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "10px 12px"
    height: "{spacing.control}"
---

# Design System: Vendor Performance Platform

## Overview

**Creative North Star: "The Work Tool"**

This is a signed-in desktop work surface for one person. The official name is Vendor Performance Platform. Design serves the job: record vendors and transactions, then read, edit, and finalize a report. There is no extra personality commitment — no brand voice layer, no cream paper, no marketing stack.

The page is daylight canvas. Chrome (navbar and sidebar) sits on a slightly cooler muted gray. One forest green does the loud work: primary actions, active navigation, link hover, and a good metric. Inter carries the job. Playfair Display appears only on the product name, page titles, and report section headings.

**Key Characteristics:**
- Daylight canvas, chroma-zero neutrals, one forest-green accent
- Playfair Display for names and titles only; Inter everywhere else
- Flat surfaces: 1px borders and tonal fills, never drop shadows
- 44px controls, 4px corners on work objects, pill only for status and progress
- Semantic color is functional: teal informs, amber warns, red breaks or deletes

## Colors

The palette is one loud green on a grayscale daylight field, with muted teal, amber, and red reserved for status.

### Primary
- **Forest Green**: Primary buttons, the sign-in control, active navigation, link hover, and the good metric band. Success aliases this same value so a positive result and a primary action share one hue.
- **Forest Green Deep**: Hover on primary actions.
- **Green Field Ink**: Text and marks sitting on the accent.
- **Forest Wash**: Soft fill behind active nav and file-picker chips.

### Secondary
- **Muted Teal**: Informational only — finalized status and helper notes. Not buttons, not navigation, not errors.
- **Teal Wash**: Soft fill behind finalized badges and info notes.

### Neutral
- **Daylight Canvas**: The page. Body background.
- **Daylight Surface**: Panels, cards, tables, and fields. Matches the canvas so a card does not float.
- **Cool Gray Panel**: Sidebar and navbar.
- **Cool Gray Divider**: Hairline borders and table rules.
- **Warm Ink**: Default text.
- **Warm Ink Mid**: Secondary copy, labels at rest, muted metadata.
- **Warm Ink Light**: Placeholders, table headers, disabled text.

Status colors sit beside the neutrals and are never decorative:
- **Work Amber** / **Amber Wash**: Elevated-but-not-broken states only (metric warning band, duplicate-name confirmation).
- **Work Red** / **Red Wash**: Validation errors, failed rows, delete, and other destructive actions. Never navigation.

**The One Green Rule.** Success is the accent. There is no second green.

**The Job-Color Rule.** Warning and danger appear only for elevated or broken states. They are never decoration and never navigation.

## Typography

**Display Font:** Playfair Display (with Georgia, serif)
**Body Font:** Inter (with ui-sans-serif, system-ui, sans-serif)

**Character:** A serif nameplate on a sans-serif work surface. The pairing is quiet: medium weight, tight tracking on large titles, no italics.

### Hierarchy
- **Display** (500, 2.25rem / 3rem at `sm`, line-height ~1.1, tracking-tight): Product name and page titles.
- **Headline** (500, 1.5rem, line-height ~1.25): Report section headings and in-page titles. A 1.875rem step appears for a card title such as Continue draft.
- **Title** (500, 1.25rem, tracking-tight): Prominent Inter — report reference numbers and other lead sentences that are not headings.
- **Body** (400, 1rem, line-height 1.625): Explanations, empty states, and form help. Long reading stays near 65ch.
- **Label** (500, 0.875rem): Buttons, nav, field labels, and metadata. Table column headers use 0.75rem, regular weight, uppercase, wide tracking.

The navbar wordmark is Playfair at 1rem medium — still the product name, just at chrome size.

**The Playfair Name Rule.** Playfair Display is for the product name, page titles, and report section headings only. Inter does everything else. Never italic Playfair. Never Playfair on table data, buttons, form copy, or empty states.

## Layout

Signed-in work lives in a fixed frame: a 56px navbar and a 256px sidebar (56px when collapsed) on muted gray, with the page scrolling in the remaining column. Main padding steps from 16px / 24px on small screens to 48px / 40px on large. Work pages stack in a single column with a 40px section gap. Forms stay near 42rem; home content stays near 48rem; tables go full width of the main column.

Controls are at least 44px tall. Field stacks use a 6px label-to-control gap. Card interiors sit in the 16–28px range. The 768px breakpoint is where the sidebar becomes persistent and the mobile menu overlay goes away.

## Elevation & Depth

The system is flat. Depth is a change of tone or a 1px divider, not a shadow. Cards and tables share the canvas color and are held by `{colors.border}`. Chrome is one step darker (`{colors.surface-muted}`). The mobile menu scrim is warm ink at 30% opacity. No `box-shadow` is in use.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadows do not appear for hover, focus, or elevation.

## Shapes

Work objects — buttons, fields, cards, tables, banners — use a 4px corner. Sidebar nav items use 8px. Status chips and progress tracks are pills. Borders are 1px `{colors.border}` unless a status wash uses a tinted edge (danger at 30%, info at 40%, warning at full warning).

**The Four-Pixel Rule.** Controls, fields, cards, and tables use a 4px corner. Pills are for status and progress only.

## Components

Restrained and functional. Color and a 1px edge do the work; nothing lifts off the page.

### Buttons
- **Shape:** 4px corner, 44px minimum height, 8px 16px padding, 14px medium Inter
- **Primary:** Forest green fill, green-field ink. Hover deepens the green. Disabled is muted ink at 40%
- **Secondary:** Transparent fill, 1px border, warm ink. Hover is the muted panel
- **Danger:** Whisper at rest (danger wash, muted red text, 1px border). Hover brings the full danger edge and ink. Disabled returns to subtle ink
- **Hover / Focus:** Color shifts in 150ms ease-out. Link-styled actions underline on hover instead of filling

### Cards / Containers
- **Corner Style:** 4px
- **Background:** Daylight surface, same as the page
- **Shadow Strategy:** None
- **Border:** 1px cool gray divider
- **Internal Padding:** 16–28px, 12px inner gap

### Inputs / Fields
- **Style:** 4px, 1px border, daylight surface, 44px tall, 14px Inter, 8px 12px padding. Label is 14px medium warm ink; hint is light ink in the same line
- **Focus:** Border recedes to forest green; outline is removed
- **Error / Disabled:** Error copy is 14px work red under the field. Disabled text is light ink

### Navigation
- **Chrome:** 56px bar and 256px rail on muted gray, split from the page by a 1px divider. Product mark is 48px; the name is Playfair at 1rem
- **Items:** 8px corners, 44px tall, 14px Inter. Rest is muted ink; hover is canvas fill and warm ink; active is forest wash and forest green at semibold
- **Mobile:** Menu opens over a 30% ink scrim; Escape and route change close it

### Status badges
- **Style:** Pill, 12px medium, 2px 10px padding, 1px border
- **Draft:** Muted panel, muted ink, divider edge
- **Finalized:** Teal wash, muted teal, teal edge at 40%

### Banners
- **Error:** Danger wash, danger edge at 30%, 12px 16px, body copy in warm ink
- **Warning:** Amber wash, warning edge, 12px 16px, copy in work amber

### Progress
- **Track:** 3px pill in the divider gray; fill is a third-width forest-green pill
- **Motion:** Transform only (loop 1.4s, pendulum 1.8s). Reduced motion freezes a 40% fill

### Tables
- **Style:** 4px, 1px border, daylight surface. Headers are 12px uppercase wide-tracking light ink; body is 14px. Horizontal scroll is allowed; empty state is centered in 64px vertical padding

## Do's and Don'ts

### Do:
- **Do** keep colors in the declared OKLCH tokens. Canvas stays chroma-zero daylight; the accent stays forest green.
- **Do** set Playfair medium on the product name, page titles, and report section headings, and Inter on everything else.
- **Do** alias success to the accent so a good metric and a primary action share one green.
- **Do** keep primary actions on daylight canvas as forest-green pills with 44px minimum height and 4px corners.
- **Do** separate chrome from the page with muted gray and a 1px divider, not a shadow or a second hue.

### Don't:
- **Don't** introduce a second green, cream paper, or a decorative accent.
- **Don't** set Playfair on body copy, buttons, tables, captions, or empty states, and don't italicize it.
- **Don't** use drop shadows.
- **Don't** use danger for navigation, or info for buttons or errors.
- **Don't** add a personality layer, illustration, or a marketing title stack. This is a work tool.
