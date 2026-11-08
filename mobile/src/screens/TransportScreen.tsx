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
import {
  BusTransportData,
  RailTransportData,
  ShuttleTransportData,
  ExternalLink,
} from '../types/transport';
import { TransportService } from '../services/transportService';
import { getLocalizedText } from '../utils/localized';
import { theme } from '../theme';

type TransportTab = 'bus' | 'rail' | 'shuttle';

export const TransportScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; ghatName?: string }>();
  const ghatId = params.id;
  const passedGhatName = params.ghatName;

  const { t } = useTranslation();
  const { language, fontFamily, fontFamilyBold } = useLanguage();

  const [activeTab, setActiveTab] = useState<TransportTab>('bus');
  const [loading, setLoading] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(false);

  // Data states
  const [busData, setBusData] = useState<BusTransportData | null>(null);
  const [railData, setRailData] = useState<RailTransportData | null>(null);
  const [shuttleData, setShuttleData] = useState<ShuttleTransportData | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'bus') {
        const res = await TransportService.getBusTransport(ghatId);
        setBusData(res.data);
        setIsOffline(res.isOffline);
      } else if (activeTab === 'rail') {
        const res = await TransportService.getRailTransport(ghatId);
        setRailData(res.data);
        setIsOffline(res.isOffline);
      } else if (activeTab === 'shuttle') {
        const res = await TransportService.getShuttleTransport(ghatId);
        setShuttleData(res.data);
        setIsOffline(res.isOffline);
      }
    } catch (err) {
      console.warn('[TransportScreen] Failed loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [ghatId, activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenLink = async (link: ExternalLink) => {
    try {
      const supported = await Linking.canOpenURL(link.url);
      if (supported) {
        await Linking.openURL(link.url);
      } else {
        Alert.alert('Notice', `Please visit: ${link.url}`);
      }
    } catch {
      Alert.alert('Notice', `Unable to open browser. Please navigate to: ${link.url}`);
    }
  };

  const handleCall = (phone?: string | null) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Helpline', phone);
    });
  };

  const handleOpenMap = (url?: string) => {
    if (!url) return;
    Linking.openURL(url).catch(() => {});
  };

  const getGhatHeading = (): string => {
    if (passedGhatName) return passedGhatName;
    const activeGhat = busData?.ghat || railData?.ghat || shuttleData?.ghat;
    if (activeGhat?.name) {
      return getLocalizedText(activeGhat.name, language);
    }
    return language === 'te' ? 'పుష్కర్ ఘాట్ పరిసరాలు' : language === 'hi' ? 'पुष्कर घाट क्षेत्र' : 'Pushkar Ghat Area';
  };

  const currentDisclaimer =
    activeTab === 'bus'
      ? busData?.disclaimer
      : activeTab === 'rail'
      ? railData?.disclaimer
      : shuttleData?.disclaimer;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F52BA" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { fontFamily: fontFamilyBold }]} numberOfLines={1}>
            {language === 'te' ? 'రవాణా & ఉచిత షటిల్స్' : language === 'hi' ? 'परिवहन एवं शटल' : 'Transport & Shuttles'}
          </Text>
          <Text style={[styles.headerSubtitle, { fontFamily }]} numberOfLines={1}>
            📍 {getGhatHeading()}
          </Text>
        </View>
        {isOffline && (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineBadgeText}>Offline</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('bus')}
          style={[styles.tabButton, activeTab === 'bus' && styles.tabButtonActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'bus' }}
        >
          <Text style={styles.tabIcon}>🚌</Text>
          <Text style={[styles.tabText, activeTab === 'bus' && styles.tabTextActive, { fontFamily: fontFamilyBold }]}>
            {language === 'te' ? 'ఆర్టీసీ బస్సులు' : language === 'hi' ? 'बस सेवा' : 'RTC Buses'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('rail')}
          style={[styles.tabButton, activeTab === 'rail' && styles.tabButtonActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'rail' }}
        >
          <Text style={styles.tabIcon}>🚆</Text>
          <Text style={[styles.tabText, activeTab === 'rail' && styles.tabTextActive, { fontFamily: fontFamilyBold }]}>
            {language === 'te' ? 'రైల్వే స్టేషన్లు' : language === 'hi' ? 'ट्रेन सेवाएं' : 'Trains'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('shuttle')}
          style={[styles.tabButton, activeTab === 'shuttle' && styles.tabButtonActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'shuttle' }}
        >
          <Text style={styles.tabIcon}>🚐</Text>
          <Text style={[styles.tabText, activeTab === 'shuttle' && styles.tabTextActive, { fontFamily: fontFamilyBold }]}>
            {language === 'te' ? 'ఉచిత షటిల్స్' : language === 'hi' ? 'मुफ्त शटल' : 'Free Shuttles'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Body Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0F52BA" />
          <Text style={[styles.loadingText, { fontFamily }]}>
            {language === 'te' ? 'రవాణా వివరాలు లోడ్ అవుతున్నాయి...' : language === 'hi' ? 'परिवहन विवरण लोड हो रहा है...' : 'Loading transport options...'}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Condition Disclaimer Banner */}
          {currentDisclaimer && (
            <View style={styles.disclaimerCard}>
              <View style={styles.disclaimerHeader}>
                <Text style={styles.disclaimerIcon}>⚠️</Text>
                <Text style={[styles.disclaimerTitle, { fontFamily: fontFamilyBold }]}>
                  {language === 'te' ? 'పుష్కరాల రవాణా హెచ్చరిక' : language === 'hi' ? 'पुष्करालु यातायात सलाह' : 'Pushkaralu Transit Advisory'}
                </Text>
              </View>
              <Text style={[styles.disclaimerBody, { fontFamily }]}>
                {getLocalizedText(currentDisclaimer, language)}
              </Text>
            </View>
          )}

          {/* ========================================== */}
          {/* TAB 1: BUS TRANSIT & SPECIALS              */}
          {/* ========================================== */}
          {activeTab === 'bus' && busData && (
            <View>
              {/* Pushkaralu Special Buses */}
              {busData.special_services && busData.special_services.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { fontFamily: fontFamilyBold }]}>
                    🌟 {language === 'te' ? 'పుష్కరాల ప్రత్యేక ఎక్స్‌ప్రెస్ బస్సులు' : language === 'hi' ? 'पुष्करालु विशेष एक्सप्रेस बसें' : 'Pushkaralu Special RTC Fleets'}
                  </Text>
                  {busData.special_services.map((spl) => (
                    <View key={spl.id} style={styles.specialCard}>
                      <View style={styles.cardTopRow}>
                        <View style={styles.badgeCode}>
                          <Text style={styles.badgeCodeText}>{spl.service_code}</Text>
                        </View>
                        <View style={styles.operatorBadge}>
                          <Text style={styles.operatorBadgeText}>{spl.operator}</Text>
                        </View>
                      </View>

                      <Text style={[styles.cardTitle, { fontFamily: fontFamilyBold }]}>
                        {getLocalizedText(spl.service_title, language)}
                      </Text>

                      <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { fontFamily }]}>
                          📍 {getLocalizedText(spl.origin_city, language)} ➔ {getLocalizedText(spl.destination_town, language)}
                        </Text>
                      </View>

                      {spl.timings_description && (
                        <Text style={[styles.timingsDesc, { fontFamily }]}>
                          ⏱️ {getLocalizedText(spl.timings_description, language)}
                        </Text>
                      )}

                      {spl.booking_url && (
                        <TouchableOpacity
                          style={styles.primaryActionButton}
                          onPress={() => spl.booking_url && Linking.openURL(spl.booking_url)}
                          accessibilityRole="button"
                        >
                          <Text style={styles.primaryActionButtonText}>
                            🎫 {language === 'te' ? 'ఆర్టీసీ అధికారిక బుకింగ్' : language === 'hi' ? 'आधिकारिक आरटीसी बुकिंग' : 'Official RTC Booking Portal'} &rarr;
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Nearby Bus Stands & Transit Hubs */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { fontFamily: fontFamilyBold }]}>
                  🚏 {language === 'te' ? 'సమీపంలోని బస్ స్టేషన్లు & పార్కింగ్' : language === 'hi' ? 'निकटतम बस स्टैंड और पार्किंग' : 'Nearby Bus Stations & Hubs'}
                </Text>

                {busData.hubs.map((hub) => (
                  <View key={hub.id} style={styles.card}>
                    <View style={styles.cardTopRow}>
                      <View style={styles.hubTypeBadge}>
                        <Text style={styles.hubTypeBadgeText}>
                          {hub.hub_type === 'bus_stand' ? 'BUS STAND' : 'SATELLITE PARKING'}
                        </Text>
                      </View>
                      <View style={styles.distanceBadge}>
                        <Text style={styles.distanceBadgeText}>{hub.distance_km} km away</Text>
                      </View>
                    </View>

                    <Text style={[styles.cardTitle, { fontFamily: fontFamilyBold }]}>
                      {getLocalizedText(hub.name, language)}
                    </Text>

                    <View style={styles.travelTimesRow}>
                      <View style={styles.travelChip}>
                        <Text style={styles.travelChipText}>🚗 ~{hub.driving_time_minutes} mins drive</Text>
                      </View>
                      <View style={styles.travelChip}>
                        <Text style={styles.travelChipText}>🚶 ~{hub.walking_time_minutes} mins walk</Text>
                      </View>
                    </View>

                    <View style={styles.cardActionRow}>
                      {hub.phone && (
                        <TouchableOpacity
                          style={styles.outlineButton}
                          onPress={() => handleCall(hub.phone)}
                        >
                          <Text style={styles.outlineButtonText}>📞 Call Helpdesk</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.directionButton}
                        onPress={() => handleOpenMap(hub.google_maps_url)}
                      >
                        <Text style={styles.directionButtonText}>🧭 Directions</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>

              {/* Verified Official RTC Booking Links */}
              {busData.official_links && busData.official_links.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { fontFamily: fontFamilyBold }]}>
                    🔗 {language === 'te' ? 'అధికారిక ఆర్టీసీ పోర్టల్స్' : language === 'hi' ? 'आधिकारिक आरटीसी लिंक' : 'Official RTC Reservation Portals'}
                  </Text>
                  {busData.official_links.map((link) => (
                    <TouchableOpacity
                      key={link.id}
                      style={styles.linkCard}
                      onPress={() => handleOpenLink(link)}
                      accessibilityRole="button"
                    >
                      <View style={styles.linkCardContent}>
                        <Text style={[styles.linkTitle, { fontFamily: fontFamilyBold }]}>
                          {getLocalizedText(link.title, language)}
                        </Text>
                        <Text style={[styles.linkAuthority, { fontFamily }]}>
                          🛡️ {link.official_authority}
                        </Text>
                      </View>
                      <Text style={styles.linkArrow}>➔</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ========================================== */}
          {/* TAB 2: RAILWAY STATIONS & OFFICIAL LINKS   */}
          {/* ========================================== */}
          {activeTab === 'rail' && railData && (
            <View>
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { fontFamily: fontFamilyBold }]}>
                  🚆 {language === 'te' ? 'పుష్కరాల రైల్వే స్టేషన్లు & హాల్ట్స్' : language === 'hi' ? 'पुष्करालु रेलवे स्टेशन और हॉल्ट' : 'Pushkaralu Railway Stations & Halts'}
                </Text>

                {railData.stations.map((stn) => (
                  <View key={stn.id} style={styles.railCard}>
                    <View style={styles.cardTopRow}>
                      <View style={styles.railCodeBadge}>
                        <Text style={styles.railCodeBadgeText}>{stn.station_code}</Text>
                      </View>
                      <View style={styles.distanceBadge}>
                        <Text style={styles.distanceBadgeText}>{stn.distance_km} km</Text>
                      </View>
                    </View>

                    <Text style={[styles.cardTitle, { fontFamily: fontFamilyBold }]}>
                      {getLocalizedText(stn.station_name, language)}
                    </Text>

                    <View style={styles.railMetaRow}>
                      <Text style={[styles.railMetaText, { fontFamily }]}>
                        🚉 {stn.total_platforms} Platforms | {stn.zone} ({stn.division})
                      </Text>
                      {stn.has_pushkaralu_special_trains && (
                        <Text style={[styles.specialTrainText, { fontFamily: fontFamilyBold }]}>
                          ✨ Special Pushkaralu Stoppages Active
                        </Text>
                      )}
                    </View>

                    <View style={styles.travelTimesRow}>
                      <View style={styles.travelChip}>
                        <Text style={styles.travelChipText}>🚗 ~{stn.driving_time_minutes} mins</Text>
                      </View>
                      <View style={styles.travelChip}>
                        <Text style={styles.travelChipText}>🚶 ~{stn.walking_time_minutes} mins</Text>
                      </View>
                    </View>

                    <View style={styles.cardActionRow}>
                      <TouchableOpacity
                        style={styles.outlineButton}
                        onPress={() => handleCall(stn.helpdesk_phone || '139')}
                      >
                        <Text style={styles.outlineButtonText}>📞 Railway Helpline 139</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.directionButton}
                        onPress={() => handleOpenMap(stn.google_maps_url)}
                      >
                        <Text style={styles.directionButtonText}>🧭 Directions</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>

              {/* Official Indian Railways Links (CRIS / NTES / IRCTC / PNR) */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { fontFamily: fontFamilyBold }]}>
                  🛡️ {language === 'te' ? 'భారతీయ రైల్వే అధికారిక లింకులు' : language === 'hi' ? 'भारतीय रेलवे आधिकारिक पोर्टल' : 'Official Indian Railways Portals'}
                </Text>
                <Text style={[styles.securityNotice, { fontFamily }]}>
                  {language === 'te'
                    ? 'యాత్రికుల భద్రత కోసం అనధికార ఐఆర్‌సిటిసి స్క్రాపర్లు నిరోధించబడ్డాయి. అధికారిక పోర్టల్‌ను ఉపయోగించండి.'
                    : language === 'hi'
                    ? 'तीर्थयात्री सुरक्षा हेतु अनधिकृत आईआरसीटीसी स्क्रैपर्स प्रतिबंधित हैं। आधिकारिक पोर्टल का उपयोग करें।'
                    : 'To ensure accuracy and data safety, unofficial third-party train scrapers are disabled. Please use official CRIS & IRCTC links.'}
                </Text>

                {railData.official_links.map((link) => (
                  <TouchableOpacity
                    key={link.id}
                    style={styles.railLinkCard}
                    onPress={() => handleOpenLink(link)}
                    accessibilityRole="button"
                  >
                    <View style={styles.railLinkIconBox}>
                      <Text style={styles.railLinkIcon}>
                        {link.key.includes('pnr') ? '🎫' : link.key.includes('live') ? '📡' : link.key.includes('madad') ? '🆘' : '🚆'}
                      </Text>
                    </View>
                    <View style={styles.linkCardContent}>
                      <Text style={[styles.linkTitle, { fontFamily: fontFamilyBold }]}>
                        {getLocalizedText(link.title, language)}
                      </Text>
                      <Text style={[styles.linkAuthority, { fontFamily }]}>
                        {link.official_authority}
                      </Text>
                    </View>
                    <Text style={styles.linkArrow}>➔</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ========================================== */}
          {/* TAB 3: FREE PILGRIM SHUTTLES               */}
          {/* ========================================== */}
          {activeTab === 'shuttle' && shuttleData && (
            <View>
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { fontFamily: fontFamilyBold }]}>
                  🚐 {language === 'te' ? 'ఉచిత గ్రీన్ కారిడార్ షటిల్స్' : language === 'hi' ? 'मुफ्त ग्रीन कॉरिडोर शटल सेवा' : 'Free Green Corridor Shuttles'}
                </Text>

                {shuttleData.shuttle_routes.map((shuttle) => (
                  <View
                    key={shuttle.id}
                    style={[styles.shuttleCard, { borderLeftColor: shuttle.color_code || '#2E7D32' }]}
                  >
                    <View style={styles.cardTopRow}>
                      <View style={[styles.shuttleCodeBadge, { backgroundColor: shuttle.color_code || '#2E7D32' }]}>
                        <Text style={styles.shuttleCodeBadgeText}>{shuttle.route_code}</Text>
                      </View>
                      <View style={styles.freeBadge}>
                        <Text style={styles.freeBadgeText}>100% FREE</Text>
                      </View>
                    </View>

                    <Text style={[styles.cardTitle, { fontFamily: fontFamilyBold }]}>
                      {getLocalizedText(shuttle.route_name, language)}
                    </Text>

                    <View style={styles.shuttleCorridorBox}>
                      <Text style={[styles.corridorText, { fontFamily }]}>
                        🟢 <strong>From:</strong> {getLocalizedText(shuttle.origin_name, language)}
                      </Text>
                      <Text style={[styles.corridorText, { fontFamily }]}>
                        📍 <strong>To:</strong> {getLocalizedText(shuttle.destination_name, language)}
                      </Text>
                    </View>

                    <View style={styles.shuttleStatsRow}>
                      <View style={styles.statPill}>
                        <Text style={styles.statPillText}>⏱️ Every {shuttle.frequency_minutes} mins</Text>
                      </View>
                      {shuttle.accessible_for_elderly_disabled && (
                        <View style={styles.statPillAccessible}>
                          <Text style={styles.statPillAccessibleText}>♿ Elderly &amp; Disabled Friendly</Text>
                        </View>
                      )}
                    </View>

                    {/* Intermediate stops list */}
                    {shuttle.stops && shuttle.stops.length > 0 && (
                      <View style={styles.stopsBox}>
                        <Text style={[styles.stopsHeader, { fontFamily: fontFamilyBold }]}>
                          Boarding &amp; Halt Points ({shuttle.stops.length}):
                        </Text>
                        {shuttle.stops.map((stop) => (
                          <View key={stop.id} style={styles.stopItem}>
                            <Text style={styles.stopOrder}>{stop.stop_order}.</Text>
                            <Text style={[styles.stopName, { fontFamily }]}>
                              {getLocalizedText(stop.stop_name, language)}
                            </Text>
                            {stop.is_major_boarding_point && (
                              <Text style={styles.majorStopTag}>Main Boarding</Text>
                            )}
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
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
    backgroundColor: '#0F52BA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  backButtonText: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#E0F2FE',
    marginTop: 2,
  },
  offlineBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  offlineBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#0F52BA',
  },
  tabIcon: {
    fontSize: 16,
  },
  tabText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#0F52BA',
    fontWeight: '800',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  disclaimerCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  disclaimerIcon: {
    fontSize: 16,
  },
  disclaimerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  disclaimerBody: {
    fontSize: 12,
    lineHeight: 18,
    color: '#78350F',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  specialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderTopWidth: 4,
    borderTopColor: '#D97706',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  railCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderTopWidth: 4,
    borderTopColor: '#0F52BA',
  },
  shuttleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 6,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgeCode: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeCodeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  operatorBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  operatorBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
  },
  hubTypeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hubTypeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  railCodeBadge: {
    backgroundColor: '#0F52BA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  railCodeBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  shuttleCodeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  shuttleCodeBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  freeBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  freeBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#15803D',
  },
  distanceBadge: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  distanceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  infoRow: {
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  timingsDesc: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  travelTimesRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 8,
  },
  travelChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  travelChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  railMetaRow: {
    marginVertical: 4,
  },
  railMetaText: {
    fontSize: 12,
    color: '#475569',
  },
  specialTrainText: {
    fontSize: 12,
    color: '#059669',
    marginTop: 2,
  },
  cardActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  outlineButton: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  outlineButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  directionButton: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#0F52BA',
  },
  directionButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  primaryActionButton: {
    minHeight: 44,
    backgroundColor: '#D97706',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
  },
  primaryActionButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  linkCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  railLinkCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  railLinkIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  railLinkIcon: {
    fontSize: 18,
  },
  linkCardContent: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  linkAuthority: {
    fontSize: 11,
    color: '#059669',
    marginTop: 2,
  },
  linkArrow: {
    fontSize: 16,
    color: '#0F52BA',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  securityNotice: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
    lineHeight: 16,
  },
  shuttleCorridorBox: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
    marginVertical: 6,
    gap: 4,
  },
  corridorText: {
    fontSize: 12,
    color: '#334155',
  },
  shuttleStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  statPill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  statPillAccessible: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statPillAccessibleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6D28D9',
  },
  stopsBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  stopsHeader: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 4,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    gap: 6,
  },
  stopOrder: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    width: 16,
  },
  stopName: {
    fontSize: 12,
    color: '#1E293B',
    flex: 1,
  },
  majorStopTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0369A1',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
});

