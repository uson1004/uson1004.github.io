# write. Design System

## 0. Research Log

- Reference: reviewed tilnote.io's GitHub Pages guide and article layout. Retained only the compact navigation, readable article measure, and desktop table-of-contents grammar. No logo, wording, image, CSS, or exact geometry is copied.
- Publishing model: Hugo turns committed Markdown in `content/posts/` into static pages. GitHub Actions deploys the generated artifact to Pages.
- Skipped lanes: images, external fonts, and a JavaScript theme control are unnecessary for this text-first static blog.

## 1. Atmosphere & Identity

An unhurried, paper-bright static blog for reading and maintaining long-lived notes. The signature is a procession of long horizontal article rows: each exposes date, title, and a short excerpt before the reader continues into a focused article page.

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

The home and section pages use a content-limiter of 1100px and one vertical post list. Every `post-row` is a desktop row with a 112px metadata column, a flexible title/excerpt column, and a trailing read link. An article keeps prose within 66ch. Below 800px rows stack without horizontal scroll and the desktop TOC returns to normal document flow. `--radius-small` is 6px for links and code blocks.

## 5. Components

### App header
- Structure: brand link, home link, post archive link, and repository authoring-guide link.
- States: current page is marked with `aria-current`.
- Accessibility: semantic navigation, visible focus ring, and a skip link.

### Post row
- Structure: date metadata, title, excerpt, and `계속 읽기` button in a wide article row.
- States: empty archive, default, hover, and focus.
- Accessibility: semantic `article`, heading, and an explicit destination link.
- Layout: vertical list, responsive stack below 800px.

### Post article and table of contents
- Structure: article header, publication date, title, description, Markdown body, back link, and Hugo-generated H2/H3 TOC.
- States: TOC is sticky only at desktop width and normal flow on mobile.
- Accessibility: TOC links point to existing headings and every heading uses scroll margin under the fixed header.

### Not-found page
- Structure: Korean 404 copy and a real home link.
- Accessibility: no redirect or fake success response.

## 6. Motion & Interaction

Only 120ms `background-color`, `border-color`, `color`, and `transform` transitions communicate hover and focus changes on article rows and links. Reduced-motion users receive instant state changes.

## 7. Depth & Surface

Strategy: borders-only. The writing surface stays flat and quiet; one-pixel dividers establish the split without cards or shadows.

## 8. Accessibility Constraints & Accepted Debt

WCAG target: 2.2 AA. Every control has visible keyboard focus, body text meets contrast requirements, copy remains readable at 200% zoom, and reduced motion is respected.

| Item | Location | Why accepted | Owner / Exit |
|---|---|---|---|
| Legacy browser data | pre-Hugo UI | Existing `write.*` keys remain in each browser but cannot be auto-imported into Git | Copy values through the README recipe and convert them to Markdown manually |
