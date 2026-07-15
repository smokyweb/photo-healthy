import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Image,
  TouchableOpacity, ScrollView, RefreshControl, useWindowDimensions, Modal,
} from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getCommunityPosts, getPublicSettings, getSubmissions } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import AppFooter from '../components/AppFooter';
import MasonryGrid from '../components/MasonryGrid';
import PhotoWatermark from '../components/PhotoWatermark';
import CommunityPostCard from '../components/CommunityPostCard';
import { C, borderRadius } from '../theme';
import { normalizeChallengeCategory, normalizeFeelingCategory, normalizeMovementCategory } from '../constants/taxonomy';
import { fullUrl } from '../config/api';

const SORTS = [
  { key: 'recent', label: 'Recent' },
  { key: 'popular', label: 'Popular' },
  { key: 'top', label: 'Top Rated' },
];

type CommunityFilter = { type: 'category' | 'feeling' | 'movement'; value: string } | null;

const clean = (value: string) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const cleanTagValue = (normalized: string, fallback?: string) => {
  const value = normalized && normalized !== '-' ? normalized : fallback;
  return String(value || '').trim();
};
const getSubmissionTag = (submission: any, type: 'category' | 'feeling' | 'movement') => {
  if (type === 'category') {
    const raw = submission.category || submission.challenge_category || submission.challengeCategory;
    return cleanTagValue(normalizeChallengeCategory(raw), raw);
  }
  if (type === 'feeling') {
    const raw = submission.feeling_category || submission.feeling_tag || submission.challenge_feeling_category || submission.challengeFeelingCategory;
    return cleanTagValue(normalizeFeelingCategory(raw), raw);
  }
  const raw = submission.movement_category || submission.movement_tag || submission.challenge_movement_category || submission.challengeMovementCategory;
  return cleanTagValue(normalizeMovementCategory(raw), raw);
};
const matchesCommunityFilter = (submission: any, filter: CommunityFilter) => {
  if (!filter) return true;
  const itemValue = clean(getSubmissionTag(submission, filter.type));
  const filterValue = clean(filter.value);
  if (!itemValue || !filterValue) return false;
  return itemValue === filterValue || itemValue.includes(filterValue) || filterValue.includes(itemValue);
};
const numberValue = (value: any) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};
const timeValue = (value: any) => {
  const t = new Date(value || 0).getTime();
  return Number.isFinite(t) ? t : 0;
};
const sortCommunitySubmissions = (items: any[], activeSort: string) => {
  const sorted = [...items];
  if (activeSort === 'popular') {
    return sorted.sort((a, b) =>
      numberValue(b.comment_count ?? b.comments_count ?? b.comments) - numberValue(a.comment_count ?? a.comments_count ?? a.comments) ||
      timeValue(b.created_at) - timeValue(a.created_at)
    );
  }
  if (activeSort === 'top') {
    return sorted.sort((a, b) =>
      numberValue(b.like_count ?? b.likes) - numberValue(a.like_count ?? a.likes) ||
      timeValue(b.created_at) - timeValue(a.created_at)
    );
  }
  return sorted.sort((a, b) => timeValue(b.created_at) - timeValue(a.created_at));
};

type CommunityGuide = {
  enabled: boolean;
  title: string;
  text: string;
  videoUrl: string;
};

const DEFAULT_COMMUNITY_GUIDE: CommunityGuide = {
  enabled: true,
  title: 'Grow Together',
  text: 'Support other members on their wellness journey with encouraging, positive comments. Open a photo to join the full conversation, celebrate progress, and build genuine friendship connections in a respectful community.',
  videoUrl: '',
};

const normalizeCommunityGuide = (data: any): CommunityGuide => {
  const settings = data?.settings || data || {};
  const enabledValue = String(settings.community_guide_enabled ?? '1').trim().toLowerCase();
  return {
    enabled: !['0', 'false', 'no', 'off'].includes(enabledValue),
    title: String(settings.community_guide_title || DEFAULT_COMMUNITY_GUIDE.title).trim(),
    text: String(settings.community_guide_text || DEFAULT_COMMUNITY_GUIDE.text).trim(),
    videoUrl: String(settings.community_guide_video_url || '').trim(),
  };
};

const communityVideoEmbedUrl = (videoUrl: string) => {
  const value = String(videoUrl || '').trim();
  if (!value) return '';
  if (/youtube\.com\/embed\//i.test(value) || /player\.vimeo\.com\/video\//i.test(value)) return value;
  const youtubeMatch = value.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/))([A-Za-z0-9_-]{6,})/i);
  if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  const vimeoMatch = value.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return '';
};

export default function CommunityScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const numCols = width >= 1200 ? 5 : width >= 900 ? 4 : width >= 600 ? 3 : 2;

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sort, setSort] = useState('recent');
  const [communityFilter, setCommunityFilter] = useState<CommunityFilter>(null);
  const [sourceSubmissionId, setSourceSubmissionId] = useState<any>(null);
  const [communityGuide, setCommunityGuide] = useState<CommunityGuide>(DEFAULT_COMMUNITY_GUIDE);
  const [communityGuideLoaded, setCommunityGuideLoaded] = useState(false);
  const [communityGuideOpen, setCommunityGuideOpen] = useState(false);

  const communityGuideFingerprint = JSON.stringify({
    title: communityGuide.title,
    text: communityGuide.text,
    videoUrl: communityGuide.videoUrl,
  });
  const communityGuideStorageKey = user?.id ? `ph_community_guide_seen_${user.id}` : '';
  const closeCommunityGuide = () => {
    setCommunityGuideOpen(false);
    if (communityGuideStorageKey && typeof localStorage !== 'undefined') {
      localStorage.setItem(communityGuideStorageKey, communityGuideFingerprint);
    }
  };

  const load = async (s = sort, filter = communityFilter) => {
    try {
      const params: Record<string, string> = { sort: s, limit: filter ? '200' : '40' };
      if (filter?.value) params[filter.type] = filter.value;
      const [submissionData, postData] = await Promise.all([
        getSubmissions(params),
        getCommunityPosts({ limit: '20' }).catch(() => ({ posts: [] })),
      ]);
      setSubmissions(submissionData?.submissions || submissionData || []);
      setCommunityPosts(postData?.posts || postData || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { load(sort, communityFilter); }, [sort, communityFilter]));
  useEffect(() => { setLoading(true); load(sort, communityFilter); }, [sort, communityFilter]);
  useEffect(() => {
    let active = true;
    getPublicSettings()
      .then(data => { if (active) setCommunityGuide(normalizeCommunityGuide(data)); })
      .catch(() => { if (active) setCommunityGuide(DEFAULT_COMMUNITY_GUIDE); })
      .finally(() => { if (active) setCommunityGuideLoaded(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!communityGuideLoaded || !user || !communityGuide.enabled) {
      if (!user || !communityGuide.enabled) setCommunityGuideOpen(false);
      return;
    }
    const seenFingerprint = communityGuideStorageKey && typeof localStorage !== 'undefined'
      ? localStorage.getItem(communityGuideStorageKey)
      : null;
    if (seenFingerprint !== communityGuideFingerprint) setCommunityGuideOpen(true);
  }, [communityGuide.enabled, communityGuideFingerprint, communityGuideLoaded, communityGuideStorageKey, user?.id]);
  useEffect(() => {
    const nextFilter = route.params?.communityFilter || (
      route.params?.communityFilterType && route.params?.communityFilterValue
        ? { type: route.params.communityFilterType, value: route.params.communityFilterValue }
        : null
    );
    if (
      nextFilter?.value &&
      ['category', 'feeling', 'movement'].includes(nextFilter.type)
    ) {
      setCommunityFilter({ type: nextFilter.type, value: nextFilter.value });
      setSourceSubmissionId(route.params?.sourceSubmissionId || null);
    }
  }, [
    route.params?.communityFilter?.type,
    route.params?.communityFilter?.value,
    route.params?.communityFilterType,
    route.params?.communityFilterValue,
    route.params?.sourceSubmissionId,
  ]);

  if (loading) return <LoadingSpinner fullScreen />;

  const visibleSubmissions = sortCommunitySubmissions(
    submissions.filter(item => matchesCommunityFilter(item, communityFilter)),
    sort
  );
  const guideEmbedUrl = communityVideoEmbedUrl(communityGuide.videoUrl);

  return (
    <>
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.ORANGE} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.heading}>Community Gallery</Text>
          {user && communityGuide.enabled && (
            <TouchableOpacity
              style={styles.guideButton}
              onPress={() => setCommunityGuideOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.guideButtonText}>How to support others</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.subheading}>Real photos from our wellness community</Text>
        {communityFilter && (
          <>
            {sourceSubmissionId ? (
              <TouchableOpacity
                onPress={() => navigation.navigate('SubmissionDetail' as never, { submissionId: sourceSubmissionId, id: sourceSubmissionId } as never)}
                style={styles.backToPhotoBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.backToPhotoText}>Back to photo</Text>
              </TouchableOpacity>
            ) : null}
            <View style={styles.activeFilterRow}>
              <Text style={styles.activeFilterText}>
                Showing {communityFilter.type}: {communityFilter.value}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setCommunityFilter(null);
                  setSourceSubmissionId(null);
                }}
                style={styles.clearFilterBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.clearFilterText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {communityPosts.length > 0 ? (
        <View style={styles.updatesSection}>
          <View style={styles.updatesHeadingRow}>
            <View>
              <Text style={styles.updatesEyebrow}>FROM PHOTO HEALTHY</Text>
              <Text style={styles.updatesTitle}>Community updates</Text>
            </View>
            <Text style={styles.updatesCount}>{communityPosts.length} {communityPosts.length === 1 ? 'post' : 'posts'}</Text>
          </View>
          {communityPosts.map(post => <CommunityPostCard key={post.id} post={post} compact />)}
        </View>
      ) : null}

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
        {visibleSubmissions.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📷</Text>
            <Text style={styles.emptyTitle}>{communityFilter ? 'No matching photos yet' : 'No photos yet'}</Text>
            <Text style={styles.emptyBody}>{communityFilter ? 'Try clearing this filter to see more community photos.' : 'Be the first to submit a photo!'}</Text>
          </View>
        ) : (
          <MasonryGrid
            items={visibleSubmissions}
            numColumns={numCols}
            gap={10}
            estimatedContentHeight={72}
            getKey={(item) => item.id}
            getImageUri={(item) => fullUrl(item.photo1_url || item.image_url || item.photo_url)}
            renderItem={(item, { aspectRatio }) => {
              const imgUri = fullUrl(item.photo1_url || item.image_url || item.photo_url);
              return (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => navigation.navigate('SubmissionDetail' as never, { submissionId: item.id, id: item.id } as never)}
                  activeOpacity={0.85}
                >
                  {imgUri ? (
                    <View style={[styles.imageWrap, { aspectRatio }]}>
                      <Image source={{ uri: imgUri }} style={styles.img} resizeMode="cover" />
                      <PhotoWatermark size="small" />
                    </View>
                  ) : (
                    <View style={[styles.placeholder, { aspectRatio }]}>
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
            }}
          />
        )}
      </View>

      <AppFooter />
    </ScrollView>
      <Modal
        visible={communityGuideOpen && !!user && communityGuide.enabled}
        transparent
        animationType="fade"
        onRequestClose={closeCommunityGuide}
      >
        <View style={styles.guideOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={closeCommunityGuide}
            accessibilityLabel="Close community guide"
          />
          <View style={styles.guidePanel}>
            <ScrollView contentContainerStyle={styles.guidePanelContent} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={styles.guideCloseButton}
                onPress={closeCommunityGuide}
                accessibilityLabel="Close community guide"
              >
                <Text style={styles.guideCloseText}>×</Text>
              </TouchableOpacity>

              <Text style={styles.guideEyebrow}>PHOTO HEALTHY COMMUNITY</Text>
              <Text style={styles.guideTitle}>{communityGuide.title}</Text>

              {communityGuide.videoUrl ? (
                <View style={styles.guideVideoFrame}>
                  {guideEmbedUrl ? (
                    <iframe
                      src={guideEmbedUrl}
                      title="Photo Healthy community guide"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{ width: '100%', height: '100%', border: 0 } as any}
                    />
                  ) : (
                    <video
                      src={communityGuide.videoUrl}
                      controls
                      style={{ width: '100%', height: '100%', objectFit: 'contain' } as any}
                    />
                  )}
                </View>
              ) : (
                <View style={styles.guideIllustration}>
                  <Text style={styles.guideIllustrationIcon}>♡</Text>
                  <Text style={styles.guideIllustrationText}>Encourage • Connect • Grow</Text>
                </View>
              )}

              {communityGuide.text.split(/\n+/).filter(Boolean).map((paragraph, index) => (
                <Text key={`${paragraph}-${index}`} style={styles.guideBody}>{paragraph}</Text>
              ))}

              <View style={styles.guideValues}>
                {[
                  ['Encourage progress', 'Celebrate effort and healthy milestones.'],
                  ['Lead with kindness', 'Keep feedback positive, helpful, and respectful.'],
                  ['Build connections', 'Use thoughtful comments to begin genuine friendships.'],
                ].map(([title, body]) => (
                  <View key={title} style={styles.guideValueCard}>
                    <Text style={styles.guideValueTitle}>{title}</Text>
                    <Text style={styles.guideValueBody}>{body}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.guideCommentsNote}>
                <Text style={styles.guideCommentsNoteTitle}>Comments stay with each photo</Text>
                <Text style={styles.guideCommentsNoteBody}>
                  Open any submission to see everyone&apos;s comments and join the conversation. The main gallery stays focused, clean, and easy to explore.
                </Text>
              </View>

              <TouchableOpacity style={styles.guidePrimaryButton} onPress={closeCommunityGuide} activeOpacity={0.85}>
                <Text style={styles.guidePrimaryButtonText}>Explore the community</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.DIVIDER,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 },
  heading: {
    color: C.TEXT,
    fontSize: 24,
    fontWeight: '800',
    fontFamily: "'Lexend', sans-serif",
    marginBottom: 4,
  },
  subheading: { color: C.TEXT_MUTED, fontSize: 14 },
  guideButton: {
    borderWidth: 1,
    borderColor: C.TEAL + '88',
    backgroundColor: C.TEAL + '12',
    borderRadius: borderRadius.pill,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  guideButtonText: { color: C.TEAL, fontSize: 12, fontWeight: '900' },
  updatesSection: { width: '100%', maxWidth: 1100, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 24 },
  updatesHeadingRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  updatesEyebrow: { color: C.ORANGE_MID, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  updatesTitle: { color: C.TEXT, fontSize: 20, lineHeight: 27, fontWeight: '800', fontFamily: "'Lexend', sans-serif", marginTop: 2 },
  updatesCount: { color: C.TEXT_MUTED, fontSize: 12, fontWeight: '600' },
  backToPhotoBtn: {
    alignSelf: 'flex-start',
    marginTop: 14,
    marginBottom: 2,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: C.ORANGE + '77',
    backgroundColor: C.ORANGE + '18',
  },
  backToPhotoText: { color: C.ORANGE, fontSize: 13, fontWeight: '900' },
  activeFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 10,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.pill,
    backgroundColor: C.CARD_BG,
    borderWidth: 1,
    borderColor: C.TEAL + '66',
  },
  activeFilterText: { color: C.TEAL, fontSize: 13, fontWeight: '800', textTransform: 'capitalize' },
  clearFilterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
    backgroundColor: C.ORANGE + '22',
    borderWidth: 1,
    borderColor: C.ORANGE + '77',
  },
  clearFilterText: { color: C.ORANGE, fontSize: 12, fontWeight: '800' },
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
    backgroundColor: 'transparent',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  imageWrap: { width: '100%', position: 'relative', overflow: 'hidden' },
  img: { width: '100%', height: '100%', backgroundColor: 'transparent' },
  placeholder: { width: '100%', backgroundColor: C.CARD_BG2, alignItems: 'center', justifyContent: 'center', minHeight: 120 },
  cardInfo: { padding: 8, backgroundColor: 'rgba(59, 62, 79, 0.82)' },
  cardTitle: { color: C.TEXT, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardUser: { color: C.TEXT_MUTED, fontSize: 11, flex: 1 },
  cardLikes: { color: C.TEXT_MUTED, fontSize: 11 },
  empty: { alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  emptyTitle: { color: C.TEXT, fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptyBody: { color: C.TEXT_MUTED, fontSize: 14 },
  guideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 16, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  guidePanel: {
    width: '100%',
    maxWidth: 720,
    maxHeight: '92%' as any,
    backgroundColor: C.CARD_BG2,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.48,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 20,
  },
  guidePanelContent: { padding: 24, paddingTop: 28 },
  guideCloseButton: {
    position: 'absolute',
    right: 14,
    top: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.CARD_BG,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    zIndex: 4,
  },
  guideCloseText: { color: C.TEXT, fontSize: 25, lineHeight: 28, fontWeight: '500' },
  guideEyebrow: { color: C.ORANGE, fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginBottom: 5, paddingRight: 44 },
  guideTitle: { color: C.TEXT, fontSize: 28, lineHeight: 35, fontWeight: '900', fontFamily: "'Lexend', sans-serif", marginBottom: 18, paddingRight: 44 },
  guideVideoFrame: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#090D18',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  guideIllustration: {
    minHeight: 120,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: C.TEAL + '55',
    backgroundColor: C.TEAL + '0D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    padding: 18,
  },
  guideIllustrationIcon: { color: C.TEAL, fontSize: 48, lineHeight: 52, fontWeight: '300' },
  guideIllustrationText: { color: C.TEXT, fontSize: 15, fontWeight: '800', marginTop: 6, textAlign: 'center' },
  guideBody: { color: C.TEXT_SECONDARY, fontSize: 15, lineHeight: 23, marginBottom: 14 },
  guideValues: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 2, marginBottom: 16 },
  guideValueCard: {
    flex: 1,
    minWidth: 170,
    padding: 13,
    borderRadius: borderRadius.lg,
    backgroundColor: C.CARD_BG,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  guideValueTitle: { color: C.TEAL, fontSize: 13, fontWeight: '900', marginBottom: 4 },
  guideValueBody: { color: C.TEXT_SECONDARY, fontSize: 12, lineHeight: 18 },
  guideCommentsNote: {
    padding: 14,
    borderRadius: borderRadius.lg,
    backgroundColor: C.ORANGE + '12',
    borderWidth: 1,
    borderColor: C.ORANGE + '55',
    marginBottom: 18,
  },
  guideCommentsNoteTitle: { color: C.ORANGE, fontSize: 13, fontWeight: '900', marginBottom: 4 },
  guideCommentsNoteBody: { color: C.TEXT_SECONDARY, fontSize: 13, lineHeight: 19 },
  guidePrimaryButton: {
    alignSelf: 'stretch',
    backgroundColor: C.ORANGE,
    borderRadius: borderRadius.pill,
    paddingHorizontal: 18,
    paddingVertical: 13,
    alignItems: 'center',
  },
  guidePrimaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
});

