import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView,
  TouchableOpacity, FlatList, RefreshControl, Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getChallenge, getSubmissions, getUserAccess } from '../services/api';
import GradientButton from '../components/GradientButton';
import LoadingSpinner from '../components/LoadingSpinner';
import { C, borderRadius } from '../theme';

export default function ChallengeDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { challengeId } = route.params || {};
  const { user } = useAuth();

  const [challenge, setChallenge] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [access, setAccess] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [cData, sData] = await Promise.all([
        getChallenge(challengeId),
        getSubmissions({ challengeId: String(challengeId), limit: '20' }),
      ]);
      setChallenge(cData?.challenge || cData);
      setSubmissions(sData?.submissions || sData || []);

      if (user) {
        const a = await getUserAccess().catch(() => ({}));
        setAccess(a);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load challenge');
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { if (challengeId) load(); }, [challengeId]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleSubmit = () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    navigation.navigate('SubmitPhoto', { challengeId });
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!challenge) return (
    <View style={styles.center}>
      <Text style={{ color: C.TEXT_MUTED }}>Challenge not found</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.screen}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.ORANGE} />}
    >
      {/* Cover */}
      <View style={styles.coverWrap}>
        {challenge.cover_image ? (
          <Image source={{ uri: challenge.cover_image }} style={styles.cover} />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder]}>
            <Text style={{ fontSize: 60 }}>🏆</Text>
          </View>
        )}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.badgeRow}>
          {challenge.status && (
            <View style={[
              styles.badge,
              { backgroundColor: challenge.status === 'active' ? C.SUCCESS + '22' : C.CARD_BG2 },
            ]}>
              <Text style={[
                styles.badgeText,
                { color: challenge.status === 'active' ? C.SUCCESS : C.TEXT_MUTED },
              ]}>
                {challenge.status}
              </Text>
            </View>
          )}
          {challenge.category && (
            <View style={[styles.badge, { backgroundColor: C.TEAL + '22' }]}>
              <Text style={[styles.badgeText, { color: C.TEAL }]}>{challenge.category}</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{challenge.title}</Text>

        {challenge.description && (
          <Text style={styles.description}>{challenge.description}</Text>
        )}

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{challenge.submission_count || submissions.length}</Text>
            <Text style={styles.statLabel}>Photos</Text>
          </View>
          {challenge.end_date && (
            <View style={styles.stat}>
              <Text style={styles.statNum}>
                {new Date(challenge.end_date).toLocaleDateString()}
              </Text>
              <Text style={styles.statLabel}>End Date</Text>
            </View>
          )}
        </View>

        {challenge.status === 'active' && (
          <GradientButton
            label="Submit a Photo"
            onPress={handleSubmit}
            style={{ marginVertical: 16 }}
          />
        )}
      </View>

      {/* Submissions Grid */}
      {submissions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Submissions ({submissions.length})
          </Text>
          <View style={styles.grid}>
            {submissions.map(s => (
              <TouchableOpacity
                key={s.id}
                style={styles.gridItem}
                onPress={() => navigation.navigate('SubmissionDetail', { submissionId: s.id })}
              >
                {s.image_url ? (
                  <Image source={{ uri: s.image_url }} style={styles.gridImg} />
                ) : (
                  <View style={[styles.gridImg, styles.gridPlaceholder]}>
                    <Text>📷</Text>
                  </View>
                )}
                <Text style={styles.gridUser} numberOfLines={1}>{s.user_name || 'User'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.BG },
  coverWrap: { position: 'relative' },
  cover: { width: '100%', height: 280 },
  coverPlaceholder: {
    backgroundColor: C.CARD_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 99,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: C.WHITE, fontSize: 20 },
  info: { padding: 16 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  badge: { borderRadius: borderRadius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  title: { color: C.TEXT, fontSize: 24, fontWeight: '800', marginBottom: 8 },
  description: { color: C.TEXT_SECONDARY, fontSize: 15, lineHeight: 22, marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 24, marginBottom: 4 },
  stat: { alignItems: 'center' },
  statNum: { color: C.ORANGE, fontSize: 20, fontWeight: '800' },
  statLabel: { color: C.TEXT_MUTED, fontSize: 12 },
  section: { padding: 16 },
  sectionTitle: { color: C.TEXT, fontSize: 18, fontWeight: '700', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  gridItem: { width: '32%' },
  gridImg: { width: '100%', aspectRatio: 1, borderRadius: borderRadius.sm },
  gridPlaceholder: { backgroundColor: C.CARD_BG, alignItems: 'center', justifyContent: 'center' },
  gridUser: { color: C.TEXT_MUTED, fontSize: 11, marginTop: 3, textAlign: 'center' },
});
