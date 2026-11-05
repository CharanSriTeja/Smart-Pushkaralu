export const theme = {
  colors: {
    // High contrast palette suitable for bright outdoors & pilgrims
    primary: '#0F52BA', // Deep Sapphire Blue (4.5:1+ contrast on white)
    primaryDark: '#0A3B85',
    primaryLight: '#E8F1FC',
    secondary: '#FF7A00', // Saffron / Pushkaralu Amber
    secondaryLight: '#FFF3E6',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceSubtle: '#F1F5F9',
    textPrimary: '#0F172A', // Slate 900 (15:1 contrast on white)
    textSecondary: '#475569', // Slate 600 (5.5:1 contrast on white)
    textMuted: '#64748B',
    border: '#CBD5E1',
    borderStrong: '#94A3B8',
    danger: '#DC2626', // High contrast red for SOS / emergency
    dangerLight: '#FEF2F2',
    warning: '#D97706',
    warningLight: '#FFFBEB',
    success: '#16A34A',
    successLight: '#F0FDF4',
    white: '#FFFFFF',
    black: '#000000',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  borderRadius: {
    sm: 6,
    md: 10,
    lg: 16,
    pill: 9999,
  },
  typography: {
    sizes: {
      caption: 12,
      bodySm: 14,
      body: 16,
      h3: 18,
      h2: 22,
      h1: 26,
      hero: 32,
    },
    lineHeights: {
      body: 24,
      heading: 32,
    },
  },
  touchTarget: {
    minHeight: 48,
    minWidth: 48,
  },
  shadows: {
    card: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 2,
    },
    floating: {
      shadowColor: '#DC2626',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 6,
    },
  },
};

