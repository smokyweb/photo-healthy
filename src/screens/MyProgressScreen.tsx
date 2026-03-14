import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { C } from '../theme';

const MyProgressScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [cData, sData] = await Promise.all([
          api.getChallenges(),
          api.getSubmissions(),
        ]);
        setChallenges(cData.challenges || []);
        const mine = (sData.submissions || []).filter((s: any) => s.user_id === user?.id);
        setMySubmissions(mine);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, [user?.id]);

  // Build a map: challenge_id → my submission
  const submittedMap: Record<number, any> = {};
  mySubmissions.forEach((s) => { submittedMap[s.challenge_id] = s; });

  const totalChallenges = challenges.length;
  const submittedCount = Object.keys(submittedMap).length;
  const pct = totalChallenges > 0 ? Math.round((submittedCount / totalChallenges) * 100) : 0;

  const completedChallenges = challenges.filter((c) => submittedMap[c.id]);
  const pendingChallenges = challenges.filter((c) => !submittedMap[c.id]);

  if (loading) {
    return (
      <View style={s.loadingWrap}>
        <ActivityIndicator size="large" color={C.ORANGE} />
        <Text style={s.loadingText}>Loading progress…</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backArrow}>‹</Text>
          <Text style={s.backText}>Profile</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Progress</Text>
        <View style={s.backBtnSpacer} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>

        {/* Progress summary card */}
        <View style={s.summaryCard}>
          <Text style={s.summaryTitle}>Challenge Participation</Text>

          {/* Big progress ring / bar */}
          <View style={s.progressBarWrap}>
            <View style={s.progressBarTrack}>
              <View style={[s.progressBarFill, { width: `${pct}%` as any }]} />
            </View>
            <Text style={s.pctLabel}>{pct}%</Text>
          </View>

          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statNum}>{submittedCount}</Text>
              <Text style={s.statLabel}>Submitted</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statNum}>{totalChallenges}</Text>
              <Text style={s.statLabel}>Total Challenges</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statNum}>{pendingChallenges.length}</Text>
              <Text style={s.statLabel}>Remaining</Text>
            </View>
          </View>

          {pct === 100 && (
            <View style={s.congrats}>
              <Text style={s.congratsText}>🏆 You've completed every challenge!</Text>
            </View>
          )}
          {pct === 0 && (
            <View style={s.nudge}>
              <Text style={s.nudgeText}>📸 Start by submitting your first photo!</Text>
            </View>
          )}
        </View>

        {/* Completed challenges */}
        {completedChallenges.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>✅ Completed ({completedChallenges.length})</Text>
            {completedChallenges.map((c) => {
              const sub = submittedMap[c.id];
              return (
                <TouchableOpacity
                  key={c.id}
                  style={s.challengeCard}
                  onPress={() => navigation.navigate('SubmissionDetail', { id: sub.id })}
                  activeOpacity={0.85}
                >
                  {sub.photo1_url ? (
                    <Image source={{ uri: sub.photo1_url }} style={s.thumbCompleted} />
                  ) : (
                    <View style={[s.thumbCompleted, s.thumbPlaceholder]}>
                      <Text style={s.thumbPlaceholderIcon}>📷</Text>
                    </View>
                  )}
                  <View style={s.challengeInfo}>
                    <Text style={s.challengeName} numberOfLines={1}>{c.title}</Text>
                    <Text style={s.submissionTitle} numberOfLines={1}>"{sub.title}"</Text>
                    <Text style={s.submissionDate}>
                      {new Date(sub.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                  <View style={s.doneBadge}>
                    <Text style={s.doneBadgeText}>✓</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Pending challenges */}
        {pendingChallenges.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>⏳ Not Yet Submitted ({pendingChallenges.length})</Text>
            {pendingChallenges.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[s.challengeCard, s.challengeCardPending]}
                onPress={() => navigation.navigate('ChallengeDetail', { id: c.id })}
                activeOpacity={0.85}
              >
                {c.cover_image_url ? (
                  <Image source={{ uri: c.cover_image_url }} style={[s.thumbCompleted, s.thumbPending]} />
                ) : (
                  <View style={[s.thumbCompleted, s.thumbPlaceholder, s.thumbPending]}>
                    <Text style={s.thumbPlaceholderIcon}>🏆</Text>
                  </View>
                )}
                <View style={s.challengeInfo}>
                  <Text style={s.challengeName} numberOfLines={1}>{c.title}</Text>
                  {c.description ? (
                    <Text style={s.challengeDesc} numberOfLines={2}>{c.description}</Text>
                  ) : null}
                </View>
                <View style={s.submitNowBadge}>
                  <Text style={s.submitNowText}>Submit →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.BG },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.BG, gap: 16 },
  loadingText: { color: C.TEXT_SECONDARY, fontSize: 14 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.CARD_BORDER,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', minWidth: 70 },
  backArrow: { color: C.TEAL, fontSize: 28, lineHeight: 28, marginRight: 2 },
  backText: { color: C.TEAL, fontSize: 15, fontWeight: '500' },
  headerTitle: { flex: 1, color: C.TEXT, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  backBtnSpacer: { minWidth: 70 },

  // Summary card
  summaryCard: {
    margin: 16,
    backgroundColor: C.CARD_BG,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  summaryTitle: { color: C.TEXT, fontSize: 15, fontWeight: '700', marginBottom: 16, textAlign: 'center' },

  progressBarWrap: { marginBottom: 20, gap: 8 },
  progressBarTrack: {
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 7,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: C.ORANGE,
    borderRadius: 7,
    minWidth: 8,
  },
  pctLabel: {
    color: C.ORANGE,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center', flex: 1 },
  statNum: { color: C.TEXT, fontSize: 22, fontWeight: '700' },
  statLabel: { color: C.TEXT_SECONDARY, fontSize: 11, marginTop: 3, textAlign: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: C.CARD_BORDER },

  congrats: {
    marginTop: 16,
    backgroundColor: 'rgba(255,140,0,0.1)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,140,0,0.3)',
  },
  congratsText: { color: C.ORANGE, textAlign: 'center', fontWeight: '600', fontSize: 14 },
  nudge: {
    marginTop: 16,
    backgroundColor: 'rgba(0,188,212,0.08)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,188,212,0.2)',
  },
  nudgeText: { color: C.TEAL, textAlign: 'center', fontSize: 13 },

  // Sections
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { color: C.TEXT, fontSize: 15, fontWeight: '700', marginBottom: 10 },

  challengeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.CARD_BG,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    gap: 12,
  },
  challengeCardPending: {
    borderColor: 'rgba(255,255,255,0.06)',
    opacity: 0.85,
  },

  thumbCompleted: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: C.CARD_BG,
    borderWidth: 2,
    borderColor: C.ORANGE,
  },
  thumbPending: {
    borderColor: C.CARD_BORDER,
    opacity: 0.6,
  },
  thumbPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbPlaceholderIcon: { fontSize: 22 },

  challengeInfo: { flex: 1 },
  challengeName: { color: C.TEXT, fontSize: 14, fontWeight: '600', marginBottom: 3 },
  submissionTitle: { color: C.TEAL, fontSize: 12, marginBottom: 3 },
  submissionDate: { color: C.TEXT_SECONDARY, fontSize: 11 },
  challengeDesc: { color: C.TEXT_SECONDARY, fontSize: 12, lineHeight: 17 },

  doneBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#48BB78',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBadgeText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  submitNowBadge: {
    backgroundColor: 'rgba(255,140,0,0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,140,0,0.3)',
  },
  submitNowText: { color: C.ORANGE, fontSize: 11, fontWeight: '700' },
});

export default MyProgressScreen;
