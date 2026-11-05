import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { formatPhoneNumberForDisplay } from '../../utils/validation';

export default function AppHomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { fontFamily, fontFamilyBold } = useLanguage();
  const { status, user, logout, deleteAccount } = useAuth();

  const [isActionLoading, setIsActionLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      t('home.logout'),
      t('home.confirm_logout'),
      [
        { text: t('home.cancel'), style: 'cancel' },
        {
          text: t('home.logout'),
          style: 'destructive',
          onPress: async () => {
            setIsActionLoading(true);
            try {
              await logout();
              router.replace('/(auth)/landing' as any);
            } finally {
              setIsActionLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('home.delete_account'),
      t('home.confirm_delete'),
      [
        { text: t('home.cancel'), style: 'cancel' },
        {
          text: t('home.delete_account'),
          style: 'destructive',
          onPress: async () => {
            setIsActionLoading(true);
            try {
              await deleteAccount();
              router.replace('/(auth)/landing' as any);
            } catch (err: any) {
              Alert.alert(t('common.error'), err.message || 'Failed to delete account');
            } finally {
              setIsActionLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleGoToLogin = () => {
    router.push('/(auth)/phone' as any);
  };

  const isGuest = status === 'guest';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View>
            <Text style={[styles.headerSubtitle, { fontFamily }]}>
              {t('landing.app_name')}
            </Text>
            <Text style={[styles.headerTitle, { fontFamily: fontFamilyBold }]}>
              {isGuest
                ? t('guest.banner_title')
                : t('home.welcome', { name: user?.name || t('home.pilgrim_id') })}
            </Text>
          </View>

          {user?.isAdmin && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>ADMIN</Text>
            </View>
          )}
        </View>

        {/* Guest Mode Banner if browsing as guest */}
        {isGuest ? (
          <View style={styles.guestCard}>
            <Text style={[styles.guestTitle, { fontFamily: fontFamilyBold }]}>
              {t('guest.banner_title')}
            </Text>
            <Text style={[styles.guestDesc, { fontFamily }]}>
              {t('guest.banner_desc')}
            </Text>
            <TouchableOpacity
              style={styles.guestLoginButton}
              onPress={handleGoToLogin}
              accessibilityRole="button"
              activeOpacity={0.8}
            >
              <Text style={[styles.guestLoginButtonText, { fontFamily: fontFamilyBold }]}>
                {t('guest.login_prompt')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* User Profile & Account Info Card */
          <View style={styles.profileCard}>
            <View style={styles.profileHeaderRow}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : '🙏'}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { fontFamily: fontFamilyBold }]}>
                  {user?.name || t('home.pilgrim_id')}
                </Text>
                <Text style={[styles.profilePhone, { fontFamily }]}>
                  {user?.phone ? formatPhoneNumberForDisplay(user.phone) : ''}
                </Text>
                {user?.isAdmin && (
                  <Text style={[styles.profileAdminText, { fontFamily }]}>
                    {t('home.role_admin')}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.metaRow}>
              <Text style={[styles.metaLabel, { fontFamily }]}>Language:</Text>
              <Text style={[styles.metaValue, { fontFamily: fontFamilyBold }]}>
                {user?.language === 'te'
                  ? 'తెలుగు (Telugu)'
                  : user?.language === 'hi'
                  ? 'हिन्दी (Hindi)'
                  : 'English'}
              </Text>
            </View>
            {user?.consentVersion && (
              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { fontFamily }]}>Advisory Consent:</Text>
                <Text style={[styles.metaValue, { fontFamily: fontFamilyBold }]}>
                  {user.consentVersion} (Active)
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Ghat Overview Section */}
        <View style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { fontFamily: fontFamilyBold }]}>
            {t('home.ghat_overview')}
          </Text>
          <Text style={[styles.sectionDesc, { fontFamily }]}>
            {t('home.ghat_note')}
          </Text>

          <View style={styles.ghatPreviewList}>
            <View style={styles.ghatItem}>
              <Text style={styles.ghatIcon}>🌊</Text>
              <View style={styles.ghatDetails}>
                <Text style={[styles.ghatName, { fontFamily: fontFamilyBold }]}>
                  Kotilingala Ghat (Rajahmundry)
                </Text>
                <Text style={[styles.ghatStatus, { fontFamily }]}>
                  Status: Preparation Mode • River Godavari
                </Text>
              </View>
            </View>

            <View style={styles.ghatItem}>
              <Text style={styles.ghatIcon}>🛕</Text>
              <View style={styles.ghatDetails}>
                <Text style={[styles.ghatName, { fontFamily: fontFamilyBold }]}>
                  Bhadrachalam Ghat
                </Text>
                <Text style={[styles.ghatStatus, { fontFamily }]}>
                  Status: Divine Darshan & Holy Bath Zone
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons for Authenticated User */}
        {!isGuest && (
          <View style={styles.accountActionsSection}>
            {isActionLoading ? (
              <ActivityIndicator size="small" color="#0F52BA" />
            ) : (
              <>
                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={handleLogout}
                  accessibilityRole="button"
                  accessibilityLabel={t('home.logout')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.logoutButtonText, { fontFamily: fontFamilyBold }]}>
                    {t('home.logout')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDeleteAccount}
                  accessibilityRole="button"
                  accessibilityLabel={t('home.delete_account')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.deleteButtonText, { fontFamily }]}>
                    {t('home.delete_account')}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#0F52BA',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0C2340',
    marginTop: 2,
  },
  adminBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  adminBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  guestCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
  },
  guestTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 6,
  },
  guestDesc: {
    fontSize: 14,
    color: '#3B82F6',
    lineHeight: 20,
    marginBottom: 14,
  },
  guestLoginButton: {
    backgroundColor: '#0F52BA',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestLoginButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0F52BA',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F52BA',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0C2340',
  },
  profilePhone: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  profileAdminText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '700',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  metaLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  metaValue: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0C2340',
    marginBottom: 6,
  },
  sectionDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
    marginBottom: 14,
  },
  ghatPreviewList: {
    gap: 10,
  },
  ghatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    gap: 12,
  },
  ghatIcon: {
    fontSize: 22,
  },
  ghatDetails: {
    flex: 1,
  },
  ghatName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  ghatStatus: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  accountActionsSection: {
    marginTop: 10,
    gap: 12,
  },
  logoutButton: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  deleteButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
});
