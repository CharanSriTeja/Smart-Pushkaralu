import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from '../context/LanguageContext';
import { NewsService } from '../services/newsService';
import { NewsPost } from '../types/news';
import { getLocalizedText } from '../utils/localized';

export const UrgentNewsBanner: React.FC = () => {
  const router = useRouter();
  const { language, fontFamily, fontFamilyBold } = useLanguage();
  const [urgentPost, setUrgentPost] = useState<NewsPost | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    NewsService.getUrgentNews(language).then((post) => {
      if (isMounted) {
        setUrgentPost(post);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [language]);

  if (!urgentPost || dismissed) {
    return null;
  }

  const title = urgentPost.localized_title || getLocalizedText(urgentPost.title, language);
  const contentStr = getLocalizedText(urgentPost.content, language);
  const summary =
    urgentPost.localized_summary ||
    getLocalizedText(urgentPost.summary, language) ||
    (contentStr ? contentStr.substring(0, 100) : '');

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.tagBadge}>
          <Text style={styles.tagIcon}>🚨</Text>
          <Text style={[styles.tagText, { fontFamily: fontFamilyBold }]}>
            {urgentPost.category === 'urgent' ? 'URGENT OFFICIAL ADVISORY' : 'IMPORTANT NOTICE'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setDismissed(true)}
          style={styles.closeBtn}
          accessibilityLabel="Dismiss banner"
        >
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.title, { fontFamily: fontFamilyBold }]} numberOfLines={2}>
        {title}
      </Text>

      {summary ? (
        <Text style={[styles.summary, { fontFamily }]} numberOfLines={2}>
          {summary}
        </Text>
      ) : null}

      <View style={styles.actionRow}>
        {urgentPost.is_official && (
          <View style={styles.officialPill}>
            <Text style={styles.officialCheck}>✓</Text>
            <Text style={[styles.officialText, { fontFamily }]}>Official Source</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.readMoreBtn}
          onPress={() => router.push(`/(app)/news/${urgentPost.id}` as any)}
        >
          <Text style={[styles.readMoreText, { fontFamily: fontFamilyBold }]}>
            Read Full Notice →
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 10,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagIcon: {
    fontSize: 12,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: '#991B1B',
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    fontSize: 15,
    color: '#991B1B',
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 4,
  },
  summary: {
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 18,
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FECACA',
  },
  officialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DEF7EC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  officialCheck: {
    fontSize: 11,
    color: '#03543F',
    fontWeight: '800',
  },
  officialText: {
    fontSize: 11,
    color: '#03543F',
    fontWeight: '700',
  },
  readMoreBtn: {
    backgroundColor: '#991B1B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  readMoreText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

