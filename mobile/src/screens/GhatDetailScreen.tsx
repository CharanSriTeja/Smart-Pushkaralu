import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
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
import { getLocalizedText } from '../utils/localized';
import { ConditionDisclaimerBanner } from '../components/ConditionDisclaimerBanner';
import { OfficialTrustBadge } from '../components/OfficialTrustBadge';
import { BathingStatusBadge } from '../components/BathingStatusBadge';
import { CrowdStatusComponent } from '../components/CrowdStatusComponent';
import { FacilitiesGrid } from '../components/FacilitiesGrid';
import { AartiTimingsList } from '../components/AartiTimingsList';
import { NoticesBanner } from '../components/NoticesBanner';
import { CrowdReportModal } from '../components/CrowdReportModal';

export const GhatDetailScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { language, fontFamily, fontFamilyBold } = useLanguage();

  const [ghat, setGhat] = useState<Ghat | null>(null);
  const [crowdStatus, setCrowdStatus] = useState<CrowdStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);

  const loadGhat = useCallback(async () => {
    if (!id) return;
    try {
      const res = await GhatService.getGhatById(id);
      setGhat(res.ghat);
      setIsOffline(res.isOffline);

      if (res.ghat) {
        // Load live crowd status
        const cs = await GhatService.getGhatCrowdStatus(id);
        if (cs) setCrowdStatus(cs);
      }
    } catch (err) {
      console.warn('Failed to load ghat detail:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadGhat();
  }, [loadGhat]);

  const handleOpenNavigation = () => {
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

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0F52BA" />
        <Text style={[styles.loadingText, { fontFamily }]}>{t('common.loading')}</Text>
      </SafeAreaView>
    );
  }

  if (!ghat) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.emptyEmoji}>⚠️</Text>
        <Text style={[styles.emptyTitle, { fontFamily: fontFamilyBold }]}>Ghat Not Found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backButtonText, { fontFamily: fontFamilyBold }]}>
            {t('common.back', 'Go Back')}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const name = getLocalizedText(ghat.name, language);
  const description = getLocalizedText(ghat.description, language);
  const nearestTown = getLocalizedText(ghat.nearest_town, language);
  const nearestRailway = getLocalizedText(ghat.nearest_railway_station, language);
  const nearestBus = getLocalizedText(ghat.nearest_bus_stand, language);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Top Navigation Bar */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBackBtn}>
          <Text style={styles.navBackIcon}>←</Text>
        </TouchableOpacity>
        <Text numberOfLines={1} style={[styles.navTitle, { fontFamily: fontFamilyBold }]}>
          {name}
        </Text>
        <TouchableOpacity onPress={handleOpenNavigation} style={styles.navActionBtn}>
          <Text style={styles.navActionText}>🧭 Navigate</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Prominent Mandatory Safety Disclaimer */}
        <ConditionDisclaimerBanner />

        {/* Ghat Title & Trust Badge Card */}
        <View style={styles.heroCard}>
          <View style={styles.riverTag}>
            <Text style={styles.riverTagText}>🌊 {ghat.river} River Pushkaralu</Text>
          </View>
          <Text style={[styles.heroTitle, { fontFamily: fontFamilyBold }]}>{name}</Text>
          <Text style={[styles.heroSubtitle, { fontFamily }]}>
            📍 {nearestTown ? `${nearestTown}, ` : ''}{ghat.district}, {ghat.state}
          </Text>

          {/* Official Trust Badge with strict verification check */}
          <OfficialTrustBadge
            recordStatus={ghat.record_status}
            officialSourceUrl={ghat.official_source_url}
            verifiedAt={ghat.verified_at}
            showSourceButton={true}
          />

          {/* Bathing Status Badge */}
          <View style={styles.bathingStatusWrapper}>
            <Text style={[styles.badgeLabel, { fontFamily }]}>
              {t('ghats.bathing_status_label', 'Bathing Status')}:
            </Text>
            <BathingStatusBadge status={ghat.bathing_status} size="medium" />
          </View>
        </View>

        {/* Active Safety Notices Banner */}
        {ghat.active_notices && ghat.active_notices.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontFamily: fontFamilyBold }]}>
              📢 {t('ghats.sections.notices', 'Safety & Emergency Advisories')}
            </Text>
            <NoticesBanner notices={ghat.active_notices} />
          </View>
        )}

        {/* Live Crowd Status Component */}
        <CrowdStatusComponent
          crowdStatus={crowdStatus || ghat.crowd_status}
          fallbackLevel={ghat.crowd_level}
          onOpenReportModal={() => setIsReportModalVisible(true)}
        />

        {/* About Section */}
        {description ? (
          <View style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { fontFamily: fontFamilyBold }]}>
              📖 {t('ghats.sections.about', 'About this Ghat')}
            </Text>
            <Text style={[styles.bodyText, { fontFamily }]}>{description}</Text>
          </View>
        ) : null}

        {/* Aarti Timings */}
        <View style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { fontFamily: fontFamilyBold }]}>
            🪔 {t('ghats.sections.aarti', 'Maha Godavari Aarti Timings')}
          </Text>
          <AartiTimingsList timings={ghat.aarti_timings} />
        </View>

        {/* On-Site Facilities */}
        <View style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { fontFamily: fontFamilyBold }]}>
            🛠️ {t('ghats.sections.facilities', 'On-Site Facilities')}
          </Text>
          <FacilitiesGrid facilities={ghat.facilities} />
        </View>

        {/* Transport & Connectivity */}
        <View style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { fontFamily: fontFamilyBold }]}>
            🚉 {t('ghats.sections.connectivity', 'Transport & Connectivity')}
          </Text>
          <View style={styles.connectItem}>
            <Text style={styles.connectIcon}>🚂</Text>
            <View style={styles.connectContent}>
              <Text style={[styles.connectLabel, { fontFamily }]}>
                {t('ghats.sections.nearest_railway', 'Railway Station')}
              </Text>
              <Text style={[styles.connectValue, { fontFamily: fontFamilyBold }]}>
                {nearestRailway || 'Not specified'}
              </Text>
            </View>
          </View>

          <View style={styles.connectItem}>
            <Text style={styles.connectIcon}>🚌</Text>
            <View style={styles.connectContent}>
              <Text style={[styles.connectLabel, { fontFamily }]}>
                {t('ghats.sections.nearest_bus', 'Bus Stand')}
              </Text>
              <Text style={[styles.connectValue, { fontFamily: fontFamilyBold }]}>
                {nearestBus || 'Not specified'}
              </Text>
            </View>
          </View>

          <View style={styles.connectItem}>
            <Text style={styles.connectIcon}>🏙️</Text>
            <View style={styles.connectContent}>
              <Text style={[styles.connectLabel, { fontFamily }]}>
                {t('ghats.sections.nearest_town', 'Nearest Town')}
              </Text>
              <Text style={[styles.connectValue, { fontFamily: fontFamilyBold }]}>
                {nearestTown || 'Not specified'}
              </Text>
            </View>
          </View>
        </View>

        {/* Nearby Hotels, Temples & Transport (Module 5) */}
        <View style={styles.sectionCard}>
          <View style={styles.nearbyHeaderRow}>
            <Text style={[styles.sectionTitle, { fontFamily: fontFamilyBold, marginBottom: 0 }]}>
              📍 {t('places.title', 'Nearby Hotels & Temples')}
            </Text>
            <TouchableOpacity
              style={styles.exploreNearbyBadge}
              onPress={() =>
                router.push({
                  pathname: '/(app)/ghats/nearby',
                  params: { id: ghat.id, ghatName: name },
                })
              }
            >
              <Text style={[styles.exploreNearbyBadgeText, { fontFamily: fontFamilyBold }]}>
                {t('places.view_all', 'Explore All →')}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.bodyText, { fontFamily, marginTop: 8, marginBottom: 12 }]}>
            {t(
              'places.subtitle',
              'Curated stays, holy shrines, and transit hubs around this ghat with travel estimates.'
            )}
          </Text>

          <View style={styles.nearbyQuickLinks}>
            <TouchableOpacity
              style={styles.nearbyQuickBtn}
              onPress={() =>
                router.push({
                  pathname: '/(app)/ghats/nearby',
                  params: { id: ghat.id, ghatName: name },
                })
              }
            >
              <Text style={styles.quickBtnIcon}>🛕</Text>
              <Text style={[styles.quickBtnText, { fontFamily: fontFamilyBold }]}>
                {t('places.categories.temple', 'Temples')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.nearbyQuickBtn}
              onPress={() =>
                router.push({
                  pathname: '/(app)/ghats/nearby',
                  params: { id: ghat.id, ghatName: name },
                })
              }
            >
              <Text style={styles.quickBtnIcon}>🏨</Text>
              <Text style={[styles.quickBtnText, { fontFamily: fontFamilyBold }]}>
                {t('places.categories.hotel', 'Hotels & Stays')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.nearbyQuickBtn}
              onPress={() =>
                router.push({
                  pathname: '/(app)/ghats/nearby',
                  params: { id: ghat.id, ghatName: name },
                })
              }
            >
              <Text style={styles.quickBtnIcon}>🚌</Text>
              <Text style={[styles.quickBtnText, { fontFamily: fontFamilyBold }]}>
                {t('places.categories.transport_hub', 'Transit Hubs')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Crowd Report Modal with GPS Proximity Check */}
      <CrowdReportModal
        visible={isReportModalVisible}
        ghatId={ghat.id}
        ghatName={name}
        onClose={() => setIsReportModalVisible(false)}
        onSuccess={() => {
          // Refresh crowd status
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
    backgroundColor: '#F8FAFC',
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  navBackBtn: {
    padding: 6,
  },
  navBackIcon: {
    fontSize: 22,
    color: '#0F52BA',
    fontWeight: '700',
  },
  navTitle: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '800',
    marginHorizontal: 10,
  },
  navActionBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  navActionText: {
    fontSize: 13,
    color: '#0F52BA',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  riverTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  riverTagText: {
    color: '#0369A1',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 10,
  },
  bathingStatusWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  badgeLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  section: {
    marginVertical: 4,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  bodyText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  connectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  connectIcon: {
    fontSize: 22,
  },
  connectContent: {
    flex: 1,
  },
  connectLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  connectValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
    marginTop: 1,
  },
  nearbyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exploreNearbyBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  exploreNearbyBadgeText: {
    fontSize: 12,
    color: '#1D4ED8',
    fontWeight: 'bold',
  },
  nearbyQuickLinks: {
    flexDirection: 'row',
    gap: 8,
  },
  nearbyQuickBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickBtnIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  quickBtnText: {
    fontSize: 11,
    color: '#1E293B',
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#0F172A',
    fontWeight: '700',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#0F52BA',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

