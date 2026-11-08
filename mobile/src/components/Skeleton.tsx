import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { colors, radii, spacing } from '../theme/tokens';

export interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = radii.sm,
  style,
}) => {
  const opacityAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.85,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
};

export const SkeletonCard: React.FC<{ height?: number; style?: ViewStyle }> = ({
  height = 120,
  style,
}) => {
  return (
    <View style={[styles.cardPlaceholder, style]}>
      <Skeleton width="45%" height={20} borderRadius={radii.sm} style={{ marginBottom: spacing.sm }} />
      <Skeleton width="80%" height={16} borderRadius={radii.sm} style={{ marginBottom: spacing.xs }} />
      <Skeleton width="60%" height={16} borderRadius={radii.sm} style={{ marginBottom: spacing.md }} />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Skeleton width={80} height={28} borderRadius={radii.pill} />
        <Skeleton width={100} height={28} borderRadius={radii.pill} />
      </View>
    </View>
  );
};

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <View style={{ gap: spacing.md, paddingVertical: spacing.sm }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.border,
  },
  cardPlaceholder: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
  },
});
