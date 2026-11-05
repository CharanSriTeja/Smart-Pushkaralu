import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { theme } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';

interface ServiceItem {
  id: string;
  title: string;
  desc: string;
  location: string;
  time: string;
  icon: string;
}

const SAMPLE_SERVICES: ServiceItem[] = [
  {
    id: '1',
    title: 'Free Annadanam Counter',
    desc: 'Hot prasadam meals served to all pilgrims continuously.',
    location: 'Kotilingala Ghat Center',
    time: '11:00 AM - 09:00 PM',
    icon: '🍲',
  },
  {
    id: '2',
    title: 'Drinking Water & Buttermilk Distribution',
    desc: 'Municipal corporation safe RO drinking water and chilled buttermilk points.',
    location: 'All Ghat Entrances',
    time: '24 Hours',
    icon: '💧',
  },
  {
    id: '3',
    title: 'Senior Citizen & Divyangjan Wheelchair Assistance',
    desc: 'Volunteer escort service from battery car drop point to river bathing steps.',
    location: 'Main Information Center',
    time: '06:00 AM - 08:00 PM',
    icon: '♿',
  },
];

export default function SevaScreen() {
  const { t } = useTranslation();
  const { fontFamily, fontFamilyBold } = useLanguage();

  return (
    <Screen style={styles.screen}>
      <Text style={[styles.title, { fontFamily: fontFamilyBold }]}>
        {t('seva.title')}
      </Text>
      <Text style={[styles.subtitle, { fontFamily }]}>
        {t('seva.available_services')}
      </Text>

      <FlatList
        data={SAMPLE_SERVICES}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={styles.icon}>{item.icon}</Text>
              <View style={styles.headerText}>
                <Text style={[styles.cardTitle, { fontFamily: fontFamilyBold }]}>
                  {item.title}
                </Text>
                <Text style={[styles.cardTime, { fontFamily }]}>⏱️ {item.time}</Text>
              </View>
            </View>

            <Text style={[styles.cardDesc, { fontFamily }]}>{item.desc}</Text>
            <Text style={[styles.cardLocation, { fontFamily }]}>📍 {item.location}</Text>

            <Button
              title="Request Assistance"
              onPress={() => {}}
              variant="outline"
              size="small"
              style={styles.actionBtn}
            />
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  icon: {
    fontSize: 28,
  },
  headerText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: theme.typography.sizes.h3,
    color: theme.colors.textPrimary,
  },
  cardTime: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  cardDesc: {
    fontSize: theme.typography.sizes.bodySm,
    color: theme.colors.textSecondary,
    marginBottom: 6,
    lineHeight: 20,
  },
  cardLocation: {
    fontSize: theme.typography.sizes.bodySm,
    color: theme.colors.primary,
    marginBottom: 10,
  },
  actionBtn: {
    marginTop: 4,
  },
});

