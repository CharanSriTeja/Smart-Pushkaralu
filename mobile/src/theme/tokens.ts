/**
 * Design Tokens for Smart Pushkaralu 2027 Mobile App
 * WCAG AA compliant, Orange and White palette.
 */

export const colors = {
  // Backgrounds
  background: '#FFFBF7',
  backgroundDefault: '#FFFBF7',
  backgroundPaper: '#FFFFFF',
  surface: '#FFFFFF', // Clean card/sheet surface
  surfaceWarm: '#FFFBF7',
  
  // Primary Orange
  primary50: '#FFF7ED',
  primary100: '#FFEDD5',
  primary500: '#F97316',
  primary600: '#EA580C',
  primary700: '#C2410C', // Compliant with white text (5.18:1)
  
  primary: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    main: '#EA580C',
  },
  
  // Aliases for convenience
  primaryLight: '#FFF7ED',
  primaryDark: '#9A3412',
  
  // Neutrals palette
  neutral: {
    50: '#FAFAF9',
    100: '#F5F5F4',
    200: '#E7E5E4',
    300: '#D6D3D1',
    400: '#A8A29E',
    500: '#78716C',
    600: '#57534E',
    700: '#44403C',
    800: '#292524',
    900: '#1C1917',
  },
  
  // Text
  text: {
    primary: '#1C1917',
    secondary: '#57534E',
    muted: '#57534E',
    inverse: '#FFFFFF',
    light: '#78716C',
    orange: '#C2410C',
  },
  textPrimary: '#1C1917',
  textMuted: '#57534E',
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
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
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
  full: 9999,
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
  sm: {
    elevation: 2,
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  md: {
    elevation: 4,
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  lg: {
    elevation: 6,
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
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
