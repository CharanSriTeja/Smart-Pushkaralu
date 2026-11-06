import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { GhatFacility } from '../types/ghats';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedText } from '../utils/localized';

interface Props {
  facilities?: GhatFacility[];
}

const FACILITY_ICONS: Record<string, string> = {
  changing_room: '🚪',
  drinking_water: '🚰',
  medical_camp: '🏥',
  police_post: '👮',
  parking: '🅿️',
  cloak_room: '🧳',
  prasad_counter: '🥣',
  toilet: '🚻',
};

export const FacilitiesGrid: React.FC<Props> = ({ facilities = [] }) => {
  const { t } = useTranslation();
  const { language, fontFamily, fontFamilyBold } = useLanguage();

  if (facilities.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { fontFamily }]}>
          Facility verification currently underway by district municipal teams.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {facilities.map((fac, idx) => {
        const icon = FACILITY_ICONS[fac.facility_type] || '✨';
        const title = t(`ghats.facilities_list.${fac.facility_type}`, fac.facility_type.replace('_', ' '));
        const detail = getLocalizedText(fac.details, language);

        return (
          <View key={fac.id || idx} style={styles.facilityItem}>
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>{icon}</Text>
            </View>
            <View style={styles.facilityInfo}>
              <View style={styles.titleRow}>
                <Text style={[styles.facilityTitle, { fontFamily: fontFamilyBold }]}>
                  {title}
                </Text>
                {fac.count > 1 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{fac.count}</Text>
                  </View>
                )}
              </View>
              {detail ? (
                <Text style={[styles.facilityDetail, { fontFamily }]}>{detail}</Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    gap: 10,
    marginVertical: 6,
  },
  facilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  icon: {
    fontSize: 18,
  },
  facilityInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  facilityTitle: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  countBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  countText: {
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '800',
  },
  facilityDetail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
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

