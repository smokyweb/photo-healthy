import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius, shadows } from '../theme';

const ChallengeDetailScreen = ({ route, navigation }: any) => {
  const { id } = route.params;
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [cData, sData] = await Promise.all([
          api.getChallenge(id),
          api.getSubmissions(id),
        ]);
        setChallenge(cData.challenge);
        setSubmissions(sData.submissions || []);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, [id]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  if (!challenge) return <View style={styles.center}><Text>Challenge not found</Text></View>;

  const isActive = challenge.is_active && new Date(challenge.end_date) > new Date();
  const hasSubmitted = submissions.some((s: any) => s.user_id === user?.id);

  const renderSubmission = ({ item }: any) => (
    <TouchableOpacity style={styles.photoCard} onPress={() => navigation.navigate('SubmissionDetail', { id: item.id })}>
      <Image source={{ uri: item.photo1_url }} style={styles.photoThumb} />
      <View style={styles.photoInfo}>
        <Text style={styles.photoTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.photoAuthor}>by {item.user_name || 'Unknown'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={submissions}
        renderItem={renderSubmission}
        keyExtractor={item => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            {challenge.cover_image_url ? (
              <Image source={{ uri: challenge.cover_image_url }} style={styles.coverImage} />
            ) : (
              <View style={[styles.coverImage, styles.placeholderCover]}>
                <Text style={{ fontSize: 64 }}>🏔️</Text>
              </View>
            )}
            <View style={styles.detailSection}>
              <Text style={styles.title}>{challenge.title}</Text>
              <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgeEnded]}>
                <Text style={[styles.badgeText, isActive ? styles.badgeTextActive : styles.badgeTextEnded]}>
                  {isActive ? 'Active' : 'Ended'}
                </Text>
              </View>
              <Text style={styles.description}>{challenge.description}</Text>
              <Text style={styles.dates}>
                {new Date(challenge.start_date).toLocaleDateString()} — {new Date(challenge.end_date).toLocaleDateString()}
              </Text>
              {isActive && !hasSubmitted && (
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={() => navigation.navigate('SubmitPhoto', { challengeId: id })}
                >
                  <Text style={styles.submitBtnText}>Submit Your Photo</Text>
                </TouchableOpacity>
              )}
              {hasSubmitted && (
                <View style={styles.submittedBadge}>
                  <Text style={styles.submittedText}>✓ You've submitted to this challenge</Text>
                </View>
              )}
              <Text style={styles.sectionTitle}>
                Submissions ({submissions.length})
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No submissions yet. Be the first!</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primaryBg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  coverImage: { width: '100%', height: 220, backgroundColor: colors.gray[100] },
  placeholderCover: { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primaryBg },
  detailSection: { padding: spacing.lg, maxWidth: 600, width: '100%', alignSelf: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: colors.black, marginBottom: spacing.sm },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: borderRadius.full, alignSelf: 'flex-start', marginBottom: spacing.md },
  badgeActive: { backgroundColor: '#E6FFFA' },
  badgeEnded: { backgroundColor: colors.gray[100] },
  badgeText: { fontSize: 13, fontWeight: '600' },
  badgeTextActive: { color: '#38A169' },
  badgeTextEnded: { color: colors.gray[500] },
  description: { fontSize: 15, color: colors.gray[600], lineHeight: 22, marginBottom: spacing.sm },
  dates: { fontSize: 13, color: colors.gray[400], marginBottom: spacing.lg },
  submitBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md,
    padding: spacing.md, alignItems: 'center', marginBottom: spacing.md,
  },
  submitBtnText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  submittedBadge: {
    backgroundColor: '#E6FFFA', borderRadius: borderRadius.md,
    padding: spacing.md, alignItems: 'center', marginBottom: spacing.md,
  },
  submittedText: { color: '#38A169', fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.black, marginBottom: spacing.md },
  list: { paddingBottom: spacing.lg },
  row: { justifyContent: 'space-between', paddingHorizontal: spacing.md },
  photoCard: {
    width: '48%', backgroundColor: colors.white, borderRadius: borderRadius.md,
    marginBottom: spacing.md, overflow: 'hidden', ...shadows.sm,
  },
  photoThumb: { width: '100%', height: 140, backgroundColor: colors.gray[100] },
  photoInfo: { padding: spacing.sm },
  photoTitle: { fontSize: 14, fontWeight: '600', color: colors.black },
  photoAuthor: { fontSize: 12, color: colors.gray[400], marginTop: 2 },
  empty: { alignItems: 'center', padding: spacing.xl },
  emptyText: { color: colors.gray[400], fontSize: 14 },
});

export default ChallengeDetailScreen;
