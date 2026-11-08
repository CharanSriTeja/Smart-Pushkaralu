import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
// Conditionally import react-native-maps to avoid SSR crash in Expo Router
// (codegenNativeComponent is not available in Node.js render environment)
let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
let UrlTile: any = null;

try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  Polyline = Maps.Polyline;
  UrlTile = Maps.UrlTile;
} catch (_err) {
  // react-native-maps not available in this environment (SSR / web)
}
import { acquireUserLocation } from '../utils/location';
import { GhatService } from '../services/ghatService';
import {
  fetchRouteOrigins,
  fetchGhatAccessPoints,
  fetchLiveRoute,
  fetchTemplesAlongRoute,
  recalculateRouteWithStops,
  fetchActiveClosures,
  ROUTE_ATTRIBUTION_TEXT,
  ROUTE_SAFETY_NOTICE,
} from '../services/routeService';
import {
  GhatAccessPoint,
  RouteClosure,
  RouteMode,
  RouteOrigin,
  RouteResult,
  DegradedRouteResult,
  RouteTemple,
} from '../types/routes';
import { decodePolylineCoordinates } from '../utils/polyline';
import { WebLeafletMap, MapMarkerItem } from '../components/WebLeafletMap';

interface RoutePlannerScreenProps {
  initialGhat?: {
    id: string;
    name: { en: string; te?: string; hi?: string } | string;
    lat: number;
    lng: number;
  };
  onBack?: () => void;
}

export const RoutePlannerScreen: React.FC<RoutePlannerScreenProps> = ({
  initialGhat,
  onBack,
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language || 'en').slice(0, 2) as 'en' | 'te' | 'hi';

  const [currentGhat, setCurrentGhat] = useState<any>(initialGhat || null);
  const [allGhats, setAllGhats] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllPicker, setShowAllPicker] = useState(false);

  const [origins, setOrigins] = useState<RouteOrigin[]>([]);
  const [selectedOrigin, setSelectedOrigin] = useState<RouteOrigin | null>(null);
  const [gpsOrigin, setGpsOrigin] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [usingGps, setUsingGps] = useState(false);

  const [accessPoints, setAccessPoints] = useState<GhatAccessPoint[]>([]);
  const [selectedAccessPoint, setSelectedAccessPoint] = useState<GhatAccessPoint | null>(null);

  const [mode, setMode] = useState<RouteMode>('car');
  const [loading, setLoading] = useState(false);
  const [routeResult, setRouteResult] = useState<RouteResult | DegradedRouteResult | null>(null);

  // Corridor Temples
  const [corridorTemples, setCorridorTemples] = useState<RouteTemple[]>([]);
  const [selectedWaypoints, setSelectedWaypoints] = useState<RouteTemple[]>([]);
  const [loadingTemples, setLoadingTemples] = useState(false);

  // Active Closures
  const [closures, setClosures] = useState<RouteClosure[]>([]);

  useEffect(() => {
    if (initialGhat) {
      setCurrentGhat(initialGhat);
    }
  }, [initialGhat]);

  // Load origins & closures on mount
  useEffect(() => {
    fetchRouteOrigins().then((data) => {
      setOrigins(data);
      if (data.length > 0 && !selectedOrigin) {
        setSelectedOrigin(data[0]);
      }
    });

    fetchActiveClosures().then(setClosures);

    GhatService.getGhats({ limit: 150 } as any)
      .then((res) => {
        if (res?.ghats?.length > 0) {
          setAllGhats(res.ghats);
          setCurrentGhat((prev: any) => prev || res.ghats[0]);
        }
      })
      .catch(() => {});
  }, []);

  // Load access points when ghat changes
  useEffect(() => {
    if (currentGhat?.id) {
      fetchGhatAccessPoints(currentGhat.id).then((points) => {
        setAccessPoints(points);
        const def = points.find((p) => p.is_default) || points[0];
        setSelectedAccessPoint(def || null);
      });
    } else {
      setAccessPoints([]);
      setSelectedAccessPoint(null);
    }
  }, [currentGhat?.id]);

  // Request GPS permission and acquire position
  const handleUseMyLocation = async () => {
    setLoading(true);
    try {
      const locResult = await acquireUserLocation();
      if (!locResult.granted || !locResult.coords) {
        Alert.alert(t('common.error'), t('routes.location_prompt'));
        return;
      }

      const myCoord = {
        lat: locResult.coords.latitude,
        lng: locResult.coords.longitude,
        name: t('routes.use_my_location'),
      };
      setGpsOrigin(myCoord);
      setUsingGps(true);
      setSelectedOrigin(null);
    } catch {
      Alert.alert(t('common.error'), 'Could not acquire current location.');
    } finally {
      setLoading(false);
    }
  };

  // Determine active start coordinates
  const activeOriginCoord = useMemo(() => {
    if (usingGps && gpsOrigin) {
      return { lat: gpsOrigin.lat, lng: gpsOrigin.lng };
    }
    if (selectedOrigin) {
      return { lat: selectedOrigin.lat, lng: selectedOrigin.lng };
    }
    return null;
  }, [usingGps, gpsOrigin, selectedOrigin]);

  // Determine active destination coordinates
  const activeDestCoord = useMemo(() => {
    if (selectedAccessPoint) {
      return { lat: selectedAccessPoint.lat, lng: selectedAccessPoint.lng };
    }
    if (currentGhat?.lat != null && currentGhat?.lng != null) {
      return { lat: Number(currentGhat.lat), lng: Number(currentGhat.lng) };
    }
    if (currentGhat?.latitude != null && currentGhat?.longitude != null) {
      return { lat: Number(currentGhat.latitude), lng: Number(currentGhat.longitude) };
    }
    return null;
  }, [selectedAccessPoint, currentGhat]);

  // Calculate or re-calculate primary route
  const handleCalculateRoute = useCallback(async () => {
    if (!activeOriginCoord || !activeDestCoord) return;

    setLoading(true);
    try {
      let result: RouteResult | DegradedRouteResult;

      if (selectedWaypoints.length > 0) {
        result = await recalculateRouteWithStops({
          origin: activeOriginCoord,
          destination: activeDestCoord,
          waypoints: selectedWaypoints.map((w) => ({ lat: w.lat, lng: w.lng })),
          mode,
          ghatId: currentGhat?.id,
        });
      } else {
        result = await fetchLiveRoute({
          origin: activeOriginCoord,
          destination: activeDestCoord,
          mode,
          ghatId: currentGhat?.id,
        });
      }

      setRouteResult(result);

      // If full route calculated, fetch corridor temples
      if ('encodedPolyline' in result && result.encodedPolyline) {
        setLoadingTemples(true);
        fetchTemplesAlongRoute(result.encodedPolyline, 3)
          .then(setCorridorTemples)
          .finally(() => setLoadingTemples(false));
      }
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || 'Routing failed.');
    } finally {
      setLoading(false);
    }
  }, [activeOriginCoord, activeDestCoord, selectedWaypoints, mode, currentGhat?.id, t]);

  // Recalculate when start/end/mode changes
  useEffect(() => {
    if (activeOriginCoord && activeDestCoord) {
      handleCalculateRoute();
    }
  }, [activeOriginCoord, activeDestCoord, mode]);

  // Toggle temple waypoint
  const handleToggleWaypoint = (temple: RouteTemple) => {
    const isSelected = selectedWaypoints.some((w) => w.id === temple.id);
    if (isSelected) {
      setSelectedWaypoints((prev) => prev.filter((w) => w.id !== temple.id));
    } else {
      if (selectedWaypoints.length >= 3) {
        Alert.alert(t('routes.title'), t('routes.max_stops_reached'));
        return;
      }
      setSelectedWaypoints((prev) => [...prev, temple]);
    }
  };

  // Decode polyline points for map
  const routeCoordinates = useMemo(() => {
    if (routeResult && 'encodedPolyline' in routeResult && routeResult.encodedPolyline) {
      return decodePolylineCoordinates(routeResult.encodedPolyline);
    }
    return [];
  }, [routeResult]);

  // Open Google Maps Universal Link
  const handleOpenGoogleMaps = () => {
    if (routeResult?.googleMapsLink) {
      Linking.openURL(routeResult.googleMapsLink).catch(() => {
        Alert.alert(t('common.error'), 'Could not launch Google Maps.');
      });
    }
  };

  const getLocalized = (val: any) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      return val[currentLang] || val.en || Object.values(val)[0] || '';
    }
    return String(val);
  };

  const filteredGhats = useMemo(() => {
    if (!Array.isArray(allGhats)) return [];
    if (!searchQuery.trim()) return allGhats.slice(0, 15);
    const q = searchQuery.toLowerCase().trim();
    return allGhats.filter((g: any) => {
      if (!g) return false;
      const name = getLocalized(g.name).toLowerCase();
      const dist = (g.district || '').toLowerCase();
      return name.includes(q) || dist.includes(q);
    });
  }, [allGhats, searchQuery, currentLang]);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
        )}
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>{t('routes.title')}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {getLocalized(currentGhat?.name) || t('routes.destination_label')}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner}>
        {/* Origin Selector */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>{t('routes.origin_label')}</Text>
          <TouchableOpacity
            style={[styles.gpsButton, usingGps && styles.gpsButtonActive]}
            onPress={handleUseMyLocation}
          >
            <Text style={[styles.gpsButtonText, usingGps && styles.gpsButtonTextActive]}>
              📍 {usingGps ? t('routes.use_my_location') : t('routes.use_my_location')}
            </Text>
          </TouchableOpacity>

          <Text style={styles.orDivider}>— {t('common.search')} {t('routes.select_origin')} —</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.originsScroll}>
            {origins.map((orig) => {
              const isSelected = !usingGps && selectedOrigin?.id === orig.id;
              return (
                <TouchableOpacity
                  key={orig.id}
                  style={[styles.originChip, isSelected && styles.originChipActive]}
                  onPress={() => {
                    setUsingGps(false);
                    setSelectedOrigin(orig);
                  }}
                >
                  <Text style={[styles.originChipText, isSelected && styles.originChipTextActive]}>
                    {getLocalized(orig.name)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Destination Ghat Selector Card */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>🎯 {t('routes.destination_label', 'Destination Ghat')}</Text>
            <TouchableOpacity
              onPress={() => setShowAllPicker(!showAllPicker)}
              style={styles.browseAllBtn}
            >
              <Text style={styles.browseAllBtnText}>
                {showAllPicker ? 'Hide Search' : '🔍 Search All Ghats'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Currently Selected Ghat Banner */}
          <View style={styles.selectedGhatBanner}>
            <Text style={styles.selectedGhatName}>
              🌊 {getLocalized(currentGhat?.name)}
            </Text>
            {currentGhat?.district && (
              <Text style={styles.selectedGhatDistrict}>
                {currentGhat.district} District
              </Text>
            )}
          </View>

          {/* Search box if opened */}
          {showAllPicker && (
            <View style={styles.searchBoxContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Type ghat name or district..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#90A4AE"
              />
              <ScrollView style={styles.searchResultsList} nestedScrollEnabled>
                {filteredGhats.slice(0, 15).map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    style={styles.searchResultItem}
                    onPress={() => {
                      setCurrentGhat(g);
                      setShowAllPicker(false);
                      setSearchQuery('');
                    }}
                  >
                    <Text style={styles.searchResultTitle}>{getLocalized(g.name)}</Text>
                    <Text style={styles.searchResultSub}>{g.district} • {g.river}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Official Ghat Destinations Chips */}
          <Text style={styles.popularGhatsLabel}>{t('routes.popular_ghats') || 'Pilgrimage Ghats:'}</Text>
          {allGhats.length === 0 ? (
            <Text style={{ fontSize: 13, color: '#64748B', paddingVertical: 8, paddingHorizontal: 4 }}>
              {t('routes.no_ghats_found') || 'Loading ghats from official registry...'}
            </Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.originsScroll}>
              {allGhats.slice(0, 10).map((g) => {
                const isSelected = currentGhat?.id === g.id;
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.originChip, isSelected && styles.destChipActive]}
                    onPress={() => setCurrentGhat(g)}
                  >
                    <Text style={[styles.originChipText, isSelected && styles.originChipTextActive]}>
                      {getLocalized(g.name)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Destination Access Point Selector */}
        {accessPoints.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>{t('routes.access_point_label')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.apScroll}>
              {accessPoints.map((ap) => {
                const isSelected = selectedAccessPoint?.id === ap.id;
                const precisionLabel = t(`routes.precision.${ap.coordinates_precision}`);
                return (
                  <TouchableOpacity
                    key={ap.id}
                    style={[styles.apCard, isSelected && styles.apCardActive]}
                    onPress={() => setSelectedAccessPoint(ap)}
                  >
                    <Text style={[styles.apCardTitle, isSelected && styles.apCardTitleActive]}>
                      {getLocalized(ap.name)}
                    </Text>
                    <View style={styles.precisionBadge}>
                      <Text style={styles.precisionBadgeText}>{precisionLabel}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Travel Mode Selector */}
        <View style={styles.modeRow}>
          {(['car', 'bike', 'walk', 'bus', 'train'] as RouteMode[]).map((m) => {
            const isSelected = mode === m;
            return (
              <TouchableOpacity
                key={m}
                style={[styles.modeTab, isSelected && styles.modeTabActive]}
                onPress={() => setMode(m)}
              >
                <Text style={[styles.modeTabText, isSelected && styles.modeTabTextActive]}>
                  {m === 'car' && '🚗'}
                  {m === 'bike' && '🏍️'}
                  {m === 'walk' && '🚶'}
                  {m === 'bus' && '🚌'}
                  {m === 'train' && '🚆'}
                  {'\n'}
                  {t(`routes.modes.${m}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bike Speed Notice */}
        {mode === 'bike' && (
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>ℹ️ {t('routes.bike_estimate_notice')}</Text>
          </View>
        )}

        {/* Transit Handoff Card for Bus and Train */}
        {(mode === 'bus' || mode === 'train') && (
          <View style={styles.transitCard}>
            <Text style={styles.transitCardTitle}>{t('routes.transit_title')}</Text>
            <Text style={styles.transitCardDesc}>{t('routes.transit_desc')}</Text>
            <TouchableOpacity style={styles.openGoogleMapsBtn} onPress={handleOpenGoogleMaps}>
              <Text style={styles.openGoogleMapsBtnText}>{t('routes.open_google_maps')} ↗</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Map View */}
        <View style={styles.mapContainer}>
          {Platform.OS === 'web' && activeOriginCoord && activeDestCoord ? (
            <WebLeafletMap
              customMarkers={[
                {
                  id: 'origin',
                  lat: activeOriginCoord.lat,
                  lng: activeOriginCoord.lng,
                  title: 'Start: ' + (usingGps ? 'My Location' : (selectedOrigin ? getLocalized(selectedOrigin.name) : 'Origin')),
                  color: '#16A34A',
                },
                {
                  id: 'destination',
                  lat: activeDestCoord.lat,
                  lng: activeDestCoord.lng,
                  title: 'Ghat: ' + (selectedAccessPoint ? getLocalized(selectedAccessPoint.name) : getLocalized(currentGhat?.name)),
                  color: '#EA580C',
                },
                ...selectedWaypoints.map((wp) => ({
                  id: wp.id,
                  lat: wp.lat,
                  lng: wp.lng,
                  title: '🛕 ' + getLocalized(wp.name),
                  subtitle: wp.district ? `${wp.district} (Corridor Temple)` : 'Corridor Temple',
                  color: '#9333EA',
                })),
                ...closures.filter(c => c.geometry?.coordinates).map((c) => ({
                  id: c.id,
                  lat: c.geometry.coordinates[1],
                  lng: c.geometry.coordinates[0],
                  title: '⚠️ ' + getLocalized(c.title),
                  subtitle: getLocalized(c.description) || 'Traffic Closure / Diversion',
                  color: c.severity === 'blocked' ? '#DC2626' : '#F59E0B',
                })),
              ]}
              polylineCoords={routeCoordinates}
              center={{
                lat: (activeOriginCoord.lat + activeDestCoord.lat) / 2,
                lng: (activeOriginCoord.lng + activeDestCoord.lng) / 2,
              }}
              zoom={10}
              language={currentLang}
            />
          ) : activeOriginCoord && activeDestCoord && MapView ? (
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: (activeOriginCoord.lat + activeDestCoord.lat) / 2,
                longitude: (activeOriginCoord.lng + activeDestCoord.lng) / 2,
                latitudeDelta: Math.abs(activeOriginCoord.lat - activeDestCoord.lat) * 1.5 + 0.05,
                longitudeDelta: Math.abs(activeOriginCoord.lng - activeDestCoord.lng) * 1.5 + 0.05,
              }}
            >
              {/* OSM tile overlay */}
              {UrlTile && (
                <UrlTile
                  urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maximumZ={19}
                  flipY={false}
                  zIndex={-1}
                />
              )}

              {/* Polyline */}
              {Polyline && routeCoordinates.length > 0 && (
                <Polyline
                  coordinates={routeCoordinates}
                  strokeColor="#E65100"
                  strokeWidth={4}
                />
              )}

              {/* Start Marker */}
              {Marker && (
                <Marker
                  coordinate={{ latitude: activeOriginCoord.lat, longitude: activeOriginCoord.lng }}
                  title={t('routes.origin_label')}
                  pinColor="green"
                />
              )}

              {/* Destination Access Point Marker */}
              {Marker && (
                <Marker
                  coordinate={{ latitude: activeDestCoord.lat, longitude: activeDestCoord.lng }}
                  title={selectedAccessPoint ? getLocalized(selectedAccessPoint.name) : getLocalized(currentGhat?.name)}
                  pinColor="orange"
                />
              )}

              {/* Waypoint Markers */}
              {Marker && selectedWaypoints.map((wp) => (
                <Marker
                  key={wp.id}
                  coordinate={{ latitude: wp.lat, longitude: wp.lng }}
                  title={getLocalized(wp.name)}
                  pinColor="purple"
                />
              ))}

              {/* Closure Markers */}
              {Marker && closures.map((c) => {
                if (!c.geometry?.coordinates) return null;
                const coords = c.geometry.coordinates;
                const lat = coords[1];
                const lng = coords[0];
                return (
                  <Marker
                    key={c.id}
                    coordinate={{ latitude: lat, longitude: lng }}
                    title={getLocalized(c.title)}
                    description={getLocalized(c.description)}
                    pinColor={c.severity === 'blocked' ? 'red' : 'gold'}
                  />
                );
              })}
            </MapView>
          ) : (
            <View style={styles.mapPlaceholder}>
              <Text>{t('routes.calculating')}</Text>
            </View>
          )}

          {/* Attribution pill */}
          <View style={styles.mapAttribution}>
            <Text style={styles.attributionText}>{ROUTE_ATTRIBUTION_TEXT}</Text>
          </View>
        </View>

        {/* Route Stats & Warnings */}
        {loading ? (
          <ActivityIndicator size="large" color="#E65100" style={{ marginVertical: 20 }} />
        ) : routeResult ? (
          <View style={styles.routeSummaryCard}>
            {'degraded' in routeResult && routeResult.degraded ? (
              <View>
                <Text style={styles.degradedTitle}>⚠️ {routeResult.message}</Text>
                <Text style={styles.statLabel}>
                  {t('routes.distance')}: {(routeResult.straightLineDistanceMeters / 1000).toFixed(1)} km (Straight line)
                </Text>
              </View>
            ) : (
              <View>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>{t('routes.distance')}</Text>
                    <Text style={styles.statValue}>
                      {((routeResult as RouteResult).distanceMeters / 1000).toFixed(1)} km
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>{t('routes.est_time')}</Text>
                    <Text style={styles.statValue}>
                      {Math.ceil((routeResult as RouteResult).estimatedDurationSeconds / 60)} mins
                    </Text>
                  </View>
                </View>

                {(routeResult as RouteResult).delayFactor > 1.0 && (
                  <Text style={styles.delayNote}>
                    ⏱️ {t('routes.delay_notice', { factor: (routeResult as RouteResult).delayFactor.toFixed(1) })}
                  </Text>
                )}

                {/* Warnings / Diversions */}
                {(routeResult as RouteResult).warnings?.map((w, idx) => (
                  <View key={idx} style={styles.warningBox}>
                    <Text style={styles.warningText}>⚠️ {w}</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.openGoogleMapsBtn} onPress={handleOpenGoogleMaps}>
              <Text style={styles.openGoogleMapsBtnText}>{t('routes.open_google_maps')} ↗</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Corridor Temples */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>{t('routes.temples_corridor_title')}</Text>
          <Text style={styles.sectionSubLabel}>{t('routes.temples_corridor_subtitle')}</Text>
          <Text style={styles.stopsCountBadge}>
            {t('routes.stops_count', { count: selectedWaypoints.length })}
          </Text>

          {loadingTemples ? (
            <ActivityIndicator size="small" color="#E65100" />
          ) : corridorTemples.length === 0 ? (
            <Text style={styles.emptyText}>No verified temples within 3 km of this route.</Text>
          ) : (
            corridorTemples.map((temple) => {
              const isSelected = selectedWaypoints.some((w) => w.id === temple.id);
              return (
                <View key={temple.id} style={styles.templeRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.templeName}>{getLocalized(temple.name)}</Text>
                    <Text style={styles.templeDist}>
                      {temple.distance_from_route_m ? `${(temple.distance_from_route_m / 1000).toFixed(1)} km from route` : ''}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.stopToggleBtn, isSelected && styles.stopToggleBtnActive]}
                    onPress={() => handleToggleWaypoint(temple)}
                  >
                    <Text style={[styles.stopToggleText, isSelected && styles.stopToggleTextActive]}>
                      {isSelected ? t('routes.remove_stop') : `+ ${t('routes.add_stop')}`}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}

          {selectedWaypoints.length > 0 && (
            <TouchableOpacity style={styles.updateRouteBtn} onPress={handleCalculateRoute}>
              <Text style={styles.updateRouteBtnText}>{t('routes.update_route_btn')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Safety Disclaimer Banner */}
        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerTitle}>⚠️ Pushkaralu Safety Disclaimer</Text>
          <Text style={styles.disclaimerText}>{t('routes.safety_disclaimer')}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E65100',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: { marginRight: 12, padding: 4 },
  backBtnText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  headerTitleWrap: { flex: 1 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  headerSubtitle: { color: '#FFE0B2', fontSize: 13, marginTop: 2 },
  scrollContent: { flex: 1 },
  scrollInner: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionLabel: { fontSize: 14, fontWeight: 'bold', color: '#37474F', marginBottom: 8 },
  sectionSubLabel: { fontSize: 12, color: '#78909C', marginBottom: 8 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  browseAllBtn: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  browseAllBtnText: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: 'bold',
  },
  selectedGhatBanner: {
    backgroundColor: '#FFF7ED',
    borderLeftWidth: 4,
    borderLeftColor: '#EA580C',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  selectedGhatName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#9A3412',
  },
  selectedGhatDistrict: {
    fontSize: 12,
    color: '#C2410C',
    marginTop: 2,
  },
  popularGhatsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  destChipActive: {
    backgroundColor: '#EA580C',
  },
  searchBoxContainer: {
    marginBottom: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 8,
  },
  searchInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
  },
  searchResultsList: {
    maxHeight: 160,
    marginTop: 6,
  },
  searchResultItem: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchResultTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  searchResultSub: {
    fontSize: 11,
    color: '#64748B',
  },
  gpsButton: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FFE0B2',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  gpsButtonActive: { backgroundColor: '#E65100', borderColor: '#E65100' },
  gpsButtonText: { color: '#E65100', fontWeight: 'bold', fontSize: 14 },
  gpsButtonTextActive: { color: '#FFF' },
  orDivider: {
    textAlign: 'center',
    color: '#90A4AE',
    fontSize: 12,
    marginVertical: 10,
  },
  originsScroll: { flexDirection: 'row' },
  originChip: {
    backgroundColor: '#ECEFF1',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  originChipActive: { backgroundColor: '#E65100' },
  originChipText: { color: '#455A64', fontSize: 13 },
  originChipTextActive: { color: '#FFF', fontWeight: 'bold' },
  apScroll: { flexDirection: 'row' },
  apCard: {
    borderWidth: 1,
    borderColor: '#CFD8DC',
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
    backgroundColor: '#FAFAFA',
    minWidth: 130,
  },
  apCardActive: { borderColor: '#E65100', backgroundColor: '#FFF8E1' },
  apCardTitle: { fontSize: 13, fontWeight: 'bold', color: '#263238' },
  apCardTitleActive: { color: '#E65100' },
  precisionBadge: {
    marginTop: 4,
    backgroundColor: '#E0F2F1',
    alignSelf: 'flex-start',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  precisionBadgeText: { fontSize: 10, color: '#00695C', fontWeight: '600' },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modeTab: {
    flex: 1,
    backgroundColor: '#FFF',
    marginHorizontal: 2,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  modeTabActive: {
    backgroundColor: '#E65100',
    borderColor: '#E65100',
  },
  modeTabText: { fontSize: 10, textAlign: 'center', color: '#455A64' },
  modeTabTextActive: { color: '#FFF', fontWeight: 'bold' },
  noticeBox: {
    backgroundColor: '#E1F5FE',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  noticeText: { fontSize: 12, color: '#0277BD' },
  transitCard: {
    backgroundColor: '#EDE7F6',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  transitCardTitle: { fontSize: 14, fontWeight: 'bold', color: '#4A148C' },
  transitCardDesc: { fontSize: 12, color: '#6A1B9A', marginVertical: 6 },
  mapContainer: {
    height: 240,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#CFD8DC',
    position: 'relative',
  },
  map: { width: '100%', height: '100%' },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECEFF1',
  },
  mapAttribution: {
    position: 'absolute',
    bottom: 4,
    right: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  attributionText: { fontSize: 9, color: '#455A64' },
  routeSummaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    elevation: 2,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: 12, color: '#78909C' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#263238', marginTop: 2 },
  delayNote: { fontSize: 12, color: '#D84315', marginTop: 4, textAlign: 'center' },
  warningBox: {
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  warningText: { fontSize: 12, color: '#E65100' },
  degradedTitle: { fontSize: 13, color: '#C62828', fontWeight: 'bold', marginBottom: 6 },
  openGoogleMapsBtn: {
    backgroundColor: '#1B5E20',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  openGoogleMapsBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  stopsCountBadge: {
    fontSize: 11,
    color: '#E65100',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: { fontSize: 12, color: '#90A4AE', fontStyle: 'italic', marginVertical: 6 },
  templeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  templeName: { fontSize: 13, fontWeight: 'bold', color: '#263238' },
  templeDist: { fontSize: 11, color: '#78909C' },
  stopToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
  },
  stopToggleBtnActive: { backgroundColor: '#FFEBEE' },
  stopToggleText: { fontSize: 12, color: '#00838F', fontWeight: '600' },
  stopToggleTextActive: { color: '#C62828' },
  updateRouteBtn: {
    backgroundColor: '#E65100',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  updateRouteBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  disclaimerCard: {
    backgroundColor: '#FFF9C4',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  disclaimerTitle: { fontSize: 12, fontWeight: 'bold', color: '#F57F17', marginBottom: 4 },
  disclaimerText: { fontSize: 11, color: '#5D4037', lineHeight: 16 },
});

