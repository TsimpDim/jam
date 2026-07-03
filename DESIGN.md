---
name: JAM!
description: AI-powered job application command center — track, organize, and land your dream job
colors:
  plum-deep: "#320047"
  plum-light: "#4d0070"
  plum-dark: "#1f002d"
  white: "#ffffff"
  surface-tinted: "#f8f9fa"
  ink-primary: "#1a1a1a"
  ink-secondary: "#666666"
  ink-muted: "#999999"
  border: "#e0e0e0"
typography:
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  pill: "20px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  "2xl": "48px"
  "3xl": "64px"
components:
  button-primary:
    backgroundColor: "{colors.plum-deep}"
    textColor: "{colors.white}"
    rounded: "{rounded.sm}"
    padding: "14px 32px"
  button-primary-hover:
    backgroundColor: "{colors.plum-light}"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.plum-deep}"
    rounded: "{rounded.sm}"
    padding: "14px 32px"
  button-secondary-hover:
    backgroundColor: "{colors.plum-deep}"
    textColor: "{colors.white}"
  card-feature:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.md}"
    padding: "32px"
  card-pricing:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.lg}"
    padding: "48px 32px"
  nav-bar:
    backgroundColor: "rgba(255, 255, 255, 0.95)"
    textColor: "{colors.ink-primary}"
  chip-status:
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  input-field:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.sm}"
---

# Design System: JAM!

## 1. Overview

**Creative North Star: "The Capable Ally"**

JAM! looks like the organized, quietly capable friend who knows exactly where everything is and never panics. The deep plum anchor (`#320047`) carries the brand's motivational pulse without shouting — it's used intentionally, never decoratively. White surfaces, generous breathing room, and precise typography create a workspace that feels calm and focused, not sterile.

The system rejects the cold sterility of corporate HR SaaS (no stock-photo blues, no generic gradient banners), the dark terminal aesthetic of developer tools (JAM! is warm and human, not a CLI), and the candy-sweet gamification that turns job hunting into a toy. Instead, it's crafted but not precious: clean layouts, consistent affordances, and subtle motion that reinforces confidence, never distracts.

**Key Characteristics:**
- Clean, white-forward surfaces with a single deep purple accent carrying brand energy
- Inter at restrained weights — one sans family for everything, tuned for readability at task-density
- Light shadow vocabulary: surfaces lift on hover, never shout
- Precise component vocabulary: every interactive element looks and behaves the same across screens
- No decoration for decoration's sake — every visual choice earns its place

## 2. Colors

The palette is focused: one saturated brand color (plum-deep), a light variant for gradients and hover, and a restrained set of neutrals that let the purple breathe.

### Primary
- **Plum Deep** (`#320047`): The brand anchor. Used for headers, primary buttons, step numbers, check icons, gradient backgrounds, and the CTA section. Appears on 15–25% of any given screen. Never used as body text.
- **Plum Light** (`#4d0070`): The hover and gradient partner. Used exclusively in `linear-gradient` pairs with Plum Deep and as the hover state for primary buttons.
- **Plum Dark** (`#1f002d`): Deepest variant. Reserved for footer backgrounds and dark-surface text when white would be too bright.

### Neutral
- **White** (`#ffffff`): Primary surface. The content canvas. Cards, modals, and main content areas all sit on white.
- **Surface Tinted** (`#f8f9fa`): Secondary surface for alternating sections and card interiors. Provides just enough contrast to define zones without introducing a second brand color.
- **Ink Primary** (`#1a1a1a`): Body text. Near-black with a hint of warmth. Meets WCAG AA contrast against white (≥4.5:1). **Never go lighter than this for running prose.**
- **Ink Secondary** (`#666666`): Supporting text, descriptions, metadata. Only used where context is clear from the structure; never the sole source of information.
- **Ink Muted** (`#999999`): Footnotes, timestamps, truly ancillary content. Use sparingly.
- **Border** (`#e0e0e0`): Card borders, input strokes, dividers. Light enough to recede, present enough to define edges.

### Named Rules

**The One Voice Rule.** Plum Deep is the only saturated color on any given screen. No secondary accent, no trendy AI-purple teal pair. AI features use a violet tint (`#8b5cf6`) only in designated AI-badged contexts and always in gradient pairs, never as a standalone color role.

**The Contrast Floor Rule.** Body text against any background must hit ≥4.5:1. If it doesn't, darken the text — never lighten it further.

## 3. Typography

**Primary Font:** Inter (with system-ui fallback: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`)

**Character:** Inter's clean, neutral geometry carries both data density and brand voice without switching families. A single sans across all roles — headings, labels, body, data — keeps the tool feeling cohesive and fast. The weight range (300–800) provides enough hierarchy for landing pages while staying tight for dashboard density.

### Hierarchy
- **Hero / Display** (800 weight, 3.5rem / clamp(2rem, 5vw, 3.5rem), line-height 1.2): Landing page hero headlines only. Never used in the dashboard.
- **Section Title** (800 weight, 2.75rem, line-height 1.2): Page-level headings. Used sparingly — at most 2–3 per page.
- **Card Title** (700 weight, 1.5rem, line-height 1.3): Feature cards, pricing cards, step titles.
- **Body** (400 weight, 1rem, line-height 1.6): Running text, descriptions, form labels. Max 65ch for prose; table/text-dense areas can run wider.
- **Label / Small** (500–600 weight, 0.875rem, letter-spacing 0.02em): Navigation, buttons, status chips, metadata.
- **Detail** (400 weight, 0.75rem): Timestamps, footnotes, truly secondary data.

### Named Rules

**The Single Family Rule.** One font family across the entire product. No display/body pairing. Hierarchy is achieved through weight and size, never by switching families.

**The Dashboard Ceiling Rule.** Inside the product (not the landing page), headings cap at 1.5rem. The tool is for doing, not for reading marketing copy. Information density wins.

## 4. Elevation

The system uses a light shadow vocabulary — three steps, all carrying a hint of the brand plum in their undertone. Surfaces are flat at rest; depth appears only as a response to state (hover, focus, elevation).

### Shadow Vocabulary
- **Ambient Low** (`0 2px 8px rgba(50, 0, 71, 0.08)`): Default card shadow. Just enough to separate from the background without feeling lifted.
- **Elevated Mid** (`0 4px 16px rgba(50, 0, 71, 0.12)`): Hovered cards, dropdowns, tooltips. The lift is subtle — 4px vertical, soft spread.
- **Prominent High** (`0 8px 32px rgba(50, 0, 71, 0.16)`): Modals, featured cards, the hero dashboard preview. The strongest lift in the system.

### Named Rules

**The Flat-By-Default Rule.** No element is elevated without cause. Cards rest at Ambient Low; hover lifts to Elevated Mid; modals lift to Prominent High. Random shadows are forbidden.

## 5. Components

### Buttons

- **Shape:** Rounded corners (8px). Generous but not pill-shaped.
- **Primary:** Plum Deep background, white text, 14px × 32px padding. On hover: shifts to Plum Light, lifts 2px (`translateY(-2px)`), shadow transitions to Elevated Mid. Transition: `all 0.3s ease`.
- **Secondary:** White background, Plum Deep text, 2px Plum Deep border. On hover: fills with Plum Deep, text goes white.
- **Outline / Ghost:** Transparent background, Plum Deep text, 2px Plum Deep border. On hover: fills with Plum Deep, text goes white.
- **CTA (Large):** Primary variant at 18px × 40px padding. Landing page only.
- **Focus:** `focus-visible` ring: 2px offset, `rgba(50, 0, 71, 0.4)` glow. No outline removal.

### Cards

- **Feature Card:** White background, 12px radius, 32px internal padding. Ambient Low shadow at rest, Elevated Mid on hover with 4px lift. AI-featured variants carry a violet gradient top border (3px) as a state marker, not a decorative stripe.
- **Application Card (Dashboard):** White background, 10px radius, 14px padding. 1px border. On hover: lifts 2px, shadow transitions to Ambient Low. Active card gets a tinted left-edge indicator via background, never a `border-left` stripe — use a full border tint or background wash instead.
- **Pricing Card:** White background, 16px radius, 48px × 32px padding. 2px border. Featured variant swaps border to Plum Deep and adds a gradient badge above. Hover lifts 8px to Prominent High.

### Navigation

- **Top Bar:** Fixed position, white at 95% opacity, backdrop blur 10px, Ambient Low shadow. Brand logo in Plum Deep, 800 weight, italic. Links in Ink Primary at 500 weight, 0.95rem. Active/hover: Plum Deep.
- **Mobile Menu:** Full-width overlay sliding from left, white background, Elevated Mid shadow. Links at 1.125rem for touch targets.
- **Dashboard Nav (Clarity):** Purple header (`#320047`) with white links. Active states use a slight background brightening (`rgba(255, 255, 255, 0.1)`). Mobile: full-height drawer from top, same purple background.

### Chips / Status Badges

- **Shape:** Pill (20px radius), 4px × 12px padding.
- **Status Variants:** Success (green tint `#e8f5e9` / `#2e7d32`), Interview (amber tint `#fff3e0` / `#f57c00`), Applied (blue tint `#e3f2fd` / `#1976d2`), Lead (amber `#fef3c7` / `#d97706`), AI (violet `#8b5cf6` gradient).
- **Typography:** 600 weight, 0.7rem, no letter-spacing inflation.

### Inputs / Fields

- **Style:** White background, 1px Border stroke, 8px radius. Typography: 400 weight, 1rem Inter.
- **Focus:** Border shifts to Plum Deep, subtle glow (`0 1px 3px rgba(50, 0, 71, 0.15)`). No outline removal.
- **Error:** Border shifts to `#ef4444`, error text in red below the field at 0.85rem.
- **Disabled:** 50% opacity on the whole control.

### Problem/Solution Layout (Landing Page Signature)

A two-column comparison grid separated by a directional arrow. Problem side: warm red tinted background (`#fff5f5`), red pain points with large stat numbers. Solution side: violet tinted background, green/violet checkmarks. Collapses to single column on tablet with a horizontal arrow. This is the landing page's most distinctive layout component — use it for before/after contrasts, never for generic feature lists.

## 6. Do's and Don'ts

### Do:
- **Do** use Plum Deep (`#320047`) for primary actions, brand moments, and section headers. It should appear on ~15–25% of any screen — visible but not dominant.
- **Do** keep body text at Ink Primary (`#1a1a1a`) or darker. Muted gray body text is the single biggest readability failure in AI-generated design.
- **Do** use the light shadow vocabulary exactly as defined. Ambient Low for rest, Elevated Mid for hover, Prominent High for modals. No other shadow values.
- **Do** use the single Inter family across all surfaces. One family, one voice.
- **Do** pair AI features with the violet gradient accent (`#8b5cf6` → `#a855f7`) — it's the one allowed secondary color and only in AI-badged contexts.
- **Do** test every component state (hover, focus, active, disabled, loading, error) before shipping.

### Don't:
- **Don't** pair another saturated color with Plum Deep. No teal accent, no complementary orange. The one accent is the point.
- **Don't** use gradient text (`background-clip: text`). One solid color for all text, always.
- **Don't** use corporate HR SaaS patterns: stock photos, cold blues, generic gradient banners, handshake imagery.
- **Don't** use dark-mode terminal aesthetics. JAM! is warm and human, not a CLI.
- **Don't** use gamification: XP bars, achievement popups, candy colors, point systems. It's a tool, not a toy.
- **Don't** use `border-left` greater than 1px as a colored accent stripe on cards. Use full border tints or background washes instead.
- **Don't** stack identical card grids (icon + heading + text, repeated 6–9 times) without breaking rhythm. Vary the layout or the content shape.
- **Don't** use tiny uppercase tracked eyebrows above every section. A named badge is a system choice; an eyebrow on every section is AI grammar.
- **Don't** gate content on animation. Every UI element must be visible at rest, regardless of scroll position or tab focus.
