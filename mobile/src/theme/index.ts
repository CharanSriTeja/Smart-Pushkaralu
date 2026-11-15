import { colors, spacing, radii, typography, touchTargets, shadows } from './tokens';

export * from './tokens';

export const theme = {
  colors: {
    // Primary Orange System
    primary: colors.primary700, // Accessible orange on white (5.18:1)
    primaryOrange: colors.primary500,
    primaryDark: colors.primary700,
    primaryLight: colors.primary50,
    primaryTints: {
      50: colors.primary50,
      100: colors.primary100,
      500: colors.primary500,
      600: colors.primary600,
      700: colors.primary700,
    },

    // Backgrounds & Surfaces
    background: colors.background, // Soft warm white #FFFBF7
    surface: colors.surface, // Clean card surface #FFFFFF
    surfaceSubtle: colors.primary50, // Subtle orange tint #FFF7ED
    surfaceWarm: colors.surfaceWarm,

    // High Contrast Typography
    textPrimary: colors.textPrimary, // #1C1917 (17.5:1 on white)
    textSecondary: colors.textSecondary, // #57534E (7.6:1 on white)
    textMuted: colors.textMuted,
    textInverse: colors.textInverse, // #FFFFFF
    textOrange: colors.textOrange, // #C2410C

    // Borders & Dividers
    border: colors.border, // #E7E5E4
    borderStrong: colors.borderStrong,
    borderOrange: colors.borderOrange,

    // SOS / Emergency Only
    danger: colors.danger, // #B91C1C
    dangerDark: colors.dangerDark,
    dangerLight: colors.dangerLight,
    dangerBorder: colors.dangerBorder,

    // Badges / Operational status
    status: colors.status,
    success: colors.status.success,
    successLight: colors.status.successLight,
    warning: colors.status.warning,
    warningLight: colors.status.warningLight,

    white: colors.white,
    black: colors.black,
    transparent: colors.transparent,
  },
  spacing,
  borderRadius: {
    sm: radii.sm, // 8
    md: radii.md, // 12
    lg: radii.lg, // 16
    pill: radii.pill,
  },
  radii,
  typography,
  touchTarget: {
    minHeight: touchTargets.minTouch,
    minWidth: touchTargets.minTouch,
    primaryHeight: touchTargets.primaryAction,
  },
  touchTargets,
  shadows,
};

export default theme;
