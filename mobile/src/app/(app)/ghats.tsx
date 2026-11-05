import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { theme } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';

interface GhatItem {
  id: string;
  name: string;
  town: string;
  waterLevel: string;
  crowdStatus: 'low' | 'moderate' | 'high';
  isSafe: boolean;
}

const SAMPLE_GHATS: GhatItem[] = [
  { id: '1', name: 'Kotilingala Ghat', town: 'Rajahmundry', waterLevel: 'Normal (12.4m)', crowdStatus: 'moderate', isSafe: true },
  { id: '2', name: 'Pushkar Ghat', town: 'Rajahmundry', waterLevel: 'Normal (12.2m)', crowdStatus: 'high', isSafe: true },
  { id: '3', name: 'Saraswati Ghat', town: 'Rajahmundry', waterLevel: 'Safe (11.8m)', crowdStatus: 'low', isSafe: true },
  { id: '4', name: 'Gowthami Ghat', town: 'Kovvur', waterLevel: 'Normal (12.0m)', crowdStatus: 'low', isSafe: true },
  { id: '5', name: 'Bhadrachalam Main Ghat', town: 'Bhadrachalam', waterLevel: 'Normal (13.1m)', crowdStatus: 'moderate', isSafe: true },
];

export default function GhatsScreen() {
  const { t } = useTranslation();
  const { fontFamily, fontFamilyBold } = useLanguage();
  const [search, setSearch] = useState('');

  const filteredGhats = SAMPLE_GHATS.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.town.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Screen style={styles.screen}>
      <Text style={[styles.title, { fontFamily: fontFamilyBold }]}>
        {t('ghats.title')}
      </Text>

      <TextInput
        style={[styles.searchInput, { fontFamily }]}
        placeholder={t('ghats.search_placeholder')}
        placeholderTextColor={theme.colors.textMuted}
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filteredGhats}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.ghatCard}>
            <View style={styles.headerRow}>
              <Text style={[styles.ghatName, { fontFamily: fontFamilyBold }]}>
                {item.name}
              </Text>
              <View
                style={[
                  styles.badge,
                  item.crowdStatus === 'low'
                    ? styles.badgeLow
                    : item.crowdStatus === 'moderate'
                    ? styles.badgeMod
                    : styles.badgeHigh,
                ]}
              >
                <Text style={styles.badgeText}>{item.crowdStatus.toUpperCase()}</Text>
              </View>
            </View>

            <Text style={[styles.ghatTown, { fontFamily }]}>📍 {item.town}</Text>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { fontFamily }]}>
                {t('ghats.water_level')}:
              </Text>
              <Text style={[styles.infoValue, { fontFamily: fontFamilyBold }]}>
                {item.waterLevel}
              </Text>
            </View>

            <Button
              title={t('ghats.navigation')}
              onPress={() => {}}
              variant="outline"
              size="small"
              style={styles.cardButton}
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
    marginBottom: theme.spacing.md,
  },
  searchInput: {
    height: 48,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    fontSize: theme.typography.sizes.bodySm,
    marginBottom: theme.spacing.md,
  },
  list: {
    paddingBottom: 100,
  },
  ghatCard: {
    marginBottom: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  ghatName: {
    fontSize: theme.typography.sizes.h3,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeLow: {
    backgroundColor: '#DEF7EC',
  },
  badgeMod: {
    backgroundColor: '#FEF08A',
  },
  badgeHigh: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E293B',
  },
  ghatTown: {
    fontSize: theme.typography.sizes.bodySm,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: theme.typography.sizes.bodySm,
    color: theme.colors.textSecondary,
  },
  infoValue: {
    fontSize: theme.typography.sizes.bodySm,
    color: theme.colors.primary,
  },
  cardButton: {
    marginTop: 4,
  },
});

