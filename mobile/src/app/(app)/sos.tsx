import React from 'react';
import { View, Text, StyleSheet, Linking, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { theme } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';

export default function SOSScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { fontFamily, fontFamilyBold } = useLanguage();

  const handleCall = (number: string, title: string) => {
    Alert.alert(
      title,
      `Dial emergency helpline ${number}?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Call Now',
          style: 'destructive',
          onPress: () => {
            Linking.openURL(`tel:${number}`).catch(() => {
              Alert.alert('Calling unavailable', `Please dial ${number} on your phone.`);
            });
          },
        },
      ]
    );
  };

  return (
    <Screen scrollable style={styles.screen}>
      <View style={styles.topBar}>
        <Button
          title={`← ${t('common.back')}`}
          onPress={() => router.back()}
          variant="ghost"
          size="small"
          style={styles.backBtn}
        />
      </View>

      <View style={styles.banner}>
        <Text style={styles.bannerIcon}>🚨</Text>
        <Text style={[styles.bannerTitle, { fontFamily: fontFamilyBold }]}>
          {t('sos.sos_button')}
        </Text>
        <Text style={[styles.bannerDesc, { fontFamily }]}>
          {t('sos.safety_warning')}
        </Text>
      </View>

      {/* Emergency helpline cards */}
      <Card style={styles.emergencyCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>🚔</Text>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardTitle, { fontFamily: fontFamilyBold }]}>
              {t('sos.calling_police')}
            </Text>
            <Text style={[styles.cardDesc, { fontFamily }]}>
              District Police Control Room & Ghat Patrol
            </Text>
          </View>
        </View>
        <Button
          title="Call Police (100)"
          onPress={() => handleCall('100', 'Police Control Room')}
          variant="danger"
          style={styles.callBtn}
        />
      </Card>

      <Card style={styles.emergencyCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>🚑</Text>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardTitle, { fontFamily: fontFamilyBold }]}>
              {t('sos.calling_ambulance')}
            </Text>
            <Text style={[styles.cardDesc, { fontFamily }]}>
              Medical Emergency & Ghat First Aid Stations
            </Text>
          </View>
        </View>
        <Button
          title="Call Ambulance (108)"
          onPress={() => handleCall('108', 'Emergency Medical Service')}
          variant="danger"
          style={styles.callBtn}
        />
      </Card>

      <Card style={styles.emergencyCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>🛟</Text>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardTitle, { fontFamily: fontFamilyBold }]}>
              River Safety & Disaster Rescue (SDRF / NDRF)
            </Text>
            <Text style={[styles.cardDesc, { fontFamily }]}>
              Godavari River Divers & Boat Rescue Helpline
            </Text>
          </View>
        </View>
        <Button
          title="Call River Rescue (1077)"
          onPress={() => handleCall('1077', 'River Disaster Helpline')}
          variant="danger"
          style={styles.callBtn}
        />
      </Card>

      <Card style={styles.emergencyCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>📍</Text>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardTitle, { fontFamily: fontFamilyBold }]}>
              {t('sos.share_location')}
            </Text>
            <Text style={[styles.cardDesc, { fontFamily }]}>
              Transmits GPS coordinates to nearby volunteer stations.
            </Text>
          </View>
        </View>
        <Button
          title="Broadcast GPS Coordinates"
          onPress={() => Alert.alert('Location Transmitted', 'Your current location has been shared with ghat control.')}
          variant="outline"
          style={styles.callBtn}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: theme.spacing.md,
    backgroundColor: '#FEF2F2', // Soft red alert tone
  },
  topBar: {
    marginBottom: theme.spacing.sm,
  },
  backBtn: {
    alignSelf: 'flex-start',
    minWidth: 80,
  },
  banner: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  bannerIcon: {
    fontSize: 56,
    marginBottom: 8,
  },
  bannerTitle: {
    fontSize: theme.typography.sizes.hero,
    color: theme.colors.danger,
    letterSpacing: 1,
    textAlign: 'center',
  },
  bannerDesc: {
    fontSize: theme.typography.sizes.bodySm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    maxWidth: 320,
  },
  emergencyCard: {
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.danger,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  cardIcon: {
    fontSize: 32,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textPrimary,
  },
  cardDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  callBtn: {
    width: '100%',
  },
});

