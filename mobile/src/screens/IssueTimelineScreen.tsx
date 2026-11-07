import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { IssueService } from '../services/issueService';
import { IssueReport, IssueUpdate, IssueStatus } from '../types/issues';
import { API_BASE_URL } from '../services/api';

const STATUS_STEPS: IssueStatus[] = ['submitted', 'under_review', 'in_progress', 'resolved'];

const CATEGORY_ICONS: Record<string, string> = {
  sanitation: '🧹',
  water: '🚰',
  road: '🛣️',
  lighting: '💡',
  crowd: '👥',
  other: '⚠️',
};

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  submitted: { color: '#D97706', bg: '#FEF3C7' },
  under_review: { color: '#EA580C', bg: '#FFEDD5' },
  in_progress: { color: '#0284C7', bg: '#E0F2FE' },
  resolved: { color: '#16A34A', bg: '#DCFCE7' },
  rejected: { color: '#DC2626', bg: '#FEE2E2' },
};

export default function IssueTimelineScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ ticket_no: string }>();
  const ticketNo = params.ticket_no || '';

  const { fontFamily, fontFamilyBold } = useLanguage();

  const [issue, setIssue] = useState<IssueReport | null>(null);
  const [timeline, setTimeline] = useState<IssueUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (ticketNo) {
      loadTimeline();
    }
  }, [ticketNo]);

  async function loadTimeline() {
    try {
      const data = await IssueService.getIssueByTicket(ticketNo);
      setIssue(data.issue);
      setTimeline(data.timeline || []);
    } catch (err: any) {
      Alert.alert('Ticket Not Found', err.message || 'Could not locate ticket details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadTimeline();
  };

  const getStepState = (step: IssueStatus) => {
    if (!issue) return 'upcoming';

    if (issue.status === 'rejected') {
      if (step === 'submitted') return 'completed';
      return 'rejected';
    }

    const currentIndex = STATUS_STEPS.indexOf(issue.status);
    const stepIndex = STATUS_STEPS.indexOf(step);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0F52BA" />
        <Text style={[styles.loadingText, { fontFamily }]}>Loading grievance status...</Text>
      </View>
    );
  }

  if (!issue) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>❌</Text>
        <Text style={[styles.errorTitle, { fontFamily: fontFamilyBold }]}>Ticket Not Found</Text>
        <Text style={[styles.errorSubtitle, { fontFamily }]}>
          No grievance record matches ticket #{ticketNo}.
        </Text>
        <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.back()}>
          <Text style={[styles.backHomeBtnText, { fontFamily: fontFamilyBold }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusCfg = STATUS_COLORS[issue.status] || STATUS_COLORS.submitted;
  const catIcon = CATEGORY_ICONS[issue.category] || '⚠️';

  // Format photo URL if relative
  const photoFullUrl = issue.photo_url
    ? issue.photo_url.startsWith('http')
      ? issue.photo_url
      : `${API_BASE_URL}${issue.photo_url}`
    : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={[styles.headerTicketNo, { fontFamily: fontFamilyBold }]}>
            {issue.ticket_no}
          </Text>
          <Text style={[styles.headerSubtitle, { fontFamily }]}>
            {t(`issues.categories.${issue.category}`)}
          </Text>
        </View>
        <View style={[styles.headerStatusBadge, { backgroundColor: statusCfg.bg }]}>
          <Text style={[styles.headerStatusText, { color: statusCfg.color, fontFamily: fontFamilyBold }]}>
            {t(`issues.status.${issue.status}`)}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewTop}>
            <Text style={styles.categoryIcon}>{catIcon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.categoryName, { fontFamily: fontFamilyBold }]}>
                {t(`issues.categories.${issue.category}`)}
              </Text>
              <Text style={[styles.reportedTime, { fontFamily }]}>
                Reported {new Date(issue.created_at).toLocaleString()}
              </Text>
            </View>
          </View>

          <Text style={[styles.descriptionText, { fontFamily }]}>
            {issue.description}
          </Text>

          {issue.qr_zone_id && (
            <View style={styles.zoneTag}>
              <Text style={styles.zoneTagText}>📍 Zone: {issue.qr_zone_id}</Text>
            </View>
          )}

          {photoFullUrl && (
            <View style={styles.attachedPhotoBox}>
              <Text style={[styles.photoLabel, { fontFamily: fontFamilyBold }]}>
                Report Photo:
              </Text>
              <Image source={{ uri: photoFullUrl }} style={styles.attachedImage} resizeMode="cover" />
            </View>
          )}
        </View>

        {/* Visual Progression Stepper */}
        <Text style={[styles.sectionTitle, { fontFamily: fontFamilyBold }]}>
          {t('issues.timeline.title')}
        </Text>

        <View style={styles.stepperContainer}>
          {STATUS_STEPS.map((step, index) => {
            const state = getStepState(step);
            const isLast = index === STATUS_STEPS.length - 1;

            return (
              <View key={step} style={styles.stepRow}>
                <View style={styles.stepIndicatorCol}>
                  <View
                    style={[
                      styles.stepDot,
                      state === 'completed' && styles.stepDotCompleted,
                      state === 'current' && styles.stepDotCurrent,
                      state === 'rejected' && styles.stepDotRejected,
                    ]}
                  >
                    {state === 'completed' ? (
                      <Text style={styles.stepDotIcon}>✓</Text>
                    ) : state === 'current' ? (
                      <View style={styles.innerDot} />
                    ) : state === 'rejected' ? (
                      <Text style={styles.stepDotIcon}>✕</Text>
                    ) : (
                      <Text style={styles.stepDotNumber}>{index + 1}</Text>
                    )}
                  </View>

                  {!isLast && (
                    <View
                      style={[
                        styles.stepLine,
                        state === 'completed' && styles.stepLineCompleted,
                      ]}
                    />
                  )}
                </View>

                <View style={styles.stepContentCol}>
                  <Text
                    style={[
                      styles.stepTitle,
                      state === 'current' && styles.stepTitleCurrent,
                      { fontFamily: state === 'current' ? fontFamilyBold : fontFamily },
                    ]}
                  >
                    {t(`issues.timeline.step_${step}`)}
                  </Text>
                  <Text style={[styles.stepDesc, { fontFamily }]}>
                    {step === 'submitted' && 'Report logged and acknowledged by control room'}
                    {step === 'under_review' && 'Field supervisor inspecting reported area'}
                    {step === 'in_progress' && 'Action squad resolving grievance on ground'}
                    {step === 'resolved' && 'Resolution confirmed and work completed'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Public Timeline Updates Log */}
        {timeline.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { fontFamily: fontFamilyBold, marginTop: 24 }]}>
              {t('issues.timeline.public_notes')}
            </Text>

            <View style={styles.timelineList}>
              {timeline.map((update, idx) => {
                const updColor = STATUS_COLORS[update.status]?.color || '#0F52BA';
                const resPhotoUrl = update.resolution_photo_url
                  ? update.resolution_photo_url.startsWith('http')
                    ? update.resolution_photo_url
                    : `${API_BASE_URL}${update.resolution_photo_url}`
                  : null;

                return (
                  <View key={update.id || idx} style={styles.timelineCard}>
                    <View style={styles.timelineCardHeader}>
                      <View style={[styles.statusDotSmall, { backgroundColor: updColor }]} />
                      <Text style={[styles.updateStatusText, { color: updColor, fontFamily: fontFamilyBold }]}>
                        {t(`issues.status.${update.status}`)}
                      </Text>
                      <Text style={[styles.updateTime, { fontFamily }]}>
                        {new Date(update.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>

                    {update.public_note && (
                      <Text style={[styles.updateNoteText, { fontFamily }]}>
                        {update.public_note}
                      </Text>
                    )}

                    {resPhotoUrl && (
                      <View style={styles.resolutionPhotoCard}>
                        <Text style={[styles.resPhotoLabel, { fontFamily: fontFamilyBold }]}>
                          Verification Photo:
                        </Text>
                        <Image source={{ uri: resPhotoUrl }} style={styles.resolutionImage} resizeMode="cover" />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Emergency Helpline Banner */}
        <View style={styles.helplineBanner}>
          <Text style={styles.helplineIcon}>🚨</Text>
          <Text style={[styles.helplineText, { fontFamily }]}>
            {t('issues.alerts.helpline_disclaimer')}
          </Text>
        </View>
      </ScrollView>
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
    backgroundColor: '#0F52BA',
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
  headerTicketNo: {
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  headerStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  headerStatusText: {
    fontSize: 11,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  overviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 32,
  },
  categoryName: {
    fontSize: 16,
    color: '#1E293B',
  },
  reportedTime: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  descriptionText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  zoneTag: {
    marginTop: 10,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  zoneTagText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  attachedPhotoBox: {
    marginTop: 14,
  },
  photoLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
  },
  attachedImage: {
    width: '100%',
    height: 160,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 15,
    color: '#1E293B',
    marginBottom: 12,
  },
  stepperContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  stepRow: {
    flexDirection: 'row',
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 32,
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotCompleted: {
    backgroundColor: '#16A34A',
  },
  stepDotCurrent: {
    backgroundColor: '#0F52BA',
  },
  stepDotRejected: {
    backgroundColor: '#DC2626',
  },
  innerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  stepDotIcon: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  stepDotNumber: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: 'bold',
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
    minHeight: 28,
  },
  stepLineCompleted: {
    backgroundColor: '#16A34A',
  },
  stepContentCol: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
  },
  stepTitleCurrent: {
    color: '#0F52BA',
    fontSize: 14,
  },
  stepDesc: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 15,
  },
  timelineList: {
    gap: 10,
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  timelineCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  updateStatusText: {
    fontSize: 12,
    flex: 1,
  },
  updateTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  updateNoteText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  resolutionPhotoCard: {
    marginTop: 10,
  },
  resPhotoLabel: {
    fontSize: 11,
    color: '#16A34A',
    marginBottom: 4,
  },
  resolutionImage: {
    width: '100%',
    height: 140,
    borderRadius: 8,
  },
  helplineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    padding: 12,
    marginTop: 20,
    gap: 10,
  },
  helplineIcon: {
    fontSize: 20,
  },
  helplineText: {
    flex: 1,
    fontSize: 11,
    color: '#991B1B',
    lineHeight: 16,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 12,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 18,
    color: '#1E293B',
    marginBottom: 6,
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  backHomeBtn: {
    backgroundColor: '#0F52BA',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backHomeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});

