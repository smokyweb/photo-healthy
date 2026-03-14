import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import { C } from '../theme';

type Filter = 'all' | 'active' | 'ended';

const PLACEHOLDER_CHALLENGES = [
  { id: 'ph1', title: 'Golden Hour Magic', description: 'Capture the magic of golden hour light in your photos.', cover_image_url: null, _localCover: require('../../assets/photo5-urban-sunset.png'), is_active: true, end_date: new Date(Date.now() + 7 * 86400000).toISOString(), submission_count: 144 },
  { id: 'ph2', title: 'Nature & Serenity', description: 'Find peace in nature and share your serene captures.', cover_image_url: null, _localCover: require('../../assets/photo2-mountain-sunset.png'), is_active: true, end_date: new Date(Date.now() + 14 * 86400000).toISOString(), submission_count: 89 },
  { id: 'ph3', title: 'Ocean Moments', description: 'Share your favorite ocean and water photography.', cover_image_url: null, _localCover: require('../../assets/photo7-ocean-sunset.png'), is_active: true, end_date: new Date(Date.now() + 30 * 86400000).toISOString(), submission_count: 0 },
  { id: 'ph4', title: 'Urban Life', description: 'Document the energy and beauty of city life.', cover_image_url: null, _localCover: require('../../assets/photo1-city-street.png'), is_active: false, end_date: new Date(Date.now() - 86400000).toISOString(), submission_count: 203 },
];

const ChallengesScreen = () => {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  const fetchChallenges = useCallback(async () => {
    try {
      const data = await api.getChallenges();
      setChallenges(data.challenges || []);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchChallenges(); }, [fetchChallenges]);

  const displayChallenges = challenges.length > 0 ? challenges : PLACEHOLDER_CHALLENGES;
  const filtered = displayChallenges.filter((c) => {
    if (filter === 'all') return true;
    const isActive = c.is_active && new Date(c.end_date) > new Date();
    return filter === 'active' ? isActive : !isActive;
  });

  const timeLeft = (end: string) => {
    const d = new Date(end).getTime() - Date.now();
    if (d <= 0) return 'Ended';
    const days = Math.floor(d / 86400000);
    const hrs = Math.floor((d % 86400000) / 3600000);
    return `${days}d ${hrs}h remaining`;
  };

  if (loading) {
    return (
      <View style={s.loadWrap}>
        <ActivityIndicator size="large" color={C.ORANGE} />
      </View>
    );
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Photography Challenges</Text>
        <Text style={s.headerSub}>Browse challenges and showcase your creativity</Text>
      </View>

      {/* Filter pills */}
      <View style={s.filterRow}>
        {[
          { key: 'all' as Filter, label: 'All' },
          { key: 'active' as Filter, label: 'Active' },
          { key: 'ended' as Filter, label: 'Completed' },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[s.filterPill, filter === f.key && s.filterActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[s.filterText, filter === f.key && s.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Challenge cards */}
      <View style={[s.grid, isMobile && { paddingHorizontal: 16 }]}>
        {filtered.map((item: any) => {
          const isActive = item.is_active && new Date(item.end_date) > new Date();
          return (
            <TouchableOpacity
              key={item.id}
              style={[s.card, isMobile && { width: '100%' as any }]}
              onPress={() => navigation.navigate('ChallengeDetail', { id: item.id })}
            >
              <Image source={item._localCover || (item.cover_image_url ? { uri: item.cover_image_url } : require('../../assets/photo9-mountain-clouds.png'))} style={s.cardImg} resizeMode="cover" />
              <View style={s.cardBody}>
                <View style={s.cardTitleRow}>
                  <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
                  <View style={[s.badge, isActive ? s.badgeActive : s.badgeEnded]}>
                    <Text style={[s.badgeText, isActive ? s.badgeTextActive : s.badgeTextEnded]}>
                      {isActive ? 'Active' : 'Ended'}
                    </Text>
                  </View>
                </View>
                <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text>
                <View style={s.cardMeta}>
                  <Text style={s.metaItem}>📸 {item.submission_count || 0} submissions</Text>
                  <Text style={s.metaItem}>⏱ {timeLeft(item.end_date)}</Text>
                </View>
                <TouchableOpacity
                  style={[s.viewBtn, !isActive && s.viewBtnEnded]}
                  onPress={() => navigation.navigate('ChallengeDetail', { id: item.id })}
                >
                  <Text style={s.viewBtnText}>View Challenge</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {filtered.length === 0 && (
        <View style={s.empty}>
          <Text style={{ fontSize: 48 }}>📷</Text>
          <Text style={s.emptyText}>No challenges found</Text>
          <Text style={s.emptySub}>Check back soon for new photo challenges!</Text>
        </View>
      )}
    </ScrollView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.BG },
  loadWrap: {
    flex: 1,
    backgroundColor: C.BG,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    color: C.TEXT,
    fontSize: 26,
    fontWeight: '700',
  },
  headerSub: {
    color: C.TEXT_SECONDARY,
    fontSize: 14,
    marginTop: 4,
  },

  // Filters
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.CARD_BG,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  filterActive: {
    backgroundColor: C.ORANGE,
    borderColor: C.ORANGE,
  },
  filterText: { color: C.TEXT_SECONDARY, fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: '#FFFFFF' },

  // Grid
  grid: {
    paddingHorizontal: 20,
    gap: 16,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    backgroundColor: C.CARD_BG,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    marginBottom: 4,
  },
  cardImg: {
    width: '100%',
    height: 180,
    backgroundColor: '#1A1E30',
  },
  cardImgPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: { padding: 16 },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    color: C.TEXT,
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeActive: { backgroundColor: 'rgba(72, 187, 120, 0.15)' },
  badgeEnded: { backgroundColor: 'rgba(148, 163, 184, 0.15)' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeTextActive: { color: '#48BB78' },
  badgeTextEnded: { color: C.TEXT_SECONDARY },
  cardDesc: {
    color: C.TEXT_SECONDARY,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: { color: C.TEXT_MUTED, fontSize: 13 },
  viewBtn: {
    borderWidth: 1.5,
    borderColor: C.ORANGE,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  viewBtnEnded: { borderColor: C.TEXT_SECONDARY },
  viewBtnText: { color: C.ORANGE, fontSize: 14, fontWeight: '700' },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: C.TEXT, fontSize: 18, fontWeight: '600', marginTop: 12 },
  emptySub: { color: C.TEXT_SECONDARY, fontSize: 14, marginTop: 4 },
});

export default ChallengesScreen;
