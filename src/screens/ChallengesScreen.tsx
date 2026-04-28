import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ScrollView, RefreshControl, useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getChallenges } from '../services/api';
import ChallengeCard from '../components/ChallengeCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { C, borderRadius } from '../theme';
import AppFooter from '../components/AppFooter';

const CATEGORIES = [
  'All', 'Nutrition', 'Fitness', 'Mindfulness', 'Nature', 'Cooking',
  'Sleep', 'Hydration', 'Strength', 'Community', 'Outdoor',
];

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'archived', label: 'Archived' },
];

export default function ChallengesScreen() {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const numCols = width >= 900 ? 3 : width >= 600 ? 2 : 1;

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

  const applyFilters = useCallback(
    (list: any[], q: string, s: string, cat: string) => {
      let result = [...list];
      if (s !== 'all') {
        if (s === 'completed') {
          result = result.filter(c => c.status === 'ended' || c.status === 'completed');
        } else if (s === 'archived') {
          result = result.filter(c => c.status === 'archived');
        } else {
          result = result.filter(c => c.status === s);
        }
      }
      if (cat !== 'All') result = result.filter(c => c.category === cat);
      if (q.trim()) {
        const lq = q.toLowerCase();
        result = result.filter(
          c => c.title?.toLowerCase().includes(lq) || c.description?.toLowerCase().includes(lq)
        );
      }
      setFiltered(result);
    },
    []
  );

  useEffect(() => { load(); }, []);
  useEffect(() => { applyFilters(challenges, search, status, category); }, [search, status, category, challenges]);

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) return <LoadingSpinner fullScreen />;

  // For multi-column on desktop, group items into rows
  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.cardWrap, numCols > 1 && { width: `${100 / numCols - 1.5}%` as any }]}>
      <ChallengeCard
        challenge={item}
        onPress={() => navigation.navigate('ChallengeDetail', { challengeId: item.id })}
      />
    </View>
  );

  return (
    <View style={styles.screen}>
      {/* Search Bar */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search challenges..."
          placeholderTextColor={C.TEXT_MUTED}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Status Filter Tabs */}
      <View style={styles.tabsRow}>
        {STATUS_TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, status === tab.key && styles.tabActive]}
            onPress={() => setStatus(tab.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, status === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.catChip, category === cat && styles.catChipActive]}
            onPress={() => setCategory(cat)}
            activeOpacity={0.8}
          >
            <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results Count */}
      <View style={styles.resultsBar}>
        <Text style={styles.resultsText}>
          {filtered.length} challenge{filtered.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Challenge List / Grid */}
      <FlatList
        data={filtered}
        keyExtractor={i => String(i.id)}
        numColumns={numCols}
        key={`cols-${numCols}`}
        contentContainerStyle={[
          styles.list,
          numCols > 1 && styles.listGrid,
        ]}
        columnWrapperStyle={numCols > 1 ? styles.colWrapper : undefined}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.ORANGE} />}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No challenges found</Text>
            <Text style={styles.emptyBody}>Try adjusting your filters or search term.</Text>
          </View>
        }
        ListFooterComponent={<AppFooter />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.BG },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    marginBottom: 8,
    backgroundColor: C.INPUT_BG,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: C.TEXT, fontSize: 15, fontFamily: "'Inter', sans-serif" },
  clearBtn: { padding: 2 },
  clearBtnText: { color: C.TEXT_MUTED, fontSize: 14 },

  // Status Tabs
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 8,
    gap: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    backgroundColor: C.CARD_BG,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  tabActive: {
    backgroundColor: C.ORANGE,
    borderColor: C.ORANGE,
    backgroundImage: 'linear-gradient(90deg, #F55B09, #FFD000)' as any,
  },
  tabText: { color: C.TEXT_SECONDARY, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#fff', fontWeight: '700' },

  // Category Pills
  categoryScroll: { flexGrow: 0, marginBottom: 4 },
  categoryContent: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    gap: 6,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
    backgroundColor: C.CARD_BG2,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  catChipActive: { backgroundColor: C.TEAL + '22', borderColor: C.TEAL },
  catText: { color: C.TEXT_MUTED, fontSize: 12, fontWeight: '500' },
  catTextActive: { color: C.TEAL, fontWeight: '700' },

  // Results bar
  resultsBar: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  resultsText: { color: C.TEXT_MUTED, fontSize: 12 },

  // List/Grid
  list: { padding: 12, paddingTop: 4 },
  listGrid: { paddingHorizontal: 12 },
  colWrapper: { justifyContent: 'space-between', gap: 10 },
  cardWrap: { flex: 1 },

  // Empty
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: C.TEXT, fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptyBody: { color: C.TEXT_MUTED, fontSize: 14, textAlign: 'center' },
});
