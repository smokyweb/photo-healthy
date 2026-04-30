import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, RefreshControl, useWindowDimensions } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getSubmissions, getUserStats } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import AppFooter from '../components/AppFooter';
import { C, borderRadius } from '../theme';

const BASE = 'https://photoai.betaplanets.com';
const fullUrl = (u?: string) => u ? (u.startsWith('http') ? u : BASE + u) : null;

export default function MyProgressScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const numCols = width >= 768 ? 4 : 3;

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const [sData, stData] = await Promise.all([
        getSubmissions({ userId: String(user.id), limit: '100' }),
        getUserStats(),
      ]);
      setSubmissions(sData?.submissions || sData || []);
      setStats(stData || {});
    } catch (e: any) {
      console.error('MyProgress load error:', e.message);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { if (user) load(); }, [user]));

  if (loading) return <LoadingSpinner fullScreen />;

  const STAT_CARDS = [
    { label: 'Photos Submitted', value: stats.submissions ?? stats.submission_count ?? 0, icon: 'ðŸ“·' },
    { label: 'Challenges Joined', value: stats.challenges ?? stats.challenge_count ?? 0, icon: 'ðŸ†' },
    { label: 'Likes Received', value: stats.likesReceived ?? stats.total_likes ?? 0, icon: 'â¤ï¸' },
    { label: 'Miles Logged', value: parseFloat(stats.totalMiles ?? stats.total_miles ?? 0).toFixed(1), icon: 'ðŸš¶' },
    { label: 'Day Streak', value: stats.streak ?? 0, icon: 'ðŸ”¥' },
  ];

  const colWidth = `${Math.floor(100 / numCols) - 1}%`;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.ORANGE} />}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>â† Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>My Progress</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {STAT_CARDS.map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Photo Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Photos ({submissions.length})</Text>
        </View>

        {submissions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>{'ðŸ“·'}</Text>
            <Text style={styles.emptyTitle}>No photos yet</Text>
            <Text style={styles.emptyBody}>Enter a challenge and start submitting to track your progress!</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Main' as never, { screen: 'ChallengesTab' } as never)}
              style={styles.cta}
            >
              <Text style={styles.ctaText}>Browse Challenges â†’</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoGrid}>
            {submissions.map(sub => {
              const imgUrl = fullUrl(sub.photo1_url || sub.image_url || sub.photo_url);
              return (
                <TouchableOpacity
                  key={sub.id}
                  style={[styles.photoItem, { width: colWidth as any }]}
                  onPress={() => navigation.navigate('SubmissionDetail' as never, { submissionId: sub.id, id: sub.id } as never)}
                  activeOpacity={0.85}
                >
                  {imgUrl ? (
                    <Image source={{ uri: imgUrl }} style={styles.photoImg} resizeMode="cover" />
                  ) : (
                    <View style={[styles.photoImg, styles.photoPlaceholder]}>
                      <Text style={{ fontSize: 28 }}>{'ðŸ“·'}</Text>
                    </View>
                  )}
                  {sub.title ? (
                    <Text style={styles.photoTitle} numberOfLines={1}>{sub.title}</Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      <AppFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: C.BG },
  container: { padding: 16, maxWidth: 1100, alignSelf: 'center', width: '100%' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingTop: 8,
  },
  backText: { color: C.ORANGE, fontSize: 14, fontWeight: '600', width: 50 },
  title: { color: C.TEXT, fontSize: 22, fontWeight: '800', fontFamily: "'Lexend', sans-serif" },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.xl,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  statIcon: { fontSize: 28, marginBottom: 6 },
  statValue: { color: C.ORANGE, fontSize: 26, fontWeight: '800', fontFamily: "'Lexend', sans-serif", marginBottom: 2 },
  statLabel: { color: C.TEXT_MUTED, fontSize: 11, textAlign: 'center' },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { color: C.TEXT, fontSize: 17, fontWeight: '700', fontFamily: "'Lexend', sans-serif" },

  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  photoItem: { marginBottom: 6 },
  photoImg: { width: '100%', aspectRatio: 1, borderRadius: borderRadius.md },
  photoPlaceholder: { backgroundColor: C.CARD_BG2, alignItems: 'center', justifyContent: 'center', minHeight: 80 },
  photoTitle: { color: C.TEXT_MUTED, fontSize: 10, marginTop: 3, paddingHorizontal: 2 },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { color: C.TEXT, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyBody: { color: C.TEXT_MUTED, fontSize: 14, textAlign: 'center', maxWidth: 280, lineHeight: 20 },
  cta: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: C.ORANGE,
    borderRadius: borderRadius.pill,
    backgroundImage: 'linear-gradient(90deg,#F55B09,#FFD000)' as any,
  },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
