import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { acquireUserLocation, getLastKnownLocation } from '../utils/location';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { IssueService } from '../services/issueService';
import { IssueCategory, LocationType } from '../types/issues';

interface CategoryItem {
  id: IssueCategory;
  icon: string;
  labelKey: string;
  color: string;
  bgColor: string;
}

const CATEGORIES: CategoryItem[] = [
  { id: 'sanitation', icon: '🧹', labelKey: 'issues.categories.sanitation', color: '#D97706', bgColor: '#FEF3C7' },
  { id: 'water', icon: '🚰', labelKey: 'issues.categories.water', color: '#0284C7', bgColor: '#E0F2FE' },
  { id: 'road', icon: '🛣️', labelKey: 'issues.categories.road', color: '#4B5563', bgColor: '#F3F4F6' },
  { id: 'lighting', icon: '💡', labelKey: 'issues.categories.lighting', color: '#CA8A04', bgColor: '#FEF9C3' },
  { id: 'crowd', icon: '👥', labelKey: 'issues.categories.crowd', color: '#DC2626', bgColor: '#FEE2E2' },
  { id: 'other', icon: '⚠️', labelKey: 'issues.categories.other', color: '#7C3AED', bgColor: '#EDE9FE' },
];

export default function ReportIssueScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { fontFamily, fontFamilyBold } = useLanguage();

  const [category, setCategory] = useState<IssueCategory>('sanitation');
  const [description, setDescription] = useState('');
  const [locationType, setLocationType] = useState<LocationType>('gps');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [qrZoneId, setQrZoneId] = useState('');
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success / Duplicate modal state
  const [submissionResult, setSubmissionResult] = useState<{
    ticket_no: string;
    is_duplicate: boolean;
    duplicate_of?: string;
    message?: string;
  } | null>(null);

  // Auto-fetch GPS on load
  useEffect(() => {
    detectLocation();
  }, []);

  async function detectLocation() {
    const cached = getLastKnownLocation();
    if (cached) {
      setLat(cached.latitude);
      setLng(cached.longitude);
    }

    setIsDetectingGps(true);
    try {
      const locResult = await acquireUserLocation();
      if (!locResult.granted || !locResult.coords) {
        if (!cached) {
          // Default to Godavari Rajahmundry ghats coordinates
          setLat(16.989065);
          setLng(81.775412);
        }
        setIsDetectingGps(false);
        return;
      }

      setLat(locResult.coords.latitude);
      setLng(locResult.coords.longitude);
    } catch {
      if (!cached) {
        // Fallback coordinate
        setLat(16.989065);
        setLng(81.775412);
      }
    } finally {
      setIsDetectingGps(false);
    }
  };

  const handlePickPhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Media library access is needed to attach a photo.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert('Photo Error', err.message || 'Failed to select photo');
    }
  };

  const handleTakePhoto = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web browsers do not support native camera launch; fallback to file picker
        return handlePickPhoto();
      }

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to capture live grievance photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert('Camera Error', err.message || 'Failed to capture photo');
    }
  };

  const handleSubmit = async () => {
    if (description.trim().length < 5) {
      Alert.alert('Incomplete Description', 'Please provide at least 5 characters describing the issue.');
      return;
    }

    const reportLat = lat || 16.989065;
    const reportLng = lng || 81.775412;

    setIsSubmitting(true);
    try {
      let uploadedPhotoUrl: string | null = null;
      if (photoUri) {
        try {
          uploadedPhotoUrl = await IssueService.uploadPhoto(photoUri);
        } catch (uploadErr: any) {
          console.warn('Photo upload error, proceeding with report:', uploadErr);
        }
      }

      const result = await IssueService.reportIssue({
        category,
        description: description.trim(),
        location_type: locationType,
        lat: reportLat,
        lng: reportLng,
        qr_zone_id: locationType === 'qr_zone' ? qrZoneId : undefined,
        photo_url: uploadedPhotoUrl,
      });

      setSubmissionResult(result);
    } catch (err: any) {
      Alert.alert('Submission Failed', err.message || 'Could not submit issue report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submissionResult) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <View style={[styles.resultCard, submissionResult.is_duplicate && styles.duplicateCard]}>
            <Text style={styles.resultBadgeIcon}>
              {submissionResult.is_duplicate ? '📍' : '✅'}
            </Text>

            <Text style={[styles.resultTitle, { fontFamily: fontFamilyBold }]}>
              {submissionResult.is_duplicate
                ? t('issues.alerts.duplicate_title')
                : t('issues.alerts.success_title')}
            </Text>

            <Text style={[styles.resultSubtitle, { fontFamily }]}>
              {submissionResult.is_duplicate
                ? submissionResult.message || t('issues.alerts.duplicate_msg')
                : 'Your report has been logged with the Pushkaralu Municipal & Police Command Desk.'}
            </Text>

            <View style={styles.ticketPill}>
              <Text style={[styles.ticketPillLabel, { fontFamily }]}>
                {t('issues.alerts.ticket_number', 'Ticket Number')}
              </Text>
              <Text style={styles.ticketPillValue}>
                {submissionResult.ticket_no}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => {
                router.replace(`/(app)/issues/${submissionResult.ticket_no}` as any);
              }}
            >
              <Text style={[styles.primaryBtnText, { fontFamily: fontFamilyBold }]}>
                {t('issues.alerts.view_status')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => router.replace('/(app)' as any)}
            >
              <Text style={[styles.secondaryBtnText, { fontFamily }]}>
                {t('issues.alerts.back_home')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.helplineBanner}>
            <Text style={styles.helplineIcon}>🚨</Text>
            <Text style={[styles.helplineText, { fontFamily }]}>
              {t('issues.alerts.helpline_disclaimer')}
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={[styles.headerTitle, { fontFamily: fontFamilyBold }]}>
            {t('issues.title')}
          </Text>
          <Text style={[styles.headerSubtitle, { fontFamily }]}>
            {t('issues.subtitle')}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.myReportsBtn}
          onPress={() => router.push('/(app)/issues' as any)}
        >
          <Text style={[styles.myReportsBtnText, { fontFamily: fontFamilyBold }]}>
            {t('issues.my_reports')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Category Selection with Large Tap Targets */}
        <Text style={[styles.sectionHeading, { fontFamily: fontFamilyBold }]}>
          {t('issues.select_category')}
        </Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => {
            const isSelected = category === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryCard,
                  { backgroundColor: cat.bgColor },
                  isSelected && styles.categoryCardSelected,
                ]}
                onPress={() => setCategory(cat.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.categoryLabel,
                    { fontFamily: isSelected ? fontFamilyBold : fontFamily },
                    isSelected && { color: '#0F52BA' },
                  ]}
                  numberOfLines={2}
                >
                  {t(cat.labelKey)}
                </Text>
                {isSelected && <View style={styles.selectedTick}><Text style={styles.tickText}>✓</Text></View>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Location Section */}
        <Text style={[styles.sectionHeading, { fontFamily: fontFamilyBold, marginTop: 24 }]}>
          {t('issues.location.title')}
        </Text>
        <View style={styles.locationTypeRow}>
          <TouchableOpacity
            style={[styles.locationTypePill, locationType === 'gps' && styles.locationTypePillActive]}
            onPress={() => {
              setLocationType('gps');
              detectLocation();
            }}
          >
            <Text style={[styles.locationTypePillText, locationType === 'gps' && styles.locationTypePillTextActive, { fontFamily }]}>
              📍 {t('issues.location.gps')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.locationTypePill, locationType === 'qr_zone' && styles.locationTypePillActive]}
            onPress={() => setLocationType('qr_zone')}
          >
            <Text style={[styles.locationTypePillText, locationType === 'qr_zone' && styles.locationTypePillTextActive, { fontFamily }]}>
              🏷️ {t('issues.location.qr_zone')}
            </Text>
          </TouchableOpacity>
        </View>

        {locationType === 'gps' ? (
          <View style={styles.gpsDisplayBox}>
            <View style={styles.gpsCoordsRow}>
              <Text style={styles.gpsIcon}>🌐</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.gpsLabel, { fontFamily: fontFamilyBold }]}>
                  {isDetectingGps ? t('issues.location.detecting') : t('issues.location.detected')}
                </Text>
                <Text style={styles.gpsCoords}>
                  {lat && lng ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : '16.989065, 81.775412 (Kotilingala Ghat)'}
                </Text>
              </View>
              <TouchableOpacity style={styles.refreshGpsBtn} onPress={detectLocation} disabled={isDetectingGps}>
                {isDetectingGps ? (
                  <ActivityIndicator size="small" color="#0F52BA" />
                ) : (
                  <Text style={styles.refreshGpsText}>🔄</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.zoneInputBox}>
            <TextInput
              style={[styles.input, { fontFamily }]}
              value={qrZoneId}
              onChangeText={setQrZoneId}
              placeholder={t('issues.location.zone_placeholder')}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        )}

        {/* Description Input */}
        <Text style={[styles.sectionHeading, { fontFamily: fontFamilyBold, marginTop: 24 }]}>
          {t('issues.form.description_label')} *
        </Text>
        <TextInput
          style={[styles.textArea, { fontFamily }]}
          value={description}
          onChangeText={setDescription}
          placeholder={t('issues.form.description_placeholder')}
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Photo Attachment */}
        <Text style={[styles.sectionHeading, { fontFamily: fontFamilyBold, marginTop: 24 }]}>
          {t('issues.form.photo_label')}
        </Text>
        {photoUri ? (
          <View style={styles.photoPreviewCard}>
            <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
            <TouchableOpacity style={styles.removePhotoBtn} onPress={() => setPhotoUri(null)}>
              <Text style={styles.removePhotoText}>✕ {t('issues.form.remove_photo')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoActionRow}>
            {Platform.OS !== 'web' && (
              <TouchableOpacity style={styles.photoBtn} onPress={handleTakePhoto}>
                <Text style={styles.photoBtnIcon}>📷</Text>
                <Text style={[styles.photoBtnText, { fontFamily }]}>{t('issues.form.take_photo')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.photoBtn} onPress={handlePickPhoto}>
              <Text style={styles.photoBtnIcon}>🖼️</Text>
              <Text style={[styles.photoBtnText, { fontFamily }]}>{t('issues.form.choose_gallery')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[styles.submitButtonText, { fontFamily: fontFamilyBold }]}>
              {t('issues.form.submit_btn')}
            </Text>
          )}
        </TouchableOpacity>

        {/* Helpline Notice */}
        <View style={styles.helplineBanner}>
          <Text style={styles.helplineIcon}>🚨</Text>
          <Text style={[styles.helplineText, { fontFamily }]}>
            {t('issues.alerts.helpline_disclaimer')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#0F52BA',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitleBox: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  myReportsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  myReportsBtnText: {
    color: '#0F52BA',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeading: {
    fontSize: 15,
    color: '#1E293B',
    marginBottom: 10,
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  categoryCard: {
    width: '48%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    position: 'relative',
  },
  categoryCardSelected: {
    borderColor: '#0F52BA',
    backgroundColor: '#EFF6FF',
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 13,
    color: '#1E293B',
    textAlign: 'center',
  },
  selectedTick: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0F52BA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  locationTypeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  locationTypePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
  },
  locationTypePillActive: {
    backgroundColor: '#0F52BA',
  },
  locationTypePillText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  locationTypePillTextActive: {
    color: '#FFFFFF',
  },
  gpsDisplayBox: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gpsCoordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gpsIcon: {
    fontSize: 22,
  },
  gpsLabel: {
    fontSize: 13,
    color: '#1E293B',
  },
  gpsCoords: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  refreshGpsBtn: {
    padding: 8,
  },
  refreshGpsText: {
    fontSize: 16,
  },
  zoneInputBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  input: {
    padding: 12,
    fontSize: 14,
    color: '#1E293B',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    fontSize: 14,
    color: '#1E293B',
    minHeight: 90,
  },
  photoActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photoBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBtnIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  photoBtnText: {
    fontSize: 12,
    color: '#475569',
  },
  photoPreviewCard: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#000000',
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: 180,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  removePhotoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#0F52BA',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
    shadowColor: '#0F52BA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  helplineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    padding: 12,
    marginTop: 20,
    gap: 10,
  },
  helplineIcon: {
    fontSize: 20,
  },
  helplineText: {
    flex: 1,
    fontSize: 11,
    color: '#991B1B',
    lineHeight: 16,
  },
  // Result state
  resultContainer: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  resultCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  duplicateCard: {
    borderColor: '#FED7AA',
  },
  resultBadgeIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 20,
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  ticketPill: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  ticketPillLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  ticketPillValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F52BA',
    letterSpacing: 1.5,
  },
  primaryBtn: {
    backgroundColor: '#0F52BA',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  secondaryBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
});

