import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { NearbyPlace, QueryPlaceType } from '../types/places';
import { Ghat } from '../types/ghats';
import { PlacesService } from '../services/placesService';
import { GhatService } from '../services/ghatService';
import { acquireUserLocation } from '../utils/location';
import { getLocalizedText } from '../utils/localized';
import { colors, radii, spacing, touchTargets, typography, shadows } from '../theme/tokens';
import {
  Card,
  Button,
  Chip,
  Badge,
  EmptyState,
  ErrorState,
  OfflineBanner,
  Banner,
  ScreenContainer,
} from '../components';
import { WebLeafletMap, MapMarkerItem } from '../components/WebLeafletMap';

// Conditionally import react-native-maps for native rendering
let MapView: any = null;
let Marker: any = null;

try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
} catch (_err) {
  // Not available in web / SSR
}

export const NearbyPlacesScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; ghatName?: string }>();
  const { t } = useTranslation();
  const { language, fontFamily, fontFamilyBold } = useLanguage();

  const [availableGhats, setAvailableGhats] = useState<Ghat[]>([]);
  const [selectedGhatId, setSelectedGhatId] = useState<string>(params.id || '');
  const [selectedGhat, setSelectedGhat] = useState<Ghat | null>(null);
  const [category, setCategory] = useState<QueryPlaceType>('all');
  const [radiusKm, setRadiusKm] = useState<number>(3);
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [showGhatPicker, setShowGhatPicker] = useState<boolean>(false);

  // 1. Load ghats list to support selection or default
  useEffect(() => {
    let isMounted = true;
    GhatService.getGhats({ limit: 100 } as any)
      .then(({ ghats }) => {
        if (!isMounted) return;
        setAvailableGhats(ghats);

        if (params.id) {
          const match = ghats.find((g) => g.id === params.id);
          if (match) setSelectedGhat(match);
        } else if (ghats.length > 0 && !selectedGhatId) {
          // If no ghat passed, auto-pick nearest or first ghat
          acquireUserLocation().then((loc) => {
            if (!isMounted) return;
            if (loc && loc.coords) {
              const uLat = loc.coords.latitude;
              const uLng = loc.coords.longitude;
              const sorted = [...ghats].sort((a, b) => {
                const distA = Math.hypot(a.lat - uLat, a.lng - uLng);
                const distB = Math.hypot(b.lat - uLat, b.lng - uLng);
                return distA - distB;
              });
              setSelectedGhatId(sorted[0].id);
              setSelectedGhat(sorted[0]);
            } else {
              setSelectedGhatId(ghats[0].id);
              setSelectedGhat(ghats[0]);
            }
          });
        }
      })
      .catch((err) => console.warn('[NearbyPlacesScreen] Ghat list load error:', err));

    return () => {
      isMounted = false;
    };
  }, [params.id]);

  // 2. Load places for current selected ghat
  const loadPlaces = useCallback(async () => {
    if (!selectedGhatId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await PlacesService.getNearbyPlaces(selectedGhatId, category, radiusKm);
      setPlaces(res.data.places || []);
      setIsOffline(res.isOffline);

      if (!selectedGhat && res.data.center) {
        const match = availableGhats.find((g) => g.id === selectedGhatId);
        if (match) {
          setSelectedGhat(match);
        }
      }
    } catch (err: any) {
      console.warn('[NearbyPlacesScreen] Error loading places:', err);
      setError(t('places.error_load', 'Unable to load nearby places. Please check your connection.'));
    } finally {
      setLoading(false);
    }
  }, [selectedGhatId, category, radiusKm, availableGhats, selectedGhat, t]);

  useEffect(() => {
    if (selectedGhatId) {
      loadPlaces();
    }
  }, [selectedGhatId, category, radiusKm, loadPlaces]);

  // Change ghat handler
  const handleSelectGhat = (ghat: Ghat) => {
    setSelectedGhatId(ghat.id);
    setSelectedGhat(ghat);
    setShowGhatPicker(false);
  };

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

  const handleExternalMaps = (place: NearbyPlace) => {
    if (place.google_maps_url) {
      Linking.openURL(place.google_maps_url).catch(() => {});
    } else {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`).catch(() => {});
    }
  };

  const handleInAppDirections = (place: NearbyPlace) => {
    const placeName = getLocalizedText(place.name, language);
    router.push({
      pathname: '/(app)/routes',
      params: {
        mode: 'directions',
        ghatId: place.id,
        ghatName: encodeURIComponent(placeName),
        lat: String(place.lat),
        lng: String(place.lng),
      },
    } as any);
  };

  const categories: Array<{ id: QueryPlaceType; label: string }> = [
    { id: 'all', label: t('places.categories.all', '🌟 All') },
    { id: 'temple', label: t('places.categories.temple', '🛕 Temples') },
    { id: 'hotel', label: t('places.categories.hotel', '🏨 Stays & Hotels') },
    { id: 'transport_hub', label: t('places.categories.transport_hub', '🚌 Transport & Parking') },
  ];

  const radii = [1, 3, 5, 10];

  const ghatTitle = selectedGhat
    ? getLocalizedText(selectedGhat.name, language)
    : params.ghatName || t('places.select_ghat', 'Select a Ghat');

  // Map markers
  const mapMarkers: MapMarkerItem[] = useMemo(() => {
    const items: MapMarkerItem[] = [];

    if (selectedGhat) {
      items.push({
        id: `ghat-${selectedGhat.id}`,
        lat: selectedGhat.lat,
        lng: selectedGhat.lng,
        title: `📍 ${getLocalizedText(selectedGhat.name, language)}`,
        subtitle: t('ghats.detail.title', 'Pushkaralu Ghat (Center)'),
        color: colors.primary[600],
      });
    }

    places.forEach((p) => {
      const pName = getLocalizedText(p.name, language);
      let color = colors.primary[500];
      let icon = '📍';
      if (p.type === 'temple') {
        color = '#B45309'; // Amber-700
        icon = '🛕';
      } else if (p.type === 'hotel') {
        color = '#0284C7'; // Sky-600
        icon = '🏨';
      } else if (p.type === 'transport_hub') {
        color = '#059669'; // Emerald-600
        icon = '🚌';
      }

      items.push({
        id: p.id,
        lat: p.lat,
        lng: p.lng,
        title: `${icon} ${pName}`,
        subtitle: `${p.distance_km} km • ${p.estimated_time_text || ''}`,
        color,
      });
    });

    return items;
  }, [selectedGhat, places, language, t]);

  const mapCenter = useMemo(() => {
    if (selectedGhat) {
      return { lat: selectedGhat.lat, lng: selectedGhat.lng };
    }
    if (places.length > 0) {
      return { lat: places[0].lat, lng: places[0].lng };
    }
    return { lat: 17.0005, lng: 81.7808 }; // Rajahmundry Default
  }, [selectedGhat, places]);

  const selectedPlace = useMemo(() => {
    return places.find((p) => p.id === selectedPlaceId) || null;
  }, [places, selectedPlaceId]);

  return (
    <ScreenContainer scrollable={false}>
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityLabel={t('common.back', 'Back')}
          accessibilityRole="button"
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { fontFamily: fontFamilyBold }]} numberOfLines={1}>
            {t('places.title', 'Nearby Places')}
          </Text>
          <TouchableOpacity
            onPress={() => setShowGhatPicker(true)}
            style={styles.ghatSelectorChip}
            accessibilityRole="button"
            accessibilityLabel={ghatTitle}
          >
            <Text style={[styles.ghatSelectorText, { fontFamily: fontFamilyBold }]} numberOfLines={1}>
              📍 {ghatTitle} ▾
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.viewModeToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            onPress={() => setViewMode('list')}
            accessibilityRole="button"
            accessibilityLabel="List view"
          >
            <Text
              style={[
                styles.toggleBtnText,
                viewMode === 'list' && styles.toggleBtnTextActive,
                { fontFamily: fontFamilyBold },
              ]}
            >
              📋
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
            onPress={() => setViewMode('map')}
            accessibilityRole="button"
            accessibilityLabel="Map view"
          >
            <Text
              style={[
                styles.toggleBtnText,
                viewMode === 'map' && styles.toggleBtnTextActive,
                { fontFamily: fontFamilyBold },
              ]}
            >
              🗺️
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {isOffline && <OfflineBanner />}

      {/* Ghat Picker Modal List when tapped */}
      {showGhatPicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { fontFamily: fontFamilyBold }]}>
                {t('places.select_ghat_title', 'Select Pushkaralu Ghat')}
              </Text>
              <TouchableOpacity onPress={() => setShowGhatPicker(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.ghatListScroll}>
              {availableGhats.map((g) => {
                const isCur = g.id === selectedGhatId;
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.ghatItem, isCur && styles.ghatItemActive]}
                    onPress={() => handleSelectGhat(g)}
                  >
                    <Text
                      style={[
                        styles.ghatItemText,
                        isCur && styles.ghatItemTextActive,
                        { fontFamily: isCur ? fontFamilyBold : fontFamily },
                      ]}
                    >
                      {getLocalizedText(g.name, language)}
                    </Text>
                    <Text style={[styles.ghatDistrictText, { fontFamily }]}>{g.district}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Filter and Radius Controls Header Bar */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map((cat) => {
            const isSelected = category === cat.id;
            return (
              <Chip
                key={cat.id}
                label={cat.label}
                selected={isSelected}
                onPress={() => setCategory(cat.id)}
              />
            );
          })}
        </ScrollView>

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
                  accessibilityRole="button"
                  accessibilityLabel={`${r} kilometers`}
                >
                  <Text
                    style={[
                      styles.radiusPillText,
                      isSelected && styles.radiusPillTextActive,
                      { fontFamily: isSelected ? fontFamilyBold : fontFamily },
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

      {/* Content Area */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={[styles.loadingText, { fontFamily }]}>
            {t('common.loading', 'Loading places around ghat...')}
          </Text>
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={loadPlaces} />
      ) : places.length === 0 ? (
        <EmptyState
          title={t('places.empty.title', 'No Places Found Nearby')}
          description={t(
            'places.empty.desc',
            'No places found within {{radius}} km. Try selecting a wider search radius.',
            { radius: radiusKm }
          )}
          actionTitle={t('places.radii.r10', 'Expand to 10 km')}
          onAction={() => setRadiusKm(10)}
        />
      ) : viewMode === 'list' ? (
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
              <Card key={place.id} style={styles.placeCard}>
                {/* Header row: Source Badge & Distance */}
                <View style={styles.cardHeader}>
                  <Badge
                    label={
                      isCurated
                        ? t('places.badges.curated', '🛡️ Curated Official')
                        : t('places.badges.third_party', '🌐 Directory')
                    }
                    variant={isCurated ? 'success' : 'neutral'}
                    size="sm"
                  />
                  <View style={styles.distanceBadge}>
                    <Text style={[styles.distanceText, { fontFamily: fontFamilyBold }]}>
                      📍 {place.distance_km} km
                    </Text>
                  </View>
                </View>

                {/* Title */}
                <Text style={[styles.placeTitle, { fontFamily: fontFamilyBold }]}>
                  {placeName}
                </Text>

                {/* Estimated Travel Time Tag */}
                {place.estimated_time_text ? (
                  <View style={styles.timeTag}>
                    <Text style={styles.timeTagIcon}>⏱️</Text>
                    <Text style={[styles.timeTagText, { fontFamily }]}>
                      {place.estimated_time_text}
                    </Text>
                  </View>
                ) : null}

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
                        <Text style={[styles.extraLabel, { fontFamily: fontFamilyBold }]}>
                          {t('places.details.deity', 'Main Deity')}:{' '}
                        </Text>
                        {deity}
                      </Text>
                    ) : null}
                    {darshan ? (
                      <Text style={[styles.extraItem, { fontFamily }]}>
                        <Text style={[styles.extraLabel, { fontFamily: fontFamilyBold }]}>
                          {t('places.details.darshan', 'Darshan Timings')}:{' '}
                        </Text>
                        {darshan}
                      </Text>
                    ) : null}
                    {specialEntry ? (
                      <Text style={[styles.extraItemHighlight, { fontFamily }]}>
                        <Text style={[styles.extraLabel, { fontFamily: fontFamilyBold }]}>
                          {t('places.details.special_entry', 'Pushkaralu Queue')}:{' '}
                        </Text>
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
                        <Text style={[styles.extraLabel, { fontFamily: fontFamilyBold }]}>
                          {t('places.details.price_range', 'Category')}:{' '}
                        </Text>
                        {t(`places.details.price_${place.price_range}`, place.price_range)}
                      </Text>
                    ) : null}
                    {place.room_types && place.room_types.length > 0 ? (
                      <Text style={[styles.extraItem, { fontFamily }]}>
                        <Text style={[styles.extraLabel, { fontFamily: fontFamilyBold }]}>
                          {t('places.details.room_types', 'Rooms')}:{' '}
                        </Text>
                        {place.room_types.join(' • ')}
                      </Text>
                    ) : null}
                  </View>
                )}

                {/* Transport Hub Specific Details */}
                {place.type === 'transport_hub' && operatingHours && (
                  <View style={styles.extraSection}>
                    <Text style={[styles.extraItem, { fontFamily }]}>
                      <Text style={[styles.extraLabel, { fontFamily: fontFamilyBold }]}>
                        {t('places.details.operating_hours', 'Operating Hours')}:{' '}
                      </Text>
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

                {/* Action Buttons Row: Call, In-App Directions, External Maps */}
                <View style={styles.actionRow}>
                  {place.phone ? (
                    <Button
                      title={t('places.actions.call', 'Call')}
                      onPress={() => handleCall(place.phone)}
                      variant="secondary"
                      size="sm"
                      style={styles.actionBtn}
                    />
                  ) : null}

                  <Button
                    title={t('places.actions.directions', 'Directions')}
                    onPress={() => handleInAppDirections(place)}
                    variant="primary"
                    size="sm"
                    style={styles.actionBtn}
                  />

                  <Button
                    title={t('places.actions.map', 'Google Maps')}
                    onPress={() => handleExternalMaps(place)}
                    variant="ghost"
                    size="sm"
                    style={styles.actionBtn}
                  />
                </View>
              </Card>
            );
          })}
        </ScrollView>
      ) : (
        /* Map View */
        <View style={styles.mapContainer}>
          {Platform.OS === 'web' || !MapView ? (
            <WebLeafletMap
              customMarkers={mapMarkers}
              center={mapCenter}
              zoom={13}
              onSelectGhat={(markerId: string) => {
                const found = places.find((p) => p.id === markerId);
                if (found) setSelectedPlaceId(found.id);
              }}
            />
          ) : (
            <MapView
              style={StyleSheet.absoluteFill}
              initialRegion={{
                latitude: mapCenter.lat,
                longitude: mapCenter.lng,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
            >
              {mapMarkers.map((marker) => (
                <Marker
                  key={marker.id}
                  coordinate={{ latitude: marker.lat, longitude: marker.lng }}
                  title={marker.title}
                  description={marker.subtitle}
                  pinColor={marker.color}
                  onPress={() => {
                    const found = places.find((p) => p.id === marker.id);
                    if (found) setSelectedPlaceId(found.id);
                  }}
                />
              ))}
            </MapView>
          )}

          {/* Selected Place Overlay Card on Map */}
          {selectedPlace && (
            <Card style={styles.mapSelectedCard}>
              <View style={styles.mapCardHeader}>
                <Text style={[styles.mapCardTitle, { fontFamily: fontFamilyBold }]} numberOfLines={1}>
                  {getLocalizedText(selectedPlace.name, language)}
                </Text>
                <TouchableOpacity onPress={() => setSelectedPlaceId(null)}>
                  <Text style={styles.mapCardClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.mapCardDistance, { fontFamily }]}>
                📍 {selectedPlace.distance_km} km • {selectedPlace.estimated_time_text}
              </Text>
              <View style={styles.mapCardActions}>
                {selectedPlace.phone && (
                  <Button
                    title={t('places.actions.call', 'Call')}
                    onPress={() => handleCall(selectedPlace.phone)}
                    variant="secondary"
                    size="sm"
                  />
                )}
                <Button
                  title={t('places.actions.directions', 'Directions')}
                  onPress={() => handleInAppDirections(selectedPlace)}
                  variant="primary"
                  size="sm"
                />
              </View>
            </Card>
          )}
        </View>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  backBtn: {
    padding: spacing[2],
    marginRight: spacing[2],
  },
  backBtnText: {
    fontSize: 22,
    color: colors.text.primary,
    fontWeight: 'bold',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.sizes.h3,
    color: colors.text.primary,
  },
  ghatSelectorChip: {
    alignSelf: 'flex-start',
    marginTop: 2,
    paddingVertical: 2,
    paddingHorizontal: spacing[2],
    backgroundColor: colors.primary[50],
    borderRadius: radii.sm,
  },
  ghatSelectorText: {
    fontSize: typography.sizes.caption,
    color: colors.primary[700],
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderRadius: radii.md,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.sm,
  },
  toggleBtnActive: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  toggleBtnText: {
    fontSize: 16,
    color: colors.text.muted,
  },
  toggleBtnTextActive: {
    color: colors.primary[600],
  },
  filterBar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    paddingVertical: spacing[2],
  },
  categoryScroll: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
    paddingBottom: spacing[2],
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
  },
  radiusLabel: {
    fontSize: typography.sizes.caption,
    color: colors.text.muted,
  },
  radiusPills: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  radiusPill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: colors.surface,
  },
  radiusPillActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  radiusPillText: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
  },
  radiusPillTextActive: {
    color: colors.text.inverse,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  loadingText: {
    marginTop: spacing[3],
    fontSize: typography.sizes.body,
    color: colors.text.muted,
  },
  listContent: {
    padding: spacing[4],
    gap: spacing[3],
  },
  resultsHeader: {
    fontSize: typography.sizes.bodySm,
    color: colors.text.muted,
    marginBottom: spacing[2],
  },
  placeCard: {
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  distanceBadge: {
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.sm,
  },
  distanceText: {
    fontSize: typography.sizes.caption,
    color: colors.neutral[700],
  },
  placeTitle: {
    fontSize: typography.sizes.h3,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  timeTagIcon: {
    fontSize: 14,
    marginRight: spacing[1],
  },
  timeTagText: {
    fontSize: typography.sizes.caption,
    color: colors.text.muted,
  },
  addressText: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
    marginBottom: spacing[2],
  },
  extraSection: {
    backgroundColor: colors.neutral[50],
    padding: spacing[3],
    borderRadius: radii.sm,
    marginBottom: spacing[2],
    gap: spacing[1],
  },
  extraItem: {
    fontSize: typography.sizes.caption,
    color: colors.text.primary,
  },
  extraItemHighlight: {
    fontSize: typography.sizes.caption,
    color: colors.primary[700],
  },
  extraLabel: {
    color: colors.text.secondary,
  },
  customNotesBox: {
    flexDirection: 'row',
    backgroundColor: colors.primary[50],
    padding: spacing[3],
    borderRadius: radii.sm,
    marginBottom: spacing[2],
    alignItems: 'center',
  },
  customNotesIcon: {
    fontSize: 16,
    marginRight: spacing[2],
  },
  customNotesText: {
    flex: 1,
    fontSize: typography.sizes.caption,
    color: colors.primary[800],
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  actionBtn: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapSelectedCard: {
    position: 'absolute',
    bottom: spacing[4],
    left: spacing[4],
    right: spacing[4],
    padding: spacing[4],
    ...shadows.lg,
  },
  mapCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  mapCardTitle: {
    fontSize: typography.sizes.body,
    color: colors.text.primary,
    flex: 1,
  },
  mapCardClose: {
    fontSize: 18,
    color: colors.text.muted,
    padding: spacing[1],
  },
  mapCardDistance: {
    fontSize: typography.sizes.caption,
    color: colors.text.muted,
    marginBottom: spacing[3],
  },
  mapCardActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
    justifyContent: 'center',
    padding: spacing[4],
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    maxHeight: '70%',
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  modalTitle: {
    fontSize: typography.sizes.h3,
    color: colors.text.primary,
  },
  modalCloseBtn: {
    padding: spacing[2],
  },
  modalCloseText: {
    fontSize: 20,
    color: colors.text.muted,
  },
  ghatListScroll: {
    padding: spacing[2],
  },
  ghatItem: {
    padding: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  ghatItemActive: {
    backgroundColor: colors.primary[50],
  },
  ghatItemText: {
    fontSize: typography.sizes.body,
    color: colors.text.primary,
  },
  ghatItemTextActive: {
    color: colors.primary[700],
  },
  ghatDistrictText: {
    fontSize: typography.sizes.caption,
    color: colors.text.muted,
    marginTop: 2,
  },
});
