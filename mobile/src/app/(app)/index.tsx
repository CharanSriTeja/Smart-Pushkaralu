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
import { acquireUserLocation } from '../../utils/location';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { formatPhoneNumberForDisplay } from '../../utils/validation';
import { ConditionDisclaimerBanner } from '../../components/ConditionDisclaimerBanner';
import { UrgentNewsBanner } from '../../components/UrgentNewsBanner';

export default function AppHomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { fontFamily, fontFamilyBold } = useLanguage();
  const { status, user, logout, deleteAccount } = useAuth();

  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isFindingNearest, setIsFindingNearest] = useState(false);

  const handleFindNearestGhat = async () => {
    setIsFindingNearest(true);
    try {
      const locResult = await acquireUserLocation();
      if (!locResult.granted || !locResult.coords) {
        Alert.alert(
          'Location Permission Required',
          'Please grant GPS permission so we can find the nearest safe Pushkaralu ghat for your holy bath.',
          [
            { text: 'Browse List Instead', onPress: () => router.push('/(app)/ghats' as any) },
            { text: 'OK' },
          ]
        );
        setIsFindingNearest(false);
        return;
      }

      router.push(`/(app)/ghats?near=${locResult.coords.latitude},${locResult.coords.longitude}` as any);
    } catch {
      Alert.alert('Location Error', 'Could not detect GPS coordinates. Opening ghat directory.');
      router.push('/(app)/ghats' as any);
    } finally {
      setIsFindingNearest(false);
    }
  };

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

        {/* Live Urgent Pushkaralu Advisory Banner */}
        <UrgentNewsBanner />

        {/* Safety Disclaimer Banner */}
        <ConditionDisclaimerBanner />

        {/* Ghat Search & Quick Actions Section */}
        <View style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { fontFamily: fontFamilyBold }]}>
            🌊 {t('ghats.title', 'Godavari Pushkaralu Ghats')}
          </Text>
          <Text style={[styles.sectionDesc, { fontFamily }]}>
            Official directory of holy bathing sites, real-time crowd density, safety alerts, and aarti timings across AP & Telangana.
          </Text>

          {/* Find Nearest Ghat Button with GPS */}
          <TouchableOpacity
            style={styles.nearestButton}
            onPress={handleFindNearestGhat}
            disabled={isFindingNearest}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            {isFindingNearest ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={[styles.nearestButtonText, { fontFamily: fontFamilyBold }]}>
                🎯 {t('ghats.find_nearest', 'Find Nearest Ghat (GPS)')}
              </Text>
            )}
          </TouchableOpacity>

          {/* Quick Action Navigation Grid */}
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.gridBtn}
              onPress={() => router.push('/(app)/ghats' as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.gridBtnIcon}>📋</Text>
              <Text style={[styles.gridBtnText, { fontFamily: fontFamilyBold }]}>
                {t('ghats.view_list', 'All Ghats List')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gridBtn}
              onPress={() => router.push('/(app)/ghats/map' as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.gridBtnIcon}>🗺️</Text>
              <Text style={[styles.gridBtnText, { fontFamily: fontFamilyBold }]}>
                {t('ghats.view_map', 'Interactive Map')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gridBtn}
              onPress={() => router.push('/(app)/news' as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.gridBtnIcon}>📢</Text>
              <Text style={[styles.gridBtnText, { fontFamily: fontFamilyBold }]}>
                Official News
              </Text>
            </TouchableOpacity>
          </View>

          {/* Module 8: Report an Issue Quick Action */}
          <View style={styles.issueActionRow}>
            <TouchableOpacity
              style={styles.reportIssuePrimaryBtn}
              onPress={() => router.push('/(app)/issues/report' as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.reportIssueBtnIcon}>🚨</Text>
              <Text style={[styles.reportIssueBtnText, { fontFamily: fontFamilyBold }]}>
                {t('issues.title', 'Report Grievance')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.myIssuesSecondaryBtn}
              onPress={() => router.push('/(app)/issues' as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.myIssuesBtnIcon}>📋</Text>
              <Text style={[styles.myIssuesBtnText, { fontFamily: fontFamilyBold }]}>
                {t('issues.my_reports', 'My Reports')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Popular Ghats Quick List */}
          <Text style={[styles.subHeading, { fontFamily: fontFamilyBold }]}>
            Major Godavari Pilgrimage Centers:
          </Text>
          <View style={styles.ghatPreviewList}>
            <TouchableOpacity
              style={styles.ghatItem}
              onPress={() => router.push('/(app)/ghats' as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.ghatIcon}>🌊</Text>
              <View style={styles.ghatDetails}>
                <Text style={[styles.ghatName, { fontFamily: fontFamilyBold }]}>
                  Rajamahendravaram (Rajahmundry) Ghats
                </Text>
                <Text style={[styles.ghatStatus, { fontFamily }]}>
                  East Godavari, AP • Kotilingala, Pushkar & Saraswati Ghats
                </Text>
              </View>
              <Text style={styles.arrowIcon}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ghatItem}
              onPress={() => router.push('/(app)/ghats' as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.ghatIcon}>🛕</Text>
              <View style={styles.ghatDetails}>
                <Text style={[styles.ghatName, { fontFamily: fontFamilyBold }]}>
                  Bhadrachalam Sri Rama Ghat
                </Text>
                <Text style={[styles.ghatStatus, { fontFamily }]}>
                  Bhadradri Kothagudem, Telangana • Temple riverfront
                </Text>
              </View>
              <Text style={styles.arrowIcon}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ghatItem}
              onPress={() => router.push('/(app)/ghats' as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.ghatIcon}>🔱</Text>
              <View style={styles.ghatDetails}>
                <Text style={[styles.ghatName, { fontFamily: fontFamilyBold }]}>
                  Kovvur Goshpada Kshetram Ghat
                </Text>
                <Text style={[styles.ghatStatus, { fontFamily }]}>
                  West Godavari, AP • Gautama Teertham
                </Text>
              </View>
              <Text style={styles.arrowIcon}>→</Text>
            </TouchableOpacity>
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
  nearestButton: {
    backgroundColor: '#0F52BA',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#0F52BA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  nearestButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  gridBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  gridBtnIcon: {
    fontSize: 18,
  },
  gridBtnText: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '700',
  },
  subHeading: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  issueActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  reportIssuePrimaryBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  reportIssueBtnIcon: {
    fontSize: 16,
  },
  reportIssueBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  myIssuesSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 6,
  },
  myIssuesBtnIcon: {
    fontSize: 16,
  },
  myIssuesBtnText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  arrowIcon: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '700',
  },
});
