import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { Ghat, GhatFilters, CrowdLevel, BathingStatus } from '../types/ghats';
import { GhatService } from '../services/ghatService';
import { getLocalizedText } from '../utils/localized';
import { BathingStatusBadge } from '../components/BathingStatusBadge';
import { CrowdStatusBadge } from '../components/CrowdStatusBadge';
import { OfficialTrustBadge } from '../components/OfficialTrustBadge';
import { ConditionDisclaimerBanner } from '../components/ConditionDisclaimerBanner';

export const GhatListScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ near?: string; district?: string; search?: string }>();
  const { t } = useTranslation();
  const { language, fontFamily, fontFamilyBold } = useLanguage();

  const [ghats, setGhats] = useState<Ghat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Filters state
  const [search, setSearch] = useState(params.search || '');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(params.district || 'all');
  const [selectedBathing, setSelectedBathing] = useState<BathingStatus | 'all'>('all');
  const [selectedCrowd, setSelectedCrowd] = useState<CrowdLevel | 'all'>('all');

  useEffect(() => {
    if (params.district) setSelectedDistrict(params.district);
    if (params.search) setSearch(params.search);
  }, [params.district, params.search]);

  const districts = [
    { id: 'all', label: t('ghats.all_districts', 'All Districts') },
    { id: 'East Godavari', label: 'East Godavari' },
    { id: 'West Godavari', label: 'West Godavari' },
    { id: 'Dr. B.R. Ambedkar Konaseema', label: 'Konaseema' },
    { id: 'Bhadradri Kothagudem', label: 'Bhadradri Kothagudem' },
    { id: 'Jagtial', label: 'Jagtial' },
    { id: 'Nirmal', label: 'Nirmal' },
    { id: 'Jayashankar Bhupalpally', label: 'Jayashankar' },
  ];

  const loadGhats = useCallback(async () => {
    try {
      const filters: GhatFilters = {};
      if (selectedDistrict !== 'all') filters.district = selectedDistrict;
      if (selectedBathing !== 'all') filters.bathingStatus = selectedBathing;
      if (selectedCrowd !== 'all') filters.crowdLevel = selectedCrowd;
      if (search.trim()) filters.search = search.trim();
      if (params.near) filters.near = params.near;

      const res = await GhatService.getGhats(filters);
      setGhats(res.ghats);
      setIsOffline(res.isOffline);
    } catch (err) {
      console.warn('Failed to load ghats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDistrict, selectedBathing, selectedCrowd, search, params.near]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadGhats();
  }, [loadGhats]);

  const onRefresh = () => {
    setRefreshing(true);
    loadGhats();
  };

  const renderGhatCard = ({ item }: { item: Ghat }) => {
    const name = getLocalizedText(item.name, language);
    const town = getLocalizedText(item.nearest_town, language);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(app)/ghats/${item.id}` as any)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${item.district}`}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleArea}>
            <Text style={[styles.ghatName, { fontFamily: fontFamilyBold }]}>{name}</Text>
            <Text style={[styles.ghatLocation, { fontFamily }]}>
              📍 {town ? `${town}, ` : ''}{item.district} ({item.state})
            </Text>
          </View>
          {item.distance_km !== undefined && (
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>{item.distance_km} km</Text>
            </View>
          )}
        </View>

        <OfficialTrustBadge
          recordStatus={item.record_status}
          officialSourceUrl={item.official_source_url}
          verifiedAt={item.verified_at}
          showSourceButton={false}
        />

        <View style={styles.statusRow}>
          <BathingStatusBadge status={item.bathing_status} size="small" />
          <CrowdStatusBadge level={item.crowd_level} size="small" />
        </View>

        {item.active_notices && item.active_notices.length > 0 && (
          <View style={styles.noticeNotice}>
            <Text style={styles.noticeNoticeText}>
              ⚠️ {item.active_notices.length} active safety advisory
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.screenTitle, { fontFamily: fontFamilyBold }]}>
            {t('ghats.title', 'Pushkaralu Ghats')}
          </Text>
          <TouchableOpacity
            style={styles.mapToggleBtn}
            onPress={() => router.push('/(app)/ghats/map' as any)}
            accessibilityRole="button"
          >
            <Text style={styles.mapToggleText}>🗺️ {t('ghats.view_map', 'Map')}</Text>
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { fontFamily }]}
            placeholder={t('ghats.search_placeholder', 'Search ghat, town, or district...')}
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Horizontal District Filter Pills */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={districts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.filterPillsContainer}
          renderItem={({ item }) => {
            const isSelected = selectedDistrict === item.id;
            return (
              <TouchableOpacity
                style={[styles.pill, isSelected && styles.pillSelected]}
                onPress={() => setSelectedDistrict(item.id)}
              >
                <Text
                  style={[
                    styles.pillText,
                    isSelected && styles.pillTextSelected,
                    { fontFamily: isSelected ? fontFamilyBold : fontFamily },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Offline Alert Strip if on cached data */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={[styles.offlineText, { fontFamily }]}>
            📡 Offline Mode: Displaying saved ghat directory. Live crowd status requires network.
          </Text>
        </View>
      )}

      {/* Main List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0F52BA" />
          <Text style={[styles.loadingText, { fontFamily }]}>{t('common.loading')}</Text>
        </View>
      ) : (
        <FlatList
          data={ghats}
          keyExtractor={(item) => item.id}
          renderItem={renderGhatCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0F52BA']} />
          }
          ListHeaderComponent={<ConditionDisclaimerBanner compact />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🌊</Text>
              <Text style={[styles.emptyTitle, { fontFamily: fontFamilyBold }]}>
                No Ghats Found
              </Text>
              <Text style={[styles.emptySubtitle, { fontFamily }]}>
                Try adjusting your search criteria or district filter.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: {
    padding: 6,
  },
  backIcon: {
    fontSize: 22,
    color: '#0F52BA',
    fontWeight: '700',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  mapToggleBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  mapToggleText: {
    fontSize: 13,
    color: '#1D4ED8',
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 10,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  clearBtn: {
    padding: 4,
  },
  clearText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  filterPillsContainer: {
    gap: 8,
    paddingVertical: 4,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillSelected: {
    backgroundColor: '#0F52BA',
    borderColor: '#0F52BA',
  },
  pillText: {
    fontSize: 13,
    color: '#475569',
  },
  pillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  offlineBanner: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  offlineText: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  titleArea: {
    flex: 1,
  },
  ghatName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  ghatLocation: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  distanceBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  distanceText: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  noticeNotice: {
    marginTop: 8,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  noticeNoticeText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#0F172A',
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
});

