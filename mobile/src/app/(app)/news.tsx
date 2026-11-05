import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { theme } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';

interface NewsItem {
  id: string;
  title: string;
  body: string;
  source: string;
  date: string;
  urgent?: boolean;
}

const SAMPLE_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'Godavari Water Discharge Steady at Dowleswaram Barrage',
    body: 'District authorities confirm adequate water flow across all primary ghats. Safety cordons and divers are stationed.',
    source: 'District Administration',
    date: 'Today, 08:30 AM',
    urgent: false,
  },
  {
    id: '2',
    title: 'Pushkar Ghat Designated One-Way Corridor for Peak Hours',
    body: 'To manage rush during Mahapushkaram snanam, entry is restricted to Main Street Gate and exit via Canal Road.',
    source: 'Traffic Police',
    date: 'Yesterday, 06:15 PM',
    urgent: true,
  },
  {
    id: '3',
    title: 'Free Electric Shuttles Operational from Outer Parking Hubs',
    body: 'Pilgrims parking vehicles at Diwancheruvu hub can board free municipal shuttles every 5 minutes.',
    source: 'RTC Special Control',
    date: 'Yesterday, 02:00 PM',
    urgent: false,
  },
];

export default function NewsScreen() {
  const { t } = useTranslation();
  const { fontFamily, fontFamilyBold } = useLanguage();

  return (
    <Screen style={styles.screen}>
      <Text style={[styles.title, { fontFamily: fontFamilyBold }]}>
        {t('news.title')}
      </Text>
      <Text style={[styles.subtitle, { fontFamily }]}>
        {t('news.official_announcements')}
      </Text>

      <FlatList
        data={SAMPLE_NEWS}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={[styles.card, item.urgent && styles.urgentCard]}>
            {item.urgent && (
              <View style={styles.urgentBanner}>
                <Text style={styles.urgentText}>⚠️ IMPORTANT ADVISORY</Text>
              </View>
            )}
            <Text style={[styles.newsTitle, { fontFamily: fontFamilyBold }]}>
              {item.title}
            </Text>
            <Text style={[styles.newsBody, { fontFamily }]}>{item.body}</Text>
            <View style={styles.footerRow}>
              <Text style={styles.metaText}>🏛️ {item.source}</Text>
              <Text style={styles.metaText}>{item.date}</Text>
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.sizes.h1,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.sizes.bodySm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  list: {
    paddingBottom: 100,
  },
  card: {
    marginBottom: theme.spacing.md,
  },
  urgentCard: {
    borderColor: '#F87171',
    borderWidth: 1.5,
  },
  urgentBanner: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B91C1C',
  },
  newsTitle: {
    fontSize: theme.typography.sizes.h3,
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  newsBody: {
    fontSize: theme.typography.sizes.bodySm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  metaText: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
});

