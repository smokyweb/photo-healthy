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

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function GalleryScreen() {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const numCols = width >= 900 ? 4 : width >= 600 ? 3 : 2;

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await getSubmissions({ limit: '60' });
      setSubmissions(data?.submissions || data || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner fullScreen />;

  const rows = chunkArray(submissions, numCols);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.ORANGE} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>My Gallery</Text>
        <Text style={styles.count}>{submissions.length} photos</Text>
      </View>

      <View style={styles.grid}>
        {submissions.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>ðŸ“·</Text>
            <Text style={styles.emptyText}>No photos yet</Text>
          </View>
        ) : (
          rows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.row}>
              {row.map(item => {
                const imgUri = fullUrl(item.photo1_url || item.image_url || item.photo_url);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.item, { width: `${100 / numCols - 0.5}%` as any }]}
                    onPress={() => navigation.navigate('SubmissionDetail', { submissionId: item.id })}
                    activeOpacity={0.85}
                  >
                    {imgUri ? (
                      <Image source={{ uri: imgUri }} style={styles.img} resizeMode="cover" />
                    ) : (
                      <View style={[styles.img, styles.placeholder]}>
                        <Text style={{ fontSize: 28 }}>ðŸ“·</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
              {row.length < numCols && Array(numCols - row.length).fill(0).map((_, i) => (
                <View key={`pad-${i}`} style={[styles.item, { width: `${100 / numCols - 0.5}%` as any, backgroundColor: 'transparent' }]} />
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
  screen: { backgroundColor: C.BG },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.DIVIDER,
  },
  title: { color: C.TEXT, fontSize: 22, fontWeight: '800', fontFamily: "'Lexend', sans-serif" },
  count: { color: C.TEXT_MUTED, fontSize: 14 },
  grid: { padding: 4 },
  row: { flexDirection: 'row', gap: 4, marginBottom: 4 },
  item: { overflow: 'hidden', borderRadius: borderRadius.md },
  img: { width: '100%', aspectRatio: 1 },
  placeholder: { backgroundColor: C.CARD_BG2, alignItems: 'center', justifyContent: 'center', minHeight: 100 },
  empty: { alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  emptyText: { color: C.TEXT_MUTED, fontSize: 16 },
});

