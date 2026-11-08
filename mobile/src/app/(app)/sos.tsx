import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  acquireUserLocation,
  getLastKnownLocation,
  addLocationListener,
} from '../../utils/location';
// expo-sms is not available on web — conditionally load it
let SMS: any = null;
try {
  SMS = require('expo-sms');
} catch {
  // Web: SMS not available; we fall back to sms: URL scheme
}
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { theme } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import {
  SosService,
  SosType,
  ActiveSosAlert,
  SosUpdateItem,
  EmergencyContact,
} from '../../services/sosService';

export default function SOSScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { fontFamily, fontFamilyBold } = useLanguage();
  const { zone } = useLocalSearchParams<{ zone?: string }>();

  // State
  const [activeAlert, setActiveAlert] = useState<ActiveSosAlert | null>(null);
  const [updates, setUpdates] = useState<SosUpdateItem[]>([]);
  const [selectedType, setSelectedType] = useState<SosType | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [assignedInfo, setAssignedInfo] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number; accuracy?: number | null } | null>(
    getLastKnownLocation()
  );
  const [isAcquiringLocation, setIsAcquiringLocation] = useState(false);

  const countdownTimerRef = useRef<any>(null);
  const pollTimerRef = useRef<any>(null);

  // Sync with global location events
  useEffect(() => {
    return addLocationListener((coords) => {
      setUserCoords(coords);
    });
  }, []);

  const handleAcquireLocation = async () => {
    setIsAcquiringLocation(true);
    try {
      const res = await acquireUserLocation();
      if (res.granted && res.coords) {
        setUserCoords(res.coords);
      } else {
        const msg = res.error || 'Location permission was denied or unavailable.';
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.alert(`GPS Location: ${msg}\nPlease allow location permission in your browser to dispatch rescue teams to your exact spot.`);
        } else {
          Alert.alert('GPS Location', msg);
        }
      }
    } finally {
      setIsAcquiringLocation(false);
    }
  };

  // Load existing active alert & emergency contacts on mount
  useEffect(() => {
    SosService.getActiveAlert().then((saved) => {
      if (saved) {
        setActiveAlert(saved);
        startPolling(saved.id, saved.statusToken);
      }
    });

    SosService.getEmergencyContacts().then((list) => {
      setContacts(list);
    });

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  // Countdown timer logic
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      countdownTimerRef.current = setTimeout(() => {
        setCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (countdown === 0) {
      // Countdown reached 0: dispatch SOS
      executeDispatch(selectedType || 'general');
    }

    return () => {
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
    };
  }, [countdown, selectedType]);

  const handleCategoryPress = (type: SosType) => {
    setSelectedType(type);
    setCountdown(3); // Start 3-second countdown
    // If location is not yet acquired, immediately prompt during this user gesture
    if (!userCoords) {
      acquireUserLocation()
        .then((res) => {
          if (res.granted && res.coords) {
            setUserCoords(res.coords);
          }
        })
        .catch(() => {});
    }
  };

  const handleCancelCountdown = () => {
    setCountdown(null);
    setSelectedType(null);
    if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
  };

  async function executeDispatch(type: SosType) {
    setCountdown(null);
    setIsSubmitting(true);

    let coords: { lat: number | null; lng: number | null; accuracyM: number | null } = {
      lat: userCoords?.latitude ?? null,
      lng: userCoords?.longitude ?? null,
      accuracyM: userCoords?.accuracy ?? null,
    };

    if (coords.lat === null || coords.lng === null) {
      try {
        const locPromise = (async () => {
          const res = await acquireUserLocation();
          if (res.granted && res.coords) {
            setUserCoords(res.coords);
            return {
              lat: res.coords.latitude,
              lng: res.coords.longitude,
              accuracyM: res.coords.accuracy ?? null,
            };
          }
          return coords;
        })();

        const timeoutPromise = new Promise<{ lat: number | null; lng: number | null; accuracyM: number | null }>((resolve) => {
          setTimeout(() => resolve(coords), 5000);
        });

        coords = await Promise.race([locPromise, timeoutPromise]);
      } catch {
        // Proceed without GPS if error
      }
    }

    try {
      const result = await SosService.triggerSos({
        type,
        channel: zone ? 'qr' : 'app',
        lat: coords.lat,
        lng: coords.lng,
        accuracyM: coords.accuracyM,
        zoneCode: zone || null,
      });

      setIsSubmitting(false);

      if (result.queued) {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.alert(t('sos.offline_queued') || 'Network unavailable. Your SOS alert is queued and will sync automatically once connected.');
        } else {
          Alert.alert(
            t('sos.title'),
            t('sos.offline_queued') || 'Network unavailable. Your SOS alert is queued and will sync automatically once connected.',
            [{ text: 'OK' }]
          );
        }
      } else if (result.alert) {
        setActiveAlert(result.alert);
        startPolling(result.alert.id, result.alert.statusToken);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      const errMsg = `An error occurred: ${err?.message || 'Unknown error'}. Please dial 112 directly if this is a life-threatening emergency.`;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(errMsg);
      } else {
        Alert.alert('⚠️ SOS Alert', errMsg, [{ text: 'OK' }]);
      }
    }
  };

  function startPolling(alertId: string, statusToken: string) {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    let consecutiveErrors = 0;

    const poll = async () => {
      const data = await SosService.pollAlertStatus(alertId, statusToken);
      if (data && data.alert) {
        consecutiveErrors = 0;
        setActiveAlert((prev) => (prev ? { ...prev, status: data.alert.status } : null));
        setUpdates(data.updates || []);
        if (data.alert.assignedToName) {
          setAssignedInfo(`${data.alert.assignedToName}${data.alert.assignedToPhone ? ` (${data.alert.assignedToPhone})` : ''}`);
        }
        if (data.alert.status === 'resolved' || data.alert.status === 'false_alarm') {
          clearInterval(pollTimerRef.current);
          SosService.clearActiveAlert();
        }
      } else {
        consecutiveErrors++;
        // If alert was not found on server for 3 consecutive polls (e.g. stale from previous test or DB reset), clear it
        if (consecutiveErrors >= 3) {
          clearInterval(pollTimerRef.current);
          SosService.clearActiveAlert();
          setActiveAlert(null);
        }
      }
    };

    poll();
    pollTimerRef.current = setInterval(poll, 5000);
  }

  const handleClearAlert = async () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    await SosService.clearActiveAlert();
    setActiveAlert(null);
    setUpdates([]);
    setAssignedInfo(null);
  };

  const handleCancelAlert = () => {
    const cancelMsg = 'Are you sure you want to cancel this emergency alert? Please only cancel if this was an accidental trigger.';
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const ok = window.confirm(cancelMsg);
      if (ok && activeAlert) {
        SosService.cancelAlert(activeAlert.id, activeAlert.statusToken, 'User cancelled on mobile app');
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        handleClearAlert();
      }
      return;
    }

    Alert.alert(
      t('sos.actions.cancel_alert'),
      cancelMsg,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Confirm Cancel',
          style: 'destructive',
          onPress: async () => {
            if (activeAlert) {
              await SosService.cancelAlert(activeAlert.id, activeAlert.statusToken, 'User cancelled on mobile app');
              if (pollTimerRef.current) clearInterval(pollTimerRef.current);
              await handleClearAlert();
            }
          },
        },
      ]
    );
  };

  const handleSendSms = async () => {
    const typeKeyword = (selectedType || activeAlert?.type || 'GENERAL').toUpperCase();
    const zoneKeyword = zone || activeAlert?.zoneCode || '';
    const body = `SOS ${typeKeyword} ${zoneKeyword}`.trim();

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.location.href = `sms:112?body=${encodeURIComponent(body)}`;
      }
      return;
    }

    const isAvailable = SMS ? await SMS.isAvailableAsync() : false;
    if (isAvailable) {
      await SMS.sendSMSAsync(['112'], body);
    } else {
      Linking.openURL(`sms:112?body=${encodeURIComponent(body)}`).catch(() => {
        Alert.alert('SMS Unavailable', `Please send an SMS to 112 manually: "${body}"`);
      });
    }
  };

  const handleCall = (number: string, title: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        const ok = window.confirm(`${title}\n\nDial emergency helpline ${number}?`);
        if (ok) {
          window.location.href = `tel:${number}`;
        }
      }
      return;
    }

    Alert.alert(title, `Dial emergency helpline ${number}?`, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: 'Call Now',
        style: 'destructive',
        onPress: () => {
          Linking.openURL(`tel:${number}`).catch(() => {
            Alert.alert('Calling unavailable', `Please dial ${number} directly on your keypad.`);
          });
        },
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return { bg: '#FEF3C7', text: '#92400E' };
      case 'acknowledged':
        return { bg: '#DBEAFE', text: '#1E40AF' };
      case 'dispatched':
        return { bg: '#FFEDD5', text: '#9A3412' };
      case 'resolved':
        return { bg: '#DCFCE7', text: '#166534' };
      case 'false_alarm':
      default:
        return { bg: '#F1F5F9', text: '#475569' };
    }
  };

  return (
    <Screen scrollable style={styles.screen}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <Button
          title={`← ${t('common.back')}`}
          onPress={() => router.back()}
          variant="ghost"
          size="small"
          style={styles.backBtn}
        />
        {zone ? (
          <View style={styles.zoneTag}>
            <Text style={[styles.zoneTagText, { fontFamily: fontFamilyBold }]}>
              📍 Zone: {zone}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Prominent Official 112 Notice (Always displayed) */}
      <Card style={styles.officialNoticeCard}>
        <View style={styles.bannerRow}>
          <Text style={styles.badge112}>112</Text>
          <View style={styles.bannerTextCol}>
            <Text style={[styles.bannerMainTitle, { fontFamily: fontFamilyBold }]}>
              {t('sos.call_112_banner')}
            </Text>
            <Text style={[styles.disclaimerText, { fontFamily }]}>
              {t('sos.official_disclaimer')}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.btnDial112}
          onPress={() => handleCall('112', 'National Emergency Helpline')}
          accessibilityLabel="Dial 112 Now"
        >
          <Text style={styles.btnDial112Text}>📞 {t('sos.call_112_button')}</Text>
        </TouchableOpacity>
      </Card>

      {/* ACTIVE SOS TRACKING VIEW */}
      {activeAlert ? (
        <Card style={styles.activeAlertCard}>
          <View style={styles.activeHeader}>
            <Text style={styles.activeAlertIcon}>🚨</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.activeAlertTitle, { fontFamily: fontFamilyBold }]}>
                {t('sos.status.title')}
              </Text>
              <Text style={styles.alertRefText}>Ref: #{activeAlert.id.slice(0, 8)}</Text>
            </View>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: getStatusColor(activeAlert.status).bg },
              ]}
            >
              <Text
                style={[
                  styles.statusPillText,
                  { color: getStatusColor(activeAlert.status).text, fontFamily: fontFamilyBold },
                ]}
              >
                {t(`sos.status.${activeAlert.status}`) || activeAlert.status.toUpperCase()}
              </Text>
            </View>
          </View>

          {assignedInfo ? (
            <View style={styles.assignedBox}>
              <Text style={[styles.assignedLabel, { fontFamily: fontFamilyBold }]}>
                Field Responder:
              </Text>
              <Text style={styles.assignedValue}>{assignedInfo}</Text>
            </View>
          ) : null}

          {/* Updates feed */}
          {updates.length > 0 ? (
            <View style={styles.updatesFeed}>
              <Text style={[styles.updatesHeader, { fontFamily: fontFamilyBold }]}>Live Updates:</Text>
              {updates.map((u) => (
                <View key={u.id} style={styles.updateRow}>
                  <Text style={styles.updateTime}>
                    {new Date(u.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text style={[styles.updateNote, { fontFamily }]}>{u.note}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Action buttons */}
          <View style={styles.activeActionsRow}>
            <TouchableOpacity style={styles.btnActionSms} onPress={handleSendSms}>
              <Text style={styles.btnActionSmsText}>💬 {t('sos.actions.send_sms')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnActionCancel} onPress={handleCancelAlert}>
              <Text style={styles.btnActionCancelText}>{t('sos.actions.cancel_alert')}</Text>
            </TouchableOpacity>
          </View>

          {/* Dismiss & Start New Alert option */}
          <TouchableOpacity
            style={[styles.btnActionClear, { marginTop: 10 }]}
            onPress={handleClearAlert}
            activeOpacity={0.8}
          >
            <Text style={styles.btnActionClearText}>✕ Dismiss Alert / Start New SOS</Text>
          </TouchableOpacity>
        </Card>
      ) : (
        /* TRIGGER / CATEGORY SELECTION VIEW */
        <View style={styles.triggerContainer}>
          {/* Active Countdown Overlay Banner */}
          {countdown !== null ? (
            <Card style={styles.countdownBanner}>
              <Text style={styles.countdownNumber}>{countdown}</Text>
              <Text style={[styles.countdownText, { fontFamily: fontFamilyBold }]}>
                {t('sos.countdown_msg', {
                  type: t(`sos.categories.${selectedType}`) || selectedType,
                  seconds: countdown,
                })}
              </Text>
              <View style={styles.countdownActions}>
                <Button
                  title={t('sos.cancel_countdown')}
                  onPress={handleCancelCountdown}
                  variant="outline"
                  size="small"
                  style={{ minWidth: 100 }}
                />
                <Button
                  title={t('sos.send_now')}
                  onPress={() => executeDispatch(selectedType || 'general')}
                  variant="danger"
                  size="small"
                  style={{ minWidth: 100 }}
                />
              </View>
            </Card>
          ) : null}

          <Text style={[styles.categorySectionTitle, { fontFamily: fontFamilyBold }]}>
            {t('sos.title')}
          </Text>
          <Text style={[styles.categorySectionSubtitle, { fontFamily }]}>
            {t('sos.subtitle')}
          </Text>

          {/* Prominent GPS Location Status Card */}
          <Card style={[styles.gpsStatusCard, userCoords ? styles.gpsCardSuccess : styles.gpsCardWarning]}>
            <View style={styles.gpsRow}>
              <Text style={{ fontSize: 24 }}>{userCoords ? '📍' : '⚠️'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.gpsTitle, { fontFamily: fontFamilyBold }]}>
                  {userCoords ? 'GPS Location Acquired' : 'GPS Rescue Location Missing'}
                </Text>
                <Text style={[styles.gpsDesc, { fontFamily }]}>
                  {userCoords
                    ? `Coordinates: ${userCoords.latitude.toFixed(5)}, ${userCoords.longitude.toFixed(5)} (±${Math.round(userCoords.accuracy || 15)}m)`
                    : 'Emergency rescue teams need your GPS coordinates to locate you at the ghats.'}
                </Text>
              </View>
              {!userCoords && (
                <TouchableOpacity
                  style={styles.btnGpsAcquire}
                  onPress={handleAcquireLocation}
                  disabled={isAcquiringLocation}
                  accessibilityRole="button"
                >
                  {isAcquiringLocation ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.btnGpsAcquireText, { fontFamily: fontFamilyBold }]}>
                      Share GPS
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </Card>

          {/* Category Touch Targets (≥ 56dp height each) */}
          <TouchableOpacity
            style={[styles.categoryBtn, styles.catMedical]}
            onPress={() => handleCategoryPress('medical')}
            disabled={isSubmitting}
            accessibilityRole="button"
          >
            <Text style={styles.catIcon}>🚑</Text>
            <View style={styles.catTextCol}>
              <Text style={[styles.catTitle, { fontFamily: fontFamilyBold }]}>
                {t('sos.categories.medical')}
              </Text>
              <Text style={[styles.catDesc, { fontFamily }]}>
                {t('sos.categories.medical_desc')}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryBtn, styles.catPolice]}
            onPress={() => handleCategoryPress('police')}
            disabled={isSubmitting}
            accessibilityRole="button"
          >
            <Text style={styles.catIcon}>👮</Text>
            <View style={styles.catTextCol}>
              <Text style={[styles.catTitle, { fontFamily: fontFamilyBold }]}>
                {t('sos.categories.police')}
              </Text>
              <Text style={[styles.catDesc, { fontFamily }]}>
                {t('sos.categories.police_desc')}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryBtn, styles.catFire]}
            onPress={() => handleCategoryPress('fire')}
            disabled={isSubmitting}
            accessibilityRole="button"
          >
            <Text style={styles.catIcon}>🚒</Text>
            <View style={styles.catTextCol}>
              <Text style={[styles.catTitle, { fontFamily: fontFamilyBold }]}>
                {t('sos.categories.fire')}
              </Text>
              <Text style={[styles.catDesc, { fontFamily }]}>
                {t('sos.categories.fire_desc')}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryBtn, styles.catLost]}
            onPress={() => handleCategoryPress('lost_person')}
            disabled={isSubmitting}
            accessibilityRole="button"
          >
            <Text style={styles.catIcon}>🧒</Text>
            <View style={styles.catTextCol}>
              <Text style={[styles.catTitle, { fontFamily: fontFamilyBold }]}>
                {t('sos.categories.lost_person')}
              </Text>
              <Text style={[styles.catDesc, { fontFamily }]}>
                {t('sos.categories.lost_person_desc')}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryBtn, styles.catGeneral]}
            onPress={() => handleCategoryPress('general')}
            disabled={isSubmitting}
            accessibilityRole="button"
          >
            <Text style={styles.catIcon}>🆘</Text>
            <View style={styles.catTextCol}>
              <Text style={[styles.catTitle, { fontFamily: fontFamilyBold }]}>
                {t('sos.categories.general')}
              </Text>
              <Text style={[styles.catDesc, { fontFamily }]}>
                {t('sos.categories.general_desc')}
              </Text>
            </View>
          </TouchableOpacity>

          {isSubmitting ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={theme.colors.danger} />
              <Text style={styles.loadingText}>Dispatching emergency alert...</Text>
            </View>
          ) : null}

          {/* Privacy Disclaimer */}
          <Text style={[styles.gpsDisclaimer, { fontFamily }]}>
            ℹ️ {t('sos.gps_privacy_notice')}
          </Text>
        </View>
      )}

      {/* EMERGENCY CONTACTS LIST */}
      <View style={styles.contactsSection}>
        <Text style={[styles.contactsTitle, { fontFamily: fontFamilyBold }]}>
          {t('sos.actions.emergency_contacts')}
        </Text>
        {contacts.map((c) => {
          const labelText =
            typeof c.label === 'object'
              ? c.label.en || Object.values(c.label)[0]
              : String(c.label);
          return (
            <Card key={c.id} style={styles.contactCard}>
              <View style={styles.contactRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.contactLabel, { fontFamily: fontFamilyBold }]}>
                    {labelText}
                  </Text>
                  <Text style={styles.contactPhone}>{c.phone}</Text>
                </View>
                <TouchableOpacity
                  style={styles.contactCallBtn}
                  onPress={() => handleCall(c.phone, labelText)}
                >
                  <Text style={styles.contactCallBtnText}>Call</Text>
                </TouchableOpacity>
              </View>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: theme.spacing.md,
    backgroundColor: '#FFF5F5',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  backBtn: {
    alignSelf: 'flex-start',
    minWidth: 80,
  },
  zoneTag: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  zoneTagText: {
    color: '#3730A3',
    fontSize: 13,
  },
  officialNoticeCard: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
    borderWidth: 2,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  badge112: {
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerMainTitle: {
    fontSize: 16,
    color: '#991B1B',
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#7F1D1D',
    lineHeight: 16,
  },
  btnDial112: {
    backgroundColor: '#DC2626',
    minHeight: 56, // Touch target ≥ 56dp
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer', userSelect: 'none' } as any) : {}),
  },
  btnDial112Text: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  triggerContainer: {
    marginBottom: theme.spacing.lg,
  },
  countdownBanner: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 2,
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
  },
  countdownNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#DC2626',
  },
  countdownText: {
    fontSize: 16,
    color: '#92400E',
    marginVertical: 8,
    textAlign: 'center',
  },
  countdownActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  categorySectionTitle: {
    fontSize: 20,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  categorySectionSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 14,
  },
  gpsStatusCard: {
    padding: 12,
    marginBottom: 14,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  gpsCardSuccess: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  gpsCardWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gpsTitle: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '700',
  },
  gpsDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  btnGpsAcquire: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 84,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer', userSelect: 'none' } as any) : {}),
  },
  btnGpsAcquireText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  categoryBtn: {
    minHeight: 64, // Touch target ≥ 56dp
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer', userSelect: 'none' } as any) : {}),
  },
  catMedical: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  catPolice: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  catFire: {
    backgroundColor: '#FFEDD5',
    borderColor: '#F97316',
  },
  catLost: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  catGeneral: {
    backgroundColor: '#F3F4F6',
    borderColor: '#6B7280',
  },
  catIcon: {
    fontSize: 28,
  },
  catTextCol: {
    flex: 1,
  },
  catTitle: {
    fontSize: 16,
    color: '#111827',
  },
  catDesc: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 2,
  },
  gpsDisclaimer: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  loadingBox: {
    alignItems: 'center',
    marginVertical: 12,
  },
  loadingText: {
    marginTop: 6,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  // Active alert view styles
  activeAlertCard: {
    borderColor: '#DC2626',
    borderWidth: 2,
    padding: 16,
    marginBottom: theme.spacing.lg,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  activeAlertIcon: {
    fontSize: 32,
  },
  activeAlertTitle: {
    fontSize: 18,
    color: '#991B1B',
  },
  alertRefText: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusPillText: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
  assignedBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
  },
  assignedLabel: {
    fontSize: 12,
    color: '#475569',
  },
  assignedValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700',
    marginTop: 2,
  },
  updatesFeed: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
  },
  updatesHeader: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 6,
  },
  updateRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 3,
  },
  updateTime: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  updateNote: {
    fontSize: 12,
    color: '#1F2937',
    flex: 1,
  },
  activeActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  btnActionSms: {
    flex: 1,
    backgroundColor: '#4B5563',
    minHeight: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer', userSelect: 'none' } as any) : {}),
  },
  btnActionSmsText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  btnActionCancel: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    minHeight: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer', userSelect: 'none' } as any) : {}),
  },
  btnActionCancelText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13,
  },
  btnActionClear: {
    width: '100%',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    minHeight: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer', userSelect: 'none' } as any) : {}),
  },
  btnActionClearText: {
    color: '#4338CA',
    fontWeight: '700',
    fontSize: 12,
  },
  contactsSection: {
    marginBottom: theme.spacing.xl,
  },
  contactsTitle: {
    fontSize: 18,
    color: theme.colors.textPrimary,
    marginBottom: 10,
  },
  contactCard: {
    marginBottom: 8,
    padding: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactLabel: {
    fontSize: 14,
    color: '#111827',
  },
  contactPhone: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 2,
  },
  contactCallBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer', userSelect: 'none' } as any) : {}),
  },
  contactCallBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
