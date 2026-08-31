# write. Design System

## 0. Research Log

- Reference: reviewed a live Velog editor screen reference - retained the light, two-pane Markdown writing grammar, compact formatting rail, and green action accent without copying its branding or copy.
- Embedded references: Velog is not in the local reference library; `taste-skill.md` supplied editorial-product guardrails and `layout-skill.md` supplied the bounded split-pane shell.
- Skipped lanes: image concepts are unnecessary for an editor with no image-led surface; broader product-screen research is unnecessary because the user named the editor reference.

## 1. Atmosphere & Identity

An unhurried, paper-bright publishing desk that opens to a readable archive and narrows into a live writing space. The signature is a procession of long horizontal article cards: each card exposes date, title, and a short excerpt before the reader chooses to continue.

## 2. Color

| Role | Token | Light | Dark | Usage |
|---|---|---|---|---|
| Canvas | `--canvas` | `#FFFFFF` | `#1B1D1F` | Page background |
| Surface | `--surface` | `#F8F9FA` | `#24282B` | Tool rail and empty state |
| Surface/raised | `--surface-raised` | `#FFFFFF` | `#1F2225` | Header and panels |
| Text/primary | `--text-primary` | `#212529` | `#F1F3F5` | Headings and body |
| Text/muted | `--text-muted` | `#868E96` | `#ADB5BD` | Metadata and placeholders |
| Border | `--border` | `#E9ECEF` | `#343A40` | Structural separation |
| Accent | `--accent` | `#12B886` | `#38D9A9` | Primary action and focus |
| Accent/hover | `--accent-hover` | `#0CA678` | `#63E6BE` | Hover and active |
| Accent/wash | `--accent-wash` | `#E6FCF5` | `#153B32` | Selection state |
| Accent/contrast | `--accent-contrast` | `#FFFFFF` | `#1B1D1F` | Primary-action label |
| Danger | `--danger` | `#E03131` | `#FF8787` | Required-field feedback |

Rules: green only signals an available writing action or current state. No decorative gradients or colored status dots.

## 3. Typography

| Level | Token | Size | Weight | Line height | Usage |
|---|---|---:|---:|---:|---|
| Display | `--type-title` | `clamp(2rem, 4vw, 3.25rem)` | 700 | 1.16 | Draft title |
| Brand | `--type-brand` | `1.375rem` | 700 | 1 | Header wordmark |
| H1 | `--type-h1` | `2rem` | 700 | 1.25 | Preview heading |
| H2 | `--type-h2` | `1.5rem` | 700 | 1.35 | Preview subheading |
| H3 | `--type-h3` | `1.25rem` | 700 | 1.4 | Preview minor heading |
| Body | `--type-body` | `1rem` | 400 | 1.75 | Draft and preview body |
| Small | `--type-small` | `0.8125rem` | 500 | 1.45 | Controls and metadata |
| Mono | `--type-mono` | `0.875rem` | 400 | 1.6 | Code and editor affordances |

Font stack: `ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`; mono uses `ui-monospace, SFMono-Regular, Menlo, monospace`.

## 4. Spacing & Layout

Base unit: 4px.

| Token | Value | Usage |
|---|---:|---|
| `--space-1` | 4px | Dense tool gaps |
| `--space-2` | 8px | Compact controls |
| `--space-3` | 12px | Field rhythm |
| `--space-4` | 16px | Default control padding |
| `--space-6` | 24px | Pane padding |
| `--space-8` | 32px | Major pane padding |

The home page uses a content-limiter of 1100px and one vertical card list. Every `post-card` is a desktop row with a 112px metadata column, a flexible title/excerpt column, and a trailing read action. Below 800px it becomes a three-part stack with no horizontal scroll. The editor is a `scroll-body-shell`: the `--header-height` (68px) header and tool rail stay fixed within the shell; the text input and preview independently own vertical scrolling at desktop. Below 800px, the rail becomes a wrapping top row and the panes stack as normal document sections. `--radius-small` is 6px for controls and panels.

## 5. Components

### App header
- Structure: brand link, archive button, draft resume action, and a primary writing or publishing action.
- States: home state shows archive count and `글 작성`; editor state shows `임시저장` and `출간하기`.
- Accessibility: semantic buttons, visible focus ring, and a live status region.

### Post card
- Structure: date metadata, title, excerpt, and `계속 읽기` button in a wide article row.
- States: empty archive, default, hover, active, focus.
- Accessibility: semantic `article`, heading, and an explicit action button.
- Layout: vertical list, responsive stack below 800px.

### Format tool
- Structure: compact text button in the formatting rail.
- States: default, hover, active, keyboard focus.
- Accessibility: accessible label and visible focus ring.

### Draft fields
- Structure: title input and body textarea.
- States: empty, editing, invalid.
- Accessibility: explicit labels and `aria-describedby` guidance.

### Live preview
- Structure: article element with empty state or sanitized Markdown rendering.
- States: empty and populated.
- Layout: content-limiter at 66ch.

### Saved-post dialog
- Structure: native dialog with published post list and resume-writing action.
- States: empty and populated.
- Accessibility: native modal focus handling, labelled title, keyboard-close support.

## 6. Motion & Interaction

Only 120ms `background-color`, `border-color`, `color`, and `transform` transitions communicate button feedback. Article cards shift their surface color and read action on hover. Active controls translate 1px. Reduced-motion users receive instant state changes.

## 7. Depth & Surface

Strategy: borders-only. The writing surface stays flat and quiet; one-pixel dividers establish the split without cards or shadows.

## 8. Accessibility Constraints & Accepted Debt

WCAG target: 2.2 AA. Every control has visible keyboard focus, body text meets contrast requirements, copy remains readable at 200% zoom, and reduced motion is respected.

| Item | Location | Why accepted | Owner / Exit |
|---|---|---|---|
| Browser-local storage only | `app.js` | GitHub Pages has no authenticated write backend | Add a server or GitHub OAuth-backed publish flow when shared publishing is required |
| Browser-local publication | `app.js` | `출간하기` adds a card only in the current browser | Add shared publishing when an authenticated backend is available |
