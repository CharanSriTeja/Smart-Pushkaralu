import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, radii, spacing, typography, touchTargets } from '../theme/tokens';
import { useLanguage } from '../context/LanguageContext';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  children,
}) => {
  const { fontFamilyBold } = useLanguage();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.sheetContainer}>
                {/* Pull handle indicator */}
                <View style={styles.handleBar} />

                {/* Header */}
                {title ? (
                  <View style={styles.header}>
                    <Text
                      maxFontSizeMultiplier={typography.maxScale}
                      style={[styles.title, { fontFamily: fontFamilyBold }]}
                    >
                      {title}
                    </Text>
                    <TouchableOpacity
                      onPress={onClose}
                      accessibilityRole="button"
                      accessibilityLabel="Close dialog"
                      style={styles.closeBtn}
                    >
                      <Text style={styles.closeIcon}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {/* Content */}
                <View style={styles.content}>{children}</View>
                <SafeAreaView />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.borderStrong,
    borderRadius: radii.pill,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.h3,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeBtn: {
    minWidth: touchTargets.minTouch,
    minHeight: touchTargets.minTouch,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 18,
    color: colors.textMuted,
    fontWeight: '700',
  },
  content: {
    paddingVertical: spacing.xs,
  },
});

