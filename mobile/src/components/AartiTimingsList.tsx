import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { GhatAartiTiming } from '../types/ghats';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedText } from '../utils/localized';

interface Props {
  timings?: GhatAartiTiming[];
}

export const AartiTimingsList: React.FC<Props> = ({ timings = [] }) => {
  const { t } = useTranslation();
  const { language, fontFamily, fontFamilyBold } = useLanguage();

  if (timings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { fontFamily }]}>
          {t('ghats.aarti.no_timings', 'Aarti timings will be announced by the temple administration.')}
        </Text>
      </View>
    );
  }

  const formatTime = (timeStr: string) => {
    try {
      const [hours, minutes] = timeStr.split(':');
      const h = parseInt(hours, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const formattedH = h % 12 || 12;
      return `${formattedH}:${minutes} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  return (
    <View style={styles.list}>
      {timings.map((aarti, idx) => {
        const name = getLocalizedText(aarti.name, language);
        const desc = getLocalizedText(aarti.description, language);
        const timeRange = `${formatTime(aarti.time_start)} - ${formatTime(aarti.time_end)}`;

        return (
          <View key={aarti.id || idx} style={styles.aartiCard}>
            <View style={styles.timeBadge}>
              <Text style={styles.fireIcon}>🪔</Text>
              <Text style={[styles.timeText, { fontFamily: fontFamilyBold }]}>{timeRange}</Text>
            </View>
            <View style={styles.details}>
              <Text style={[styles.aartiName, { fontFamily: fontFamilyBold }]}>{name}</Text>
              {desc ? <Text style={[styles.aartiDesc, { fontFamily }]}>{desc}</Text> : null}
              {aarti.days_of_week && (
                <Text style={[styles.frequency, { fontFamily }]}>• {aarti.days_of_week}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: 10,
    marginVertical: 6,
  },
  aartiCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF08A',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  timeBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 85,
  },
  fireIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  timeText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '800',
    textAlign: 'center',
  },
  details: {
    flex: 1,
  },
  aartiName: {
    fontSize: 14,
    color: '#78350F',
    fontWeight: '700',
  },
  aartiDesc: {
    fontSize: 12,
    color: '#92400E',
    marginTop: 2,
    lineHeight: 16,
  },
  frequency: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyContainer: {
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
  },
});

