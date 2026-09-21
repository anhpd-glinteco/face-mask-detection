---
name: Precision Technical Evaluation Workspace
colors:
  surface: '#f8f9fc'
  surface-dim: '#d8dadd'
  surface-bright: '#f8f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e7e8eb'
  surface-container-highest: '#e1e2e5'
  on-surface: '#191c1e'
  on-surface-variant: '#434655'
  inverse-surface: '#2e3133'
  inverse-on-surface: '#eff1f3'
  outline: '#747686'
  outline-variant: '#c4c5d7'
  surface-tint: '#2151da'
  primary: '#0037b0'
  on-primary: '#ffffff'
  primary-container: '#1d4ed8'
  on-primary-container: '#cad3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#006d30'
  on-secondary: '#ffffff'
  secondary-container: '#92f5a4'
  on-secondary-container: '#007233'
  tertiary: '#733100'
  on-tertiary: '#ffffff'
  tertiary-container: '#984300'
  on-tertiary-container: '#ffcaae'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001551'
  on-primary-fixed-variant: '#0039b5'
  secondary-fixed: '#95f8a7'
  secondary-fixed-dim: '#79db8d'
  on-secondary-fixed: '#00210a'
  on-secondary-fixed-variant: '#005323'
  tertiary-fixed: '#ffdbca'
  tertiary-fixed-dim: '#ffb68e'
  on-tertiary-fixed: '#331200'
  on-tertiary-fixed-variant: '#763300'
  background: '#f8f9fc'
  on-background: '#191c1e'
  surface-variant: '#e1e2e5'
typography:
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 1.75rem
    fontWeight: '600'
    lineHeight: 2.25rem
    letterSpacing: -0.015em
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: IBM Plex Sans
    fontSize: 1rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: -0.005em
  body-lg:
    fontFamily: IBM Plex Sans
    fontSize: 0.9375rem
    fontWeight: '400'
    lineHeight: 1.375rem
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
  body-sm:
    fontFamily: IBM Plex Sans
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1.125rem
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.6875rem
    fontWeight: '500'
    lineHeight: 0.875rem
    letterSpacing: 0.03em
  data-metric:
    fontFamily: JetBrains Mono
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.25rem
    letterSpacing: -0.02em
  data-metric-lg:
    fontFamily: JetBrains Mono
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.03em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system establishes a high-density, analytical workstation tailored for visual machine learning verification, edge-model auditing, and ground-truth validation. It treats computer vision evaluation not as an automated surveillance output, but as a deliberate scientific instrument—evoking the measured precision, calm focus, and clinical integrity of a modern metrology lab.

The design movement combines **Swiss Utilitarianism** with **Modern Benchtop Instrumentation**:
- **Utilitarian & Honest:** Interfaces prioritize functional hierarchy, data clarity, and legibility over decorative flourish. Every container, rule, and label exists solely to contextualize metric comparisons, model inferences, and confidence thresholds.
- **Calm, High-Focus Workspace:** A tactile warm-paper background paired with deep carbon ink suppresses eye fatigue across extended auditing sessions. It deliberately rejects saturated dark modes, glowing neon HUD elements, and surveillance-style dystopic overlays in favor of archival clarity.
- **Instrument Precision:** Crisp 1-pixel architectural borders, low-radius geometries, and strict monospaced readouts communicate mathematical rigor, traceability, and confidence.

## Colors

The palette is engineered around an archival paper-and-ink baseline with discrete, functional chromatic signals dedicated to visual inspection.

### Base Environment & Canvas
- **Canvas / App Root:** `#F9F8F6` (Warm technical paper; dampens harsh screen glare during precision inspections).
- **Surface / Panels:** `#FFFFFF` (Primary work surfaces, image viewports, and table containers).
- **Surface Inset / Recessed:** `#F3F1ED` (Toolbars, inspect rails, and tabular headers).
- **Structural Borders:** `#E2DFD8` (Standard internal panel dividers) and `#D0CCC2` (Active boundaries, focus states, and high-contrast section framing).

### Ink & Typography Hierarchy
- **Primary Ink:** `#191C1E` (Pure contrast for critical readouts, labels, and bounding box counts).
- **Secondary Ink:** `#565D64` (Metadata, unit labels, table headers, and auxiliary details).
- **Muted / Inactive Ink:** `#8A929A` (Disabled states, grid lines, structural guides, placeholder indicators).

### Interactive Accent
- **Focal Ink-Blue:** `#1D4ED8` (Active tools, primary actions, selected records, focus rings). Interactive hover: `#1E40AF`. Subtle active wash: `#EFF6FF`.

### Model Evaluation Classes (Semantic Detection States)
Semantic states are paired with high-contrast text and desaturated tint surfaces to maximize bounding-box legibility over variable image exposures:
- **Correct Mask (`class-correct`):** Text/Stroke `#15803D` | Background fill `#DCFCE7` (Forest Emerald).
- **Incorrect Mask (`class-incorrect`):** Text/Stroke `#B45309` | Background fill `#FEF3C7` (Amber Ochre).
- **No Mask (`class-none`):** Text/Stroke `#B91C1C` | Background fill `#FEE2E2` (Crimson Coral).
- **Uncertain / Low Confidence (`class-uncertain`):** Text/Stroke `#475569` | Background fill `#F1F5F9` (Slate Mauve).

## Typography

Typography enforces a strict dichotomy between interface taxonomy and quantitative evidence:
- **IBM Plex Sans:** Drives all human-language interfaces, navigation titles, tooltips, and procedural instructions. It delivers neutral, highly legible glyphs with sturdy terminals suited to high-density layouts.
- **JetBrains Mono:** Dedicated exclusively to spatial coordinates `(x, y, w, h)`, confidence scores `[0.00 - 1.00]`, inference latencies (`ms`), IoU metrics, timestamps, and model tensor IDs. This ensures tabular figures align naturally across comparative inspection matrices without vertical jitter.

Use uppercase styling sparingly and only on `label-sm` technical tags (e.g., `CLASS: NO_MASK`, `IOU: 0.84`, `FPS: 60`). Do not use open tracking on running body text.

## Layout & Spacing

The layout is built as a **fixed-frame multi-pane benchtop workstation** operating within a dense 4px base increment (`space-xs: 4px`, `space-sm: 8px`, `space-md: 12px`, `space-lg: 16px`, `space-xl: 24px`):

- **Workspace Architecture:** Full viewport height allocation (`100vh`) with no gratuitous outer margins. Three primary operational columns dominate the layout:
  1. **Batch Navigation / Manifest Strip (Left):** 280px fixed width, listing session frames, test sets, and filter bars.
  2. **Viewport & Spatial Inspection Canvas (Center):** Fluid width, dark/light toggleable neutral backing with crosshair alignment grids and pixel zoom controls.
  3. **Analytical Readout & Matrix Panel (Right):** 360px–420px fixed width, displaying bounding box metadata, threshold scrubbers, and confusion matrices.
- **Density Policy:** Vertical padding on table cells and lists must not exceed 6px (`0.375rem`) to maintain immediate situational awareness across dozens of detections per frame.
- **Breakpoints:** On displays under `1280px`, the left manifest collapses to an icon/index drawer, preserving central inspection canvas fidelity. Below `1024px`, the right analytical panel switches into a modal overlay, prioritizing precision canvas review.

## Elevation & Depth

This system intentionally eliminates traditional ambient dropshadows, blurred backdrops, and artificial layering. Depth is communicated strictly via **Tonal Layering and Crisp Architectural Borders**:

- **Layer 0 (Canvas Base):** `#F9F8F6` provides the technical foundation beneath all docking panes.
- **Layer 1 (Structural Work Surfaces):** `#FFFFFF` surfaces inset into the foundation, bounded by a uniform `1px solid #E2DFD8` stroke.
- **Layer 2 (Recessed Tooling & Headers):** `#F3F1ED` surfaces sit flush within Layer 1 panels to anchor header ribbons, table column titles, and metric strips without adding elevation.
- **Floating Overlays & Popovers:** Inspection loupes, context menus, and confidence filter tooltips use an opaque `#FFFFFF` surface with a crisp `1px solid #D0CCC2` border and a single technical hard hairline edge: `box-shadow: 0 2px 4px rgba(25, 28, 30, 0.06)`. Never use diffuse or colored glow shadows.

## Shapes

The geometric framework is strictly disciplined, using compact radii to reinforce an industrial laboratory feel:
- **Base Geometry (`roundedness: 1`):** A rigid 4px default radius for buttons, input fields, tags, and small metric blocks.
- **Panel Boundaries & Viewport Frames:** 6px maximum border radius.
- **Modal Containers & Canvas Frame:** 8px absolute maximum.
- **No Pill Radii:** Rounded-full styles are prohibited. Badges, status markers, and sliders use rectangular shapes with 2px to 4px corners to maintain visual alignment with tabular data columns.

## Components

### Buttons
- **Primary:** Background `#1D4ED8`, text `#FFFFFF`, 1px border `#1E40AF`, radius 4px, height 32px. Focus outline: 2px offset in `#1D4ED8`. Hover: `#1E40AF`.
- **Secondary / Tool:** Background `#FFFFFF`, text `#191C1E`, 1px border `#D0CCC2`, radius 4px, height 32px. Hover: `#F3F1ED`.
- **Destructive / Reset:** Background `#FFFFFF`, text `#B91C1C`, 1px border `#FEE2E2`. Hover: `#FEE2E2`.

### Inspection Chips & Detection Badges
- Strict 4px radius, 20px total height, monospaced font (`label-sm`).
- Bounded with a 1px border matching the semantic classification:
  - *Correct:* `#15803D` text, `#DCFCE7` background, `1px solid #86EFAC`.
  - *Incorrect:* `#B45309` text, `#FEF3C7` background, `1px solid #FCD34D`.
  - *No Mask:* `#B91C1C` text, `#FEE2E2` background, `1px solid #FCA5A5`.
  - *Uncertain:* `#475569` text, `#F1F5F9` background, `1px solid #CBD5E1`.

### Data Grids & Bounding Box Manifests
- **Header:** Height 28px, background `#F3F1ED`, text `#565D64`, uppercase `label-sm`, bottom border `1px solid #E2DFD8`.
- **Rows:** Height 32px, text `#191C1E` with monospaced coordinate columns. Alternating hover background `#F9F8F6`. Selected row: `#EFF6FF` with a 2px left accent border `#1D4ED8`.

### Form Controls & Threshold Inputs
- **Confidence Sliders:** Track height 4px, background `#E2DFD8`, filled range `#1D4ED8`. Thumb: 12px x 12px square or 2px radius block in `#1D4ED8` with a visible floating monospaced value bubble.
- **Inputs & Dropdowns:** Height 32px, background `#FFFFFF`, border `1px solid #D0CCC2`, padding 0 8px, font `body-md` / `label-md`. Focus: border `#1D4ED8`, outline none.
- **Checkboxes:** 14px x 14px square, 2px radius, border `1px solid #8A929A`. Active checked state: `#1D4ED8` background with a crisp white tick mark.

### Canvas Bounding Overlays
- **BBox Stroke:** Crisp 1.5px solid stroke using the semantic class color.
- **Corner Anchors:** 4px x 4px solid square grips for manual ground-truth adjustment.
- **Label Tag:** Directly attached to the top-left boundary of the bbox. Background matches the semantic text color, with 10px `#FFFFFF` monospaced text rendering label name and confidence (e.g., `CORRECT 0.98`).