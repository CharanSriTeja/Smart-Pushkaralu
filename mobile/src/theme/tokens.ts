/**
 * Design Tokens for Smart Pushkaralu 2027 Mobile App
 * WCAG AA compliant, Orange and White palette.
 */

export const colors = {
  // Backgrounds
  background: '#FFFBF7', // Soft warm white as primary screen background
  surface: '#FFFFFF', // Clean card/sheet surface
  surfaceWarm: '#FFFBF7',
  
  // Primary Orange
  primary50: '#FFF7ED',
  primary100: '#FFEDD5',
  primary500: '#F97316',
  primary600: '#EA580C',
  primary700: '#C2410C', // Compliant with white text (5.18:1)
  
  // Aliases for convenience
  primary: '#C2410C',
  primaryLight: '#FFF7ED',
  primaryDark: '#9A3412',
  
  // Text
  text: '#1C1917', // High contrast dark text (17.5:1 on white)
  textPrimary: '#1C1917',
  textMuted: '#57534E', // Compliant secondary text (7.6:1 on white)
  textSecondary: '#57534E',
  textLight: '#78716C',
  textInverse: '#FFFFFF',
  textOrange: '#C2410C',
  
  // Borders
  border: '#E7E5E4',
  borderLight: '#F5F5F4',
  borderStrong: '#D6D3D1',
  borderOrange: '#FDBA74',
  
  // Emergency / SOS (Red only)
  danger: '#B91C1C', // High contrast red (6.47:1)
  dangerDark: '#991B1B',
  dangerLight: '#FEF2F2',
  dangerBorder: '#FECACA',
  
  // Status - Bathing & Crowd indicators
  status: {
    // Low crowd / Open / Safe
    success: '#15803D',
    successLight: '#F0FDF4',
    successBorder: '#BBF7D0',
    // Moderate crowd / Caution / Restricted
    warning: '#92400E',
    warningLight: '#FFFBEB',
    warningBorder: '#FDE68A',
    // Inactive / Closed / Info
    muted: '#374151',
    mutedLight: '#F3F4F6',
    mutedBorder: '#E5E7EB',
  },
  
  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 9999,
};

export const touchTargets = {
  minTouch: 48,
  primaryAction: 56,
  sosAction: 56,
};

export const typography = {
  sizes: {
    caption: 14,
    bodySm: 14, // 14sp minimum per design system
    body: 16, // 16sp standard body text
    h3: 18,
    h2: 22,
    h1: 26,
    hero: 32,
  },
  lineHeights: {
    caption: 22,
    body: 26, // 1.6x for clear Telugu/Hindi rendering
    h3: 28,
    h2: 32,
    h1: 36,
    hero: 42,
  },
  fontWeights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  maxScale: 1.3, // Allow up to 130% system font scale
};

export const shadows = {
  none: {
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  card: {
    elevation: 2,
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  elevated: {
    elevation: 4,
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  floating: {
    elevation: 6,
    shadowColor: '#B91C1C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
};
