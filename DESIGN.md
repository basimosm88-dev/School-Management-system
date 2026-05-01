---
name: Full School Management System
colors:
  surface: '#fbf8ff'
  surface-dim: '#d9d9e6'
  surface-bright: '#fbf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f2ff'
  surface-container: '#ededfb'
  surface-container-high: '#e7e7f5'
  surface-container-highest: '#e1e1ef'
  on-surface: '#191b25'
  on-surface-variant: '#434656'
  inverse-surface: '#2e303a'
  inverse-on-surface: '#f0effd'
  outline: '#737687'
  outline-variant: '#c3c5d8'
  surface-tint: '#0051e1'
  primary: '#004bd3'
  on-primary: '#ffffff'
  primary-container: '#1d63ff'
  on-primary-container: '#f6f5ff'
  inverse-primary: '#b5c4ff'
  secondary: '#5c5f61'
  on-secondary: '#ffffff'
  secondary-container: '#e0e3e5'
  on-secondary-container: '#626567'
  tertiary: '#50586e'
  on-tertiary: '#ffffff'
  tertiary-container: '#687087'
  on-tertiary-container: '#f5f5ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b5c4ff'
  on-primary-fixed: '#00164d'
  on-primary-fixed-variant: '#003cac'
  secondary-fixed: '#e0e3e5'
  secondary-fixed-dim: '#c4c7c9'
  on-secondary-fixed: '#191c1e'
  on-secondary-fixed-variant: '#444749'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#fbf8ff'
  on-background: '#191b25'
  surface-variant: '#e1e1ef'
typography:
  display-bold:
    fontFamily: Epilogue
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Epilogue
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Epilogue
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Epilogue
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-bold:
    fontFamily: Epilogue
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
  stat-value:
    fontFamily: Epilogue
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  sidebar-width: 240px
  card-padding: 24px
  gutter: 20px
  section-margin: 32px
---

## Brand & Style
This design system embodies a **Modern Corporate** aesthetic, prioritizing clarity, efficiency, and a calm professional atmosphere. It is tailored for high-density SaaS environments where data visualization and navigation speed are paramount. The style uses a "soft-minimalist" approach—utilizing generous whitespace and high-contrast typography to ensure readability without visual fatigue. The emotional response should be one of reliability and organized precision, achieved through consistent grid alignment and a disciplined color application. With the transition to rounded geometry, the brand maintains a contemporary, approachable tech aesthetic that feels stable and professional.

## Colors
The palette is rooted in a functional "Light Mode" default, emphasizing a clean, high-end professional look.
- **Primary Blue (#1d63FF):** Used for actionable elements, active states, and focus indicators.
- **Tonal Accents:** The secondary color (#F8FAFC) provides a subtle off-white for surfaces, while the tertiary dark slate (#0F172A) is reserved for high-contrast structural elements and primary headings.
- **Surface Strategy:** The background utilizes the secondary light gray (#F8FAFC) to provide a subtle contrast against the pure white (#FFFFFF) cards, creating a natural layered effect without heavy shadows.
- **Text Hierarchy:** Deep slate (#0F172A) is used for headings to ensure maximum legibility, while a mid-gray (#757682) is used for secondary body text and metadata.

## Typography
The system uses **Epilogue** for its contemporary, sans-serif character which brings a slightly more distinct and personality-driven feel to dashboard environments while maintaining high readability. 
- **Headings:** Bold weights are used for page titles and card headers to establish a clear hierarchy.
- **Stats:** Numeric data should use semi-bold weights with consistent tabular lining where possible.
- **Labels:** Small caps or slightly smaller font sizes with increased weight are used for secondary labels to distinguish them from actionable body text.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model. 
- **Sidebar:** A fixed 240px vertical navigation occupies the left, providing a stable anchor for the application.
- **Grid:** The main content area utilizes a 12-column fluid grid with 20px gutters. 
- **Rhythm:** A 4px baseline grid ensures vertical consistency. Components are spaced using multiples of 8px (8, 16, 24, 32) to maintain a clean, rhythmic breathing room between cards and sections.

## Elevation & Depth
This system avoids heavy, traditional shadows in favor of **Tonal Layering** and **Ambient Depth**.
- **Level 0 (Background):** #F8FAFC.
- **Level 1 (Cards/Sidebar):** White (#FFFFFF) with a very soft, high-diffusion shadow (0px 4px 20px rgba(0, 0, 0, 0.03)).
- **Overlays (Tooltips/Dropdowns):** Use a slightly more defined shadow and a thin 1px border (#757682 at low opacity) to ensure separation from Level 1 surfaces.
- **Focus States:** Elements "lift" slightly or receive a primary blue ring rather than a shadow increase.

## Shapes
The shape language is "Rounded," utilizing standardized radii to create a clean, balanced interface that feels more structured than pill-shaped designs while remaining accessible.
- **Containers/Cards:** Use a 16px radius (lg) for large surface areas.
- **Buttons/Inputs:** Standardized at an 8px radius (md) to provide a crisp, professional appearance.
- **Icon Containers:** Small utility icons sit inside 4px rounded squares (sm) or circles for a cohesive look.

## Components
- **Buttons:** Primary buttons are solid Blue with white text. Secondary buttons use the light secondary gray or a subtle border. All buttons feature the standardized 8px (md) rounded corners.
- **Stat Cards:** Must include a primary value, a secondary label, and a "Trend Indicator." Cards utilize the 16px rounded corners.
- **Segmented Controls:** Used for high-level view switching. These feature the dark tertiary active state with white text and light gray inactive states, following the 8px rounded shape.
- **Icons:** 2px stroke weight, outline style only. Avoid filled icons except for specific status indicators.
- **Data Tables:** Clean rows with 1px light gray dividers. Selection highlights should incorporate rounded corners (4px) for a cohesive look.
- **Sidebar Items:** Clear active state using a primary blue background with a softened 8px rounded highlight.