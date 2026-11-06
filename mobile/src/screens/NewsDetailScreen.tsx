import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from '../context/LanguageContext';
import { NewsService } from '../services/newsService';
import { NewsPost } from '../types/news';
import { getLocalizedText } from '../utils/localized';
import { ConditionDisclaimerBanner } from '../components/ConditionDisclaimerBanner';

interface Props {
  id: string;
}

export const NewsDetailScreen: React.FC<Props> = ({ id }) => {
  const router = useRouter();
  const { language, fontFamily, fontFamilyBold } = useLanguage();

  const [news, setNews] = useState<NewsPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let isMounted = true;
    NewsService.getNewsById(id, language).then((res) => {
      if (isMounted) {
        setNews(res.news);
        setIsOffline(res.isOffline);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [id, language]);

  const handleOpenSource = () => {
    if (news?.source_url) {
      Linking.openURL(news.source_url).catch((err) =>
        console.warn('Cannot open source url:', err)
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0F52BA" />
          <Text style={[styles.loadingText, { fontFamily }]}>Loading announcement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!news) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={[styles.errorTitle, { fontFamily: fontFamilyBold }]}>
            Announcement Not Found
          </Text>
          <Text style={[styles.errorSub, { fontFamily }]}>
            This announcement may have expired or is no longer available.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={[styles.backButtonText, { fontFamily: fontFamilyBold }]}>
              ← Return to News Feed
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const title = news.localized_title || getLocalizedText(news.title, language);
  const content = news.localized_content || getLocalizedText(news.content, language);
  const summary = news.localized_summary || getLocalizedText(news.summary, language);

  const formattedDate = news.published_at
    ? new Date(news.published_at).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* Top Navbar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navBack} onPress={() => router.back()}>
          <Text style={styles.navBackText}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.navTitle, { fontFamily: fontFamilyBold }]}>
          Official Bulletin
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Offline indicator */}
        {isOffline && (
          <View style={styles.offlinePill}>
            <Text style={styles.offlinePillText}>📡 Cached Copy (Offline)</Text>
          </View>
        )}

        {/* Priority & Pinned Header */}
        <View style={styles.badgeRow}>
          {news.is_pinned && (
            <View style={styles.pinnedPill}>
              <Text style={styles.pinnedIcon}>📌</Text>
              <Text style={[styles.pinnedPillText, { fontFamily: fontFamilyBold }]}>PINNED</Text>
            </View>
          )}

          <View style={[styles.categoryPill, news.category === 'urgent' && styles.urgentPill]}>
            <Text
              style={[
                styles.categoryText,
                news.category === 'urgent' && styles.urgentText,
                { fontFamily: fontFamilyBold },
              ]}
            >
              {news.category.toUpperCase()}
            </Text>
          </View>

          {formattedDate && (
            <Text style={[styles.dateText, { fontFamily }]}>{formattedDate}</Text>
          )}
        </View>

        {/* Official Source Card */}
        {news.is_official ? (
          <View style={styles.officialBox}>
            <View style={styles.officialHeader}>
              <Text style={styles.officialIcon}>🏛️</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.officialHeaderTitle, { fontFamily: fontFamilyBold }]}>
                  Verified Official Government Advisory
                </Text>
                <Text style={[styles.officialHeaderSub, { fontFamily }]}>
                  Issued by Pushkaralu District Coordination Committee
                </Text>
              </View>
            </View>

            {news.source_url && (
              <TouchableOpacity style={styles.sourceBtn} onPress={handleOpenSource}>
                <Text style={[styles.sourceBtnText, { fontFamily: fontFamilyBold }]}>
                  View Official Portal Source ↗
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          news.source_url && (
            <TouchableOpacity style={styles.genericSourceBtn} onPress={handleOpenSource}>
              <Text style={[styles.genericSourceText, { fontFamily }]}>
                Source Link: {news.source_url} ↗
              </Text>
            </TouchableOpacity>
          )
        )}

        {/* Title */}
        <Text style={[styles.title, { fontFamily: fontFamilyBold }]}>{title}</Text>

        {/* Summary callout box if present */}
        {summary ? (
          <View style={styles.summaryBox}>
            <Text style={[styles.summaryTitle, { fontFamily: fontFamilyBold }]}>
              KEY SUMMARY
            </Text>
            <Text style={[styles.summaryText, { fontFamily }]}>{summary}</Text>
          </View>
        ) : null}

        {/* Main Content Body */}
        <View style={styles.contentBody}>
          <Text style={[styles.contentText, { fontFamily }]}>{content}</Text>
        </View>

        {/* Mandatory Pushkaralu Safety Disclaimer */}
        <View style={styles.disclaimerContainer}>
          <ConditionDisclaimerBanner />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#0F52BA',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  navBack: {
    padding: 6,
  },
  navBackText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  navTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  offlinePill: {
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  offlinePillText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  pinnedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  pinnedIcon: {
    fontSize: 11,
  },
  pinnedPillText: {
    fontSize: 10,
    color: '#1E40AF',
    fontWeight: '800',
  },
  categoryPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  urgentPill: {
    backgroundColor: '#FEE2E2',
  },
  categoryText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '800',
  },
  urgentText: {
    color: '#991B1B',
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 'auto',
  },
  officialBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  officialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  officialIcon: {
    fontSize: 24,
  },
  officialHeaderTitle: {
    fontSize: 13,
    color: '#166534',
    fontWeight: '800',
  },
  officialHeaderSub: {
    fontSize: 11,
    color: '#15803D',
  },
  sourceBtn: {
    backgroundColor: '#166534',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  sourceBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  genericSourceBtn: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  genericSourceText: {
    color: '#0F52BA',
    fontSize: 12,
  },
  title: {
    fontSize: 22,
    color: '#0F172A',
    fontWeight: '800',
    lineHeight: 28,
  },
  summaryBox: {
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 4,
    borderLeftColor: '#0F52BA',
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  summaryTitle: {
    fontSize: 10,
    color: '#0F52BA',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  summaryText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  contentBody: {
    marginTop: 6,
  },
  contentText: {
    fontSize: 15,
    color: '#1E293B',
    lineHeight: 24,
  },
  disclaimerContainer: {
    marginTop: 14,
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
  errorIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  errorTitle: {
    fontSize: 18,
    color: '#1E293B',
    fontWeight: '700',
    marginBottom: 6,
  },
  errorSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#0F52BA',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
