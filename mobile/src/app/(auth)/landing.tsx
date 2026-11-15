import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { SupportedLanguage } from '../../i18n';

export default function LandingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { language, changeLanguage, fontFamily, fontFamilyBold } = useLanguage();
  const { continueAsGuest } = useAuth();

  const handleLanguageSelect = (lang: SupportedLanguage) => {
    changeLanguage(lang);
  };

  const handleContinueWithPhone = () => {
    router.push('/(auth)/phone' as any);
  };

  const handleContinueAsGuest = () => {
    continueAsGuest();
    router.replace('/(app)' as any);
  };

  const handleOpenSos = () => {
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* Simple lightweight high-contrast logo placeholder */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer} accessibilityRole="image" accessibilityLabel="Smart Pushkaralu Emblem">
            <View style={styles.logoWaveTop} />
            <View style={styles.logoSun} />
            <View style={styles.logoWaveBottom} />
            <Text style={styles.logoText}>2027</Text>
          </View>

          <Text style={[styles.appName, { fontFamily: fontFamilyBold }]}>
            {t('landing.app_name')}
          </Text>
          <Text style={[styles.tagline, { fontFamily }]}>
            {t('landing.tagline')}
          </Text>
        </View>

        {/* Official Advisory Banner */}
        <View style={styles.advisoryCard}>
          <View style={styles.advisoryBadge}>
            <Text style={styles.advisoryBadgeText}>
              {t('landing.official_badge')}
            </Text>
          </View>
          <Text style={[styles.advisoryText, { fontFamily }]}>
            {t('landing.disclaimer')}
          </Text>
        </View>

        {/* Language Selector: 3 large touch target buttons */}
        <View style={styles.languageSection}>
          <Text style={[styles.languageSectionTitle, { fontFamily: fontFamilyBold }]}>
            {t('landing.select_language')}
          </Text>
          <View style={styles.languageButtonsRow}>
            <TouchableOpacity
              style={[
                styles.langButton,
                language === 'en' && styles.langButtonActive,
              ]}
              onPress={() => handleLanguageSelect('en')}
              accessibilityRole="button"
              accessibilityLabel="Select English"
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.langButtonText,
                  language === 'en' && styles.langButtonTextActive,
                ]}
              >
                English
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.langButton,
                language === 'te' && styles.langButtonActive,
              ]}
              onPress={() => handleLanguageSelect('te')}
              accessibilityRole="button"
              accessibilityLabel="తెలుగు ఎంచుకోండి"
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.langButtonText,
                  language === 'te' && styles.langButtonTextActive,
                ]}
              >
                తెలుగు
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.langButton,
                language === 'hi' && styles.langButtonActive,
              ]}
              onPress={() => handleLanguageSelect('hi')}
              accessibilityRole="button"
              accessibilityLabel="हिन्दी चुनें"
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.langButtonText,
                  language === 'hi' && styles.langButtonTextActive,
                ]}
              >
                हिन्दी
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Primary and Secondary CTA Buttons */}
        <View style={styles.ctaSection}>
          {/* Prominent Emergency SOS CTA */}
          <TouchableOpacity
            style={styles.sosButton}
            onPress={handleOpenSos}
            accessibilityRole="button"
            accessibilityLabel="Emergency SOS"
            activeOpacity={0.8}
          >
            <Text style={[styles.sosButtonText, { fontFamily: fontFamilyBold }]}>
              🚨 {t('sos.title', 'Emergency SOS / 112')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleContinueWithPhone}
            accessibilityRole="button"
            accessibilityLabel={t('landing.continue_with_phone')}
            activeOpacity={0.8}
          >
            <Text style={[styles.primaryButtonText, { fontFamily: fontFamilyBold }]}>
              {t('landing.continue_with_phone')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleContinueAsGuest}
            accessibilityRole="button"
            accessibilityLabel={t('landing.continue_as_guest')}
            activeOpacity={0.8}
          >
            <Text style={[styles.secondaryButtonText, { fontFamily }]}>
              {t('landing.continue_as_guest')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F8FA',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: 'space-between',
  },
  logoSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0F52BA', // Godavari deep sacred blue
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  logoSun: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFB800', // Saffron gold sunrise
    position: 'absolute',
    top: 14,
  },
  logoWaveTop: {
    position: 'absolute',
    bottom: 22,
    width: 60,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#72C2F8',
  },
  logoWaveBottom: {
    position: 'absolute',
    bottom: 12,
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  logoText: {
    position: 'absolute',
    bottom: 3,
    fontSize: 9,
    fontWeight: '800',
    color: '#0F52BA',
    letterSpacing: 0.5,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0C2340',
    textAlign: 'center',
    marginBottom: 6,
  },
  tagline: {
    fontSize: 15,
    color: '#4A5568',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
  advisoryCard: {
    backgroundColor: '#FFF8E6',
    borderLeftWidth: 4,
    borderLeftColor: '#D97706',
    borderRadius: 8,
    padding: 14,
    marginVertical: 16,
  },
  advisoryBadge: {
    backgroundColor: '#FDE68A',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 6,
  },
  advisoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    textTransform: 'uppercase',
  },
  advisoryText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 19,
  },
  languageSection: {
    marginVertical: 12,
  },
  languageSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 10,
    textAlign: 'center',
  },
  languageButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  langButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  langButtonActive: {
    backgroundColor: '#0F52BA',
    borderColor: '#0F52BA',
  },
  langButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  langButtonTextActive: {
    color: '#FFFFFF',
  },
  ctaSection: {
    marginTop: 20,
    gap: 12,
  },
  sosButton: {
    minHeight: 52,
    backgroundColor: '#DC2626',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#B91C1C',
    elevation: 3,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  sosButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  primaryButton: {
    minHeight: 56,
    backgroundColor: '#0F52BA',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#0F52BA',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    minHeight: 52,
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
});
