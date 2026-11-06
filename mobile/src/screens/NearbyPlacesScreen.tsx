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
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { NearbyPlace, QueryPlaceType } from '../types/places';
import { PlacesService } from '../services/placesService';
import { getLocalizedText } from '../utils/localized';

export const NearbyPlacesScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; ghatName?: string }>();
  const ghatId = params.id;
  const passedGhatName = params.ghatName;

  const { t } = useTranslation();
  const { language, fontFamily, fontFamilyBold } = useLanguage();

  const [category, setCategory] = useState<QueryPlaceType>('all');
  const [radiusKm, setRadiusKm] = useState<number>(3);
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [ghatTitle, setGhatTitle] = useState<string>(passedGhatName || 'Ghat');

  const loadPlaces = useCallback(async () => {
    if (!ghatId) return;
    setLoading(true);
    try {
      const res = await PlacesService.getNearbyPlaces(ghatId, category, radiusKm);
      setPlaces(res.data.places || []);
      setIsOffline(res.isOffline);
      if (res.data.ghat_name) {
        setGhatTitle(getLocalizedText(res.data.ghat_name, language));
      }
    } catch (err) {
      console.warn('[NearbyPlacesScreen] Error loading places:', err);
    } finally {
      setLoading(false);
    }
  }, [ghatId, category, radiusKm, language]);

  useEffect(() => {
    loadPlaces();
  }, [loadPlaces]);

  const handleCall = (phone?: string) => {
    if (!phone) {
      Alert.alert(t('common.info', 'Info'), t('places.details.no_phone', 'Phone contact not available.'));
      return;
    }
    const cleanNumber = phone.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${cleanNumber}`).catch(() => {
      Alert.alert(t('common.error', 'Error'), t('places.details.call_failed', 'Unable to initiate phone call.'));
    });
  };

  const handleOpenMapPin = (place: NearbyPlace) => {
    const label = encodeURIComponent(getLocalizedText(place.name, language));
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${place.lat},${place.lng}`,
      android: `geo:0,0?q=${place.lat},${place.lng}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`,
    });
    Linking.openURL(url as string).catch(() => {});
  };

  const handleDirections = (place: NearbyPlace) => {
    if (place.google_maps_url) {
      Linking.openURL(place.google_maps_url).catch(() => {});
    } else {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`).catch(() => {});
    }
  };

  const categories: Array<{ id: QueryPlaceType; label: string }> = [
    { id: 'all', label: t('places.categories.all', '🌟 All') },
    { id: 'temple', label: t('places.categories.temple', '🛕 Temples') },
    { id: 'hotel', label: t('places.categories.hotel', '🏨 Hotels & Stays') },
    { id: 'transport_hub', label: t('places.categories.transport_hub', '🚌 Transport Hubs') },
  ];

  const radii = [1, 3, 5, 10];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { fontFamily: fontFamilyBold }]} numberOfLines={1}>
            {t('places.title', 'Nearby Places')}
          </Text>
          <Text style={[styles.headerSubtitle, { fontFamily }]} numberOfLines={1}>
            {ghatTitle}
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={loadPlaces}>
          <Text style={styles.refreshIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Offline Alert Strip if needed */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>
            📶 {t('common.offline_notice', 'Showing offline saved data. Tap refresh when online.')}
          </Text>
        </View>
      )}

      {/* Pushkaralu Traffic / Condition Notice Banner */}
      <View style={styles.noticeCard}>
        <Text style={styles.noticeIcon}>⚠️</Text>
        <Text style={[styles.noticeText, { fontFamily }]}>
          {t(
            'places.disclaimer_notice',
            'Notice: During Godavari Pushkaralu, temple queues, road diversions, ghat security cordons, and parking regulations may affect real-time accessibility and timings. Conditions can change suddenly.'
          )}
        </Text>
      </View>

      {/* Category Chips Bar */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {categories.map((cat) => {
            const isSelected = category === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => setCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    isSelected ? [styles.chipTextActive, { fontFamily: fontFamilyBold }] : { fontFamily },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Radius Selector Pills */}
        <View style={styles.radiusRow}>
          <Text style={[styles.radiusLabel, { fontFamily }]}>
            {t('common.radius', 'Distance Radius:')}
          </Text>
          <View style={styles.radiusPills}>
            {radii.map((r) => {
              const isSelected = radiusKm === r;
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.radiusPill, isSelected && styles.radiusPillActive]}
                  onPress={() => setRadiusKm(r)}
                >
                  <Text
                    style={[
                      styles.radiusPillText,
                      isSelected ? [styles.radiusPillTextActive, { fontFamily: fontFamilyBold }] : { fontFamily },
                    ]}
                  >
                    {r} km
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Main Places List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0F52BA" />
          <Text style={[styles.loadingText, { fontFamily }]}>
            {t('common.loading', 'Loading places around ghat...')}
          </Text>
        </View>
      ) : places.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📍</Text>
          <Text style={[styles.emptyTitle, { fontFamily: fontFamilyBold }]}>
            {t('places.empty.title', 'No Places Found Nearby')}
          </Text>
          <Text style={[styles.emptySubtitle, { fontFamily }]}>
            {t(
              'places.empty.desc',
              'No places found within {{radius}} km. Try selecting a wider search radius.',
              { radius: radiusKm }
            )}
          </Text>
          <TouchableOpacity style={styles.wideRadiusBtn} onPress={() => setRadiusKm(10)}>
            <Text style={[styles.wideRadiusBtnText, { fontFamily: fontFamilyBold }]}>
              {t('places.radii.r10', 'Expand to 10 km')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          <Text style={[styles.resultsHeader, { fontFamily }]}>
            {t('places.actions.view_all', 'Found {{count}} places nearby', { count: places.length })}
          </Text>

          {places.map((place) => {
            const placeName = getLocalizedText(place.name, language);
            const address = place.address ? getLocalizedText(place.address, language) : null;
            const customNotes = place.custom_notes ? getLocalizedText(place.custom_notes, language) : null;
            const deity = place.deity ? getLocalizedText(place.deity, language) : null;
            const darshan = place.darshan_timings ? getLocalizedText(place.darshan_timings, language) : null;
            const specialEntry = place.special_entry_info ? getLocalizedText(place.special_entry_info, language) : null;
            const operatingHours = place.operating_hours ? getLocalizedText(place.operating_hours, language) : null;
            const isCurated = place.source_type === 'curated';

            return (
              <View key={place.id} style={styles.card}>
                {/* Header row: Source Badge & Distance */}
                <View style={styles.cardHeader}>
                  <View style={[styles.badge, isCurated ? styles.badgeCurated : styles.badgeThirdParty]}>
                    <Text style={styles.badgeText}>
                      {isCurated
                        ? t('places.badges.curated', '🛡️ Curated Official')
                        : t('places.badges.third_party', '🌐 Places Directory')}
                    </Text>
                  </View>

                  <View style={styles.distanceBadge}>
                    <Text style={styles.distanceText}>
                      📍 {place.distance_km} km
                    </Text>
                  </View>
                </View>

                {/* Place Title & Rating */}
                <View style={styles.titleRow}>
                  <Text style={[styles.placeTitle, { fontFamily: fontFamilyBold }]}>
                    {placeName}
                  </Text>
                  {place.rating ? (
                    <View style={styles.ratingBox}>
                      <Text style={styles.ratingText}>⭐ {place.rating}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Estimated Travel Time Tag */}
                <View style={styles.timeTag}>
                  <Text style={styles.timeTagIcon}>⏱️</Text>
                  <Text style={[styles.timeTagText, { fontFamily }]}>
                    {place.estimated_time_text}
                  </Text>
                </View>

                {/* Address */}
                {address ? (
                  <Text style={[styles.addressText, { fontFamily }]}>
                    🏢 {address}
                  </Text>
                ) : null}

                {/* Temple Specific Details */}
                {place.type === 'temple' && (
                  <View style={styles.extraSection}>
                    {deity ? (
                      <Text style={[styles.extraItem, { fontFamily }]}>
                        <Text style={styles.extraLabel}>{t('places.details.deity', 'Main Deity')}: </Text>
                        {deity}
                      </Text>
                    ) : null}
                    {darshan ? (
                      <Text style={[styles.extraItem, { fontFamily }]}>
                        <Text style={styles.extraLabel}>{t('places.details.darshan', 'Darshan Timings')}: </Text>
                        {darshan}
                      </Text>
                    ) : null}
                    {specialEntry ? (
                      <Text style={[styles.extraItemHighlight, { fontFamily }]}>
                        <Text style={styles.extraLabel}>{t('places.details.special_entry', 'Pushkaralu Queue')}: </Text>
                        {specialEntry}
                      </Text>
                    ) : null}
                  </View>
                )}

                {/* Hotel Specific Details */}
                {place.type === 'hotel' && (
                  <View style={styles.extraSection}>
                    {place.price_range ? (
                      <Text style={[styles.extraItem, { fontFamily }]}>
                        <Text style={styles.extraLabel}>{t('places.details.price_range', 'Category')}: </Text>
                        {t(`places.details.price_${place.price_range}`, place.price_range)}
                      </Text>
                    ) : null}
                    {place.room_types && place.room_types.length > 0 ? (
                      <Text style={[styles.extraItem, { fontFamily }]}>
                        <Text style={styles.extraLabel}>{t('places.details.room_types', 'Rooms')}: </Text>
                        {place.room_types.join(' • ')}
                      </Text>
                    ) : null}
                  </View>
                )}

                {/* Transport Hub Specific Details */}
                {place.type === 'transport_hub' && operatingHours && (
                  <View style={styles.extraSection}>
                    <Text style={[styles.extraItem, { fontFamily }]}>
                      <Text style={styles.extraLabel}>{t('places.details.operating_hours', 'Operating Hours')}: </Text>
                      {operatingHours}
                    </Text>
                  </View>
                )}

                {/* Special Admin / Festival Override Notes */}
                {customNotes ? (
                  <View style={styles.customNotesBox}>
                    <Text style={styles.customNotesIcon}>ℹ️</Text>
                    <Text style={[styles.customNotesText, { fontFamily }]}>
                      {customNotes}
                    </Text>
                  </View>
                ) : null}

                {/* Action Buttons Row: Call, Map Pin, Directions */}
                <View style={styles.actionRow}>
                  {place.phone ? (
                    <TouchableOpacity style={styles.callBtn} onPress={() => handleCall(place.phone)}>
                      <Text style={styles.btnIcon}>📞</Text>
                      <Text style={[styles.callBtnText, { fontFamily: fontFamilyBold }]}>
                        {t('places.actions.call', 'Call')}
                      </Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity style={styles.mapPinBtn} onPress={() => handleOpenMapPin(place)}>
                    <Text style={styles.btnIcon}>📍</Text>
                    <Text style={[styles.mapPinBtnText, { fontFamily }]}>
                      {t('places.actions.map', 'Pin')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.directionsBtn} onPress={() => handleDirections(place)}>
                    <Text style={styles.btnIconWhite}>🧭</Text>
                    <Text style={[styles.directionsBtnText, { fontFamily: fontFamilyBold }]}>
                      {t('places.actions.directions', 'Directions')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#0F52BA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    padding: 6,
    marginRight: 10,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#DCE7F9',
    fontSize: 13,
  },
  refreshButton: {
    padding: 8,
  },
  refreshIcon: {
    fontSize: 18,
  },
  offlineBanner: {
    backgroundColor: '#FFFBEB',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  offlineBannerText: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '600',
    textAlign: 'center',
  },
  noticeCard: {
    backgroundColor: '#FEF3C7',
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 6,
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#D97706',
  },
  noticeIcon: {
    fontSize: 18,
    marginRight: 8,
    marginTop: 1,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#78350F',
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  chipsScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#0F52BA',
    borderColor: '#0F52BA',
  },
  chipText: {
    fontSize: 13,
    color: '#4B5563',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginTop: 10,
  },
  radiusLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  radiusPills: {
    flexDirection: 'row',
    gap: 6,
  },
  radiusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  radiusPillActive: {
    backgroundColor: '#E0E7FF',
    borderColor: '#4338CA',
  },
  radiusPillText: {
    fontSize: 11,
    color: '#4B5563',
  },
  radiusPillTextActive: {
    color: '#312E81',
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    color: '#4B5563',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  wideRadiusBtn: {
    backgroundColor: '#0F52BA',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  wideRadiusBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 14,
    paddingBottom: 40,
  },
  resultsHeader: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 10,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeCurated: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  badgeThirdParty: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
  },
  distanceBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1D4ED8',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  placeTitle: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontWeight: 'bold',
    marginRight: 8,
  },
  ratingBox: {
    backgroundColor: '#FEF08A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#713F12',
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  timeTagIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  timeTagText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  addressText: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 8,
    lineHeight: 16,
  },
  extraSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    gap: 4,
  },
  extraItem: {
    fontSize: 12,
    color: '#374151',
  },
  extraItemHighlight: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
  extraLabel: {
    fontWeight: 'bold',
    color: '#1F2937',
  },
  customNotesBox: {
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  customNotesIcon: {
    fontSize: 13,
    marginRight: 6,
    marginTop: 1,
  },
  customNotesText: {
    flex: 1,
    fontSize: 11,
    color: '#1E40AF',
    lineHeight: 15,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  btnIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  btnIconWhite: {
    fontSize: 13,
    marginRight: 4,
    color: '#FFFFFF',
  },
  callBtnText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: 'bold',
  },
  mapPinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  mapPinBtnText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  directionsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F52BA',
    paddingVertical: 8,
    borderRadius: 8,
  },
  directionsBtnText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
