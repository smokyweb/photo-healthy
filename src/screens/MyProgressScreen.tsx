import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getSubmissions, getUserStats } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { C, borderRadius } from '../theme';
import AppFooter from '../components/AppFooter';

export default function MyProgressScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [sData, stData] = await Promise.all([
        getSubmissions({ userId: String(user?.id), limit: '50' }),
        getUserStats(),
      ]);
      setSubmissions(sData?.submissions || sData || []);
      setStats(stData || {});
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <ScrollView
      style={styles.screen}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.ORANGE} />}
    >
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>My Progress</Text>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Photos', value: stats.submission_count || 0, icon: '📷' },
            { label: 'Challenges', value: stats.challenge_count || 0, icon: '🏆' },
            { label: 'Likes Received', value: stats.total_likes || 0, icon: '❤️' },
            { label: 'Miles Logged', value: stats.total_miles ? stats.total_miles.toFixed(1) : '0', icon: '🏃' },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Photo grid */}
        <Text style={styles.sectionTitle}>My Photos ({submissions.length})</Text>
        <View style={styles.photoGrid}>
          {submissions.map(s => (
            <TouchableOpacity
              key={s.id}
              style={styles.photoItem}
              onPress={() => navigation.navigate('SubmissionDetail', { submissionId: s.id })}
            >
              {s.image_url ? (
                <Image source={{ uri: s.image_url }} style={styles.photoImg} />
              ) : (
                <View style={[styles.photoImg, styles.photoPlaceholder]}>
                  <Text>📷</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {submissions.length === 0 && (
          <Text style={styles.emptyText}>No photos yet. Start submitting to track your progress!</Text>
        )}
      </View>
          <AppFooter />
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.BG },
  container: { padding: 20 },
  back: { marginBottom: 20 },
  backText: { color: C.ORANGE, fontSize: 15 },
  title: { color: C.TEXT, fontSize: 26, fontWeight: '800', marginBottom: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: {
    width: '47%',
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.lg,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  statIcon: { fontSize: 28, marginBottom: 6 },
  statValue: { color: C.ORANGE, fontSize: 24, fontWeight: '800', marginBottom: 2 },
  statLabel: { color: C.TEXT_MUTED, fontSize: 12 },
  sectionTitle: { color: C.TEXT, fontSize: 18, fontWeight: '700', marginBottom: 12 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  photoItem: { width: '32%' },
  photoImg: { width: '100%', aspectRatio: 1, borderRadius: borderRadius.sm },
  photoPlaceholder: { backgroundColor: C.CARD_BG, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: C.TEXT_MUTED, fontSize: 14, textAlign: 'center', marginTop: 20 },
});
