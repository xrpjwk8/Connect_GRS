---
name: Connect Design System
colors:
  surface: '#faf9f9'
  surface-dim: '#dbdad9'
  surface-bright: '#faf9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efeded'
  surface-container-high: '#e9e8e8'
  surface-container-highest: '#e3e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#454934'
  inverse-surface: '#303031'
  inverse-on-surface: '#f2f0f0'
  outline: '#757962'
  outline-variant: '#c5c9ae'
  surface-tint: '#526600'
  primary: '#526600'
  on-primary: '#ffffff'
  primary-container: '#d6ff3d'
  on-primary-container: '#5e7400'
  inverse-primary: '#afd500'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e5e2e1'
  on-secondary-container: '#656464'
  tertiary: '#5d5f5d'
  on-tertiary: '#ffffff'
  tertiary-container: '#efefed'
  on-tertiary-container: '#6b6c6b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#caf22f'
  primary-fixed-dim: '#afd500'
  on-primary-fixed: '#171e00'
  on-primary-fixed-variant: '#3d4c00'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474646'
  tertiary-fixed: '#e2e3e1'
  tertiary-fixed-dim: '#c6c7c5'
  on-tertiary-fixed: '#1a1c1b'
  on-tertiary-fixed-variant: '#454746'
  background: '#faf9f9'
  on-background: '#1b1c1c'
  surface-variant: '#e3e2e2'
  ink-secondary: '#3D3D3D'
  canvas-deep: '#ECECE8'
  white: '#FFFFFF'
  chip-bg: '#F4F4F2'
  success: '#16A34A'
  danger: '#EF4444'
  warn: '#EAB308'
  border-strong: '#ECECEC'
  border-subtle: '#F4F4F4'
typography:
  display-hero:
    fontFamily: Noto Sans KR
    fontSize: 56px
    fontWeight: '800'
    lineHeight: '1.05'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Noto Sans KR
    fontSize: 22px
    fontWeight: '800'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Noto Sans KR
    fontSize: 20px
    fontWeight: '800'
    lineHeight: '1.2'
  headline-sm:
    fontFamily: Noto Sans KR
    fontSize: 18px
    fontWeight: '700'
    lineHeight: '1.35'
  title-md:
    fontFamily: Noto Sans KR
    fontSize: 16px
    fontWeight: '700'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.25'
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.4'
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Noto Sans KR
    fontSize: 32px
    fontWeight: '800'
    lineHeight: '1.1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-padding: 18px
  section-gap: 36px
  card-gap: 12px
  element-gap: 8px
  stack-sm: 4px
  max-width: 1000px
---

## Brand & Style

The design system is crafted for a platform that bridges the gap between high-energy university life and professional business management. It embodies a **Minimalist Modern** aesthetic with a high-contrast, utility-driven layout. The personality is "Professional-Energetic"—it feels like a sophisticated tool for business owners while maintaining the vibrant, fast-paced spirit of campus culture.

The style leverages **Minimalism** with a focus on bold typography and generous white space to handle information-dense dashboards. It incorporates subtle **Glassmorphism** and **Tonal Layering** to create hierarchy without visual clutter. The use of a singular, high-vibrancy accent color (Lime) against a deep "Ink" and neutral "Canvas" foundation creates a signature look that is both authoritative and fresh.

## Colors

This design system utilizes a high-contrast palette designed for maximum legibility and brand recognition. 

- **Primary (Lime):** Reserved for high-impact actions, key status indicators, and branding elements. It should always be paired with "Ink" for text to ensure accessibility.
- **Secondary (Ink):** The foundation for typography and primary surfaces in dark-themed components. It provides the "professional" weight of the brand.
- **Tertiary (Canvas) & White:** These form the background layers. Canvas is used for the app-wide background to reduce eye strain, while White is used for cards and interactive surfaces to create a "lifted" effect.
- **Semantic Colors:** Success (Green) and Danger (Red) are used exclusively for the "Time Block" and reservation status UI to provide immediate cognitive cues for owners.

## Typography

The typography system relies on a dual-font strategy: **Noto Sans KR** provides a sturdy, authoritative structure for headings, while **Inter** ensures technical precision and high legibility for data-heavy body text and labels.

**Key Principles:**
- **Weight as Hierarchy:** Use Extra Bold (800) for screen titles to establish immediate context.
- **Compactness:** Large headings use tight line-heights and negative letter-spacing to create a "heavy" editorial feel.
- **Clarity:** For technical data (times, prices, counts), always use Inter with its tabular-friendly spacing.
- **Mobile Adaptation:** Display titles scale down aggressively on mobile to maintain impact without causing excessive scrolling.

## Layout & Spacing

This design system employs a **Fluid Grid** model centered within a 1000px container for desktop, ensuring that information remains glanceable and focused. 

**Spacing Rhythm:**
- The system uses a strict **4px/8px base grid**.
- **Margins:** Screen-edge margins are 18px on mobile and scale to 48px on large displays.
- **Vertical Rhythm:** Major sections are separated by 36px to provide visual "breathing room," while related items within cards use 8px or 12px gaps.
- **Layout Model:** Dashboards utilize a 2-column layout on desktop (768px+), which reflows into a single-column stack on mobile devices.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** rather than heavy shadows. The system uses three primary depths:

1.  **Level 0 (Base):** The Canvas (`#F5F5F3`) color serves as the foundation.
2.  **Level 1 (Surface):** White (`#FFFFFF`) cards with a subtle 1px border (`#ECECEC`). These cards contain the primary content.
3.  **Level 2 (Interaction):** A soft, diffused shadow (`rgba(15, 15, 15, 0.18)`) is applied only to elevated components like floating action buttons, modals, or primary phone frames to suggest clickability and "lift."

**Floating Elements:** Use a subtle backdrop blur (12px) for sticky headers or navigation bars to maintain context of the content scrolling underneath.

## Shapes

The shape language is defined by **exaggerated roundedness**, which softens the high-contrast color palette and makes the UI feel approachable.

- **Primary Containers:** Large cards and hero sections use **20px** corners.
- **Secondary Components:** Standard buttons and input fields use **16px** to **14px** corners.
- **Technical Elements:** Small grid cells (like time slots) use **8px**.
- **Interactive Pills:** CTA buttons and status chips use **999px (Pill-shaped)** to distinguish them from structural layout cards.

## Components

### Buttons
- **Primary:** Solid Ink background with White or Lime text. 16px border-radius or Pill-shaped.
- **Accent:** Solid Lime background with Ink text. Used for "Book Now" or "Approve."
- **Ghost:** 1px Ink or Subtle Border with no fill.

### Input Fields
- Background: `#F4F4F2`.
- Border-radius: 14px.
- Focus State: 1.5px solid Ink or Lime border.

### Chips & Badges
- Used for categories or status.
- Background: `#F4F4F2` for neutral; Semantic colors for status.
- Border-radius: 999px for status; 6px for inline keywords.

### Cards
- Background: White.
- Border: 1px solid `#ECECEC`.
- Padding: 18px for main body; 14px for internal KPI blocks.

### Time Blocks (Owner Dashboard)
- **Available:** White with subtle border.
- **Blocked/Danger:** Solid `#EF4444` with white icon/text.
- **Reserved:** Solid Lime or light gray with Ink text.
- Grid: 8px spacing between time cells.