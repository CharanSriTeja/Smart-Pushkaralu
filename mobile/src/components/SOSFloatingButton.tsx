import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { colors, radii, shadows, touchTargets } from '../theme/tokens';
import { useLanguage } from '../context/LanguageContext';

export const SOSFloatingButton: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { fontFamilyBold } = useLanguage();

  // Hide the floating SOS button when inside the SOS flow itself
  if (pathname && (pathname.includes('/sos') || pathname === '/sos')) {
    return null;
  }

  const handlePress = () => {
    try {
      router.navigate('/(app)/sos' as any);
    } catch {
      try {
        router.push('/(app)/sos' as any);
      } catch {
        if (typeof window !== 'undefined') {
          window.location.href = '/(app)/sos';
        }
      }
    }
  };

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Emergency SOS Button"
        accessibilityHint="Opens emergency police and medical assistance screen"
        style={styles.sosButton}
      >
        <Text style={styles.icon}>🆘</Text>
        <Text style={[styles.label, { fontFamily: fontFamilyBold }]}>SOS</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as any,
    bottom: 84, // Sits comfortably above bottom tab bar
    right: 16,
    zIndex: 99999, // Ensure it is above all tab bars and content on web & native
    elevation: 20,
    ...(Platform.OS === 'web' ? ({ pointerEvents: 'auto' } as any) : {}),
  },
  sosButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.danger, // High contrast red #B91C1C
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer', userSelect: 'none' } as any) : {}),
    ...shadows.floating,
  },
  icon: {
    fontSize: 20,
    marginTop: -2,
  },
  label: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
