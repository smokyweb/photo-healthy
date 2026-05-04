import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, RefreshControl, useWindowDimensions } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { getSubmissions } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import AppFooter from '../components/AppFooter';
import { C, borderRadius } from '../theme';

const BASE_URL = 'https://photoai.betaplanets.com';
const fullUrl = (u?: string) => u ? (u.startsWith('http') ? u : BASE_URL + u) : null;

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function UserSubmissionsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { userId, userName } = route.params || {};
  const { width } = useWindowDimensions();
  const numCols = width >= 768 ? 4 : 3;

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!userId) { setLoading(false); return; }
    try {
      const data = await getSubmissions({ userId: String(userId), limit: '100' });
      setSubmissions(data?.submissions || data || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { load(); }, [userId]));

  if (loading) return <LoadingSpinner fullScreen />;

  const rows = chunkArray(submissions, numCols);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.ORANGE} />}
    >
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>\u2190 Back</Text>
      </TouchableOpacity>

      {/* User header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(userName || 'U')[0].toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.userName}>{userName || 'User'}</Text>
          <Text style={styles.subCount}>{submissions.length} submission{submissions.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      {/* Photo grid */}
      {submissions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>\uD83D\uDCF7</Text>
          <Text style={styles.emptyText}>No submissions yet</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {rows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.row}>
              {row.map(sub => {
                const img = fullUrl(sub.photo1_url || sub.image_url);
                return (
                  <TouchableOpacity
                    key={sub.id}
                    style={[styles.cell, { width: `${Math.floor(100/numCols) - 0.5}%` as any }]}
                    onPress={() => navigation.navigate('SubmissionDetail' as never, { submissionId: sub.id, id: sub.id } as never)}
                    activeOpacity={0.85}
                  >
                    {img ? (
                      <Image source={{ uri: img }} style={styles.photo} resizeMode="cover" />
                    ) : (
                      <View style={[styles.photo, styles.photoPlaceholder]}>
                        <Text style={{ fontSize: 24 }}>\uD83D\uDCF7</Text>
                      </View>
                    )}
                    {sub.challenge_title && (
                      <Text style={styles.challengeLabel} numberOfLines={1}>
                        {sub.challenge_title}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
              {row.length < numCols && Array(numCols - row.length).fill(0).map((_, i) => (
                <View key={'pad-'+i} style={[styles.cell, { width: `${Math.floor(100/numCols) - 0.5}%` as any }]} />
              ))}
            </View>
          ))}
        </View>
      )}

      <AppFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: C.BG },
  back: { padding: 16, paddingBottom: 8 },
  backText: { color: C.ORANGE, fontSize: 14, fontWeight: '600' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: C.CARD_BORDER,
    marginBottom: 8,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.ORANGE + '33',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: C.ORANGE, fontSize: 22, fontWeight: '800' },
  userName: { color: C.TEXT, fontSize: 20, fontWeight: '800', fontFamily: "'Lexend', sans-serif" },
  subCount: { color: C.TEXT_MUTED, fontSize: 13 },
  grid: { padding: 4 },
  row: { flexDirection: 'row', gap: 4, marginBottom: 4 },
  cell: {},
  photo: { width: '100%', aspectRatio: 1, borderRadius: borderRadius.sm },
  photoPlaceholder: { backgroundColor: C.CARD_BG2, alignItems: 'center', justifyContent: 'center', minHeight: 80 },
  challengeLabel: { color: C.TEXT_MUTED, fontSize: 9, marginTop: 2, paddingHorizontal: 2 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: C.TEXT_MUTED, fontSize: 16 },
});
