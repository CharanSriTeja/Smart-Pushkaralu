import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';
import { useLanguage } from '../context/LanguageContext';

export const SOSFloatingButton: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { fontFamilyBold } = useLanguage();

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
    backgroundColor: theme.colors.danger,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer', userSelect: 'none' } as any) : {}),
    ...theme.shadows.floating,
  },
  icon: {
    fontSize: 20,
    marginTop: -2,
  },
  label: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
