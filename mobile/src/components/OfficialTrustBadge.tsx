import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { RecordStatus } from '../types/ghats';
import { useLanguage } from '../context/LanguageContext';
import { formatVerifiedDate } from '../utils/localized';

interface Props {
  recordStatus: RecordStatus;
  officialSourceUrl?: string | null;
  verifiedAt?: string | null;
  showSourceButton?: boolean;
}

export const OfficialTrustBadge: React.FC<Props> = ({
  recordStatus,
  officialSourceUrl,
  verifiedAt,
  showSourceButton = true,
}) => {
  const { t } = useTranslation();
  const { language, fontFamily, fontFamilyBold } = useLanguage();

  // Strict Rule Check:
  // Must have recordStatus === 'officially_listed' AND officialSourceUrl must be present!
  const isOfficiallyApproved =
    recordStatus === 'officially_listed' &&
    typeof officialSourceUrl === 'string' &&
    officialSourceUrl.trim().length > 0;

  const handleOpenSource = async () => {
    if (officialSourceUrl) {
      try {
        await Linking.openURL(officialSourceUrl);
      } catch (err) {
        console.warn('Could not open source URL:', err);
      }
    }
  };

  if (isOfficiallyApproved) {
    return (
      <View style={styles.container}>
        <View style={[styles.badge, styles.approvedBadge]}>
          <Text style={styles.badgeIcon}>✓</Text>
          <Text style={[styles.badgeText, styles.approvedText, { fontFamily: fontFamilyBold }]}>
            {t('ghats.trust.official_badge', 'Official District Approved')}
          </Text>
        </View>

        {verifiedAt && (
          <Text style={[styles.verifiedDate, { fontFamily }]}>
            {t('ghats.trust.verified_date', { date: formatVerifiedDate(verifiedAt, language) })}
          </Text>
        )}

        {showSourceButton && officialSourceUrl && (
          <TouchableOpacity
            style={styles.sourceButton}
            onPress={handleOpenSource}
            accessibilityRole="link"
            activeOpacity={0.7}
          >
            <Text style={[styles.sourceButtonText, { fontFamily }]}>
              🌐 {t('ghats.trust.view_source', 'View Official Government Portal')} →
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (recordStatus === 'reported') {
    return (
      <View style={styles.container}>
        <View style={[styles.badge, styles.reportedBadge]}>
          <Text style={styles.badgeIcon}>👥</Text>
          <Text style={[styles.badgeText, styles.reportedText, { fontFamily: fontFamilyBold }]}>
            {t('ghats.trust.community_badge', 'Community Reported')}
          </Text>
        </View>
        <Text style={[styles.subNote, { fontFamily }]}>
          Awaiting inspection by district collectorate. Facilities and water safety may vary.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.badge, styles.unverifiedBadge]}>
        <Text style={styles.badgeIcon}>⚠️</Text>
        <Text style={[styles.badgeText, styles.unverifiedText, { fontFamily: fontFamilyBold }]}>
          {t('ghats.trust.unverified_badge', 'Unverified — Caution Advised')}
        </Text>
      </View>
      <Text style={[styles.subNote, { fontFamily }]}>
        No official government listing found. Exercise extreme caution; no verified life guards.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  approvedBadge: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  approvedText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
  },
  reportedBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  reportedText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '700',
  },
  unverifiedBadge: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  unverifiedText: {
    color: '#991B1B',
    fontSize: 12,
    fontWeight: '700',
  },
  badgeIcon: {
    fontSize: 13,
  },
  badgeText: {
    letterSpacing: 0.3,
  },
  verifiedDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  sourceButton: {
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  sourceButtonText: {
    fontSize: 13,
    color: '#0F52BA',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  subNote: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16,
  },
});

