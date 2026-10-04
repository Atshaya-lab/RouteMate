---
name: Wayfinding & Safety System
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434655'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#747686'
  outline-variant: '#c4c5d7'
  surface-tint: '#2151da'
  primary: '#0037b0'
  on-primary: '#ffffff'
  primary-container: '#1d4ed8'
  on-primary-container: '#cad3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#006c4a'
  on-secondary: '#ffffff'
  secondary-container: '#82f5c1'
  on-secondary-container: '#00714e'
  tertiary: '#8f000b'
  on-tertiary: '#ffffff'
  tertiary-container: '#bb0112'
  on-tertiary-container: '#ffc7c1'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001551'
  on-primary-fixed-variant: '#0039b5'
  secondary-fixed: '#85f8c4'
  secondary-fixed-dim: '#68dba9'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#ffdad6'
  tertiary-fixed-dim: '#ffb4ab'
  on-tertiary-fixed: '#410002'
  on-tertiary-fixed-variant: '#93000b'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 34px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.003em
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.015em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  tabular-metric:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system is engineered for moments of disorientation, vulnerability, and spatial friction. It serves lost travelers, solo commuters, and unfamiliar explorers seeking instantaneous connection to vetted local guides. The brand identity balances unyielding technical precision with calm human reassurance.

The visual style blends **Modern Utilitarianism** with **Calm Reassurance**:
- Zero extraneous ornament; cognitive load is minimized to reduce stress under duress.
- Tactical legibility designed for direct sunlight, motion blur, and one-handed use.
- High-contrast visual cues prioritizing critical wayfinding decisions and rapid emergency escalation.
- Quiet, clinical reliability paired with soft human verification markers to establish immediate trust.

## Colors

The palette establishes a strict functional hierarchy built on psychological clarity and instant recognition outdoors:

- **Primary (`#1D4ED8` - Cobalt Blue)**: The core navigational anchor. Used for primary interactive triggers, active route lines, key callouts, and prominent selection states.
- **Secondary (`#059669` - Emerald Green)**: The indicator of trust and activity. Reserved strictly for real-time guide availability, verified credentials, completed waypoints, and active connection status.
- **Tertiary (`#DC2626` - Crimson Red)**: The critical safety accent. Strictly isolated to SOS alerts, panic triggers, critical battery/connection dropouts, and emergency contact bypass. It must never appear in standard error notifications or form validations to preserve its psychological impact.
- **Neutrals**:
  - `#0F172A` (Slate 900): Deep obsidian slate for primary display titles, critical metrics, and maximum text contrast against bright maps.
  - `#334155` (Slate 700): Secondary text, icon fills, and instructional body copy.
  - `#64748B` (Slate 500): Tertiary support, metadata, language tags, and structural disabled states.
  - `#E2E8F0` (Slate 200): Dividers, non-interactive borders, and sheet handles.
  - `#F8FAFC` (Slate 50): Canvas and surface neutral backdrop.
  - `#FFFFFF`: Elevated card surfaces and bottom sheets.

## Typography

The typographic engine is built using **Inter**, tuned specifically for instant readability in motion, ambient direct sunlight, and under cognitive stress.

- **Tabular Figures**: Numeric outputs (time-to-arrival, countdown rings, distances, compass bearings) must enforce tabular figures (`tnum`) to eliminate micro-jitter during live updates.
- **Visual Weight**: Primary wayfinding commands and guide names leverage Semibold (`600`) and Bold (`700`) to guarantee contrast against moving cartographic backgrounds.
- **Micro-Hierarchy**: Labels and metadata utilize crisp tracking offsets to prevent letter blurring on handheld OLED displays at sub-optimal viewing angles.

## Layout & Spacing

Designed fundamentally around a single-viewport mobile architecture (iOS standard 390x844pt):

- **Touch Ergonomics**: All interactive elements must strictly adhere to a **minimum touch target size of 48×48pt**, with critical emergency controls exceeding this (56pt to 64pt).
- **Z-Index Spatial Stack**:
  - `Base (z: 0)`: Full-bleed interactive vector map canvas.
  - `Map Overlays (z: 10)`: Floating safety HUD, GPS accuracy ring, heading vector.
  - `Persistent Action Layer (z: 20)`: Floating SOS button, recenter button, compass rose.
  - `Interactive Modality (z: 30)`: Multi-state bottom sheets.
  - `System Escapes (z: 40)`: Active SOS countdown takeover modal.
- **Rhythm & Grid**: Content within sheets and overlays relies on an 8pt baseline rhythm with 16pt outer margin bounds to maximize horizontal card scanning.

## Elevation & Depth

Depth in this system establishes structural hierarchy without muddying visual clarity over complex map tiles:

- **Level 0 (Flat Canvas)**: Map substrate. No shadow, absolute vector rendering.
- **Level 1 (In-Sheet Cards & Separators)**: `#FFFFFF` panels on `#F8FAFC` background. Subtle boundary separation using `#E2E8F0` structural outlines (`1px solid`) rather than blur shadows to keep definition razor sharp.
- **Level 2 (Floating Micro-Controls)**: Recenter GPS, Map Layers, Filter chips. `box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 2px 4px -1px rgba(15, 23, 42, 0.04);`
- **Level 3 (Interactive Bottom Sheet & SOS)**: Multi-state sliding sheets and the floating emergency action button. High-diffusion ambient lift with a cool slate tint: `box-shadow: 0 12px 32px -4px rgba(15, 23, 42, 0.16), 0 4px 8px -2px rgba(15, 23, 42, 0.06);`
- **Level 4 (SOS Active Override)**: Pulsing tertiary glow: `box-shadow: 0 0 0 8px rgba(220, 38, 38, 0.25), 0 12px 24px -4px rgba(220, 38, 38, 0.4);`

## Shapes

The physical geometry balances approachable human touch with authoritative structural precision:

- **Cards & Sheets**: Set to `rounded-xl` (1.5rem / 24px) on top sheet corners to visually soften incoming panels over the rigid map grid. Internal guide cards utilize `rounded-lg` (1rem / 16px) for compact efficiency.
- **Touch Anchors & Chips**: Floating controls and filter chips implement pill silhouettes (`rounded-full`) to immediately communicate tactility and drag/tap affordance.
- **Emergency Elements**: SOS actions retain perfectly circular geometry to instantly differentiate them from rect-linear informational cards.

## Components

### 1. Buttons
- **Primary Action (Call / Request Guide)**: High-contrast `#1D4ED8` background, `#FFFFFF` text. Height 54px, `rounded-xl`, bold label. Disabled state transitions to `#E2E8F0` with `#64748B` label.
- **Secondary Action**: `#FFFFFF` background, `1.5px solid #E2E8F0`, `#0F172A` label.
- **Floating SOS Trigger**: Floating circular button (64×64px) anchored bottom-right (above sheet collapsed peak). Crimson `#DC2626` base, `#FFFFFF` high-contrast iconography, high-diffusion elevation shadow. Features an active hold-to-confirm mechanical delay (1.5 seconds) to prevent accidental invocation.

### 2. Multi-State Bottom Sheet
- **States**:
  - *Collapsed (Peak)*: 88px visible height. Displays closest guide avatar, real-time ETA, and swift call trigger.
  - *Half-Sheet (Contextual)*: 45% screen height. Shows guide card roster, language compatibility tags, distance metrics, and safety stats.
  - *Full-Sheet (Expanded)*: 92% screen height. Detailed profile, verified badge history, localized audio-call notes, review transcriptions.
- **Header**: Features a pill-shaped grab handle (`36×4px`, `#CBD5E1`) centered at 8px from top edge.

### 3. Guide Cards
- **Structure**: Surface `#FFFFFF`, border `1px solid #E2E8F0`, padding 16px, `rounded-lg`.
- **Header Row**: 48px circular avatar with an overlapping 14px emerald green (`#059669`) live-status ring at the 4 o'clock position. Guide name, star rating with total review volume, and distance metric (`0.2 mi away`).
- **Tag Row**: High-contrast language chips (`#F1F5F9` background, `#334155` text, e.g., "English", "日本語", "Español") accompanied by a verified background badge.
- **Countdown Rings**: For live dispatches, an animated circular SVG ring displays real-time guide arrival latency with synchronized tabular remaining time text (`03:42`).

### 4. Chips & Filters
- **Filter Chips**: 36px height, pill radius, padding `0 14px`. Unselected: `#FFFFFF` fill with `1px solid #E2E8F0` and `#334155` label. Selected: `#0F172A` fill with `#FFFFFF` label.

### 5. Input Fields & Search Anchors
- **Address / Destination Bar**: 52px height, floating surface with Level 2 elevation, `#FFFFFF` fill, `#0F172A` text. Left-aligned compass needle or search icon, right-aligned rapid clear touch target (minimum 48×48pt hit box).

### 6. Verification & Safety Badges
- **Verified Local Guide**: Micro-chip with emerald fill tone (`#ECFDF5`), border `1px solid #A7F3D0`, text `#065F46`, featuring an embedded checkmark glyph.