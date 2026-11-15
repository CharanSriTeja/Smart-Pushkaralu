import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { Ghat, GhatFilters, CrowdLevel, BathingStatus } from '../types/ghats';
import { GhatService } from '../services/ghatService';
import { getLocalizedText, formatVerifiedDate } from '../utils/localized';
import { colors, radii, spacing, touchTargets, typography, shadows } from '../theme/tokens';
import {
  Card,
  Button,
  SearchField,
  Chip,
  BathingBadge,
  CrowdBadge,
  VerificationBadge,
  SkeletonList,
  EmptyState,
  ErrorState,
  OfflineBanner,
} from '../components';

export const GhatListScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ near?: string; district?: string; search?: string }>();
  const { t } = useTranslation();
  const { language, fontFamily, fontFamilyBold } = useLanguage();

  const [ghats, setGhats] = useState<Ghat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Filters state
  const [search, setSearch] = useState(params.search || '');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(params.district || 'all');
  const [selectedBathing, setSelectedBathing] = useState<BathingStatus | 'all'>('all');
  const [selectedCrowd, setSelectedCrowd] = useState<CrowdLevel | 'all'>('all');
  const [selectedFacility, setSelectedFacility] = useState<string>('all');

  const districts = [
    { id: 'all', label: t('ghats.all_districts', 'All Districts') },
    { id: 'East Godavari', label: 'East Godavari' },
    { id: 'West Godavari', label: 'West Godavari' },
    { id: 'Dr. B.R. Ambedkar Konaseema', label: 'Konaseema' },
    { id: 'Bhadradri Kothagudem', label: 'Bhadradri' },
    { id: 'Jagtial', label: 'Jagtial' },
    { id: 'Nirmal', label: 'Nirmal' },
    { id: 'Jayashankar Bhupalpally', label: 'Jayashankar' },
  ];

  const bathingOptions: { id: BathingStatus | 'all'; label: string }[] = [
    { id: 'all', label: 'All Bathing Status' },
    { id: 'allowed', label: 'Safe for Holy Bath' },
    { id: 'restricted', label: 'Restricted / Caution' },
    { id: 'closed', label: 'Strictly Closed' },
  ];

  const crowdOptions: { id: CrowdLevel | 'all'; label: string }[] = [
    { id: 'all', label: 'All Crowds' },
    { id: 'low', label: 'Low Crowd' },
    { id: 'medium', label: 'Moderate' },
    { id: 'high', label: 'High / Surge' },
  ];

  const facilityOptions = [
    { id: 'all', label: 'All Facilities' },
    { id: 'changing_rooms', label: 'Changing Rooms' },
    { id: 'drinking_water', label: 'Drinking Water' },
    { id: 'medical_aid', label: 'Medical Post' },
    { id: 'parking', label: 'Parking Space' },
  ];

  const loadGhats = useCallback(async () => {
    setError(null);
    try {
      const filters: GhatFilters = {};
      if (selectedDistrict !== 'all') filters.district = selectedDistrict;
      if (selectedBathing !== 'all') filters.bathingStatus = selectedBathing;
      if (selectedCrowd !== 'all') filters.crowdLevel = selectedCrowd;
      if (selectedFacility !== 'all') filters.facilities = selectedFacility;
      if (search.trim()) filters.search = search.trim();
      if (params.near) filters.near = params.near;

      const res = await GhatService.getGhats(filters);
      setGhats(res.ghats);
      setIsOffline(res.isOffline);
    } catch (err: any) {
      console.warn('Failed to load ghats:', err);
      setError(err.message || 'Could not connect to ghats registry');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDistrict, selectedBathing, selectedCrowd, selectedFacility, search, params.near]);

  useEffect(() => {
    loadGhats();
  }, [loadGhats]);

  const onRefresh = () => {
    setRefreshing(true);
    loadGhats();
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedDistrict('all');
    setSelectedBathing('all');
    setSelectedCrowd('all');
    setSelectedFacility('all');
  };

  const renderGhatCard = ({ item }: { item: Ghat }) => {
    const name = getLocalizedText(item.name, language);
    const town = getLocalizedText(item.nearest_town, language);
    const verifiedDate = item.verified_at ? formatVerifiedDate(item.verified_at, language) : null;

    return (
      <Card
        variant="elevated"
        onPress={() => router.push(`/(app)/ghats/${item.id}` as any)}
        accessibilityLabel={`${name}, ${item.district}`}
        style={styles.card}
      >
        {/* Title & Location Header */}
        <View style={styles.cardHeader}>
          <View style={styles.titleArea}>
            <Text
              maxFontSizeMultiplier={typography.maxScale}
              style={[styles.ghatName, { fontFamily: fontFamilyBold }]}
            >
              {name}
            </Text>
            <Text
              maxFontSizeMultiplier={typography.maxScale}
              style={[styles.ghatLocation, { fontFamily }]}
            >
              📍 {town ? `${town}, ` : ''}{item.district} ({item.state})
            </Text>
          </View>
          {item.distance_km !== undefined && (
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>
                {item.distance_km < 1
                  ? `${Math.round(item.distance_km * 1000)} m`
                  : `${item.distance_km.toFixed(1)} km`}
              </Text>
            </View>
          )}
        </View>

        {/* Verification & Source */}
        <View style={styles.verificationRow}>
          <VerificationBadge
            verified={item.record_status === 'officially_listed'}
            label={item.record_status === 'officially_listed' ? 'Official Registry' : 'Unverified'}
            size="sm"
          />
          {verifiedDate && (
            <Text
              maxFontSizeMultiplier={typography.maxScale}
              style={[styles.verifiedDateText, { fontFamily }]}
            >
              Updated: {verifiedDate}
            </Text>
          )}
        </View>

        {/* Status Badges: Bathing status & Crowd level */}
        <View style={styles.statusRow}>
          <BathingBadge status={item.bathing_status} size="sm" />
          <CrowdBadge crowd={item.crowd_level} size="sm" />
        </View>

        {/* Safety Advisories notice if present */}
        {item.active_notices && item.active_notices.length > 0 && (
          <View style={styles.noticeNotice}>
            <Text
              maxFontSizeMultiplier={typography.maxScale}
              style={[styles.noticeNoticeText, { fontFamily }]}
            >
              ⚠️ {item.active_notices.length} active safety advisory
            </Text>
          </View>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Sticky Search & Filter Header */}
      <View style={styles.stickyHeader}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backBtn}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text
            maxFontSizeMultiplier={typography.maxScale}
            style={[styles.screenTitle, { fontFamily: fontFamilyBold }]}
          >
            {t('ghats.title', 'Pushkaralu Ghats')}
          </Text>
          <TouchableOpacity
            style={styles.mapToggleBtn}
            onPress={() => router.push('/(app)/ghats/map' as any)}
            accessibilityRole="button"
            accessibilityLabel="Switch to map view"
          >
            <Text style={styles.mapToggleText}>🗺️ {t('ghats.view_map', 'Map')}</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchField
            value={search}
            onChangeText={setSearch}
            placeholder={t('ghats.search_placeholder', 'Search ghat, town, or district...')}
            onClear={() => setSearch('')}
          />
        </View>

        {/* Filter Chips Scroll (Districts, Bathing, Crowd) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {/* Districts */}
          {districts.map((d) => (
            <Chip
              key={d.id}
              label={d.label}
              selected={selectedDistrict === d.id}
              onPress={() => setSelectedDistrict(d.id)}
            />
          ))}

          {/* Bathing Status filter */}
          {bathingOptions.map((b) => (
            <Chip
              key={b.id}
              label={b.label}
              selected={selectedBathing === b.id}
              onPress={() => setSelectedBathing(b.id)}
            />
          ))}

          {/* Crowd filter */}
          {crowdOptions.map((c) => (
            <Chip
              key={c.id}
              label={c.label}
              selected={selectedCrowd === c.id}
              onPress={() => setSelectedCrowd(c.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Offline Alert Strip */}
      {isOffline && <OfflineBanner />}

      {/* Main Content Area */}
      {loading ? (
        <View style={styles.loadingPadding}>
          <SkeletonList count={4} />
        </View>
      ) : error ? (
        <ErrorState
          title="Could not load ghats"
          message={error}
          onRetry={loadGhats}
          retryTitle={t('common.retry', 'Retry')}
        />
      ) : (
        <FlatList
          data={ghats}
          keyExtractor={(item) => item.id}
          renderItem={renderGhatCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary700]}
              tintColor={colors.primary700}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="🌊"
              title={t('ghats.no_ghats_found', 'No Ghats Found')}
              description="No holy bathing ghats matched your search criteria or district filter."
              actionTitle="Clear All Filters"
              onAction={resetFilters}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stickyHeader: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    ...shadows.card,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  backBtn: {
    minWidth: touchTargets.minTouch,
    minHeight: touchTargets.minTouch,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 22,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  screenTitle: {
    fontSize: typography.sizes.h2,
    fontWeight: '800',
    color: colors.primary700,
  },
  mapToggleBtn: {
    minHeight: 38,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary50,
    borderWidth: 1,
    borderColor: colors.borderOrange,
    borderRadius: radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary700,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  filterScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  loadingPadding: {
    padding: spacing.md,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  card: {
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleArea: {
    flex: 1,
    marginRight: spacing.sm,
  },
  ghatName: {
    fontSize: typography.sizes.h3,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  ghatLocation: {
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  distanceBadge: {
    backgroundColor: colors.primary50,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderOrange,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary700,
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  verifiedDateText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  noticeNotice: {
    marginTop: spacing.xs,
    padding: spacing.xs,
    backgroundColor: colors.status.warningLight,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.status.warningBorder,
  },
  noticeNoticeText: {
    fontSize: 12,
    color: colors.status.warning,
    fontWeight: '600',
  },
});
