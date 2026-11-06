import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GhatNotice } from '../types/ghats';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedText } from '../utils/localized';

interface Props {
  notices?: GhatNotice[];
}

export const NoticesBanner: React.FC<Props> = ({ notices = [] }) => {
  const { language, fontFamily, fontFamilyBold } = useLanguage();

  if (notices.length === 0) return null;

  return (
    <View style={styles.container}>
      {notices.map((notice, idx) => {
        const title = getLocalizedText(notice.title, language);
        const message = getLocalizedText(notice.message, language);

        const isEmergency = notice.severity === 'emergency';
        const isWarning = notice.severity === 'warning';

        const cardStyle = isEmergency
          ? styles.emergencyCard
          : isWarning
          ? styles.warningCard
          : styles.infoCard;

        const titleStyle = isEmergency
          ? styles.emergencyTitle
          : isWarning
          ? styles.warningTitle
          : styles.infoTitle;

        const textStyle = isEmergency
          ? styles.emergencyText
          : isWarning
          ? styles.warningText
          : styles.infoText;

        const icon = isEmergency ? '🚨' : isWarning ? '⚠️' : 'ℹ️';

        return (
          <View key={notice.id || idx} style={[styles.card, cardStyle]}>
            <Text style={styles.icon}>{icon}</Text>
            <View style={styles.content}>
              <Text style={[styles.title, titleStyle, { fontFamily: fontFamilyBold }]}>
                {title}
              </Text>
              <Text style={[styles.message, textStyle, { fontFamily }]}>{message}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginVertical: 6,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    gap: 10,
  },
  icon: {
    fontSize: 18,
    marginTop: 1,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    lineHeight: 17,
  },
  emergencyCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
  },
  emergencyTitle: {
    color: '#991B1B',
  },
  emergencyText: {
    color: '#B91C1C',
  },
  warningCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FBBF24',
  },
  warningTitle: {
    color: '#92400E',
  },
  warningText: {
    color: '#78350F',
  },
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  infoTitle: {
    color: '#1E40AF',
  },
  infoText: {
    color: '#1D4ED8',
  },
});

