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
  Share,
} from 'react-native';
import { useTranslation } from 'react-i18next';
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
import { storage } from '../utils/storage';
import { colors, radii, spacing, touchTargets, typography, shadows } from '../theme/tokens';
import {
  Card,
  Button,
  SearchField,
  Chip,
  BathingBadge,
  CrowdBadge,
  Stepper,
  EmptyState,
  ErrorState,
} from '../components';

// Conditionally import react-native-maps for native rendering
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
  // Not available in web / SSR
}

export interface SavedTrip {
  id: string;
  originName: string;
  destinationName: string;
  ghatId: string;
  lat: number;
  lng: number;
  date: string;
  mode: RouteMode;
  preferences: string[];
  createdAt: string;
}

const SAVED_TRIPS_STORAGE_KEY = 'saved_pushkaralu_trips';

interface RoutePlannerScreenProps {
  initialGhat?: {
    id: string;
    name: { en: string; te?: string; hi?: string } | string;
    lat: number;
    lng: number;
  };
  initialTab?: 'plan' | 'directions' | 'saved';
  onBack?: () => void;
}

export const RoutePlannerScreen: React.FC<RoutePlannerScreenProps> = ({
  initialGhat,
  initialTab = 'plan',
  onBack,
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language || 'en').slice(0, 2) as 'en' | 'te' | 'hi';

  const [activeMainTab, setActiveMainTab] = useState<'plan' | 'directions' | 'saved'>(initialTab);

  // --- Common Routing State ---
  const [currentGhat, setCurrentGhat] = useState<any>(initialGhat || null);
  const [allGhats, setAllGhats] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGhatSearch, setShowGhatSearch] = useState(false);

  const [origins, setOrigins] = useState<RouteOrigin[]>([]);
  const [selectedOrigin, setSelectedOrigin] = useState<RouteOrigin | null>(null);
  const [gpsOrigin, setGpsOrigin] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [usingGps, setUsingGps] = useState(false);

  const [accessPoints, setAccessPoints] = useState<GhatAccessPoint[]>([]);
  const [selectedAccessPoint, setSelectedAccessPoint] = useState<GhatAccessPoint | null>(null);

  const [mode, setMode] = useState<RouteMode>('car');
  const [loading, setLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeResult, setRouteResult] = useState<RouteResult | DegradedRouteResult | null>(null);

  // Corridor Temples & Closures
  const [corridorTemples, setCorridorTemples] = useState<RouteTemple[]>([]);
  const [selectedWaypoints, setSelectedWaypoints] = useState<RouteTemple[]>([]);
  const [loadingTemples, setLoadingTemples] = useState(false);
  const [closures, setClosures] = useState<RouteClosure[]>([]);

  // --- Trip Planner Wizard State ---
  const [wizardStep, setWizardStep] = useState(0); // 0: Origin, 1: Destination, 2: Preferences, 3: Summary
  const [tripDate, setTripDate] = useState('2027-07-14'); // Opening Day of 2027 Maha Pushkaram
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>(['changing_rooms']);
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const wizardSteps = [
    { label: 'Origin' },
    { label: 'Ghat' },
    { label: 'Date & Mode' },
    { label: 'Summary' },
  ];

  const pushkaraluDates = [
    { id: '2027-07-14', label: '14 Jul (Inaugural Day)' },
    { id: '2027-07-15', label: '15 Jul (Pushkar Snanam)' },
    { id: '2027-07-16', label: '16 Jul' },
    { id: '2027-07-18', label: '18 Jul (Auspicious Sunday)' },
    { id: '2027-07-20', label: '20 Jul' },
    { id: '2027-07-25', label: '25 Jul (Closing Day)' },
  ];

  const preferenceOptions = [
    { id: 'changing_rooms', label: 'Changing Rooms Available' },
    { id: 'drinking_water', label: 'Filtered Drinking Water' },
    { id: 'elderly_access', label: 'Elderly / Wheelchair Ramp' },
    { id: 'medical_aid', label: 'First Aid / Medical Camp' },
  ];

  useEffect(() => {
    if (initialGhat) {
      setCurrentGhat(initialGhat);
    }
  }, [initialGhat]);

  // Load origins, closures, and ghats on mount
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

    // Load saved trips from local storage
    storage.getItem(SAVED_TRIPS_STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setSavedTrips(JSON.parse(raw));
        } catch {}
      }
    });
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

  const handleUseMyLocation = async () => {
    setLoading(true);
    try {
      const locResult = await acquireUserLocation();
      if (!locResult.granted || !locResult.coords) {
        Alert.alert(t('common.error', 'Error'), t('routes.location_prompt', 'Please enable location permissions.'));
        return;
      }

      const myCoord = {
        lat: locResult.coords.latitude,
        lng: locResult.coords.longitude,
        name: t('routes.use_my_location', 'Current Location'),
      };
      setGpsOrigin(myCoord);
      setUsingGps(true);
      setSelectedOrigin(null);
    } catch {
      Alert.alert(t('common.error', 'Error'), 'Could not acquire GPS coordinates.');
    } finally {
      setLoading(false);
    }
  };

  const activeOriginCoord = useMemo(() => {
    if (usingGps && gpsOrigin) {
      return { lat: gpsOrigin.lat, lng: gpsOrigin.lng };
    }
    if (selectedOrigin) {
      return { lat: selectedOrigin.lat, lng: selectedOrigin.lng };
    }
    return null;
  }, [usingGps, gpsOrigin, selectedOrigin]);

  const activeDestCoord = useMemo(() => {
    if (selectedAccessPoint) {
      return { lat: selectedAccessPoint.lat, lng: selectedAccessPoint.lng };
    }
    if (currentGhat?.lat != null && currentGhat?.lng != null) {
      return { lat: Number(currentGhat.lat), lng: Number(currentGhat.lng) };
    }
    return null;
  }, [selectedAccessPoint, currentGhat]);

  // Calculate live route
  const handleCalculateRoute = useCallback(async () => {
    if (!activeOriginCoord || !activeDestCoord) return;

    setLoading(true);
    setRouteError(null);
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

      if ('encodedPolyline' in result && result.encodedPolyline) {
        setLoadingTemples(true);
        fetchTemplesAlongRoute(result.encodedPolyline, 3)
          .then(setCorridorTemples)
          .finally(() => setLoadingTemples(false));
      }
    } catch (err: any) {
      console.warn('[RoutePlannerScreen] Calculation failed:', err);
      setRouteError(err.message || 'Routing service is temporarily unreachable.');
    } finally {
      setLoading(false);
    }
  }, [activeOriginCoord, activeDestCoord, selectedWaypoints, mode, currentGhat?.id]);

  useEffect(() => {
    if (activeMainTab === 'directions' && activeOriginCoord && activeDestCoord) {
      handleCalculateRoute();
    }
  }, [activeMainTab, activeOriginCoord, activeDestCoord, mode]);

  const handleToggleWaypoint = (temple: RouteTemple) => {
    const isSelected = selectedWaypoints.some((w) => w.id === temple.id);
    if (isSelected) {
      setSelectedWaypoints((prev) => prev.filter((w) => w.id !== temple.id));
    } else {
      if (selectedWaypoints.length >= 3) {
        Alert.alert('Maximum Stops', 'You can add up to 3 temple stops along the route.');
        return;
      }
      setSelectedWaypoints((prev) => [...prev, temple]);
    }
  };

  const routeCoordinates = useMemo(() => {
    if (routeResult && 'encodedPolyline' in routeResult && routeResult.encodedPolyline) {
      return decodePolylineCoordinates(routeResult.encodedPolyline);
    }
    return [];
  }, [routeResult]);

  const handleOpenExternalMaps = () => {
    if (!activeDestCoord) return;
    const origStr = activeOriginCoord ? `${activeOriginCoord.lat},${activeOriginCoord.lng}` : '';
    const destStr = `${activeDestCoord.lat},${activeDestCoord.lng}`;
    const url = activeOriginCoord
      ? `https://www.google.com/maps/dir/?api=1&origin=${origStr}&destination=${destStr}`
      : `https://www.google.com/maps/search/?api=1&query=${destStr}`;
    Linking.openURL(url).catch(() => {});
  };

  const getLocalized = (val: any) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      return val[currentLang] || val.en || Object.values(val)[0] || '';
    }
    return String(val);
  };

  // --- Save & Share Trip Functions ---
  const handleSaveTrip = async () => {
    if (!currentGhat) return;

    const originName = usingGps
      ? 'Current GPS Location'
      : selectedOrigin
      ? getLocalized(selectedOrigin.name)
      : 'Central Transit Hub';

    const newTrip: SavedTrip = {
      id: `trip_${Date.now()}`,
      originName,
      destinationName: getLocalized(currentGhat.name),
      ghatId: currentGhat.id,
      lat: Number(currentGhat.lat),
      lng: Number(currentGhat.lng),
      date: tripDate,
      mode,
      preferences: selectedPrefs,
      createdAt: new Date().toISOString(),
    };

    const updated = [newTrip, ...savedTrips.filter((t) => t.ghatId !== currentGhat.id)];
    setSavedTrips(updated);
    await storage.setItem(SAVED_TRIPS_STORAGE_KEY, JSON.stringify(updated));
    setSaveSuccessMsg('Trip saved to your pilgrimage itineraries!');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  const handleShareTrip = async () => {
    const originName = usingGps
      ? 'Current Location'
      : selectedOrigin
      ? getLocalized(selectedOrigin.name)
      : 'Rajahmundry';
    const ghatName = getLocalized(currentGhat?.name) || 'Pushkar Ghat';

    const message = `🕉️ Smart Pushkaralu 2027 Pilgrimage Plan:\n` +
      `• Origin: ${originName}\n` +
      `• Destination: ${ghatName} (${currentGhat?.district || 'East Godavari'})\n` +
      `• Date: ${tripDate}\n` +
      `• Travel Mode: ${mode.toUpperCase()}\n` +
      `• Recommended Snanam Timings: 05:30 AM - 08:30 AM\n\n` +
      `View official ghat advisory: https://smartpushkaralu.ap.gov.in`;

    try {
      await Share.share({ message });
    } catch {}
  };

  const handleDeleteSavedTrip = async (tripId: string) => {
    const updated = savedTrips.filter((t) => t.id !== tripId);
    setSavedTrips(updated);
    await storage.setItem(SAVED_TRIPS_STORAGE_KEY, JSON.stringify(updated));
  };

  const handleOpenSavedTrip = (trip: SavedTrip) => {
    const match = allGhats.find((g) => g.id === trip.ghatId);
    if (match) setCurrentGhat(match);
    setMode(trip.mode);
    setTripDate(trip.date);
    setActiveMainTab('directions');
  };

  return (
    <View style={styles.container}>
      {/* Top Navbar */}
      <View style={styles.topNav}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backBtn}
          >
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
        )}
        <View style={styles.headerTitleWrap}>
          <Text
            maxFontSizeMultiplier={typography.maxScale}
            style={styles.headerTitle}
          >
            {activeMainTab === 'plan'
              ? 'Yatra Trip Planner'
              : activeMainTab === 'saved'
              ? 'Saved Itineraries'
              : 'Live Route & Directions'}
          </Text>
          <Text
            maxFontSizeMultiplier={typography.maxScale}
            style={styles.headerSubtitle}
            numberOfLines={1}
          >
            {getLocalized(currentGhat?.name) || 'Godavari Maha Pushkaralu 2027'}
          </Text>
        </View>
      </View>

      {/* Main Tab Switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setActiveMainTab('plan')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeMainTab === 'plan' }}
          style={[styles.tabButton, activeMainTab === 'plan' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, activeMainTab === 'plan' && styles.tabTextActive]}>
            🧭 Plan a Trip
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveMainTab('directions')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeMainTab === 'directions' }}
          style={[styles.tabButton, activeMainTab === 'directions' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, activeMainTab === 'directions' && styles.tabTextActive]}>
            🚗 Directions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveMainTab('saved')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeMainTab === 'saved' }}
          style={[styles.tabButton, activeMainTab === 'saved' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, activeMainTab === 'saved' && styles.tabTextActive]}>
            📋 Saved ({savedTrips.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* ========================================================================= */}
      {/* TAB 1: STEP-BY-STEP TRIP PLANNER WIZARD                                    */}
      {/* ========================================================================= */}
      {activeMainTab === 'plan' && (
        <ScrollView contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
          {/* Stepper Progress */}
          <Stepper steps={wizardSteps} currentStep={wizardStep} />

          {/* STEP 0: Select Starting Origin */}
          {wizardStep === 0 && (
            <Card variant="elevated" style={styles.wizardCard}>
              <Text style={styles.wizardTitle}>Step 1: Choose Starting Location</Text>
              <Text style={styles.wizardDesc}>
                Select where your pilgrimage will begin (GPS location, nearest railway station or central bus hub).
              </Text>

              <TouchableOpacity
                onPress={handleUseMyLocation}
                style={[styles.gpsActionBtn, usingGps && styles.gpsActionBtnActive]}
                accessibilityRole="button"
              >
                <Text style={styles.gpsActionIcon}>📍</Text>
                <Text style={[styles.gpsActionText, usingGps && styles.gpsActionTextActive]}>
                  {usingGps ? 'Using Current GPS Location ✓' : 'Use Current GPS Location'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.orDivider}>— or choose official starting hub —</Text>

              <View style={styles.originsGrid}>
                {origins.map((orig) => {
                  const isSelected = !usingGps && selectedOrigin?.id === orig.id;
                  return (
                    <Chip
                      key={orig.id}
                      label={getLocalized(orig.name)}
                      selected={isSelected}
                      onPress={() => {
                        setUsingGps(false);
                        setSelectedOrigin(orig);
                      }}
                    />
                  );
                })}
              </View>

              <View style={styles.wizardActions}>
                <Button
                  title="Next: Select Ghat →"
                  variant="primary"
                  size="md"
                  onPress={() => setWizardStep(1)}
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          )}

          {/* STEP 1: Select Destination Ghat */}
          {wizardStep === 1 && (
            <Card variant="elevated" style={styles.wizardCard}>
              <Text style={styles.wizardTitle}>Step 2: Choose Holy Bathing Ghat</Text>
              <Text style={styles.wizardDesc}>
                Select the holy bathing ghat you intend to visit. Status and crowd density are pulled directly from the official database.
              </Text>

              {/* Selected Ghat display */}
              {currentGhat && (
                <View style={styles.selectedGhatHighlight}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.highlightGhatName}>🌊 {getLocalized(currentGhat.name)}</Text>
                    <Text style={styles.highlightGhatDistrict}>{currentGhat.district} District</Text>
                  </View>
                  <BathingBadge status={currentGhat.bathing_status || 'allowed'} size="sm" />
                </View>
              )}

              {/* Ghat search field */}
              <SearchField
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search official ghats..."
                onClear={() => setSearchQuery('')}
              />

              <ScrollView style={styles.ghatSelectionList} nestedScrollEnabled>
                {allGhats
                  .filter((g) => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase().trim();
                    const name = getLocalized(g.name).toLowerCase();
                    const dist = (g.district || '').toLowerCase();
                    return name.includes(q) || dist.includes(q);
                  })
                  .slice(0, 10)
                  .map((g) => {
                    const isSelected = currentGhat?.id === g.id;
                    return (
                      <TouchableOpacity
                        key={g.id}
                        onPress={() => setCurrentGhat(g)}
                        style={[styles.ghatPickRow, isSelected && styles.ghatPickRowSelected]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.ghatPickName, isSelected && styles.ghatPickNameSelected]}>
                            {getLocalized(g.name)}
                          </Text>
                          <Text style={styles.ghatPickDistrict}>{g.district}</Text>
                        </View>
                        <CrowdBadge crowd={g.crowd_level || 'low'} size="sm" />
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>

              <View style={styles.wizardActions}>
                <Button
                  title="← Back"
                  variant="outline"
                  size="md"
                  onPress={() => setWizardStep(0)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Next: Date & Mode →"
                  variant="primary"
                  size="md"
                  onPress={() => setWizardStep(2)}
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          )}

          {/* STEP 2: Date & Travel Mode & Preferences */}
          {wizardStep === 2 && (
            <Card variant="elevated" style={styles.wizardCard}>
              <Text style={styles.wizardTitle}>Step 3: Pilgrimage Date & Travel Mode</Text>

              {/* Date selection */}
              <Text style={styles.subSectionTitle}>Select Pushkaralu Snanam Date:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {pushkaraluDates.map((d) => (
                  <Chip
                    key={d.id}
                    label={d.label}
                    selected={tripDate === d.id}
                    onPress={() => setTripDate(d.id)}
                  />
                ))}
              </ScrollView>

              {/* Mode selection */}
              <Text style={[styles.subSectionTitle, { marginTop: spacing.md }]}>Travel Mode:</Text>
              <View style={styles.modeChipsGrid}>
                {[
                  { id: 'car', icon: '🚗', label: 'Car / Cab' },
                  { id: 'bike', icon: '🛵', label: 'Two-Wheeler' },
                  { id: 'walk', icon: '🚶', label: 'Walking' },
                  { id: 'bus', icon: '🚌', label: 'Pushkar Shuttle' },
                ].map((m) => (
                  <Chip
                    key={m.id}
                    label={`${m.icon} ${m.label}`}
                    selected={mode === m.id}
                    onPress={() => setMode(m.id as RouteMode)}
                  />
                ))}
              </View>

              {/* Preferences */}
              <Text style={[styles.subSectionTitle, { marginTop: spacing.md }]}>Facility Preferences:</Text>
              <View style={styles.preferencesList}>
                {preferenceOptions.map((pref) => {
                  const isChecked = selectedPrefs.includes(pref.id);
                  return (
                    <TouchableOpacity
                      key={pref.id}
                      onPress={() => {
                        if (isChecked) {
                          setSelectedPrefs((p) => p.filter((x) => x !== pref.id));
                        } else {
                          setSelectedPrefs((p) => [...p, pref.id]);
                        }
                      }}
                      style={styles.prefRow}
                    >
                      <Text style={styles.prefCheckbox}>{isChecked ? '☑️' : '◻️'}</Text>
                      <Text style={styles.prefLabel}>{pref.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.wizardActions}>
                <Button
                  title="← Back"
                  variant="outline"
                  size="md"
                  onPress={() => setWizardStep(1)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Review Itinerary →"
                  variant="primary"
                  size="md"
                  onPress={() => setWizardStep(3)}
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          )}

          {/* STEP 3: Summary, Save & Share */}
          {wizardStep === 3 && (
            <Card variant="elevated" style={styles.wizardCard}>
              <Text style={styles.wizardTitle}>Step 4: Itinerary Summary</Text>
              <Text style={styles.wizardDesc}>
                Review your customized pilgrimage plan. Save it for offline reference or share it with family members.
              </Text>

              {saveSuccessMsg && (
                <View style={styles.successBanner}>
                  <Text style={styles.successBannerText}>✓ {saveSuccessMsg}</Text>
                </View>
              )}

              {/* Itinerary overview */}
              <View style={styles.summaryBox}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Starting Point:</Text>
                  <Text style={styles.summaryValue}>
                    {usingGps
                      ? 'Current GPS Location'
                      : selectedOrigin
                      ? getLocalized(selectedOrigin.name)
                      : 'Central Hub'}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Destination Ghat:</Text>
                  <Text style={styles.summaryValue}>
                    {getLocalized(currentGhat?.name)} ({currentGhat?.district})
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Date:</Text>
                  <Text style={styles.summaryValue}>{tripDate}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Travel Mode:</Text>
                  <Text style={styles.summaryValue}>{mode.toUpperCase()}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Recommended Snanam:</Text>
                  <Text style={[styles.summaryValue, { color: colors.status.success }]}>
                    05:30 AM – 08:30 AM (Brahma Muhurtam)
                  </Text>
                </View>
              </View>

              {/* Advisory note */}
              <View style={styles.advisoryNotice}>
                <Text style={styles.advisoryText}>
                  ⚠️ Note: Vehicle parking permits and cordon passes are regulated by the police on peak bathing days.
                </Text>
              </View>

              {/* Action buttons */}
              <View style={styles.summaryActionButtons}>
                <Button
                  title="💾 Save Itinerary"
                  variant="primary"
                  size="md"
                  onPress={handleSaveTrip}
                  style={{ flex: 1 }}
                />
                <Button
                  title="📤 Share Plan"
                  variant="secondary"
                  size="md"
                  onPress={handleShareTrip}
                  style={{ flex: 1 }}
                />
              </View>

              <Button
                title="🗺️ View Live Route & Map"
                variant="outline"
                size="md"
                onPress={() => setActiveMainTab('directions')}
                style={{ marginTop: spacing.sm }}
              />

              <Button
                title="← Edit Steps"
                variant="ghost"
                size="sm"
                onPress={() => setWizardStep(0)}
                style={{ marginTop: spacing.xs }}
              />
            </Card>
          )}
        </ScrollView>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LIVE DIRECTIONS & ROUTING                                          */}
      {/* ========================================================================= */}
      {activeMainTab === 'directions' && (
        <ScrollView contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
          {/* Active Closures Alert if any */}
          {closures.length > 0 && (
            <Card variant="tint" style={styles.closureCard}>
              <Text style={styles.closureTitle}>🚧 Active Road Closures & Diversions</Text>
              {closures.slice(0, 2).map((c) => (
                <Text key={c.id} style={styles.closureText}>
                  • {getLocalized(c.title)}: {c.description ? getLocalized(c.description) : 'Road closed for festival traffic'}
                </Text>
              ))}
            </Card>
          )}

          {/* Destination & Access Point Card */}
          <Card variant="elevated" style={styles.directionsControlCard}>
            <View style={styles.destHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.destGhatTitle}>🌊 {getLocalized(currentGhat?.name)}</Text>
                <Text style={styles.destGhatSubtitle}>{currentGhat?.district} District</Text>
              </View>
              <BathingBadge status={currentGhat?.bathing_status || 'allowed'} size="sm" />
            </View>

            {/* Travel Mode Selector */}
            <View style={styles.modeSelectorRow}>
              {(['car', 'bike', 'walk', 'bus'] as RouteMode[]).map((m) => (
                <Chip
                  key={m}
                  label={m.toUpperCase()}
                  selected={mode === m}
                  onPress={() => setMode(m)}
                />
              ))}
            </View>
          </Card>

          {/* Map Display */}
          <View style={styles.mapContainer}>
            {Platform.OS === 'web' ? (
              <WebLeafletMap
                center={{
                  lat: activeDestCoord?.lat || 17.0005,
                  lng: activeDestCoord?.lng || 81.7800,
                }}
                zoom={14}
                customMarkers={[
                  ...(activeOriginCoord
                    ? [
                        {
                          id: 'origin',
                          lat: activeOriginCoord.lat,
                          lng: activeOriginCoord.lng,
                          title: 'Origin Point',
                          color: '#2563EB',
                        },
                      ]
                    : []),
                  ...(activeDestCoord
                    ? [
                        {
                          id: 'destination',
                          lat: activeDestCoord.lat,
                          lng: activeDestCoord.lng,
                          title: getLocalized(currentGhat?.name) || 'Destination Ghat',
                          color: '#C2410C',
                        },
                      ]
                    : []),
                ]}
                polylineCoords={routeCoordinates.map((c) => ({ latitude: c.latitude, longitude: c.longitude }))}
                style={{ height: 260 }}
              />
            ) : MapView ? (
              <MapView
                style={{ flex: 1, height: 260 }}
                initialRegion={{
                  latitude: activeDestCoord?.lat || 17.0005,
                  longitude: activeDestCoord?.lng || 81.7800,
                  latitudeDelta: 0.08,
                  longitudeDelta: 0.08,
                }}
              >
                {activeOriginCoord && (
                  <Marker
                    coordinate={{ latitude: activeOriginCoord.lat, longitude: activeOriginCoord.lng }}
                    title="Starting Origin"
                    pinColor="#2563EB"
                  />
                )}
                {activeDestCoord && (
                  <Marker
                    coordinate={{ latitude: activeDestCoord.lat, longitude: activeDestCoord.lng }}
                    title={getLocalized(currentGhat?.name) || 'Ghat'}
                    pinColor="#C2410C"
                  />
                )}
                {routeCoordinates.length > 0 && (
                  <Polyline coordinates={routeCoordinates} strokeColor={colors.primary700} strokeWidth={4} />
                )}
              </MapView>
            ) : (
              <View style={styles.mapFallback}>
                <Text style={styles.mapFallbackText}>Interactive Map Active</Text>
              </View>
            )}
          </View>

          {/* Route Result Summary Card or Error */}
          {loading ? (
            <Card variant="flat" style={styles.loadingRouteCard}>
              <ActivityIndicator size="small" color={colors.primary700} />
              <Text style={styles.loadingRouteText}>Computing real-time route via official network...</Text>
            </Card>
          ) : routeError ? (
            <ErrorState
              title="Unable to compute route"
              message={routeError}
              onRetry={handleCalculateRoute}
              retryTitle="Retry Routing"
            />
          ) : routeResult ? (
            <Card variant="elevated" style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View>
                  <Text style={styles.resultDistance}>
                    {'distanceMeters' in routeResult
                      ? `${(routeResult.distanceMeters / 1000).toFixed(1)} km`
                      : `${(((routeResult as any).straightLineDistanceMeters || 0) / 1000).toFixed(1)} km (approx)`}
                  </Text>
                  <Text style={styles.resultDuration}>
                    {'durationSeconds' in routeResult
                      ? `Approx. ${Math.round(routeResult.durationSeconds / 60)} mins`
                      : (routeResult as any).message || 'Route estimated'}
                  </Text>
                </View>
                <CrowdBadge crowd={currentGhat?.crowd_level || 'low'} />
              </View>

              {/* External Navigation Button */}
              <Button
                title="🗺️ Open in Google / Apple Maps"
                variant="secondary"
                size="md"
                onPress={handleOpenExternalMaps}
                style={{ marginTop: spacing.sm }}
              />

              {/* Legs summary if available */}
              {'legs' in routeResult && routeResult.legs && routeResult.legs.length > 0 && (
                <View style={styles.stepsList}>
                  <Text style={styles.stepsHeading}>Route Corridor Guidance:</Text>
                  {routeResult.legs.map((leg, idx) => (
                    <Text key={idx} style={styles.stepItemText}>
                      • Leg {idx + 1}: {(leg.distanceMeters / 1000).toFixed(1)} km (~{Math.round(leg.durationSeconds / 60)} mins)
                    </Text>
                  ))}
                </View>
              )}
            </Card>
          ) : null}

          {/* Corridor Temples */}
          {corridorTemples.length > 0 && (
            <Card variant="elevated" style={styles.templesCard}>
              <Text style={styles.templesHeading}>🛕 Shrines Along Corridor:</Text>
              {corridorTemples.map((temple) => (
                <View key={temple.id} style={styles.templeRow}>
                  <Text style={styles.templeName}>{getLocalized(temple.name)}</Text>
                  <Button
                    title={selectedWaypoints.some((w) => w.id === temple.id) ? 'Stop Added ✓' : '+ Add Stop'}
                    variant="outline"
                    size="sm"
                    onPress={() => handleToggleWaypoint(temple)}
                  />
                </View>
              ))}
            </Card>
          )}
        </ScrollView>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SAVED ITINERARIES                                                  */}
      {/* ========================================================================= */}
      {activeMainTab === 'saved' && (
        <ScrollView contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
          {savedTrips.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No Saved Itineraries"
              description="You have not saved any pilgrimage plans yet. Use the Plan a Trip wizard to create and store your itinerary."
              actionTitle="Create First Plan"
              onAction={() => setActiveMainTab('plan')}
            />
          ) : (
            savedTrips.map((trip) => (
              <Card key={trip.id} variant="elevated" style={styles.savedTripCard}>
                <View style={styles.savedTripHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.savedTripDest}>🌊 {trip.destinationName}</Text>
                    <Text style={styles.savedTripOrigin}>From: {trip.originName}</Text>
                    <Text style={styles.savedTripDate}>📅 Scheduled: {trip.date}</Text>
                  </View>
                  <Chip label={trip.mode.toUpperCase()} selected={false} onPress={() => {}} />
                </View>

                <View style={styles.savedTripActions}>
                  <Button
                    title="View Route"
                    variant="primary"
                    size="sm"
                    onPress={() => handleOpenSavedTrip(trip)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Share"
                    variant="secondary"
                    size="sm"
                    onPress={handleShareTrip}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Delete"
                    variant="danger"
                    size="sm"
                    onPress={() => handleDeleteSavedTrip(trip.id)}
                  />
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 56,
  },
  backBtn: {
    minWidth: touchTargets.minTouch,
    minHeight: touchTargets.minTouch,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  backBtnText: {
    fontSize: 22,
    color: colors.primary700,
    fontWeight: '700',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    minHeight: touchTargets.minTouch,
  },
  tabButtonActive: {
    borderBottomColor: colors.primary700,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary700,
    fontWeight: '700',
  },
  scrollInner: {
    padding: spacing.md,
    gap: spacing.md,
  },
  wizardCard: {
    gap: spacing.sm,
  },
  wizardTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  wizardDesc: {
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
    lineHeight: 20,
  },
  gpsActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm,
    minHeight: touchTargets.minTouch,
  },
  gpsActionBtnActive: {
    borderColor: colors.primary700,
    backgroundColor: colors.primary50,
  },
  gpsActionIcon: {
    fontSize: 18,
  },
  gpsActionText: {
    fontSize: typography.sizes.bodySm || 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  gpsActionTextActive: {
    color: colors.primary700,
    fontWeight: '700',
  },
  orDivider: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginVertical: spacing.xs,
  },
  originsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  wizardActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  selectedGhatHighlight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary50,
    borderWidth: 1,
    borderColor: colors.borderOrange,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  highlightGhatName: {
    fontSize: typography.sizes.body,
    fontWeight: '700',
    color: colors.primary700,
  },
  highlightGhatDistrict: {
    fontSize: 12,
    color: colors.textMuted,
  },
  ghatSelectionList: {
    maxHeight: 220,
  },
  ghatPickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    minHeight: touchTargets.minTouch,
  },
  ghatPickRowSelected: {
    backgroundColor: colors.primary50,
  },
  ghatPickName: {
    fontSize: typography.sizes.bodySm || 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  ghatPickNameSelected: {
    color: colors.primary700,
    fontWeight: '700',
  },
  ghatPickDistrict: {
    fontSize: 11,
    color: colors.textMuted,
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  horizontalScroll: {
    gap: spacing.xs,
  },
  modeChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  preferencesList: {
    gap: spacing.sm,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 36,
  },
  prefCheckbox: {
    fontSize: 18,
  },
  prefLabel: {
    fontSize: typography.sizes.bodySm || 14,
    color: colors.textPrimary,
  },
  successBanner: {
    backgroundColor: colors.status.successLight,
    borderWidth: 1,
    borderColor: colors.status.successBorder,
    borderRadius: radii.sm,
    padding: spacing.sm,
  },
  successBannerText: {
    fontSize: 13,
    color: colors.status.success,
    fontWeight: '700',
  },
  summaryBox: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  summaryLabel: {
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
  },
  summaryValue: {
    fontSize: typography.sizes.caption,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'right',
  },
  advisoryNotice: {
    backgroundColor: colors.status.warningLight,
    borderWidth: 1,
    borderColor: colors.status.warningBorder,
    borderRadius: radii.sm,
    padding: spacing.sm,
  },
  advisoryText: {
    fontSize: 12,
    color: colors.status.warning,
    lineHeight: 18,
  },
  summaryActionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  closureCard: {
    gap: 4,
  },
  closureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.status.warning,
  },
  closureText: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  directionsControlCard: {
    gap: spacing.sm,
  },
  destHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  destGhatTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  destGhatSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  modeSelectorRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  mapContainer: {
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapFallback: {
    height: 200,
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapFallbackText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  loadingRouteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  loadingRouteText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  resultCard: {
    gap: spacing.xs,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultDistance: {
    fontSize: typography.sizes.h2,
    fontWeight: '800',
    color: colors.primary700,
  },
  resultDuration: {
    fontSize: 13,
    color: colors.textMuted,
  },
  stepsList: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 4,
  },
  stepsHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  stepItemText: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  templesCard: {
    gap: spacing.sm,
  },
  templesHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  templeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  templeName: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  savedTripCard: {
    gap: spacing.sm,
  },
  savedTripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  savedTripDest: {
    fontSize: typography.sizes.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  savedTripOrigin: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  savedTripDate: {
    fontSize: 12,
    color: colors.primary700,
    fontWeight: '600',
    marginTop: 2,
  },
  savedTripActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
