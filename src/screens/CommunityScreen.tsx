import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Image,
  TouchableOpacity, ScrollView, RefreshControl, useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getSubmissions } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import AppFooter from '../components/AppFooter';
import { C, borderRadius } from '../theme';

const BASE_URL = 'https://photoai.betaplanets.com';
const fullUrl = (u?: string) => u ? (u.startsWith('http') ? u : BASE_URL + u) : undefined;

const SORTS = [
  { key: 'recent', label: 'Recent' },
  { key: 'popular', label: 'Popular' },
  { key: 'top', label: 'Top Rated' },
];

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function CommunityScreen() {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const numCols = width >= 900 ? 4 : width >= 600 ? 3 : 2;

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sort, setSort] = useState('recent');

  const load = async (s = sort) => {
    try {
      const data = await getSubmissions({ sort: s, limit: '40' });
      setSubmissions(data?.submissions || data || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setLoading(true); load(sort); }, [sort]);

  if (loading) return <LoadingSpinner fullScreen />;

  const rows = chunkArray(submissions, numCols);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.ORANGE} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Community Gallery</Text>
        <Text style={styles.subheading}>Real photos from our wellness community</Text>
      </View>

      {/* Sort Tabs */}
      <View style={styles.tabs}>
        {SORTS.map(s => (
          <TouchableOpacity
            key={s.key}
            style={[styles.tab, sort === s.key && styles.tabActive]}
            onPress={() => setSort(s.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, sort === s.key && styles.tabTextActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Photo Grid */}
      <View style={styles.grid}>
        {submissions.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📷</Text>
            <Text style={styles.emptyTitle}>No photos yet</Text>
            <Text style={styles.emptyBody}>Be the first to submit a photo!</Text>
          </View>
        ) : (
          rows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.row}>
              {row.map(item => {
                const imgUri = fullUrl(item.photo1_url || item.image_url || item.photo_url);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.card, { width: `${100 / numCols - 1}%` as any }]}
                    onPress={() => navigation.navigate('SubmissionDetail', { submissionId: item.id })}
                    activeOpacity={0.85}
                  >
                    {imgUri ? (
                      <Image source={{ uri: imgUri }} style={styles.img} resizeMode="cover" />
                    ) : (
                      <View style={[styles.img, styles.placeholder]}>
                        <Text style={{ fontSize: 32 }}>📷</Text>
                      </View>
                    )}
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{item.title || 'Untitled'}</Text>
                      <View style={styles.cardMeta}>
                        <Text style={styles.cardUser} numberOfLines={1}>@{item.user_name || 'user'}</Text>
                        {item.like_count > 0 && (
                          <Text style={styles.cardLikes}>❤️ {item.like_count}</Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
              {/* Pad last row */}
              {row.length < numCols && Array(numCols - row.length).fill(0).map((_, i) => (
                <View key={`pad-${i}`} style={[styles.card, { width: `${100 / numCols - 1}%` as any, backgroundColor: 'transparent', borderWidth: 0 }]} />
              ))}
            </View>
          ))
        )}
      </View>

      <AppFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.BG },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.DIVIDER,
  },
  heading: {
    color: C.TEXT,
    fontSize: 24,
    fontWeight: '800',
    fontFamily: "'Lexend', sans-serif",
    marginBottom: 4,
  },
  subheading: { color: C.TEXT_MUTED, fontSize: 14 },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: borderRadius.pill,
    backgroundColor: C.CARD_BG,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  tabActive: {
    backgroundColor: C.ORANGE,
    borderColor: C.ORANGE,
    backgroundImage: 'linear-gradient(90deg, #F55B09, #FFD000)' as any,
  },
  tabText: { color: C.TEXT_MUTED, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#fff', fontWeight: '700' },
  grid: { padding: 12, paddingTop: 4 },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    justifyContent: 'flex-start',
  },
  card: {
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  img: { width: '100%', aspectRatio: 1 },
  placeholder: { backgroundColor: C.CARD_BG2, alignItems: 'center', justifyContent: 'center', minHeight: 120 },
  cardInfo: { padding: 8 },
  cardTitle: { color: C.TEXT, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardUser: { color: C.TEXT_MUTED, fontSize: 11, flex: 1 },
  cardLikes: { color: C.TEXT_MUTED, fontSize: 11 },
  empty: { alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  emptyTitle: { color: C.TEXT, fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptyBody: { color: C.TEXT_MUTED, fontSize: 14 },
});

