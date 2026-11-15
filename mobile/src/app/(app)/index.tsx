import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { colors, radii, spacing, touchTargets, typography, shadows } from '../../theme/tokens';
import {
  ScreenContainer,
  Card,
  Button,
  CrowdBadge,
  BathingBadge,
  SearchField,
  SkeletonCard,
  BottomSheet,
  LanguageSwitcher,
} from '../../components';
import { UrgentNewsBanner } from '../../components/UrgentNewsBanner';
import { GhatService } from '../../services/ghatService';
import { NewsService } from '../../services/newsService';
import { getLocalizedText } from '../../utils/localized';
import { Ghat } from '../../types/ghats';
import { NewsPost } from '../../types/news';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { language, fontFamily, fontFamilyBold } = useLanguage();
  const { user, status } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [nearestGhat, setNearestGhat] = useState<Ghat | null>(null);
  const [loadingNearest, setLoadingNearest] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [latestNews, setLatestNews] = useState<NewsPost[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLanguageSheet, setShowLanguageSheet] = useState(false);

  // Load data without prompting for location permissions on launch
  const loadHomeData = useCallback(async () => {
    // 1. Check if location permission is ALREADY granted (never prompt on launch)
    try {
      const perm = await Location.getForegroundPermissionsAsync();
      if (perm.granted) {
        setLocationPermissionGranted(true);
        setLoadingNearest(true);
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (loc?.coords) {
          const res = await GhatService.getGhats({
            near: `${loc.coords.latitude},${loc.coords.longitude}`,
            limit: 1,
          } as any);
          if (res.ghats && res.ghats.length > 0) {
            setNearestGhat(res.ghats[0]);
          }
        }
      }
    } catch (e) {
      console.warn('[Home] Silent location check failed:', e);
    } finally {
      setLoadingNearest(false);
    }

    // 2. Fetch latest official news
    try {
      setLoadingNews(true);
      const newsRes = await NewsService.getNews({ language });
      if (newsRes.news) {
        setLatestNews(newsRes.news.slice(0, 3));
      }
    } catch (e) {
      console.warn('[Home] Fetching latest news failed:', e);
    } finally {
      setLoadingNews(false);
    }
  }, [language]);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHomeData();
    setRefreshing(false);
  };

  // User explicitly asks to find nearest ghat
  const handleRequestLocation = async () => {
    setLoadingNearest(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.granted) {
        setLocationPermissionGranted(true);
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (loc?.coords) {
          const res = await GhatService.getGhats({
            near: `${loc.coords.latitude},${loc.coords.longitude}`,
            limit: 1,
          } as any);
          if (res.ghats && res.ghats.length > 0) {
            setNearestGhat(res.ghats[0]);
          } else {
            router.push('/(app)/ghats' as any);
          }
        }
      } else {
        router.push('/(app)/ghats' as any);
      }
    } catch {
      router.push('/(app)/ghats' as any);
    } finally {
      setLoadingNearest(false);
    }
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      router.push(`/(app)/ghats?search=${encodeURIComponent(searchQuery.trim())}` as any);
    } else {
      router.push('/(app)/ghats' as any);
    }
  };

  const quickActions = [
    {
      id: 'ghats',
      title: t('navigation.ghats', 'Ghats'),
      subtitle: t('home.view_ghats_sub', 'Live water & crowds'),
      icon: '🌊',
      onPress: () => router.push('/(app)/ghats' as any),
    },
    {
      id: 'plan',
      title: t('navigation.plan', 'Plan a Trip'),
      subtitle: t('planner.add_visit', 'Schedule holy bath'),
      icon: '🧭',
      onPress: () => router.push('/(app)/routes' as any),
    },
    {
      id: 'directions',
      title: t('routes.directions_title', 'Directions'),
      subtitle: t('routes.traffic_notice', 'Godavari routes & closures'),
      icon: '🚗',
      onPress: () => router.push('/(app)/routes' as any),
    },
    {
      id: 'nearby',
      title: t('places.title', 'Nearby Places'),
      subtitle: t('places.hotels_and_temples', 'Hotels & Temples'),
      icon: '🏨',
      onPress: () => router.push('/(app)/ghats/nearby' as any),
    },
    {
      id: 'issues',
      title: t('issues.report_title', 'Report Issue'),
      subtitle: t('issues.category_label', 'Sanitation & Safety'),
      icon: '📋',
      onPress: () => router.push('/(app)/issues/report' as any),
    },
    {
      id: 'sos',
      title: t('sos.emergency_112', 'Emergency 112'),
      subtitle: t('sos.title', 'SOS Police & Rescue'),
      icon: '🚨',
      onPress: () => router.push('/(app)/sos' as any),
      isEmergency: true,
    },
    {
      id: 'seva',
      title: t('seva.title', 'Virtual Seva'),
      subtitle: t('home.seva_booking_sub', 'Volunteering & Annadanam'),
      icon: '🙏',
      onPress: () => router.push('/(app)/seva' as any),
    },
    {
      id: 'transport',
      title: t('transport.title', 'Transport'),
      subtitle: t('transport.hubs_title', 'Buses & Shuttles'),
      icon: '🚌',
      onPress: () => router.push('/(app)/transport' as any),
    },
  ];

  return (
    <ScreenContainer
      scrollable
      refreshing={refreshing}
      onRefresh={handleRefresh}
      contentContainerStyle={styles.container}
    >
      {/* 1. Top Bar with Logo and Language Chip */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Text style={styles.brandIcon}>🕉️</Text>
          <View>
            <Text
              maxFontSizeMultiplier={typography.maxScale}
              style={[styles.brandTitle, { fontFamily: fontFamilyBold }]}
            >
              Smart Pushkaralu
            </Text>
            <Text
              maxFontSizeMultiplier={typography.maxScale}
              style={[styles.brandSubtitle, { fontFamily }]}
            >
              2027 Godavari Maha Pushkaram
            </Text>
          </View>
        </View>

        {/* Language selector chip */}
        <TouchableOpacity
          onPress={() => setShowLanguageSheet(true)}
          accessibilityRole="button"
          accessibilityLabel="Switch language"
          style={styles.languageChip}
        >
          <Text style={styles.langGlobe}>🌐</Text>
          <Text
            maxFontSizeMultiplier={typography.maxScale}
            style={[styles.langText, { fontFamily: fontFamilyBold }]}
          >
            {language === 'te' ? 'తెలుగు' : language === 'hi' ? 'हिन्दी' : 'English'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2. Ghat Search Entry */}
      <View style={styles.searchSection}>
        <SearchField
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('ghats.search_placeholder', 'Search holy ghats, towns or districts...')}
          onClear={() => setSearchQuery('')}
        />
        {searchQuery.trim().length > 0 && (
          <Button
            title={t('common.search', 'Search')}
            onPress={handleSearchSubmit}
            size="sm"
            style={styles.searchSubmitBtn}
          />
        )}
      </View>

      {/* 3. Live Urgent Advisory Banner */}
      <UrgentNewsBanner />

      {/* 4. Nearest Ghat Status Card (shown if location granted, or prompt button) */}
      <View style={styles.sectionWrapper}>
        <Text
          maxFontSizeMultiplier={typography.maxScale}
          style={[styles.sectionHeading, { fontFamily: fontFamilyBold }]}
        >
          📍 {t('home.ghat_overview', 'Nearest Bathing Ghat')}
        </Text>

        {loadingNearest ? (
          <SkeletonCard height={110} />
        ) : nearestGhat ? (
          <Card variant="elevated" style={styles.nearestCard}>
            <View style={styles.nearestHeader}>
              <View style={{ flex: 1 }}>
                <Text
                  maxFontSizeMultiplier={typography.maxScale}
                  style={[styles.nearestGhatName, { fontFamily: fontFamilyBold }]}
                >
                  {getLocalizedText(nearestGhat.name, language)}
                </Text>
                <Text
                  maxFontSizeMultiplier={typography.maxScale}
                  style={[styles.nearestDistrict, { fontFamily }]}
                >
                  {nearestGhat.district} • {nearestGhat.river || 'Godavari'}
                  {nearestGhat.distance_km ? ` • ${nearestGhat.distance_km.toFixed(1)} km away` : ''}
                </Text>
              </View>
              <BathingBadge status={nearestGhat.bathing_status} size="sm" />
            </View>

            <View style={styles.nearestFooter}>
              <CrowdBadge crowd={nearestGhat.crowd_level} size="sm" />
              <Button
                title={t('routes.get_directions', 'Directions')}
                size="sm"
                variant="secondary"
                onPress={() => router.push(`/(app)/ghats/${nearestGhat.id}` as any)}
              />
            </View>
          </Card>
        ) : (
          <Card variant="tint" style={styles.locationPromptCard}>
            <Text style={styles.promptIcon}>🌊</Text>
            <View style={{ flex: 1 }}>
              <Text
                maxFontSizeMultiplier={typography.maxScale}
                style={[styles.promptTitle, { fontFamily: fontFamilyBold }]}
              >
                {t('home.view_ghats', 'Find Nearest Holy Ghat')}
              </Text>
              <Text
                maxFontSizeMultiplier={typography.maxScale}
                style={[styles.promptDesc, { fontFamily }]}
              >
                {t('home.view_ghats_sub', 'Check real-time river current and crowd density')}
              </Text>
            </View>
            <Button
              title={t('common.enable_location', 'Detect GPS')}
              size="sm"
              variant="primary"
              onPress={handleRequestLocation}
            />
          </Card>
        )}
      </View>

      {/* 5. Quick Actions Grid */}
      <View style={styles.sectionWrapper}>
        <Text
          maxFontSizeMultiplier={typography.maxScale}
          style={[styles.sectionHeading, { fontFamily: fontFamilyBold }]}
        >
          ⚡ {t('home.quick_actions', 'Quick Services')}
        </Text>

        <View style={styles.grid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              onPress={action.onPress}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={action.title}
              style={[
                styles.gridItem,
                action.isEmergency ? styles.gridItemEmergency : null,
              ]}
            >
              <View
                style={[
                  styles.gridIconBox,
                  action.isEmergency ? styles.gridIconBoxEmergency : null,
                ]}
              >
                <Text style={styles.gridIcon}>{action.icon}</Text>
              </View>
              <Text
                maxFontSizeMultiplier={typography.maxScale}
                style={[
                  styles.gridTitle,
                  action.isEmergency ? styles.gridTitleEmergency : null,
                  { fontFamily: fontFamilyBold },
                ]}
                numberOfLines={1}
              >
                {action.title}
              </Text>
              <Text
                maxFontSizeMultiplier={typography.maxScale}
                style={[styles.gridSubtitle, { fontFamily }]}
                numberOfLines={1}
              >
                {action.subtitle}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 6. Latest News & Announcements */}
      <View style={styles.sectionWrapper}>
        <View style={styles.newsSectionHeader}>
          <Text
            maxFontSizeMultiplier={typography.maxScale}
            style={[styles.sectionHeading, { fontFamily: fontFamilyBold, marginBottom: 0 }]}
          >
            📰 {t('news.title', 'Official Updates & Notices')}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(app)/news' as any)}
            accessibilityRole="button"
            style={styles.viewAllBtn}
          >
            <Text
              maxFontSizeMultiplier={typography.maxScale}
              style={[styles.viewAllText, { fontFamily: fontFamilyBold }]}
            >
              {t('common.view_all', 'View All')} →
            </Text>
          </TouchableOpacity>
        </View>

        {loadingNews ? (
          <SkeletonCard height={90} />
        ) : latestNews.length === 0 ? (
          <Card variant="flat" style={styles.emptyNewsCard}>
            <Text
              maxFontSizeMultiplier={typography.maxScale}
              style={[styles.emptyNewsText, { fontFamily }]}
            >
              No active advisories right now. All ghat operations normal.
            </Text>
          </Card>
        ) : (
          latestNews.map((newsItem) => (
            <Card
              key={newsItem.id}
              variant="elevated"
              onPress={() => router.push(`/(app)/news/${newsItem.id}` as any)}
              style={styles.newsCard}
            >
              <View style={styles.newsHeader}>
                <Text style={styles.newsCategory}>{newsItem.category.toUpperCase()}</Text>
                <Text
                  maxFontSizeMultiplier={typography.maxScale}
                  style={[styles.newsDate, { fontFamily }]}
                >
                  {new Date(newsItem.published_at || newsItem.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text
                maxFontSizeMultiplier={typography.maxScale}
                style={[styles.newsTitle, { fontFamily: fontFamilyBold }]}
                numberOfLines={2}
              >
                {getLocalizedText(newsItem.title, language)}
              </Text>
            </Card>
          ))
        )}
      </View>

      {/* Language Selection Bottom Sheet */}
      <BottomSheet
        visible={showLanguageSheet}
        onClose={() => setShowLanguageSheet(false)}
        title="Select Language / భాషను ఎంచుకోండి"
      >
        <LanguageSwitcher variant="chips" />
        <View style={{ marginTop: spacing.md }}>
          <Button
            title={t('common.done', 'Done')}
            onPress={() => setShowLanguageSheet(false)}
            variant="primary"
          />
        </View>
      </BottomSheet>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandIcon: {
    fontSize: 28,
  },
  brandTitle: {
    fontSize: typography.sizes.h2,
    fontWeight: '800',
    color: colors.primary700,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  languageChip: {
    minHeight: touchTargets.minTouch,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.borderOrange,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    gap: 6,
  },
  langGlobe: {
    fontSize: 14,
  },
  langText: {
    fontSize: 13,
    color: colors.primary700,
    fontWeight: '700',
  },
  searchSection: {
    gap: spacing.xs,
  },
  searchSubmitBtn: {
    alignSelf: 'flex-end',
  },
  sectionWrapper: {
    gap: spacing.xs,
  },
  sectionHeading: {
    fontSize: typography.sizes.body,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  nearestCard: {
    gap: spacing.sm,
  },
  nearestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nearestGhatName: {
    fontSize: typography.sizes.h3,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  nearestDistrict: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  nearestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  locationPromptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  promptIcon: {
    fontSize: 28,
  },
  promptTitle: {
    fontSize: typography.sizes.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  promptDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridItem: {
    width: '48%',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    minHeight: 104,
    justifyContent: 'center',
    ...shadows.card,
  },
  gridItemEmergency: {
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerLight,
  },
  gridIconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  gridIconBoxEmergency: {
    backgroundColor: colors.white,
  },
  gridIcon: {
    fontSize: 18,
  },
  gridTitle: {
    fontSize: typography.sizes.bodySm || 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  gridTitleEmergency: {
    color: colors.danger,
  },
  gridSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  newsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  viewAllBtn: {
    minHeight: 36,
    justifyContent: 'center',
  },
  viewAllText: {
    fontSize: 13,
    color: colors.primary700,
    fontWeight: '700',
  },
  newsCard: {
    gap: 4,
    marginVertical: 4,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsCategory: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary700,
    letterSpacing: 0.5,
  },
  newsDate: {
    fontSize: 11,
    color: colors.textMuted,
  },
  newsTitle: {
    fontSize: typography.sizes.bodySm || 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  emptyNewsCard: {
    padding: spacing.md,
    alignItems: 'center',
  },
  emptyNewsText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
