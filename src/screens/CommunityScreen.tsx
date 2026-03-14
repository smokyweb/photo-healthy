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

type SortTab = 'recent' | 'liked' | 'commented';

const PLACEHOLDER_SUBMISSIONS = [
  { id: 'ps1', user_name: 'sarah_lens', title: 'Golden hour reflections', photo1_url: null, _localPhoto: require('../../assets/photo1-city-street.png'), like_count: 234, comment_count: 18, created_at: '2026-03-12T10:00:00Z' },
  { id: 'ps2', user_name: 'mike_photo', title: 'City lights at dusk', photo1_url: null, _localPhoto: require('../../assets/photo2-mountain-sunset.png'), like_count: 189, comment_count: 24, created_at: '2026-03-11T10:00:00Z' },
  { id: 'ps3', user_name: 'jane_captures', title: 'Morning serenity', photo1_url: null, _localPhoto: require('../../assets/photo3-field-sunset.png'), like_count: 156, comment_count: 12, created_at: '2026-03-10T10:00:00Z' },
  { id: 'ps4', user_name: 'tom_shutters', title: 'Urban sunset vibes', photo1_url: null, _localPhoto: require('../../assets/photo5-urban-sunset.png'), like_count: 142, comment_count: 9, created_at: '2026-03-09T10:00:00Z' },
  { id: 'ps5', user_name: 'amy_frames', title: 'Forest light rays', photo1_url: null, _localPhoto: require('../../assets/photo6-trees-light.png'), like_count: 198, comment_count: 15, created_at: '2026-03-08T10:00:00Z' },
  { id: 'ps6', user_name: 'dan_lens', title: 'Bare winter beauty', photo1_url: null, _localPhoto: require('../../assets/photo10-bare-tree-sky.png'), like_count: 167, comment_count: 21, created_at: '2026-03-07T10:00:00Z' },
];

const CommunityScreen = () => {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SortTab>('recent');
  const [showCount, setShowCount] = useState(10);

  const fetchSubmissions = useCallback(async () => {
    try {
      const data = await api.getSubmissions();
      setSubmissions(data.submissions || []);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const displaySubmissions = submissions.length > 0 ? submissions : PLACEHOLDER_SUBMISSIONS;
  const sorted = [...displaySubmissions].sort((a, b) => {
    if (activeTab === 'liked') return (b.like_count || 0) - (a.like_count || 0);
    if (activeTab === 'commented') return (b.comment_count || 0) - (a.comment_count || 0);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const visible = sorted.slice(0, showCount);
  const hasMore = showCount < sorted.length;

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
        <Text style={s.headerTitle}>View Submissions</Text>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {[
          { key: 'recent' as SortTab, label: 'Most Recent' },
          { key: 'liked' as SortTab, label: 'Most Liked' },
          { key: 'commented' as SortTab, label: 'Most Commented' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, activeTab === tab.key && s.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Count header */}
      <View style={s.countRow}>
        <Text style={s.countTitle}>Community Submissions</Text>
        <Text style={s.countBadge}>{displaySubmissions.length} photos</Text>
      </View>

      {/* Grid */}
      <View style={[s.grid, isMobile && { gap: 12, paddingHorizontal: 16 }]}>
        {visible.map((sub: any) => (
          <TouchableOpacity
            key={sub.id}
            style={[s.card, isMobile && { width: '47%' as any }]}
            onPress={() => navigation.navigate('SubmissionDetail', { id: sub.id })}
          >
            <Image source={sub._localPhoto || { uri: sub.photo1_url }} style={s.cardImg} resizeMode="cover" />
            <View style={s.cardBottom}>
              <View style={s.cardUser}>
                <View style={s.cardAvatar}>
                  <Text style={s.cardAvatarText}>
                    {(sub.user_name || 'U')[0]}
                  </Text>
                </View>
                <Text style={s.cardUserName} numberOfLines={1}>
                  {sub.user_name || 'Unknown'}
                </Text>
              </View>
              <View style={s.cardStats}>
                <Text style={s.cardStat}>❤️ {sub.like_count || 0}</Text>
                <Text style={s.cardStat}>💬 {sub.comment_count || 0}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {visible.length === 0 && (
        <View style={s.empty}>
          <Text style={{ fontSize: 48 }}>📷</Text>
          <Text style={s.emptyText}>No submissions yet</Text>
          <Text style={s.emptySubtext}>Be the first to share!</Text>
        </View>
      )}

      {/* Load more */}
      {hasMore && (
        <TouchableOpacity
          style={s.loadMoreBtn}
          onPress={() => setShowCount((c) => c + 10)}
        >
          <Text style={s.loadMoreText}>Load More Submissions</Text>
        </TouchableOpacity>
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

  // Tabs
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.CARD_BG,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  tabActive: {
    backgroundColor: C.ORANGE,
    borderColor: C.ORANGE,
  },
  tabText: {
    color: C.TEXT_SECONDARY,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  // Count
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  countTitle: {
    color: C.TEXT,
    fontSize: 18,
    fontWeight: '700',
  },
  countBadge: {
    color: C.TEAL,
    fontSize: 13,
    fontWeight: '600',
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingHorizontal: 20,
  },
  card: {
    width: '48%' as any,
    backgroundColor: C.CARD_BG,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  cardImg: {
    width: '100%',
    height: 150,
    backgroundColor: '#1A1E30',
  },
  cardBottom: { padding: 10 },
  cardUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardAvatarText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cardUserName: {
    color: C.TEXT,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  cardStats: { flexDirection: 'row', gap: 12 },
  cardStat: { color: C.TEXT_SECONDARY, fontSize: 12 },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: C.TEXT, fontSize: 18, fontWeight: '600', marginTop: 12 },
  emptySubtext: { color: C.TEXT_SECONDARY, fontSize: 14, marginTop: 4 },

  // Load more
  loadMoreBtn: {
    alignSelf: 'center',
    marginTop: 24,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.TEAL,
  },
  loadMoreText: { color: C.TEAL, fontSize: 14, fontWeight: '600' },
});

export default CommunityScreen;
