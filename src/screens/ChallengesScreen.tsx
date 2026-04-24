import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ScrollView, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getChallenges } from '../services/api';
import ChallengeCard from '../components/ChallengeCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { C, borderRadius } from '../theme';

const CATEGORIES = [
  'All', 'Nutrition', 'Fitness', 'Mindfulness', 'Nature', 'Cooking',
  'Sleep', 'Hydration', 'Strength', 'Community', 'Outdoor',
];

const STATUS_FILTERS = ['all', 'active', 'upcoming', 'ended'];

export default function ChallengesScreen() {
  const navigation = useNavigation<any>();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('All');

  const load = async () => {
    try {
      const data = await getChallenges();
      const list = data?.challenges || data || [];
      setChallenges(list);
      applyFilters(list, search, status, category);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const applyFilters = (list: any[], q: string, s: string, cat: string) => {
    let result = [...list];
    if (s !== 'all') result = result.filter(c => c.status === s);
    if (cat !== 'All') result = result.filter(c => c.category === cat);
    if (q.trim()) {
      const lq = q.toLowerCase();
      result = result.filter(
        c => c.title?.toLowerCase().includes(lq) || c.description?.toLowerCase().includes(lq)
      );
    }
    setFiltered(result);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { applyFilters(challenges, search, status, category); }, [search, status, category]);

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.screen}>
      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search challenges..."
          placeholderTextColor={C.TEXT_MUTED}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Status Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {STATUS_FILTERS.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.filterChip, status === s && styles.filterChipActive]}
            onPress={() => setStatus(s)}
          >
            <Text style={[styles.filterText, status === s && styles.filterTextActive]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.catChip, category === cat && styles.catChipActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      <FlatList
        data={filtered}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.ORANGE} />}
        renderItem={({ item }) => (
          <ChallengeCard
            challenge={item}
            onPress={() => navigation.navigate('ChallengeDetail', { challengeId: item.id })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No challenges found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.BG },
  searchWrap: {
    margin: 12,
    marginBottom: 8,
    backgroundColor: C.INPUT_BG,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: { color: C.TEXT, fontSize: 15 },
  filterScroll: { flexGrow: 0 },
  filterContent: { paddingHorizontal: 12, paddingBottom: 6, gap: 6, flexDirection: 'row' },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
    backgroundColor: C.CARD_BG,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    marginRight: 6,
  },
  filterChipActive: { backgroundColor: C.ORANGE, borderColor: C.ORANGE },
  filterText: { color: C.TEXT_SECONDARY, fontSize: 13 },
  filterTextActive: { color: C.WHITE, fontWeight: '700' },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: borderRadius.pill,
    backgroundColor: C.CARD_BG2,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    marginRight: 6,
  },
  catChipActive: { backgroundColor: C.TEAL + '33', borderColor: C.TEAL },
  catText: { color: C.TEXT_MUTED, fontSize: 12 },
  catTextActive: { color: C.TEAL, fontWeight: '600' },
  list: { padding: 12 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: C.TEXT_MUTED, fontSize: 16 },
});
