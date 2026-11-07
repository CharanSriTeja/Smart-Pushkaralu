import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { acquireUserLocation } from '../utils/location';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { Ghat } from '../types/ghats';
import { GhatService } from '../services/ghatService';
import { getLocalizedText } from '../utils/localized';
import { ConditionDisclaimerBanner } from '../components/ConditionDisclaimerBanner';

// Conditionally import react-native-maps for cross-platform safety
let MapView: any = null;
let Marker: any = null;
let Callout: any = null;
let UrlTile: any = null;

try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  Callout = Maps.Callout;
  UrlTile = Maps.UrlTile;
} catch (err) {
  console.warn('react-native-maps not loaded in current environment');
}

const { width, height } = Dimensions.get('window');

// Default initial region focused around Godavari river basin in AP & Telangana
const INITIAL_REGION = {
  latitude: 17.0005,
  longitude: 81.7725,
  latitudeDelta: 1.5,
  longitudeDelta: 1.5,
};

export const GhatMapScreen: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { language, fontFamily, fontFamilyBold } = useLanguage();

  const mapRef = useRef<any>(null);
  const [ghats, setGhats] = useState<Ghat[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedGhat, setSelectedGhat] = useState<Ghat | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const res = await GhatService.getGhats();
        setGhats(res.ghats);
      } catch (err) {
        console.warn('Failed to load map ghats:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleCenterOnUser = async () => {
    try {
      const locResult = await acquireUserLocation();
      if (!locResult.granted || !locResult.coords) return;

      const coords = { lat: locResult.coords.latitude, lng: locResult.coords.longitude };
      setUserLocation(coords);

      mapRef.current?.animateToRegion({
        latitude: coords.lat,
        longitude: coords.lng,
        latitudeDelta: 0.15,
        longitudeDelta: 0.15,
      });
    } catch (err) {
      console.warn('Could not acquire user location:', err);
    }
  };

  const getMarkerColor = (ghat: Ghat) => {
    if (ghat.bathing_status === 'closed' || ghat.crowd_level === 'very_high') return '#DC2626'; // Red
    if (ghat.bathing_status === 'restricted' || ghat.crowd_level === 'high') return '#EA580C'; // Orange
    if (ghat.crowd_level === 'medium') return '#CA8A04'; // Amber
    return '#16A34A'; // Green
  };

  const handleGetDirections = (ghat: Ghat) => {
    const lat = Number(ghat.lat);
    const lng = Number(ghat.lng);
    const label = encodeURIComponent(getLocalizedText(ghat.name, language));
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    });
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
      }
    }).catch(() => {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top Floating Control Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: fontFamilyBold }]}>
          {t('ghats.view_map', 'Pushkaralu Ghats Map')}
        </Text>
        <TouchableOpacity onPress={() => router.push('/(app)/ghats' as any)} style={styles.listToggle}>
          <Text style={styles.listToggleText}>📋 {t('ghats.view_list', 'List')}</Text>
        </TouchableOpacity>
      </View>

      {/* Floating Disclaimer */}
      <View style={styles.disclaimerWrapper}>
        <ConditionDisclaimerBanner compact />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0F52BA" />
        </View>
      ) : MapView ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={INITIAL_REGION}
          showsUserLocation={!!userLocation}
          showsCompass
        >
          {UrlTile && (
            <UrlTile
              urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
              zIndex={-1}
            />
          )}
          {ghats.map((ghat) => {
            const name = getLocalizedText(ghat.name, language);
            const pinColor = getMarkerColor(ghat);

            return (
              <Marker
                key={ghat.id}
                coordinate={{ latitude: Number(ghat.lat), longitude: Number(ghat.lng) }}
                title={name}
                pinColor={pinColor}
                onPress={() => setSelectedGhat(ghat)}
              >
                <Callout tooltip onPress={() => router.push(`/(app)/ghats/${ghat.id}` as any)}>
                  <View style={styles.calloutCard}>
                    <Text style={[styles.calloutTitle, { fontFamily: fontFamilyBold }]}>{name}</Text>
                    <Text style={[styles.calloutDistrict, { fontFamily }]}>
                      {ghat.district} • {ghat.state}
                    </Text>
                    <View style={styles.calloutStatusRow}>
                      <Text style={styles.statusPill}>Status: {ghat.bathing_status}</Text>
                      <Text style={styles.statusPill}>Crowd: {ghat.crowd_level}</Text>
                    </View>
                    <Text style={styles.calloutAction}>Tap to view details →</Text>
                  </View>
                </Callout>
              </Marker>
            );
          })}
        </MapView>
      ) : (
        /* Fallback when MapView cannot render (e.g. mock or headless) */
        <View style={styles.fallbackContainer}>
          <Text style={[styles.fallbackTitle, { fontFamily: fontFamilyBold }]}>
            Map View
          </Text>
          <Text style={[styles.fallbackDesc, { fontFamily }]}>
            {ghats.length} Ghats mapped along River Godavari across Andhra Pradesh and Telangana.
          </Text>
          <TouchableOpacity
            style={styles.fallbackButton}
            onPress={() => router.push('/(app)/ghats' as any)}
          >
            <Text style={[styles.fallbackButtonText, { fontFamily: fontFamilyBold }]}>
              Open Ghats Directory
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Center on GPS button */}
      <TouchableOpacity
        style={styles.gpsFab}
        onPress={handleCenterOnUser}
        accessibilityRole="button"
        accessibilityLabel="Locate nearest ghat"
      >
        <Text style={styles.gpsIcon}>🎯</Text>
      </TouchableOpacity>

      {/* Bottom Sheet Card if Ghat is Selected */}
      {selectedGhat && (
        <View style={styles.bottomCard}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.selectedName, { fontFamily: fontFamilyBold }]}>
                {getLocalizedText(selectedGhat.name, language)}
              </Text>
              <Text style={[styles.selectedTown, { fontFamily }]}>
                {selectedGhat.district} ({selectedGhat.state})
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedGhat(null)} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[styles.directionsBtn, { flex: 1 }]}
              onPress={() => handleGetDirections(selectedGhat)}
            >
              <Text style={[styles.directionsBtnText, { fontFamily: fontFamilyBold }]}>
                🧭 {t('ghats.navigation', 'Directions')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewDetailBtn, { flex: 2 }]}
              onPress={() => router.push(`/(app)/ghats/${selectedGhat.id}` as any)}
            >
              <Text style={[styles.viewDetailText, { fontFamily: fontFamilyBold }]}>
                {t('ghats.view_details', 'Details & Crowd →')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 15,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    padding: 4,
  },
  backText: {
    fontSize: 22,
    color: '#0F52BA',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '700',
  },
  listToggle: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  listToggleText: {
    fontSize: 13,
    color: '#1D4ED8',
    fontWeight: '700',
  },
  disclaimerWrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 75,
    left: 16,
    right: 16,
    zIndex: 9,
  },
  map: {
    width,
    height,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calloutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    width: 220,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  calloutDistrict: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  calloutStatusRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  statusPill: {
    fontSize: 11,
    color: '#475569',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  calloutAction: {
    fontSize: 12,
    color: '#0F52BA',
    fontWeight: '700',
    marginTop: 8,
  },
  gpsFab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0F52BA',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 10,
  },
  gpsIcon: {
    fontSize: 24,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    zIndex: 11,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  selectedName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  selectedTown: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    fontSize: 16,
    color: '#94A3B8',
  },
  viewDetailBtn: {
    backgroundColor: '#0F52BA',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewDetailText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  directionsBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionsBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  fallbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fallbackTitle: {
    fontSize: 20,
    color: '#0F172A',
    fontWeight: '800',
    marginBottom: 8,
  },
  fallbackDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  fallbackButton: {
    backgroundColor: '#0F52BA',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  fallbackButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

