import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { GhatService } from '../services/ghatService';

interface Props {
  visible: boolean;
  ghatId: string;
  ghatName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const CrowdReportModal: React.FC<Props> = ({
  visible,
  ghatId,
  ghatName,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { fontFamily, fontFamilyBold } = useLanguage();

  const [selectedLevel, setSelectedLevel] = useState<'low' | 'medium' | 'high' | 'very_high'>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getDeviceFingerprint = async (): Promise<string> => {
    let fp = await SecureStore.getItemAsync('device_fingerprint_id');
    if (!fp) {
      fp = 'dev_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
      await SecureStore.setItemAsync('device_fingerprint_id', fp);
    }
    return fp;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Explicitly ask for GPS permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('common.error', 'Permission Required'),
          'GPS location access is required to verify that you are near the ghat to prevent false crowd reports.',
          [{ text: t('common.back', 'OK') }]
        );
        setIsSubmitting(false);
        return;
      }

      // 2. Fetch current GPS position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const fingerprint = await getDeviceFingerprint();

      // 3. Submit report to backend
      const result = await GhatService.submitCrowdReport({
        ghat_id: ghatId,
        reported_crowd_level: selectedLevel,
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        device_fingerprint: fingerprint,
      });

      if (result.success) {
        Alert.alert(
          t('ghats.crowd.title', 'Report Submitted'),
          result.data?.message?.en || t('ghats.crowd.report_success', 'Report verified and recorded!'),
          [
            {
              text: 'OK',
              onPress: () => {
                onSuccess();
                onClose();
              },
            },
          ]
        );
      } else {
        Alert.alert(t('common.error', 'Submission Failed'), result.error || 'Failed to submit report.');
      }
    } catch (err: any) {
      Alert.alert(t('common.error', 'Error'), err.message || 'Location could not be acquired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const crowdOptions: Array<{ level: 'low' | 'medium' | 'high' | 'very_high'; label: string; desc: string; color: string }> = [
    {
      level: 'low',
      label: t('ghats.crowd.low', 'Low Crowd (<30%)'),
      desc: 'Free movement, easy bathing access',
      color: '#16A34A',
    },
    {
      level: 'medium',
      label: t('ghats.crowd.medium', 'Moderate Flow (30-60%)'),
      desc: 'Normal queue, steady movement',
      color: '#CA8A04',
    },
    {
      level: 'high',
      label: t('ghats.crowd.high', 'Heavy Rush (60-85%)'),
      desc: 'Dense crowd, slow queue movement',
      color: '#EA580C',
    },
    {
      level: 'very_high',
      label: t('ghats.crowd.very_high', 'Peak Rush (>85%)'),
      desc: 'Barricades full, urgent caution advised',
      color: '#DC2626',
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={[styles.title, { fontFamily: fontFamilyBold }]}>
              {t('ghats.crowd.report_modal_title', 'Report Crowd Condition')}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.ghatLabel, { fontFamily }]}>
            Ghat: <Text style={{ fontFamily: fontFamilyBold }}>{ghatName}</Text>
          </Text>

          <Text style={[styles.subtitle, { fontFamily }]}>
            {t(
              'ghats.crowd.report_modal_subtitle',
              'Help fellow pilgrims by sharing live ground conditions. Must be within 1 km.'
            )}
          </Text>

          <View style={styles.optionsList}>
            {crowdOptions.map((opt) => {
              const isSelected = selectedLevel === opt.level;
              return (
                <TouchableOpacity
                  key={opt.level}
                  style={[
                    styles.optionCard,
                    isSelected && { borderColor: opt.color, backgroundColor: `${opt.color}10` },
                  ]}
                  onPress={() => setSelectedLevel(opt.level)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.radioCircle, isSelected && { borderColor: opt.color }]}>
                    {isSelected && <View style={[styles.radioInner, { backgroundColor: opt.color }]} />}
                  </View>
                  <View style={styles.optionContent}>
                    <Text
                      style={[
                        styles.optionLabel,
                        { fontFamily: fontFamilyBold, color: isSelected ? opt.color : '#1E293B' },
                      ]}
                    >
                      {opt.label}
                    </Text>
                    <Text style={[styles.optionDesc, { fontFamily }]}>{opt.desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[styles.submitButtonText, { fontFamily: fontFamilyBold }]}>
                {t('ghats.crowd.submit_report', 'Verify GPS & Submit Report')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    color: '#0F172A',
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 18,
    color: '#64748B',
  },
  ghatLabel: {
    fontSize: 14,
    color: '#0F52BA',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },
  optionsList: {
    gap: 10,
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  optionDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: '#0F52BA',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

