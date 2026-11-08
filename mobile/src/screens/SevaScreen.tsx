import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SevaService } from '../services/sevaService';
import { SevaVideoItem, SevaCategory } from '../types/seva';
import { ClickToLoadYouTubePlayer } from '../components/ClickToLoadYouTubePlayer';

const CATEGORIES: Array<{ id: SevaCategory; en: string; te: string; hi: string; icon: string }> = [
  { id: 'all', en: 'All Events', te: 'అన్ని విశేషాలు', hi: 'सभी कार्यक्रम', icon: '🌟' },
  { id: 'aarthi', en: 'Godavari Harathi', te: 'గోదావరి హారతి', hi: 'गोदावरी महा आरती', icon: '🪔' },
  { id: 'pooja', en: 'Pujas & Rituals', te: 'పూజలు & హోమాలు', hi: 'पूजा एवं अनुष्ठान', icon: '🙏' },
  { id: 'cultural', en: 'Cultural & Music', te: 'సాంస్కృతిక & భజనలు', hi: 'सांस्कृतिक एवं संगीत', icon: '🎭' },
  { id: 'snanam', en: 'Holy Snanam Guides', te: 'పుణ్యస్నాన పద్ధతులు', hi: 'पुण्य स्नान विधि', icon: '🌊' },
  { id: 'live_darshan', en: 'Live Darshan', te: 'ప్రత్యక్ష దర్శనం', hi: 'सीधा दर्शन', icon: '🔴' },
];

export const SevaScreen: React.FC = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';
  const router = useRouter();

  const [videos, setVideos] = useState<SevaVideoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<SevaCategory>('all');

  const fetchVideos = useCallback(async () => {
    try {
      const res = await SevaService.getVideos({
        category: selectedCategory === 'all' ? undefined : selectedCategory,
      });
      setVideos(res.data);
      setIsOffline(res.isOffline);
    } catch (err) {
      console.warn('[SevaScreen] Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    setLoading(true);
    fetchVideos();
  }, [fetchVideos]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVideos();
  }, [fetchVideos]);

  // Separate live videos and regular feed
  const liveVideos = useMemo(() => {
    return videos.filter((v) => v.is_live);
  }, [videos]);

  const recordedVideos = useMemo(() => {
    return videos.filter((v) => !v.is_live);
  }, [videos]);

  const getLocalizedTitle = (item: SevaVideoItem): { primary: string; secondary: string } => {
    const en = item.title_en || item.title?.en || '';
    const te = item.title_te || item.title?.te || en;
    const hi = item.title_hi || item.title?.hi || en;

    if (currentLang === 'te') {
      return { primary: te, secondary: en !== te ? en : '' };
    } else if (currentLang === 'hi') {
      return { primary: hi, secondary: te || en };
    }
    return { primary: en, secondary: te };
  };

  const getLocalizedDescription = (item: SevaVideoItem): string => {
    if (currentLang === 'te' && (item.description_te || item.description?.te)) {
      return item.description_te || item.description?.te || '';
    }
    if (currentLang === 'hi' && (item.description_hi || item.description?.hi)) {
      return item.description_hi || item.description?.hi || '';
    }
    return item.description_en || item.description?.en || '';
  };

  const formatEventDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(currentLang === 'te' ? 'te-IN' : currentLang === 'hi' ? 'hi-IN' : 'en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#0F52BA"
          colors={['#0F52BA']}
        />
      }
    >
      {/* Offline Banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>
            📶 Offline Mode: Showing cached official broadcasts & videos.
          </Text>
        </View>
      )}

      {/* Screen Title & Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerEmoji}>📺</Text>
          <View>
            <Text style={styles.headerTitle}>
              {currentLang === 'te'
                ? 'గోదావరి పుష్కరాల ప్రత్యక్ష దర్శనం'
                : currentLang === 'hi'
                ? 'गोदावरी पुष्करालु सीधा प्रसारण'
                : 'Virtual Seva & Live Broadcasts'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {currentLang === 'te'
                ? 'అధికారిక హారతులు, పూజలు మరియు పుణ్యస్నాన దృశ్యాలు'
                : currentLang === 'hi'
                ? 'आधिकारिक महा आरती, पूजा और पवित्र स्नान प्रसारण'
                : 'Official Harathi livestreams, rituals & cultural events'}
            </Text>
          </View>
        </View>
      </View>

      {/* Category Chips Horizontal Filter Bar */}
      <View style={styles.categoryBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryChipsList}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const label = currentLang === 'te' ? cat.te : currentLang === 'hi' ? cat.hi : cat.en;

            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={styles.categoryChipIcon}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && styles.categoryChipTextSelected,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Loading Indicator */}
      {loading && !refreshing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0F52BA" />
          <Text style={styles.loadingText}>Loading official Seva streams...</Text>
        </View>
      )}

      {/* 1. Live Videos Section (Pinned on Top) */}
      {!loading && liveVideos.length > 0 && (
        <View style={styles.liveSection}>
          <View style={styles.liveSectionHeader}>
            <View style={styles.liveRedPill}>
              <View style={styles.livePulseDot} />
              <Text style={styles.liveRedPillText}>LIVE NOW</Text>
            </View>
            <Text style={styles.liveSectionTitle}>
              {currentLang === 'te'
                ? 'ప్రత్యక్ష ప్రసారాలు'
                : currentLang === 'hi'
                ? 'सीधा प्रसारण'
                : 'Live Broadcasts'}
            </Text>
          </View>

          {liveVideos.map((item) => {
            const { primary, secondary } = getLocalizedTitle(item);
            const desc = getLocalizedDescription(item);

            return (
              <View key={item.id} style={[styles.videoCard, styles.liveVideoCard]}>
                {/* Click-to-load YouTube Player */}
                <ClickToLoadYouTubePlayer
                  videoId={item.youtube_id}
                  thumbnailUrl={item.thumbnail_url}
                  title={primary}
                  isLive={true}
                />

                {/* Video Info */}
                <View style={styles.cardBody}>
                  <View style={styles.badgeRow}>
                    <View style={styles.liveTag}>
                      <Text style={styles.liveTagText}>🔴 LIVE DARSHAN</Text>
                    </View>
                    {item.ghat_name && (
                      <TouchableOpacity
                        style={styles.ghatBadge}
                        onPress={() => {
                          if (item.ghat_id) router.push(`/ghats/${item.ghat_id}` as any);
                        }}
                      >
                        <Text style={styles.ghatBadgeText}>
                          📍 {currentLang === 'te' && item.ghat_name.te ? item.ghat_name.te : item.ghat_name.en}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Bilingual Titles */}
                  <Text style={styles.primaryTitle}>{primary}</Text>
                  {secondary ? <Text style={styles.secondaryTitle}>{secondary}</Text> : null}

                  {desc ? <Text style={styles.descriptionText}>{desc}</Text> : null}

                  <View style={styles.cardFooter}>
                    <Text style={styles.dateText}>🕒 {formatEventDate(item.event_date)}</Text>
                    <Text style={styles.officialBadgeText}>✓ District Official Stream</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* 2. Recorded / Curated Rituals & Event Videos */}
      {!loading && (
        <View style={styles.recordedSection}>
          <Text style={styles.sectionHeading}>
            {selectedCategory === 'all'
              ? currentLang === 'te'
                ? 'పూజా కార్యక్రమాలు & విశేషాలు'
                : currentLang === 'hi'
                ? 'अनुष्ठान एवं सांस्कृतिक झलकियाँ'
                : 'Rituals & Cultural Events'
              : CATEGORIES.find((c) => c.id === selectedCategory)?.en || 'Videos'}
          </Text>

          {recordedVideos.length === 0 && liveVideos.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🙏</Text>
              <Text style={styles.emptyTitle}>
                {currentLang === 'te' ? 'వీడియోలు అందుబాటులో లేవు' : 'No videos available'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {currentLang === 'te'
                  ? 'ఈ వర్గంలో త్వరలో మరిన్ని అధికారిక వీడియోలు జతచేయబడతాయి.'
                  : 'More official live broadcasts will be added soon by the district administration.'}
              </Text>
            </View>
          ) : (
            recordedVideos.map((item) => {
              const { primary, secondary } = getLocalizedTitle(item);
              const desc = getLocalizedDescription(item);

              return (
                <View key={item.id} style={styles.videoCard}>
                  {/* Click-to-load YouTube Player */}
                  <ClickToLoadYouTubePlayer
                    videoId={item.youtube_id}
                    thumbnailUrl={item.thumbnail_url}
                    title={primary}
                    isLive={false}
                  />

                  {/* Video Metadata */}
                  <View style={styles.cardBody}>
                    <View style={styles.badgeRow}>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>
                          {item.category.toUpperCase()}
                        </Text>
                      </View>
                      {item.ghat_name && (
                        <TouchableOpacity
                          style={styles.ghatBadge}
                          onPress={() => {
                            if (item.ghat_id) router.push(`/ghats/${item.ghat_id}` as any);
                          }}
                        >
                          <Text style={styles.ghatBadgeText}>
                            📍 {currentLang === 'te' && item.ghat_name.te ? item.ghat_name.te : item.ghat_name.en}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Bilingual Titles */}
                    <Text style={styles.primaryTitle}>{primary}</Text>
                    {secondary ? <Text style={styles.secondaryTitle}>{secondary}</Text> : null}

                    {desc ? <Text style={styles.descriptionText}>{desc}</Text> : null}

                    <View style={styles.cardFooter}>
                      <Text style={styles.dateText}>🕒 {formatEventDate(item.event_date)}</Text>
                      <Text style={styles.officialBadgeText}>✓ Official Pushkaralu Feed</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* Trust & Sudden Condition Change Disclaimer */}
      <View style={styles.disclaimerContainer}>
        <Text style={styles.disclaimerTitle}>⚖️ Devotee Advisory & Disclaimer</Text>
        <Text style={styles.disclaimerText}>
          {currentLang === 'te'
            ? 'పుష్కరాల రద్దీ మరియు వాతావరణ పరిస్థితుల దృష్ట్యా హారతి వేళలు మరియు పూజా కార్యక్రమ సమయాలు మారవచ్చు. ప్రత్యక్ష ప్రసారాలు జిల్లా యంత్రాంగం మరియు దేవాదాయ శాఖ అధికారిక అనుమతితో నిర్వహించబడుతున్నాయి.'
            : currentLang === 'hi'
            ? 'पुष्करालु के दौरान अत्यधिक भीड़ और मौसम के कारण आरती और पूजा के समय में अचानक परिवर्तन हो सकता है। सभी सीधा प्रसारण जिला प्रशासन के सहयोग से संचालित हैं।'
            : 'Ritual and Harathi timings are subject to change suddenly due to crowd safety protocols and river water levels. All streams are officially sanctioned by the District Administration and Endowments Department.'}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  offlineBanner: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  offlineBannerText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerEmoji: {
    fontSize: 28,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  categoryBarContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  categoryChipsList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
    minHeight: 36,
  },
  categoryChipSelected: {
    backgroundColor: '#0F52BA',
    borderColor: '#0F52BA',
  },
  categoryChipIcon: {
    fontSize: 13,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  liveSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  liveSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  liveRedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 5,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  liveRedPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  liveSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  recordedSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  videoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  liveVideoCard: {
    borderColor: '#FCA5A5',
    borderWidth: 1.5,
  },
  cardBody: {
    padding: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  liveTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  liveTagText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: '800',
  },
  categoryBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  categoryBadgeText: {
    color: '#3730A3',
    fontSize: 10,
    fontWeight: '700',
  },
  ghatBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ghatBadgeText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '600',
  },
  primaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 21,
  },
  secondaryTitle: {
    fontSize: 13,
    color: '#0F52BA',
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 18,
  },
  descriptionText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  officialBadgeText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  disclaimerContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  disclaimerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#7F1D1D',
    lineHeight: 16,
  },
});

