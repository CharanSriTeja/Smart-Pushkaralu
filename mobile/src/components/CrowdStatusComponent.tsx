import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CrowdStatus, CrowdLevel } from '../types/ghats';
import { useLanguage } from '../context/LanguageContext';
import { CrowdStatusBadge } from './CrowdStatusBadge';
import { getLocalizedText } from '../utils/localized';

interface Props {
  crowdStatus?: CrowdStatus | null;
  fallbackLevel?: CrowdLevel;
  onOpenReportModal: () => void;
}

export const CrowdStatusComponent: React.FC<Props> = ({
  crowdStatus,
  fallbackLevel = 'unknown',
  onOpenReportModal,
}) => {
  const { t } = useTranslation();
  const { language, fontFamily, fontFamilyBold } = useLanguage();

  const currentLevel = crowdStatus?.current_level || fallbackLevel;

  const getSourceLabel = () => {
    if (!crowdStatus) return t('ghats.crowd.source_official');
    switch (crowdStatus.source_type) {
      case 'official_override':
        return t('ghats.crowd.source_official', 'Official Control Room (Admin)');
      case 'crowdsourced_aggregate':
        return crowdStatus.recent_report_count > 0
          ? `${t('ghats.crowd.source_aggregate', 'Pilgrim Reports')} (${crowdStatus.recent_report_count})`
          : t('ghats.crowd.source_aggregate', 'Pilgrim Reports');
      case 'sensor_or_camera':
        return t('ghats.crowd.source_sensor', 'CCTV & Drone Surveillance');
      default:
        return t('ghats.crowd.source_official', 'District Estimate');
    }
  };

  const formattedTime = crowdStatus?.updated_at
    ? new Date(crowdStatus.updated_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const noteText = crowdStatus?.note ? getLocalizedText(crowdStatus.note, language) : '';

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { fontFamily: fontFamilyBold }]}>
          {t('ghats.crowd.title', 'Live Crowd Status')}
        </Text>
        {formattedTime ? (
          <Text style={[styles.timeText, { fontFamily }]}>
            {t('ghats.crowd.updated_at', { time: formattedTime })}
          </Text>
        ) : null}
      </View>

      <View style={styles.badgeRow}>
        <CrowdStatusBadge level={currentLevel} size="medium" />
        <View style={styles.sourcePill}>
          <Text style={[styles.sourceText, { fontFamily }]}>📡 {getSourceLabel()}</Text>
        </View>
      </View>

      {noteText ? (
        <Text style={[styles.noteText, { fontFamily }]}>💬 {noteText}</Text>
      ) : null}

      <TouchableOpacity
        style={styles.reportButton}
        onPress={onOpenReportModal}
        accessibilityRole="button"
        activeOpacity={0.8}
      >
        <Text style={[styles.reportButtonText, { fontFamily: fontFamilyBold }]}>
          📍 {t('ghats.crowd.report_btn', 'Report Current Crowd Here')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '700',
  },
  timeText: {
    fontSize: 12,
    color: '#64748B',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  sourcePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  sourceText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  noteText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 14,
  },
  reportButton: {
    backgroundColor: '#0F52BA',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

