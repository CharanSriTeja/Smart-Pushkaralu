import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { useAuth } from '../../context/AuthContext';
import { clearCache } from '../../storage/cache';
import { theme } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { formatPhoneNumberForDisplay } from '../../utils/validation';

export default function MoreScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, status, logout, deleteAccount } = useAuth();
  const { fontFamily, fontFamilyBold } = useLanguage();
  const [clearing, setClearing] = useState(false);

  const isGuest = status === 'guest';

  const handleClearCache = async () => {
    setClearing(true);
    try {
      await clearCache();
      Alert.alert(t('common.done'), 'Offline cache cleared successfully.');
    } finally {
      setClearing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('auth.logout'),
      t('home.confirm_logout'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.logout'),
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
      t('auth.delete_account'),
      t('home.confirm_delete'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.delete_account'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              router.replace('/(auth)/landing' as any);
            } catch (err: any) {
              Alert.alert(t('common.error'), err.message || 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  return (
    <Screen scrollable style={styles.screen}>
      <Text style={[styles.title, { fontFamily: fontFamilyBold }]}>
        {t('settings.title')}
      </Text>

      {/* User profile card */}
      <Card style={styles.card}>
        <Text style={[styles.cardHeader, { fontFamily: fontFamilyBold }]}>
          👤 Pilgrim Profile
        </Text>
        {isGuest ? (
          <View>
            <Text style={[styles.profileText, { fontFamily }]}>
              {t('guest.banner_title')}
            </Text>
            <Button
              title="Log In for Personalized Alerts"
              onPress={() => router.push('/(auth)/phone' as any)}
              variant="outline"
              size="small"
              style={styles.profileBtn}
            />
          </View>
        ) : (
          <View>
            <Text style={[styles.userName, { fontFamily: fontFamilyBold }]}>
              {user?.name || 'Pilgrim'}
            </Text>
            <Text style={[styles.userPhone, { fontFamily }]}>
              📱 {user?.phone ? formatPhoneNumberForDisplay(user.phone) : ''}
            </Text>
          </View>
        )}
      </Card>

      {/* Language Selection */}
      <Card style={styles.card}>
        <Text style={[styles.cardHeader, { fontFamily: fontFamilyBold }]}>
          🌐 {t('settings.language_selection')}
        </Text>
        <LanguageSwitcher style={styles.langSwitcher} />
      </Card>

      {/* Emergency SOS Quick Link */}
      <Card style={[styles.card, { borderColor: '#EF4444', borderWidth: 1.5, backgroundColor: '#FEF2F2' }]}>
        <Text style={[styles.cardHeader, { fontFamily: fontFamilyBold, color: '#991B1B' }]}>
          🆘 Emergency Assistance & Helpline
        </Text>
        <Text style={[styles.bodyText, { fontFamily, color: '#7F1D1D', marginBottom: 10 }]}>
          Direct dispatch to Control Room, Police, NDRF boat teams, and medical emergency helpline 112.
        </Text>
        <Button
          title="Open Emergency SOS 🚨"
          onPress={() => router.push('/(app)/sos' as any)}
          variant="danger"
          size="small"
        />
      </Card>

      {/* Offline Storage Cache */}
      <Card style={styles.card}>
        <Text style={[styles.cardHeader, { fontFamily: fontFamilyBold }]}>
          💾 {t('settings.offline_cache')}
        </Text>
        <Text style={[styles.bodyText, { fontFamily }]}>
          Ghat conditions and schedules are cached locally on your device for weak network areas.
        </Text>
        <Button
          title={clearing ? 'Clearing...' : t('settings.clear_cache')}
          onPress={handleClearCache}
          loading={clearing}
          variant="outline"
          size="small"
          style={styles.cacheBtn}
        />
      </Card>

      {/* App Info */}
      <Card style={styles.card}>
        <Text style={[styles.cardHeader, { fontFamily: fontFamilyBold }]}>
          ℹ️ {t('settings.about')}
        </Text>
        <Text style={[styles.bodyText, { fontFamily }]}>
          Smart Pushkaralu 2027 • Official Pilgrim Portal
        </Text>
        <Text style={[styles.versionText, { fontFamily }]}>
          {t('settings.app_version')}: 1.0.0 (Build 2027.1)
        </Text>
      </Card>

      {/* Account actions */}
      {!isGuest && (
        <View style={styles.accountActions}>
          <Button
            title={t('auth.logout')}
            onPress={handleLogout}
            variant="outline"
            style={styles.logoutBtn}
          />
          <Button
            title={t('auth.delete_account')}
            onPress={handleDeleteAccount}
            variant="danger"
            style={styles.deleteBtn}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.sizes.h1,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  card: {
    marginBottom: theme.spacing.md,
  },
  cardHeader: {
    fontSize: theme.typography.sizes.h3,
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  profileText: {
    fontSize: theme.typography.sizes.bodySm,
    color: theme.colors.textSecondary,
    marginBottom: 10,
  },
  userName: {
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textPrimary,
  },
  userPhone: {
    fontSize: theme.typography.sizes.bodySm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  profileBtn: {
    marginTop: 6,
  },
  langSwitcher: {
    marginTop: 6,
  },
  bodyText: {
    fontSize: theme.typography.sizes.bodySm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  cacheBtn: {
    alignSelf: 'flex-start',
  },
  versionText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  accountActions: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  logoutBtn: {
    width: '100%',
  },
  deleteBtn: {
    width: '100%',
  },
});

