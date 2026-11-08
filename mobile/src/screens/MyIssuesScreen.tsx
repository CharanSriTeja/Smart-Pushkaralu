import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { IssueService } from '../services/issueService';
import { IssueReport, IssueStatus } from '../types/issues';
import { colors } from '../theme/tokens';

const CATEGORY_ICONS: Record<string, string> = {
  sanitation: '🧹',
  water: '🚰',
  road: '🛣️',
  lighting: '💡',
  crowd: '👥',
  other: '⚠️',
};

const STATUS_CONFIG: Record<
  IssueStatus,
  { labelKey: string; color: string; bg: string }
> = {
  submitted: { labelKey: 'issues.status.submitted', color: '#D97706', bg: '#FEF3C7' },
  under_review: { labelKey: 'issues.status.under_review', color: '#EA580C', bg: '#FFEDD5' },
  in_progress: { labelKey: 'issues.status.in_progress', color: '#0284C7', bg: '#E0F2FE' },
  resolved: { labelKey: 'issues.status.resolved', color: '#16A34A', bg: '#DCFCE7' },
  rejected: { labelKey: 'issues.status.rejected', color: '#64748B', bg: '#F1F5F9' },
};

export default function MyIssuesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { fontFamily, fontFamilyBold } = useLanguage();

  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTicket, setSearchTicket] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved'>('all');

  async function loadMyIssues() {
    try {
      const data = await IssueService.getMyIssues();
      setIssues(data);
    } catch (err) {
      console.warn('Failed to load my issues:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMyIssues();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadMyIssues();
  };

  const handleSearchTicket = () => {
    if (!searchTicket.trim()) return;
    router.push(`/(app)/issues/${searchTicket.trim().toUpperCase()}` as any);
  };

  const filteredIssues = issues.filter((issue) => {
    if (statusFilter === 'active') {
      return ['submitted', 'under_review', 'in_progress'].includes(issue.status);
    }
    if (statusFilter === 'resolved') {
      return ['resolved', 'rejected'].includes(issue.status);
    }
    return true;
  });

  const renderIssueItem = ({ item }: { item: IssueReport }) => {
    const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.submitted;
    const catIcon = CATEGORY_ICONS[item.category] || '⚠️';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(app)/issues/${item.ticket_no}` as any)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.cardCategoryIcon}>{catIcon}</Text>
            <View>
              <Text style={[styles.cardTicketNo, { fontFamily: fontFamilyBold }]}>
                {item.ticket_no}
              </Text>
              <Text style={[styles.cardCategoryLabel, { fontFamily }]}>
                {t(`issues.categories.${item.category}`)}
              </Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusCfg.color, fontFamily: fontFamilyBold }]}>
              {t(statusCfg.labelKey)}
            </Text>
          </View>
        </View>

        <Text style={[styles.cardDescription, { fontFamily }]} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.cardFooter}>
          <Text style={[styles.cardDate, { fontFamily }]}>
            {new Date(item.created_at).toLocaleDateString()} • {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>

          {item.duplicate_count > 0 && (
            <View style={styles.duplicateTag}>
              <Text style={styles.duplicateTagText}>
                +{item.duplicate_count} similar reports
              </Text>
            </View>
          )}

          <Text style={styles.viewArrow}>View →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={[styles.headerTitle, { fontFamily: fontFamilyBold }]}>
            {t('issues.my_reports')}
          </Text>
          <Text style={[styles.headerSubtitle, { fontFamily }]}>
            Track filed grievances and status updates
          </Text>
        </View>
        <TouchableOpacity
          style={styles.reportNewBtn}
          onPress={() => router.push('/(app)/issues/report' as any)}
        >
          <Text style={[styles.reportNewBtnText, { fontFamily: fontFamilyBold }]}>
            + Report
          </Text>
        </TouchableOpacity>
      </View>

      {/* Ticket Lookup Box */}
      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <TextInput
            style={[styles.searchInput, { fontFamily }]}
            value={searchTicket}
            onChangeText={setSearchTicket}
            placeholder={t('issues.enter_ticket', 'Track Ticket (e.g. SP-2027-ABC123)')}
            placeholderTextColor="#94A3B8"
            autoCapitalize="characters"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearchTicket}>
            <Text style={[styles.searchBtnText, { fontFamily: fontFamilyBold }]}>
              {t('issues.track_btn', 'Track')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          {(['all', 'active', 'resolved'] as const).map((filter) => {
            const isActive = statusFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setStatusFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                    { fontFamily: isActive ? fontFamilyBold : fontFamily },
                  ]}
                >
                  {filter === 'all' ? 'All Reports' : filter === 'active' ? 'Active In Progress' : 'Resolved'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Content List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
        </View>
      ) : filteredIssues.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={[styles.emptyTitle, { fontFamily: fontFamilyBold }]}>
            {t('issues.empty.no_reports')}
          </Text>
          <Text style={[styles.emptySubtitle, { fontFamily }]}>
            {t('issues.empty.report_first')}
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => router.push('/(app)/issues/report' as any)}
          >
            <Text style={[styles.emptyBtnText, { fontFamily: fontFamilyBold }]}>
              + {t('issues.title')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredIssues}
          keyExtractor={(item) => item.id}
          renderItem={renderIssueItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: colors.primary[600],
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitleBox: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  reportNewBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  reportNewBtnText: {
    color: colors.primary[700],
    fontSize: 13,
    fontWeight: '700',
  },
  searchSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#1E293B',
  },
  searchBtn: {
    backgroundColor: colors.primary[600],
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: {
    backgroundColor: colors.primary[600],
  },
  filterChipText: {
    fontSize: 12,
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardCategoryIcon: {
    fontSize: 26,
  },
  cardTicketNo: {
    fontSize: 15,
    color: colors.primary[700],
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardCategoryLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  cardDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  duplicateTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  duplicateTagText: {
    fontSize: 10,
    color: '#B45309',
    fontWeight: '600',
  },
  viewArrow: {
    fontSize: 12,
    color: colors.primary[700],
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  emptyBtn: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

