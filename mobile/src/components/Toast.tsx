import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from 'react-native';
import { colors, radii, spacing, touchTargets, typography, shadows } from '../theme/tokens';
import { useLanguage } from '../context/LanguageContext';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  visible,
  onDismiss,
  duration = 3500,
}) => {
  const { fontFamily } = useLanguage();

  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        onDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onDismiss]);

  if (!visible) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'error':
        return {
          bg: colors.danger,
          text: colors.white,
          icon: '⚠️',
        };
      case 'success':
        return {
          bg: colors.status.success,
          text: colors.white,
          icon: '✓',
        };
      case 'warning':
        return {
          bg: colors.status.warning,
          text: colors.white,
          icon: '!',
        };
      case 'info':
      default:
        return {
          bg: colors.primary700,
          text: colors.white,
          icon: 'ℹ️',
        };
    }
  };

  const cfg = getTypeConfig();

  return (
    <SafeAreaView style={styles.container} pointerEvents="box-none">
      <View
        accessibilityLiveRegion="polite"
        style={[styles.toastBox, { backgroundColor: cfg.bg }]}
      >
        <Text style={styles.icon}>{cfg.icon}</Text>
        <Text
          maxFontSizeMultiplier={typography.maxScale}
          style={[styles.message, { color: cfg.text, fontFamily }]}
        >
          {message}
        </Text>
        <TouchableOpacity
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification"
          style={styles.dismissBtn}
        >
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: spacing.md,
    right: spacing.md,
    zIndex: 9999,
  },
  toastBox: {
    minHeight: touchTargets.minTouch,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    ...shadows.elevated,
    gap: spacing.sm,
  },
  icon: {
    fontSize: 16,
    color: colors.white,
  },
  message: {
    flex: 1,
    fontSize: typography.sizes.bodySm || 14,
    fontWeight: '600',
  },
  dismissBtn: {
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '700',
  },
});
