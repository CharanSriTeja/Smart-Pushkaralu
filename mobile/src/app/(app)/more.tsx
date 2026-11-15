import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { clearCache } from '../../storage/cache';
import { useLanguage } from '../../context/LanguageContext';
import { formatPhoneNumberForDisplay } from '../../utils/validation';
import { colors, radii, spacing, touchTargets, typography, shadows } from '../../theme/tokens';
import {
  ScreenContainer,
  Card,
  Button,
  LanguageSwitcher,
  ListItem,
  SectionHeader,
  BottomSheet,
} from '../../components';
import { getBaseV1Url } from '../../services/api';

export default function MoreScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, status, logout, deleteAccount } = useAuth();
  const { fontFamily, fontFamilyBold } = useLanguage();

  const [clearing, setClearing] = useState(false);
  const [versionTapCount, setVersionTapCount] = useState(0);
  const [devOptionsUnlocked, setDevOptionsUnlocked] = useState(false);
  const [activeModal, setActiveModal] = useState<'terms' | 'privacy' | 'faqs' | 'about' | 'dev' | null>(null);

  const isGuest = status === 'guest';
  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

  const handleVersionTap = () => {
    if (!isDev) return;
    const next = versionTapCount + 1;
    setVersionTapCount(next);
    if (next >= 7) {
      setDevOptionsUnlocked(true);
      Alert.alert('🛠️ Developer Options', 'Developer options unlocked for development build.');
    } else if (next >= 3) {
      Alert.alert('Developer Mode', `${7 - next} more taps to unlock developer options.`);
    }
  };

  const handleClearCache = async () => {
    setClearing(true);
    try {
      await clearCache();
      Alert.alert(t('common.done', 'Done'), 'Offline cache cleared successfully.');
    } finally {
      setClearing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('auth.logout', 'Log Out'),
      t('home.confirm_logout', 'Are you sure you want to log out?'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('auth.logout', 'Log Out'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/landing' as any);
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('auth.delete_account', 'Delete Account'),
      t('home.confirm_delete', 'Delete your account and all associated data permanently?'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('auth.delete_account', 'Delete Account'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              router.replace('/(auth)/landing' as any);
            } catch (err: any) {
              Alert.alert(t('common.error', 'Error'), err.message || 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.container}>
      {/* 1. Header */}
      <View style={styles.header}>
        <Text
          maxFontSizeMultiplier={typography.maxScale}
          style={[styles.title, { fontFamily: fontFamilyBold }]}
        >
          {t('settings.title', 'Settings & Support')}
        </Text>
      </View>

      {/* 2. Pilgrim Profile Card */}
      <Card variant="elevated" style={styles.card}>
        <SectionHeader title="👤 Pilgrim Profile" />
        {isGuest ? (
          <View style={styles.guestContent}>
            <Text
              maxFontSizeMultiplier={typography.maxScale}
              style={[styles.bodyText, { fontFamily }]}
            >
              Browsing as Guest. Sign in with your mobile number to view personalized trip itineraries and track reported issues.
            </Text>
            <Button
              title="Sign In with Mobile OTP"
              onPress={() => router.push('/(auth)/phone' as any)}
              variant="primary"
              size="sm"
              style={{ marginTop: spacing.sm }}
            />
          </View>
        ) : (
          <View style={styles.profileContent}>
            <Text
              maxFontSizeMultiplier={typography.maxScale}
              style={[styles.profileName, { fontFamily: fontFamilyBold }]}
            >
              {user?.name || 'Pilgrim'}
            </Text>
            <Text
              maxFontSizeMultiplier={typography.maxScale}
              style={[styles.profilePhone, { fontFamily }]}
            >
              📱 {user?.phone ? formatPhoneNumberForDisplay(user.phone) : ''}
            </Text>

            <View style={styles.profileLinks}>
              <ListItem
                title="My Reported Grievances"
                subtitle="Track status and updates of submitted issues"
                showChevron
                onPress={() => router.push('/(app)/issues' as any)}
              />
              <ListItem
                title="Yatra Trip Plans"
                subtitle="Review saved pilgrimage schedules"
                showChevron
                onPress={() => router.push('/(app)/routes' as any)}
              />
            </View>
          </View>
        )}
      </Card>

      {/* 3. Language Switcher Card */}
      <Card variant="elevated" style={styles.card}>
        <SectionHeader title={`🌐 ${t('settings.language_selection', 'Language / భాష')}`} />
        <LanguageSwitcher variant="chips" />
      </Card>

      {/* 4. Offline Data Sync & Storage */}
      <Card variant="elevated" style={styles.card}>
        <SectionHeader title={`💾 ${t('settings.offline_cache', 'Offline Data & Sync')}`} />
        <Text
          maxFontSizeMultiplier={typography.maxScale}
          style={[styles.bodyText, { fontFamily }]}
        >
          Ghat statuses, holy water guidelines, and route advisories are stored locally so you can access them in high-density areas with weak network connectivity.
        </Text>
        <View style={styles.cacheActions}>
          <Button
            title={clearing ? 'Clearing...' : t('settings.clear_cache', 'Clear Local Cache')}
            onPress={handleClearCache}
            loading={clearing}
            variant="outline"
            size="sm"
          />
        </View>
      </Card>

      {/* 5. Platform Support Section */}
      <Card variant="elevated" style={styles.card}>
        <SectionHeader title="🏛️ Platform Support & Guidelines" />
        <ListItem
          title="About Smart Pushkaralu 2027"
          subtitle="Official Godavari Pushkaram civic portal"
          showChevron
          onPress={() => setActiveModal('about')}
        />
        <ListItem
          title="Frequently Asked Questions (FAQs)"
          subtitle="Ghat safety, Aarti times, and transit FAQs"
          showChevron
          onPress={() => setActiveModal('faqs')}
        />
        <ListItem
          title="Terms of Service & Pilgrimage Guidelines"
          subtitle="District Administration compliance rules"
          showChevron
          onPress={() => setActiveModal('terms')}
        />
        <ListItem
          title="Privacy Policy & Data Security"
          subtitle="Zero third-party trackers, end-to-end encryption"
          showChevron
          onPress={() => setActiveModal('privacy')}
        />
      </Card>

      {/* 6. Version Info & Dev Options Trigger (7 Taps) */}
      <View style={styles.versionContainer}>
        <TouchableOpacity
          onPress={handleVersionTap}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="App version information"
        >
          <Text
            maxFontSizeMultiplier={typography.maxScale}
            style={[styles.versionText, { fontFamily }]}
          >
            Smart Pushkaralu 2027 • v1.0.0 (Build 2027.1)
          </Text>
          <Text
            maxFontSizeMultiplier={typography.maxScale}
            style={[styles.subVersionText, { fontFamily }]}
          >
            Government of Andhra Pradesh & Telangana Pushkaram Authority
          </Text>
        </TouchableOpacity>

        {devOptionsUnlocked && isDev && (
          <Button
            title="🛠️ Open Developer Options"
            variant="secondary"
            size="sm"
            onPress={() => setActiveModal('dev')}
            style={styles.devBtn}
          />
        )}
      </View>

      {/* 7. Sign Out / Account Deletion for Logged-In Pilgrims */}
      {!isGuest && (
        <View style={styles.accountActions}>
          <Button
            title={t('auth.logout', 'Log Out')}
            onPress={handleLogout}
            variant="outline"
            size="md"
          />
          <Button
            title={t('auth.delete_account', 'Delete Account Permanently')}
            onPress={handleDeleteAccount}
            variant="danger"
            size="md"
          />
        </View>
      )}

      {/* Modals for Support / Legal / Dev Options */}
      <BottomSheet
        visible={activeModal !== null}
        onClose={() => setActiveModal(null)}
        title={
          activeModal === 'about'
            ? 'About Smart Pushkaralu'
            : activeModal === 'faqs'
            ? 'Pushkaralu FAQs'
            : activeModal === 'terms'
            ? 'Terms & Guidelines'
            : activeModal === 'privacy'
            ? 'Privacy & Security'
            : 'Developer Options'
        }
      >
        <ScrollView style={styles.modalScroll}>
          {activeModal === 'about' && (
            <View style={styles.modalContent}>
              <Text style={styles.modalPara}>
                Smart Pushkaralu 2027 is the official civic technology platform for the 2027 Godavari Maha Pushkaram, coordinating holy bathing ghats across Rajahmundry, Bhadrachalam, and all Godavari riparian districts.
              </Text>
              <Text style={styles.modalPara}>
                Built under strict governance guidelines to ensure zero dummy data, WCAG AA contrast compliance, real-time emergency SOS dispatch, and verified bathing statuses.
              </Text>
            </View>
          )}

          {activeModal === 'faqs' && (
            <View style={styles.modalContent}>
              <Text style={styles.faqQ}>Q: When is the auspicious time for Pushkaram Snanam?</Text>
              <Text style={styles.faqA}>A: Traditional holy snanam is observed from sunrise to sunset. Check live crowd levels on the Ghats tab before proceeding.</Text>

              <Text style={styles.faqQ}>Q: How do I report a missing person or sanitation issue?</Text>
              <Text style={styles.faqA}>A: Use the Report Issue screen or tap the persistent red SOS button for immediate police and medical response.</Text>

              <Text style={styles.faqQ}>Q: Does the app work without internet?</Text>
              <Text style={styles.faqA}>A: Yes, offline mode caches ghat listings and emergency instructions so you can access them even in heavy crowd congestion.</Text>
            </View>
          )}

          {activeModal === 'terms' && (
            <View style={styles.modalContent}>
              <Text style={styles.modalPara}>
                1. Holy river bathing is subject to real-time current conditions. Always obey police safety cordons and lifeguard directions.
              </Text>
              <Text style={styles.modalPara}>
                2. Do not venture into deep waters beyond safety barricades.
              </Text>
              <Text style={styles.modalPara}>
                3. Misuse of the Emergency SOS feature is punishable under relevant disaster management and public safety regulations.
              </Text>
            </View>
          )}

          {activeModal === 'privacy' && (
            <View style={styles.modalContent}>
              <Text style={styles.modalPara}>
                Your privacy is paramount. Phone authentication is strictly used for emergency identity verification. Location is acquired solely on-demand to compute nearest safe ghats or dispatch emergency rescue.
              </Text>
              <Text style={styles.modalPara}>
                No personal data is shared with commercial advertising brokers.
              </Text>
            </View>
          )}

          {activeModal === 'dev' && (
            <View style={styles.modalContent}>
              <Text style={styles.faqQ}>API Base URL:</Text>
              <Text style={styles.faqA}>{getBaseV1Url()}</Text>

              <Text style={styles.faqQ}>Environment:</Text>
              <Text style={styles.faqA}>{isDev ? 'Development / Staging' : 'Production'}</Text>

              <Text style={styles.faqQ}>Active User Role:</Text>
              <Text style={styles.faqA}>{user?.isAdmin ? 'Admin / Coordinator' : 'Pilgrim'}</Text>

              <Text style={styles.faqQ}>Platform:</Text>
              <Text style={styles.faqA}>React Native / Expo 58</Text>
            </View>
          )}
        </ScrollView>
      </BottomSheet>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md,
  },
  header: {
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.sizes.h1,
    fontWeight: '800',
    color: colors.primary700,
  },
  card: {
    gap: spacing.sm,
  },
  guestContent: {
    gap: spacing.xs,
  },
  profileContent: {
    gap: spacing.xs,
  },
  profileName: {
    fontSize: typography.sizes.h3,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  profilePhone: {
    fontSize: typography.sizes.bodySm || 14,
    color: colors.textMuted,
  },
  profileLinks: {
    marginTop: spacing.sm,
  },
  bodyText: {
    fontSize: typography.sizes.bodySm || 14,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  cacheActions: {
    marginTop: spacing.xs,
    alignItems: 'flex-start',
  },
  versionContainer: {
    alignItems: 'center',
    marginVertical: spacing.md,
    gap: spacing.xs,
  },
  versionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textAlign: 'center',
  },
  subVersionText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
  devBtn: {
    marginTop: spacing.sm,
  },
  accountActions: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalContent: {
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  modalPara: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  faqQ: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary700,
  },
  faqA: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
});
