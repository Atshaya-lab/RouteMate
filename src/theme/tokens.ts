export const Colors = {
  // Brand Surfaces
  surface: '#faf8ff',
  surfaceDim: '#d2d9f4',
  surfaceBright: '#faf8ff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f2f3ff',
  surfaceContainer: '#eaedff',
  surfaceContainerHigh: '#e2e7ff',
  surfaceContainerHighest: '#dae2fd',

  // Brand Contrast
  onSurface: '#131b2e',
  onSurfaceVariant: '#434655',
  inverseSurface: '#283044',
  inverseOnSurface: '#eef0ff',
  outline: '#747686',
  outlineVariant: '#c4c5d7',
  surfaceTint: '#2151da',

  // Primary Navigational Anchor
  primary: '#0037b0',
  onPrimary: '#ffffff',
  primaryContainer: '#1d4ed8',
  onPrimaryContainer: '#cad3ff',
  inversePrimary: '#b7c4ff',
  primaryFixed: '#dce1ff',
  primaryFixedDim: '#b7c4ff',
  onPrimaryFixed: '#001551',
  onPrimaryFixedVariant: '#0039b5',

  // Secondary Trust & Activity (Guide status / verified)
  secondary: '#006c4a',
  secondaryLive: '#059669',
  onSecondary: '#ffffff',
  secondaryContainer: '#82f5c1',
  onSecondaryContainer: '#00714e',
  secondaryFixed: '#85f8c4',
  secondaryFixedDim: '#68dba9',
  onSecondaryFixed: '#002114',
  onSecondaryFixedVariant: '#005137',

  // Tertiary Critical Safety (SOS & Alerts)
  tertiary: '#8f000b',
  tertiaryCrimson: '#dc2626',
  onTertiary: '#ffffff',
  tertiaryContainer: '#bb0112',
  onTertiaryContainer: '#ffc7c1',
  tertiaryFixed: '#ffdad6',
  tertiaryFixedDim: '#ffb4ab',
  onTertiaryFixed: '#410002',
  onTertiaryFixedVariant: '#93000b',

  // System & States
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  background: '#faf8ff',
  onBackground: '#131b2e',
  surfaceVariant: '#dae2fd',

  // Accents
  amber: '#f59e0b',
  starYellow: '#eab308',
  mapBlueCircle: 'rgba(29, 78, 216, 0.15)',
  mapBlueStroke: 'rgba(29, 78, 216, 0.45)',
  radarPulse: 'rgba(0, 55, 176, 0.12)',
};

export const Spacing = {
  gutter: 16,
  margin: 16,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const Radii = {
  sm: 4,
  default: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Elevation = {
  level0: {},
  level1: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  level2: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  level3: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 6,
  },
  level4SOS: {
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
};
