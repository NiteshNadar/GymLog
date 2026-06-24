---
name: Gym Log 2.0 Design System
description: Linear-inspired high-performance dark theme optimized for mobile gym logging speed.
colors:
  primary: "#4f46e5"
  primary-hover: "#6366f1"
  neutral-bg: "#09090b"
  neutral-card: "#18181b"
  neutral-border: "#27272a"
  neutral-foreground: "#fafafa"
  neutral-muted: "#a1a1aa"
  accent-green: "#22c55e"
  accent-red: "#ef4444"
typography:
  display:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.2
  headline:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
  title:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.05em"
rounded:
  sm: "6px"
  md: "12px"
  lg: "20px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-foreground}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
---

# Design System: Gym Log 2.0

## 1. Overview

**Creative North Star: "The Athletic Instrument"**

Gym Log 2.0 is designed as a high-performance utility for athletes in active training. Every visual choice prioritizes immediate legibility, high contrast under gym lighting, and minimal input latency. The aesthetic is inspired by tools like Linear and Raycast—restrained, precise, and utilitarian.

This system rejects visual noise: there are no unnecessary card containers, no gradient text, and no glassmorphism for backgrounds. Depth is communicated strictly through tonal layering and razor-thin borders.

**Key Characteristics:**
- **Zero-Friction Layout**: Vertical stacks and tap targets are prioritized over horizontal groupings.
- **Deep-Slate Canvas**: A low-light, high-contrast palette that reduces eye strain in dark gym environments.
- **Micro-Interactivity**: Responsive hover and active states build trust through instant feedback.

---

## 2. Colors

The color palette is highly restrained, using dark slate and zinc neutrals with a single functional indigo accent.

### Primary
- **Performance Indigo** (`#4f46e5` / `oklch(53% 0.20 264)`): The primary action and brand accent. Used for submit buttons and positive selection states.

### Neutral
- **Deep Slate Canvas** (`#09090b` / `oklch(10% 0.005 240)`): The global background. Tinted neutral to avoid pitch-black deadness.
- **Elevated Slate** (`#18181b` / `oklch(15% 0.005 240)`): Card backgrounds and input fields.
- **Border Zinc** (`#27272a` / `oklch(22% 0.005 240)`): Used for all structure lines and field borders.
- **High-Contrast Text** (`#fafafa` / `oklch(98% 0.002 240)`): Base body and title text color.
- **Muted Zinc** (`#a1a1aa` / `oklch(70% 0.005 240)`): Secondary labels and unit indicators.

**The 10% Accent Rule.** The primary accent Indigo is restricted to 10% or less of the screen surface to ensure key actions are unmistakable.

---

## 3. Typography

**Display Font:** `Outfit` (fallback: `system-ui, sans-serif`)
**Body Font:** `Inter` (fallback: `system-ui, sans-serif`)
**Label/Mono Font:** `JetBrains Mono` (fallback: `monospace`)

The pairing uses the energetic geometry of `Outfit` for titles to evoke modern athleticism, combined with the extreme utility of `Inter` for content and `JetBrains Mono` for tabular workout metrics.

### Hierarchy
- **Display** (Bold, `1.75rem`, `1.2`): Page titles and large headers (e.g., active session name).
- **Headline** (Semi-Bold, `1.5rem`, `1.25`): Section headings.
- **Title** (Semi-Bold, `1.125rem`, `1.5`): Workout/Card names.
- **Body** (Regular, `0.9375rem`, `1.5`): General details and logs. Max line length: `65ch`.
- **Label** (Bold, `0.75rem`, uppercase, `0.05em` letter-spacing): Form input headers and column labels.

---

## 4. Elevation

Gym Log 2.0 uses a flat, layered elevation model. Depth is created using background color steps (e.g., `#09090b` for base, `#18181b` for active containers) rather than drop shadows.

**The Flat-By-Default Rule.** Dropshadows are forbidden except on floating overlay panels (like select lists). Active states use border shifts rather than visual lift.

---

## 5. Components

### Buttons
- **Shape:** Soft-curved corners (`12px` / `rounded-xl`).
- **Primary:** Background Performance Indigo (`#4f46e5`), text High-Contrast Text (`#fafafa`). Padding: `12px 24px`.
- **Ghost:** Transparent background, Border Zinc (`#27272a`), text Muted Zinc (`#a1a1aa`).

### Cards / Containers
- **Corner Style:** Rounded (`20px` / `rounded-3xl` for main panels).
- **Background:** Elevated Slate (`#18181b`).
- **Border:** Border Zinc (`#27272a`), `1px` solid.

### Inputs / Fields
- **Style:** Elevated Slate (`#18181b`), Border Zinc (`#27272a`), `1px` solid, corners `12px` (`rounded-xl`).
- **Focus:** Border changes to Indigo (`#4f46e5`), ring width `1px`.

---

## 6. Do's and Don'ts

### Do:
- **Do** ensure all clickable items have a touch area of at least 44x44px.
- **Do** use `font-variant-numeric: tabular-nums` or `JetBrains Mono` for all numbers to ensure set metrics align vertically.
- **Do** keep forms single-column to speed up typing and navigation.

### Don't:
- **Don't** use glassmorphism effects for primary card backgrounds.
- **Don't** use text gradients under any circumstances.
- **Don't** use colored left/right borders as accent indicators on list items or cards.
