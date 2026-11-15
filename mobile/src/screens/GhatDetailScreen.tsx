import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Linking,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { Ghat, CrowdStatus } from '../types/ghats';
import { GhatService } from '../services/ghatService';
import { getLocalizedText, formatVerifiedDate } from '../utils/localized';
import { colors, radii, spacing, touchTargets, typography, shadows } from '../theme/tokens';
import {
  Card,
  Button,
  BathingBadge,
  CrowdBadge,
  VerificationBadge,
  SkeletonCard,
  ErrorState,
  OfflineBanner,
} from '../components';
import { ConditionDisclaimerBanner } from '../components/ConditionDisclaimerBanner';
import { FacilitiesGrid } from '../components/FacilitiesGrid';
import { AartiTimingsList } from '../components/AartiTimingsList';
import { NoticesBanner } from '../components/NoticesBanner';
import { CrowdStatusComponent } from '../components/CrowdStatusComponent';
import { CrowdReportModal } from '../components/CrowdReportModal';

export const GhatDetailScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { language, fontFamily, fontFamilyBold } = useLanguage();

  const [ghat, setGhat] = useState<Ghat | null>(null);
  const [crowdStatus, setCrowdStatus] = useState<CrowdStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);

  const loadGhat = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const res = await GhatService.getGhatById(id);
      setGhat(res.ghat);
      setIsOffline(res.isOffline);

      if (res.ghat) {
        const cs = await GhatService.getGhatCrowdStatus(id);
        if (cs) setCrowdStatus(cs);
      }
    } catch (err: any) {
      console.warn('Failed to load ghat detail:', err);
      setError(err.message || 'Could not load ghat detail');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadGhat();
  }, [loadGhat]);

  const handleExternalMaps = () => {
    if (!ghat) return;
    const lat = ghat.lat;
    const lng = ghat.lng;
    const label = encodeURIComponent(getLocalizedText(ghat.name, language));
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    });
    Linking.openURL(url as string).catch(() => {});
  };

  const handleOpenSource = () => {
    if (ghat?.official_source_url) {
      Linking.openURL(ghat.official_source_url).catch(() => {});
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.topNav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.navBackBtn}>
            <Text style={styles.navBackIcon}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.navTitle, { fontFamily: fontFamilyBold }]}>Loading Ghat...</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ padding: spacing.md, gap: spacing.md }}>
          <SkeletonCard height={140} />
          <SkeletonCard height={100} />
          <SkeletonCard height={160} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !ghat) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.topNav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.navBackBtn}>
            <Text style={styles.navBackIcon}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.navTitle, { fontFamily: fontFamilyBold }]}>Ghat Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <ErrorState
          title="Ghat Not Found"
          message={error || 'We could not find details for this holy bathing site.'}
          onRetry={loadGhat}
          retryTitle={t('common.retry', 'Retry')}
        />
      </SafeAreaView>
    );
  }

  const name = getLocalizedText(ghat.name, language);
  const description = getLocalizedText(ghat.description, language);
  const nearestTown = getLocalizedText(ghat.nearest_town, language);
  const verifiedDate = ghat.verified_at ? formatVerifiedDate(ghat.verified_at, language) : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.navBackBtn}
        >
          <Text style={styles.navBackIcon}>←</Text>
        </TouchableOpacity>
        <Text
          numberOfLines={1}
          maxFontSizeMultiplier={typography.maxScale}
          style={[styles.navTitle, { fontFamily: fontFamilyBold }]}
        >
          {name}
        </Text>
        <TouchableOpacity
          onPress={handleExternalMaps}
          accessibilityRole="button"
          accessibilityLabel="Open in external map application"
          style={styles.navActionBtn}
        >
          <Text style={styles.navActionText}>🗺️ Maps</Text>
        </TouchableOpacity>
      </View>

      {/* Offline Alert Strip */}
      {isOffline && <OfflineBanner />}

      {/* Scrollable Content Body */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Safety Disclaimer Banner */}
        <ConditionDisclaimerBanner />

        {/* 1. Header Card with Name, Location, Badges, and Verification Date */}
        <Card variant="elevated" style={styles.heroCard}>
          <View style={styles.riverTag}>
            <Text style={styles.riverTagText}>🌊 {ghat.river || 'Godavari'} River Maha Pushkaralu</Text>
          </View>
          <Text
            maxFontSizeMultiplier={typography.maxScale}
            style={[styles.heroTitle, { fontFamily: fontFamilyBold }]}
          >
            {name}
          </Text>
          <Text
            maxFontSizeMultiplier={typography.maxScale}
            style={[styles.heroSubtitle, { fontFamily }]}
          >
            📍 {nearestTown ? `${nearestTown}, ` : ''}{ghat.district}, {ghat.state}
          </Text>

          {/* Badges row */}
          <View style={styles.badgesRow}>
            <BathingBadge status={ghat.bathing_status} size="md" />
            <CrowdBadge crowd={ghat.crowd_level} size="md" />
          </View>

          {/* Verification, Source Link and Last Verified Date */}
          <View style={styles.verificationSection}>
            <View style={styles.verificationLeft}>
              <VerificationBadge
                verified={ghat.record_status === 'officially_listed'}
                label={ghat.record_status === 'officially_listed' ? 'Official District Registry' : 'Unverified'}
                size="sm"
              />
              {verifiedDate && (
                <Text
                  maxFontSizeMultiplier={typography.maxScale}
                  style={[styles.verifiedDate, { fontFamily }]}
                >
                  Verified on: {verifiedDate}
                </Text>
              )}
            </View>

            {ghat.official_source_url ? (
              <TouchableOpacity
                onPress={handleOpenSource}
                accessibilityRole="link"
                accessibilityLabel="Open official source URL"
                style={styles.sourceBtn}
              >
                <Text style={styles.sourceBtnText}>Official Source ↗</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </Card>

        {/* 2. Active Safety Notices Section */}
        {ghat.active_notices && ghat.active_notices.length > 0 && (
          <View style={styles.section}>
            <Text
              maxFontSizeMultiplier={typography.maxScale}
              style={[styles.sectionTitle, { fontFamily: fontFamilyBold }]}
            >
              📢 {t('ghats.sections.notices', 'Safety & Emergency Advisories')}
            </Text>
            <NoticesBanner notices={ghat.active_notices} />
          </View>
        )}

        {/* 3. Live Crowd Status & Report Trigger */}
        <CrowdStatusComponent
          crowdStatus={crowdStatus || ghat.crowd_status}
          fallbackLevel={ghat.crowd_level}
          onOpenReportModal={() => setIsReportModalVisible(true)}
        />

        {/* 4. Overview / About Section */}
        {description ? (
          <Card variant="elevated" style={styles.sectionCard}>
            <Text
              maxFontSizeMultiplier={typography.maxScale}
              style={[styles.sectionTitle, { fontFamily: fontFamilyBold }]}
            >
              📖 {t('ghats.sections.about', 'About this Ghat')}
            </Text>
            <Text
              maxFontSizeMultiplier={typography.maxScale}
              style={[styles.bodyText, { fontFamily }]}
            >
              {description}
            </Text>
          </Card>
        ) : null}

        {/* 5. Aarti Timings Section */}
        <Card variant="elevated" style={styles.sectionCard}>
          <Text
            maxFontSizeMultiplier={typography.maxScale}
            style={[styles.sectionTitle, { fontFamily: fontFamilyBold }]}
          >
            🪔 {t('ghats.sections.aarti', 'Maha Godavari Aarti Timings')}
          </Text>
          <AartiTimingsList timings={ghat.aarti_timings} />
        </Card>

        {/* 6. Facilities Section */}
        <Card variant="elevated" style={styles.sectionCard}>
          <Text
            maxFontSizeMultiplier={typography.maxScale}
            style={[styles.sectionTitle, { fontFamily: fontFamilyBold }]}
          >
            🛠️ {t('ghats.sections.facilities', 'On-Site Facilities')}
          </Text>
          <FacilitiesGrid facilities={ghat.facilities} />
        </Card>

        {/* 7. Nearby Hotels & Temples Section */}
        <Card variant="elevated" style={styles.sectionCard}>
          <View style={styles.nearbyHeaderRow}>
            <Text
              maxFontSizeMultiplier={typography.maxScale}
              style={[styles.sectionTitle, { fontFamily: fontFamilyBold, marginBottom: 0 }]}
            >
              📍 {t('places.title', 'Nearby Hotels & Temples')}
            </Text>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/(app)/ghats/nearby',
                  params: { id: ghat.id, ghatName: name },
                })
              }
              accessibilityRole="button"
              style={styles.exploreNearbyBadge}
            >
              <Text
                maxFontSizeMultiplier={typography.maxScale}
                style={[styles.exploreNearbyText, { fontFamily: fontFamilyBold }]}
              >
                {t('places.view_all', 'Explore All →')}
              </Text>
            </TouchableOpacity>
          </View>
          <Text
            maxFontSizeMultiplier={typography.maxScale}
            style={[styles.bodyText, { fontFamily, marginTop: 4, marginBottom: 12 }]}
          >
            {t('places.subtitle', 'Official accommodations, pilgrimage shrines and transit hubs around this ghat.')}
          </Text>

          <View style={styles.nearbyButtonsRow}>
            <Button
              title="🛕 Temples"
              variant="outline"
              size="sm"
              onPress={() =>
                router.push({
                  pathname: '/(app)/ghats/nearby',
                  params: { id: ghat.id, ghatName: name, type: 'temple' },
                })
              }
              style={{ flex: 1 }}
            />
            <Button
              title="🏨 Hotels"
              variant="outline"
              size="sm"
              onPress={() =>
                router.push({
                  pathname: '/(app)/ghats/nearby',
                  params: { id: ghat.id, ghatName: name, type: 'hotel' },
                })
              }
              style={{ flex: 1 }}
            />
          </View>
        </Card>

        {/* Bottom padding to ensure content is never obscured by the sticky action bar */}
        <View style={{ height: 96 }} />
      </ScrollView>

      {/* Sticky Bottom Action Bar with Directions and Plan a Trip */}
      <View style={styles.stickyBottomBar}>
        <Button
          title={t('routes.get_directions', 'Directions')}
          variant="secondary"
          size="md"
          icon={<Text style={{ fontSize: 16 }}>🚗</Text>}
          onPress={() =>
            router.navigate(
              `/(app)/routes?ghatId=${ghat.id}&ghatName=${encodeURIComponent(name)}&lat=${ghat.lat}&lng=${ghat.lng}&mode=directions` as any
            )
          }
          style={styles.bottomBarButton}
        />
        <Button
          title={t('navigation.plan', 'Plan a Trip')}
          variant="primary"
          size="md"
          icon={<Text style={{ fontSize: 16 }}>🧭</Text>}
          onPress={() =>
            router.navigate(
              `/(app)/routes?destination=${ghat.id}&ghatName=${encodeURIComponent(name)}&lat=${ghat.lat}&lng=${ghat.lng}&mode=plan` as any
            )
          }
          style={styles.bottomBarButton}
        />
      </View>

      {/* Crowd Report Modal */}
      <CrowdReportModal
        visible={isReportModalVisible}
        ghatId={ghat.id}
        ghatName={name}
        onClose={() => setIsReportModalVisible(false)}
        onSuccess={() => {
          GhatService.getGhatCrowdStatus(ghat.id).then((cs) => {
            if (cs) setCrowdStatus(cs);
          });
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 56,
  },
  navBackBtn: {
    minWidth: touchTargets.minTouch,
    minHeight: touchTargets.minTouch,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBackIcon: {
    fontSize: 22,
    color: colors.primary700,
    fontWeight: '700',
  },
  navTitle: {
    flex: 1,
    fontSize: typography.sizes.h3,
    fontWeight: '700',
    color: colors.textPrimary,
    marginHorizontal: spacing.sm,
  },
  navActionBtn: {
    minHeight: 38,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary50,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderOrange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary700,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  heroCard: {
    gap: spacing.sm,
  },
  riverTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary50,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderOrange,
  },
  riverTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary700,
  },
  heroTitle: {
    fontSize: typography.sizes.h1,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  verificationSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  verificationLeft: {
    gap: 4,
  },
  verifiedDate: {
    fontSize: 11,
    color: colors.textMuted,
  },
  sourceBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  sourceBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary700,
  },
  section: {
    gap: spacing.xs,
  },
  sectionCard: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  bodyText: {
    fontSize: typography.sizes.bodySm || 14,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  nearbyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exploreNearbyBadge: {
    minHeight: 36,
    justifyContent: 'center',
  },
  exploreNearbyText: {
    fontSize: 13,
    color: colors.primary700,
    fontWeight: '700',
  },
  nearbyButtonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    gap: spacing.md,
    ...shadows.elevated,
  },
  bottomBarButton: {
    flex: 1,
  },
});
