import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, ScrollView, RefreshControl, useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getChallenges } from '../services/api';
import ChallengeCard from '../components/ChallengeCard';
import LoadingSpinner from '../components/LoadingSpinner';
import GradientButton from '../components/GradientButton';
import { C, borderRadius } from '../theme';
import AppFooter from '../components/AppFooter';
import { Image } from 'react-native';

const BASE_URL = 'https://photoai.betaplanets.com';
const fullUrl = (u?: string) => u ? (u.startsWith('http') ? u : BASE_URL + u) : undefined;

// Categories built dynamically from data - see load()

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
  const [categories, setCategories] = useState<string[]>(['All']);
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
      // Build category list dynamically from actual data
      const cats = Array.from(new Set(
        list.map((c: any) => c.category).filter(Boolean)
      )) as string[];
      cats.sort();
      setCategories(['All', ...cats]);
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
      // Use substring match to handle emoji encoding differences
      if (cat !== 'All') result = result.filter(c =>
        c.category && (c.category === cat || c.category.includes(cat.replace(/^\S+\s/, '')))
      );
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

  // Group items into rows for manual grid
  function chunkArray<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }
  const rows = chunkArray(filtered, numCols);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.ORANGE} />}
    >
      {/* Featured Challenge Banner */}
      {(() => {
        const featured = challenges.find(c => c.is_active || c.status === 'active') || challenges[0];
        if (!featured) return null;
        const imgUri = fullUrl(featured.cover_image_url || featured.cover_image);
        const daysLeft = featured.end_date
          ? Math.max(0, Math.ceil((new Date(featured.end_date).getTime() - Date.now()) / 86400000))
          : null;
        return (
          <TouchableOpacity
            style={styles.featuredBanner}
            onPress={() => navigation.navigate('ChallengeDetail', { challengeId: featured.id })}
            activeOpacity={0.92}
          >
            {imgUri ? (
              <Image source={{ uri: imgUri }} style={styles.featuredImg} resizeMode="cover" />
            ) : (
              <View style={[styles.featuredImg, { backgroundColor: C.CARD_BG2, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ fontSize: 48 }}>📸</Text>
              </View>
            )}
            <View style={styles.featuredOverlay}>
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeText}>⭐ Featured Challenge</Text>
              </View>
              <Text style={styles.featuredTitle} numberOfLines={2}>{featured.title}</Text>
              <View style={styles.featuredMeta}>
                {daysLeft !== null && (
                  <Text style={styles.featuredMetaText}>🗓 {daysLeft} days left</Text>
                )}
                {featured.submission_count != null && (
                  <Text style={styles.featuredMetaText}>📷 {featured.submission_count} submissions</Text>
                )}
                {featured.feeling_category && (
                  <Text style={styles.featuredMetaText}>💙 {featured.feeling_category.split(',')[0].trim()}</Text>
                )}
              </View>
              <View style={{ marginTop: 12, alignSelf: 'flex-start' }}>
                <GradientButton
                  label="View Challenge →"
                  variant="primary"
                  size="sm"
                  onPress={() => navigation.navigate('ChallengeDetail', { challengeId: featured.id })}
                />
              </View>
            </View>
          </TouchableOpacity>
        );
      })()}

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
      <Text style={{ color: C.TEXT_MUTED, fontSize: 11, paddingHorizontal: 14, marginTop: 2 }}>Swipe for categories ›</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        persistentScrollbar
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map(cat => (
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

      {/* Challenge Grid */}
      <View style={[styles.list, numCols > 1 && styles.listGrid]}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No challenges found</Text>
            <Text style={styles.emptyBody}>Try adjusting your filters or search term.</Text>
          </View>
        ) : (
          rows.map((row, rowIdx) => (
            <View key={rowIdx} style={numCols > 1 ? styles.colWrapper : undefined}>
              {row.map(item => (
                <View key={item.id} style={[styles.cardWrap, numCols > 1 && { width: `${100 / numCols - 1}%` as any }]}>
                  <ChallengeCard
                    challenge={item}
                    onPress={() => navigation.navigate('ChallengeDetail', { challengeId: item.id })}
                  />
                </View>
              ))}
              {/* Pad last row if uneven */}
              {row.length < numCols && Array(numCols - row.length).fill(0).map((_, i) => (
                <View key={`pad-${i}`} style={[styles.cardWrap, { width: `${100 / numCols - 1}%` as any }]} />
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

  // Featured Banner
  featuredBanner: {
    margin: 12,
    marginBottom: 8,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    height: 220,
    position: 'relative',
  },
  featuredImg: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)' as any,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: C.ORANGE,
    borderRadius: borderRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 6,
    backgroundImage: 'linear-gradient(90deg, #F55B09, #FFD000)' as any,
  },
  featuredBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  featuredTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    fontFamily: "'Lexend', sans-serif",
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
    marginBottom: 6,
  },
  featuredMeta: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  featuredMetaText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '500' },

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
  categoryScroll: { flexGrow: 0, marginBottom: 4, marginTop: 4 },
  categoryContent: {
    paddingHorizontal: 12,
    paddingRight: 32,
    paddingBottom: 10,
    paddingTop: 4,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
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
