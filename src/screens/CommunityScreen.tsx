import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getSubmissions } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { C, borderRadius } from '../theme';
import AppFooter from '../components/AppFooter';

const SORTS = ['recent', 'popular', 'top'];

export default function CommunityScreen() {
  const navigation = useNavigation<any>();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sort, setSort] = useState('recent');

  const load = async (s = sort) => {
    try {
      const data = await getSubmissions({ sort: s, limit: '30' });
      setSubmissions(data?.submissions || data || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setLoading(true); load(sort); }, [sort]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.screen}>
      {/* Sort Tabs */}
      <View style={styles.tabs}>
        {SORTS.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.tab, sort === s && styles.tabActive]}
            onPress={() => setSort(s)}
          >
            <Text style={[styles.tabText, sort === s && styles.tabTextActive]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={submissions}
        keyExtractor={i => String(i.id)}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.ORANGE} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('SubmissionDetail', { submissionId: item.id })}
          >
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.img} />
            ) : (
              <View style={[styles.img, styles.placeholder]}>
                <Text style={{ fontSize: 30 }}>📷</Text>
              </View>
            )}
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <View style={styles.cardMeta}>
                <Text style={styles.cardUser}>{item.user_name || 'User'}</Text>
                {item.like_count > 0 && (
                  <Text style={styles.cardLikes}>❤️ {item.like_count}</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No photos yet. Be the first!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.BG },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.DIVIDER,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: borderRadius.pill,
    backgroundColor: C.CARD_BG,
  },
  tabActive: { backgroundColor: C.ORANGE },
  tabText: { color: C.TEXT_MUTED, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: C.WHITE },
  grid: { padding: 8 },
  row: { gap: 8 },
  card: {
    flex: 1,
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    marginBottom: 8,
  },
  img: { width: '100%', aspectRatio: 1 },
  placeholder: { backgroundColor: C.CARD_BG2, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { padding: 8 },
  cardTitle: { color: C.TEXT, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  cardUser: { color: C.TEXT_MUTED, fontSize: 11 },
  cardLikes: { color: C.TEXT_MUTED, fontSize: 11 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: C.TEXT_MUTED, fontSize: 16 },
});
