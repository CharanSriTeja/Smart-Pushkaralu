import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { NewsService } from '../services/newsService';
import { NewsPost, NewsCategory } from '../types/news';
import { getLocalizedText } from '../utils/localized';

const CATEGORIES: { key: NewsCategory | 'all'; label: string; icon: string }[] = [
  { key: 'all', label: 'All News', icon: '📰' },
  { key: 'urgent', label: 'Urgent', icon: '🚨' },
  { key: 'advisory', label: 'Advisories', icon: '📢' },
  { key: 'facility', label: 'Facilities', icon: '🚻' },
  { key: 'traffic', label: 'Traffic', icon: '🚗' },
  { key: 'weather', label: 'Weather', icon: '🌧️' },
  { key: 'general', label: 'General', icon: 'ℹ️' },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  urgent: { bg: '#FEE2E2', text: '#991B1B' },
  advisory: { bg: '#FEF3C7', text: '#92400E' },
  facility: { bg: '#E0F2FE', text: '#075985' },
  traffic: { bg: '#F3E8FF', text: '#6B21A8' },
  weather: { bg: '#E0E7FF', text: '#3730A3' },
  general: { bg: '#F1F5F9', text: '#334155' },
};

export const NewsListScreen: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { language, fontFamily, fontFamilyBold } = useLanguage();

  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | 'all'>('all');
  const [news, setNews] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const loadNews = useCallback(async () => {
    try {
      const result = await NewsService.getNews({
        category: selectedCategory,
        language,
      });
      setNews(result.news);
      setIsOffline(result.isOffline);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, language]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const onRefresh = () => {
    setRefreshing(true);
    loadNews();
  };

  const renderNewsItem = ({ item }: { item: NewsPost }) => {
    const title = item.localized_title || getLocalizedText(item.title, language);
    const summary =
      item.localized_summary ||
      getLocalizedText(item.summary, language) ||
      getLocalizedText(item.content, language).substring(0, 140);
    const catStyle = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.general;

    const formattedDate = item.published_at
      ? new Date(item.published_at).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : null;

    return (
      <TouchableOpacity
        style={[
          styles.newsCard,
          item.is_pinned && styles.pinnedCard,
          item.category === 'urgent' && styles.urgentCard,
        ]}
        activeOpacity={0.8}
        onPress={() => router.push(`/(app)/news/${item.id}` as any)}
      >
        {/* Top Badges Row */}
        <View style={styles.cardHeader}>
          <View style={styles.badgeRow}>
            {item.is_pinned && (
              <View style={styles.pinnedBadge}>
                <Text style={styles.pinnedIcon}>📌</Text>
                <Text style={[styles.pinnedText, { fontFamily: fontFamilyBold }]}>PINNED</Text>
              </View>
            )}

            <View style={[styles.catBadge, { backgroundColor: catStyle.bg }]}>
              <Text style={[styles.catText, { color: catStyle.text, fontFamily: fontFamilyBold }]}>
                {item.category.toUpperCase()}
              </Text>
            </View>

            {item.is_official && (
              <View style={styles.officialBadge}>
                <Text style={styles.officialCheck}>✓</Text>
                <Text style={[styles.officialText, { fontFamily }]}>OFFICIAL</Text>
              </View>
            )}
          </View>

          {formattedDate && (
            <Text style={[styles.dateText, { fontFamily }]}>{formattedDate}</Text>
          )}
        </View>

        {/* Title */}
        <Text style={[styles.title, { fontFamily: fontFamilyBold }]} numberOfLines={2}>
          {title}
        </Text>

        {/* Summary */}
        {summary ? (
          <Text style={[styles.summary, { fontFamily }]} numberOfLines={3}>
            {summary}
          </Text>
        ) : null}

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          <Text style={[styles.readLink, { fontFamily: fontFamilyBold }]}>
            Read Announcement →
          </Text>
          {item.source_url && (
            <Text style={[styles.sourcePreview, { fontFamily }]} numberOfLines={1}>
              🏛️ {item.source_url.replace(/^https?:\/\//, '').split('/')[0]}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { fontFamily: fontFamilyBold }]}>
            Official News & Advisories
          </Text>
          <Text style={[styles.headerSub, { fontFamily }]}>
            Godavari Pushkaralu 2027 Information Desk
          </Text>
        </View>
      </View>

      {/* Offline Alert Strip */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineIcon}>📡</Text>
          <Text style={[styles.offlineText, { fontFamily }]}>
            Showing cached announcements (Offline Mode)
          </Text>
        </View>
      )}

      {/* Category Chips Bar */}
      <View style={styles.chipsContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(c) => c.key}
          contentContainerStyle={styles.chipsList}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item.key;
            return (
              <TouchableOpacity
                style={[styles.chip, isSelected && styles.activeChip]}
                onPress={() => setSelectedCategory(item.key)}
                activeOpacity={0.7}
              >
                <Text style={styles.chipIcon}>{item.icon}</Text>
                <Text
                  style={[
                    styles.chipText,
                    isSelected ? styles.activeChipText : styles.inactiveChipText,
                    { fontFamily: isSelected ? fontFamilyBold : fontFamily },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Content List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0F52BA" />
          <Text style={[styles.loadingText, { fontFamily }]}>Loading official advisories...</Text>
        </View>
      ) : (
        <FlatList
          data={news}
          keyExtractor={(item) => item.id}
          renderItem={renderNewsItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0F52BA']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📢</Text>
              <Text style={[styles.emptyTitle, { fontFamily: fontFamilyBold }]}>
                No Announcements Found
              </Text>
              <Text style={[styles.emptySub, { fontFamily }]}>
                There are currently no published advisories in this category.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#0F52BA',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 12,
    color: '#BFDBFE',
    marginTop: 2,
  },
  offlineBanner: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  offlineIcon: {
    fontSize: 14,
  },
  offlineText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },
  chipsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  chipsList: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeChip: {
    backgroundColor: '#0F52BA',
    borderColor: '#0F52BA',
  },
  chipIcon: {
    fontSize: 13,
  },
  chipText: {
    fontSize: 13,
  },
  activeChipText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inactiveChipText: {
    color: '#475569',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  newsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  pinnedCard: {
    borderColor: '#BFDBFE',
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 4,
    borderLeftColor: '#0F52BA',
  },
  urgentCard: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  pinnedIcon: {
    fontSize: 10,
  },
  pinnedText: {
    fontSize: 10,
    color: '#1E40AF',
    fontWeight: '800',
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  catText: {
    fontSize: 10,
    fontWeight: '800',
  },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DEF7EC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  officialCheck: {
    fontSize: 10,
    color: '#03543F',
    fontWeight: '800',
  },
  officialText: {
    fontSize: 10,
    color: '#03543F',
    fontWeight: '800',
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  title: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 6,
  },
  summary: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  readLink: {
    fontSize: 12,
    color: '#0F52BA',
    fontWeight: '700',
  },
  sourcePreview: {
    fontSize: 11,
    color: '#64748B',
    maxWidth: '50%',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 13,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
});
