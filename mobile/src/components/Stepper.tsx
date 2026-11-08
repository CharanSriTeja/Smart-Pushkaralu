import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '../theme/tokens';
import { useLanguage } from '../context/LanguageContext';

export interface StepItem {
  label: string;
  description?: string;
}

export interface StepperProps {
  steps: StepItem[];
  currentStep: number; // 0-indexed
  style?: ViewStyle;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  style,
}) => {
  const { fontFamilyBold } = useLanguage();

  return (
    <View style={[styles.container, style]}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={index}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.circle,
                  isCompleted ? styles.completedCircle : isActive ? styles.activeCircle : styles.pendingCircle,
                ]}
              >
                <Text
                  style={[
                    styles.circleText,
                    isCompleted || isActive ? styles.activeCircleText : styles.pendingCircleText,
                  ]}
                >
                  {isCompleted ? '✓' : index + 1}
                </Text>
              </View>
              <Text
                maxFontSizeMultiplier={typography.maxScale}
                style={[
                  styles.label,
                  isActive ? styles.activeLabel : null,
                  { fontFamily: fontFamilyBold },
                ]}
                numberOfLines={1}
              >
                {step.label}
              </Text>
            </View>
            {!isLast ? (
              <View
                style={[
                  styles.line,
                  isCompleted ? styles.completedLine : styles.pendingLine,
                ]}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  activeCircle: {
    backgroundColor: colors.primary700,
  },
  completedCircle: {
    backgroundColor: colors.status.success,
  },
  pendingCircle: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.borderStrong,
  },
  circleText: {
    fontSize: 14,
    fontWeight: '700',
  },
  activeCircleText: {
    color: colors.white,
  },
  pendingCircleText: {
    color: colors.textMuted,
  },
  label: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  activeLabel: {
    color: colors.primary700,
    fontWeight: '700',
  },
  line: {
    height: 2,
    flex: 1,
    marginTop: -20,
    marginHorizontal: 2,
  },
  completedLine: {
    backgroundColor: colors.status.success,
  },
  pendingLine: {
    backgroundColor: colors.border,
  },
});
