import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet,
  TouchableOpacity, ScrollView, RefreshControl, useWindowDimensions,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getChallengeEnrollment, getChallenges, getMyChallenges, getPublicChallenges, getPublicSettings } from '../services/api';
import ChallengeCard from '../components/ChallengeCard';
import LoadingSpinner from '../components/LoadingSpinner';
import GradientButton from '../components/GradientButton';
import { C, borderRadius } from '../theme';
import AppFooter from '../components/AppFooter';
import { Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { fullUrl } from '../config/api';
import {
  CHALLENGE_CATEGORIES,
  FEELING_CATEGORIES,
  normalizeChallengeCategory,
  normalizeFeelingCategory,
} from '../constants/taxonomy';

const CHALLENGE_LOGO = require('../../assets/Pose_6-removebg-preview.png');

type ChallengeGuide = {
  enabled: boolean;
  title: string;
  text: string;
  videoUrl: string;
};

const DEFAULT_CHALLENGE_GUIDE: ChallengeGuide = {
  enabled: true,
  title: 'How to choose your challenge',
  text: 'Use Pick your feeling to choose the emotional experience you want, then use Category to narrow the kind of wellness challenge you want to explore. Movement remains visible on each challenge so you know what activity is involved, but it is not part of the search.',
  videoUrl: '',
};

const normalizeChallengeGuide = (data: any): ChallengeGuide => {
  const settings = data?.settings || data || {};
  const enabledValue = String(settings.challenge_guide_enabled ?? '1').trim().toLowerCase();
  return {
    enabled: !['0', 'false', 'no', 'off'].includes(enabledValue),
    title: String(settings.challenge_guide_title || DEFAULT_CHALLENGE_GUIDE.title).trim(),
    text: String(settings.challenge_guide_text || DEFAULT_CHALLENGE_GUIDE.text).trim(),
    videoUrl: String(settings.challenge_guide_video_url || '').trim(),
  };
};

const challengeVideoEmbedUrl = (videoUrl: string) => {
  const value = String(videoUrl || '').trim();
  if (!value) return '';
  if (/youtube\.com\/embed\//i.test(value) || /player\.vimeo\.com\/video\//i.test(value)) return value;
  const youtubeMatch = value.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/))([A-Za-z0-9_-]{6,})/i);
  if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  const vimeoMatch = value.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return '';
};

const FEELING_OPTIONS = FEELING_CATEGORIES;

const primaryValue = (value?: string) => (value || '').split(',')[0].trim();
const tagDisplayValue = (normalized: string, fallback?: string) => {
  const value = normalized && normalized !== '-' ? normalized : fallback;
  return String(value || '').split(',')[0].replace(/^[^\w]+/u, '').trim();
};
const uniqueOptions = (defaults: string[], values: string[]) => {
  const seen = new Set<string>();
  return ['All', ...defaults, ...values]
    .map(v => String(v || '').trim())
    .filter(v => v && v !== '-' && !seen.has(v) && seen.add(v));
};
const filterMatches = (value: string, selected: string) => {
  const clean = (v: string) => String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const v = clean(value);
  const s = clean(selected);
  return v === s || v.includes(s) || s.includes(v);
};
const isInactiveFlag = (value: any) => value === false || value === 0 || value === '0';
const userChallengeStatus = (challenge: any) => challenge.user_challenge?.status || null;
const hasHardStopExpired = (challenge: any) => (
  !!challenge.end_date && new Date(challenge.end_date).getTime() < Date.now()
);
const isGloballyArchived = (challenge: any) =>
  challenge.status === 'archived' || isInactiveFlag(challenge.is_active) || hasHardStopExpired(challenge);
const isOpenChallenge = (challenge: any) => {
  if (challenge.status === 'upcoming') return false;
  return !isGloballyArchived(challenge);
};
const hasMissedCommitmentWindow = (challenge: any) =>
  userChallengeStatus(challenge) === 'active' && Number(challenge.user_challenge?.days_remaining ?? 0) < 0;
const isAvailableChallenge = (challenge: any) =>
  isOpenChallenge(challenge) &&
  !isActiveUserChallenge(challenge) &&
  !isCompletedUserChallenge(challenge) &&
  !hasMissedCommitmentWindow(challenge);
const isActiveUserChallenge = (challenge: any) =>
  userChallengeStatus(challenge) === 'active' &&
  isOpenChallenge(challenge) &&
  !hasMissedCommitmentWindow(challenge) &&
  !isCompletedUserChallenge(challenge);
const isCompletedUserChallenge = (challenge: any) =>
  userChallengeStatus(challenge) === 'completed' || !!challenge.user_challenge?.has_submission;
const isArchivedUserChallenge = (challenge: any) =>
  !isCompletedUserChallenge(challenge) &&
  (isGloballyArchived(challenge) || hasMissedCommitmentWindow(challenge));
const statusFilteredChallenges = (list: any[], status: string) => {
  if (status === 'active') return list.filter(isActiveUserChallenge);
  if (status === 'completed') return list.filter(isCompletedUserChallenge);
  if (status === 'archived') return list.filter(isArchivedUserChallenge);
  if (status !== 'all') return list.filter(c => c.status === status);
  return list.filter(isAvailableChallenge);
};
const optionBaseChallenges = (list: any[], status: string) => {
  if (status === 'all') return list;
  return statusFilteredChallenges(list, status);
};
const challengeCategoryValue = (challenge: any) =>
  tagDisplayValue(normalizeChallengeCategory(challenge.category || challenge.challenge_category), challenge.category || challenge.challenge_category);
const challengeFeelingValue = (challenge: any) =>
  tagDisplayValue(normalizeFeelingCategory(challenge.feeling_category || challenge.feeling_tag || challenge.challenge_feeling_category), challenge.feeling_category || challenge.feeling_tag || challenge.challenge_feeling_category);
const normalizeChallengeList = (data: any) => data?.challenges || data || [];
const userChallengeId = (item: any) => Number(item?.challenge_id ?? item?.id);
const userChallengeRows = (data: any) => {
  const rows = [...(data?.active || []), ...(data?.past || []), ...(data?.completed || [])];
  const byId = new Map<number, any>();
  rows.forEach(item => {
    const id = userChallengeId(item);
    if (id) byId.set(id, item);
  });
  return Array.from(byId.values());
};
const userChallengeState = (item: any) => {
  const hasSubmission = !!item.has_submission || !!item.has_submitted || item.status === 'completed';
  return {
    challenge_id: userChallengeId(item),
    status: hasSubmission ? 'completed' : 'active',
    days_remaining: item.days_remaining == null ? null : Number(item.days_remaining),
    has_submission: hasSubmission,
    new_submission_count: Number(item.new_submission_count || 0),
  };
};
const mergeUserChallenges = (list: any[], myData: any) => {
  const byId = new Map<number, any>();
  list.forEach(challenge => {
    const id = Number(challenge?.id);
    if (id) byId.set(id, challenge);
  });

  userChallengeRows(myData).forEach(item => {
    const id = userChallengeId(item);
    if (!id) return;
    const existing = byId.get(id);
    const user_challenge = userChallengeState(item);
    if (existing) {
      byId.set(id, { ...existing, user_challenge });
    } else {
      byId.set(id, { ...item, id, user_challenge });
    }
  });

  return Array.from(byId.values());
};
const mergeChallengeEnrollments = async (list: any[]) => {
  const enrollments = await Promise.all(
    list.map(async challenge => {
      const id = Number(challenge?.id);
      if (!id) return null;
      const enrollment = await getChallengeEnrollment(id).catch(() => null);
      return enrollment?.enrolled && enrollment.user_challenge
        ? { id, user_challenge: userChallengeState(enrollment.user_challenge) }
        : null;
    })
  );
  const byId = new Map(enrollments.filter(Boolean).map((item: any) => [item.id, item.user_challenge]));
  return list.map(challenge => {
    const id = Number(challenge?.id);
    const user_challenge = byId.get(id);
    return user_challenge ? { ...challenge, user_challenge } : challenge;
  });
};

export default function ChallengesScreen() {
  const navigation = useNavigation<any>();
  const { user, loading: authLoading } = useAuth();
  const [dismissSignupBanner, setDismissSignupBanner] = useState(false);
  const [challengeGuide, setChallengeGuide] = useState<ChallengeGuide>(DEFAULT_CHALLENGE_GUIDE);

  const [challenges, setChallenges] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [moodFilter, setMoodFilter] = useState('');
  const [moodDropdownOpen, setMoodDropdownOpen] = useState(false);
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('');
  const { width } = useWindowDimensions();
  const numCols = width >= 1100 ? 3 : width >= 700 ? 2 : 1;
  const cardHeight = width >= 1100 ? 580 : width >= 700 ? 560 : 580;

  const load = async () => {
    try {
      const data = await getChallenges();
      let list = normalizeChallengeList(data);
      const myChallenges = await getMyChallenges().catch(() => null);
      if (!Array.isArray(list) || list.length === 0) {
        const publicData = await getPublicChallenges().catch(() => null);
        const publicList = normalizeChallengeList(publicData);
        if (Array.isArray(publicList) && publicList.length > 0) list = publicList;
      }
      if (myChallenges) list = mergeUserChallenges(list, myChallenges);
      list = await mergeChallengeEnrollments(list);
      setChallenges(list);

      applyFilters(list, status, category, moodFilter);
    } catch (e) {
      console.error(e);
      try {
        const publicData = await getPublicChallenges();
        let list = normalizeChallengeList(publicData);
        const myChallenges = await getMyChallenges().catch(() => null);
        if (myChallenges) list = mergeUserChallenges(list, myChallenges);
        list = await mergeChallengeEnrollments(list);
        setChallenges(list);
        applyFilters(list, status, category, moodFilter);
      } catch (fallbackError) {
        console.error(fallbackError);
      }
    }
    setLoading(false);
    setRefreshing(false);
  };

  const applyFilters = useCallback(
    (list: any[], s: string, cat: string, mood: string) => {
      let result = [...list];
      result = statusFilteredChallenges(result, s);
      if (cat) result = result.filter(c => filterMatches(challengeCategoryValue(c), cat));
      if (mood) result = result.filter(c => filterMatches(challengeFeelingValue(c), mood));
      if (
        result.length === 0 &&
        s === 'all' &&
        !cat &&
        !mood
      ) {
        result = list.filter(isAvailableChallenge);
        if (result.length === 0) result = [...list];
      }
      setFiltered(result);
    },
    []
  );

  useFocusEffect(useCallback(() => {
    if (!authLoading) load();
  }, [authLoading, user?.id]));
  useEffect(() => {
    let active = true;
    getPublicSettings()
      .then(data => { if (active) setChallengeGuide(normalizeChallengeGuide(data)); })
      .catch(() => { if (active) setChallengeGuide(DEFAULT_CHALLENGE_GUIDE); });
    return () => { active = false; };
  }, []);
  useEffect(() => { applyFilters(challenges, status, category, moodFilter); }, [status, category, moodFilter, challenges]);
  useEffect(() => {
    const statusList = optionBaseChallenges(challenges, status);
    if (category && !statusList.some(c => filterMatches(challengeCategoryValue(c), category))) setCategory('');
    if (moodFilter && !statusList.some(c => filterMatches(challengeFeelingValue(c), moodFilter))) setMoodFilter('');
  }, [challenges, status, category, moodFilter]);

  const onRefresh = () => { setRefreshing(true); load(); };
  const handleChallengeCardFilter = useCallback((filter: { type: 'name' | 'category' | 'feeling'; value: string }) => {
    if (!filter.value || filter.value === 'Not set') return;
    if (filter.type === 'category') {
      setCategory(filter.value);
      return;
    }
    if (filter.type === 'feeling') {
      setMoodFilter(filter.value);
      setMoodDropdownOpen(false);
    }
  }, []);

  if (loading) return <LoadingSpinner fullScreen />;

  // Group items into rows for manual grid
  function chunkArray<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }
  const rows = chunkArray(filtered, numCols);

  const tabCounts = {
    all: challenges.filter(isAvailableChallenge).length,
    active: challenges.filter(isActiveUserChallenge).length,
    completed: challenges.filter(isCompletedUserChallenge).length,
    archived: challenges.filter(isArchivedUserChallenge).length,
  };
  const STATUS_TABS = [
    { key: 'all', label: 'All (' + tabCounts.all + ')' },
    { key: 'active', label: 'Active (' + tabCounts.active + ')' },
    { key: 'completed', label: 'Completed (' + tabCounts.completed + ')' },
    { key: 'archived', label: 'Archived (' + tabCounts.archived + ')' },
  ];
  const activeChallengeCardFilters = [
    ...(category ? [{ type: 'category' as const, value: category }] : []),
    ...(moodFilter ? [{ type: 'feeling' as const, value: moodFilter }] : []),
  ];
  const challengeGuideEmbedUrl = challengeVideoEmbedUrl(challengeGuide.videoUrl);
  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.ORANGE} />}
      >
      {/* Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logoImageWrapper}>
          <Image source={CHALLENGE_LOGO} style={styles.logoImage} />
        </View>
        <Text style={styles.logoTitle}>Challenges</Text>
      </View>

      {challengeGuide.enabled && (
        <View style={[styles.challengeGuide, width >= 900 && styles.challengeGuideDesktop]}>
          <View style={styles.challengeGuideCopy}>
            <Text style={styles.challengeGuideEyebrow}>CHALLENGE FILTER GUIDE</Text>
            <Text style={styles.challengeGuideTitle}>{challengeGuide.title}</Text>
            <Text style={styles.challengeGuideBody}>{challengeGuide.text}</Text>
            <View style={styles.challengeGuideDefinitions}>
              {[
                ['Feeling', 'The emotional experience you want to support.'],
                ['Movement', 'The activity shown on each challenge for context.'],
                ['Category', 'The overall type of wellness challenge.'],
              ].map(([label, description]) => (
                <View key={label} style={styles.challengeGuideDefinition}>
                  <Text style={styles.challengeGuideDefinitionLabel}>{label}</Text>
                  <Text style={styles.challengeGuideDefinitionText}>{description}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={[styles.challengeGuideMedia, width >= 900 && styles.challengeGuideMediaDesktop]}>
            {challengeGuide.videoUrl ? (
              challengeGuideEmbedUrl ? (
                <iframe
                  src={challengeGuideEmbedUrl}
                  title="How challenge filters work"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ width: '100%', height: '100%', border: 0 } as any}
                />
              ) : (
                <video
                  src={challengeGuide.videoUrl}
                  controls
                  style={{ width: '100%', height: '100%', objectFit: 'contain' } as any}
                />
              )
            ) : (
              <View style={styles.challengeGuidePlaceholder}>
                <View style={styles.challengeGuidePlayCircle}>
                  <Text style={styles.challengeGuidePlayIcon}>▶</Text>
                </View>
                <Text style={styles.challengeGuidePlaceholderTitle}>Video guide coming soon</Text>
                <Text style={styles.challengeGuidePlaceholderText}>Feeling • Movement • Category</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Featured Challenge Banner */}
      {/* {(() => {
        const featured = challenges.find(c => {
          if (!(c.is_active || c.status === 'active')) return false;
          if (!c.end_date) return true;
          return new Date(c.end_date).getTime() >= Date.now();
        }) || challenges.find(c => c.is_active || c.status === 'active') || challenges[0];
        if (!featured) return null;
        const imgUri = fullUrl(featured.cover_image_url || featured.cover_image);
        const daysLeft = featured.end_date
          ? Math.max(0, Math.ceil((new Date(featured.end_date).getTime() - Date.now()) / 86400000))
          : null;
        return (
          <TouchableOpacity
            style={styles.featuredBanner}
            onPress={() => navigation.navigate('ChallengeDetail', { challengeId: featured.id, id: featured.id })}
            activeOpacity={0.92}
          >
            <View style={styles.featuredImgWrap}>
              {imgUri ? (
                <Image source={{ uri: imgUri }} style={styles.featuredImg} resizeMode="cover" />
              ) : (
                <View style={[styles.featuredImg, { backgroundColor: C.CARD_BG2, justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ fontSize: 48 }}>📸</Text>
                </View>
              )}
            </View>
            <View style={styles.featuredInfoPanel}>
              <View style={styles.featuredActiveBadge}>
                <Text style={styles.featuredActiveBadgeText}>{featured.is_active ? 'ACTIVE' : 'FEATURED'}</Text>
              </View>
              <Text style={styles.featuredTitle} numberOfLines={2}>{featured.title}</Text>
              {featured.description ? <Text style={styles.featuredDescText} numberOfLines={5}>{featured.description}</Text> : null}
              <View style={styles.featuredStatsGrid}>
                {daysLeft !== null && <View style={styles.featuredStatCell}><Text style={styles.featuredStatLabel}>ENDS IN</Text><Text style={styles.featuredStatVal}>{daysLeft}d</Text></View>}
                {featured.submission_count != null && <View style={styles.featuredStatCell}><Text style={styles.featuredStatLabel}>ENTRIES</Text><Text style={styles.featuredStatVal}>{featured.submission_count}</Text></View>}
                {featured.feeling_category && <View style={styles.featuredStatCell}><Text style={styles.featuredStatLabel}>FEELING</Text><Text style={styles.featuredStatVal} numberOfLines={1}>{primaryValue(featured.feeling_category)}</Text></View>}
                {featured.movement_category && <View style={styles.featuredStatCell}><Text style={styles.featuredStatLabel}>MOVEMENT</Text><Text style={styles.featuredStatVal} numberOfLines={1}>{primaryValue(featured.movement_category)}</Text></View>}
              </View>
              <GradientButton label="Join Challenge" variant="primary" size="sm" pill={false} onPress={() => navigation.navigate('ChallengeDetail', { challengeId: featured.id, id: featured.id })} style={{ marginTop: 12, alignSelf: 'flex-start' } as any} />
            </View>
          </TouchableOpacity>
        );
      })()} */}

      {/* Feeling Picker */}
      <View style={styles.searchArea}>
        <TouchableOpacity
          style={styles.searchWrap}
          onPress={() => setMoodDropdownOpen(open => !open)}
          activeOpacity={0.86}
        >
          <Text style={styles.searchIcon}>Search</Text>
          <Text style={[styles.searchInput, !moodFilter && styles.searchPlaceholder]} numberOfLines={1}>
            {moodFilter || 'Pick your feeling'}
          </Text>
          {moodFilter ? (
            <TouchableOpacity
              onPress={() => {
                setMoodFilter('');
                setMoodDropdownOpen(false);
              }}
              style={styles.clearBtn}
            >
              <Text style={styles.clearBtnText}>x</Text>
            </TouchableOpacity>
          ) : null}
          <Text style={styles.dropdownCaret}>{moodDropdownOpen ? '^' : 'v'}</Text>
        </TouchableOpacity>
        {moodDropdownOpen && (
          <View style={styles.dropdownPanel}>
            {FEELING_OPTIONS.map(feeling => (
              <TouchableOpacity
                key={feeling}
                style={[styles.dropdownOption, moodFilter === feeling && styles.dropdownOptionActive]}
                onPress={() => {
                  setMoodFilter(feeling);
                  setMoodDropdownOpen(false);
                }}
                activeOpacity={0.82}
              >
                <Text style={styles.dropdownOptionType}>Feeling</Text>
                <Text style={[styles.dropdownOptionText, moodFilter === feeling && styles.dropdownOptionTextActive]}>
                  {feeling}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Category Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        persistentScrollbar
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {CHALLENGE_CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.pill, category === cat && styles.pillActive]}
            onPress={() => setCategory(current => current === cat ? '' : cat)}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillText, category === cat && styles.pillTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.statusSection}>
        <Text style={styles.statusTitle}>Status</Text>
        <View style={styles.tabsRow}>
          {STATUS_TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, status === tab.key && styles.tabActive]}
              onPress={() => setStatus(tab.key)}
              activeOpacity={0.82}
            >
              <Text style={[styles.tabText, status === tab.key && styles.tabTextActive]}>
                {tab.label.split(' (')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Challenge Grid */}
      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🏆</Text>
          <Text style={styles.emptyTitle}>No challenges found</Text>
          <Text style={styles.emptyBody}>Try another status, category, or feeling.</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((challenge: any) => (
                <View key={challenge.id} style={[styles.challengeSlot, { width: `${100 / numCols - 1}%` as any, height: cardHeight }]}>
                  <ChallengeCard
                    challenge={challenge}
                    onPress={() => navigation.navigate('ChallengeDetail', { challengeId: challenge.id, id: challenge.id })}
                    onFilterPress={handleChallengeCardFilter}
                    activeFilters={activeChallengeCardFilters}
                  />
                </View>
              ))}
              {row.length < numCols && Array(numCols - row.length).fill(0).map((_, i) => (
                <View key={`pad-${i}`} style={[styles.challengeSlot, styles.challengeSlotPad, { width: `${100 / numCols - 1}%` as any, height: cardHeight }]} />
              ))}
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
      <AppFooter />
    </ScrollView>

    {/* Sign Up Banner for non-logged-in users */}
    {!user && !dismissSignupBanner && (
      <View style={styles.signupBannerContainer}>
        <View style={styles.signupBanner}>
          <TouchableOpacity onPress={() => setDismissSignupBanner(true)} style={styles.signupBannerClose} accessibilityLabel="Close join now prompt">
            <Text style={styles.signupBannerCloseText}>X</Text>
          </TouchableOpacity>
          <Text style={styles.signupTitle}>Join now to participate in challenges</Text>
          <Text style={styles.signupSubtitle}>
            Be a part of our growing wellness community that encourages your every step. Connect and Share with people from around the world.
          </Text>
          <GradientButton
            label="Join now"
            variant="primary"
            size="md"
            onPress={() => navigation.navigate('Register')}
            style={styles.signupButton}
          />
        </View>
      </View>
    )}

    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  logoImageWrapper: {
    width: 250,
    height: 170,
    overflow: 'hidden',
    marginBottom: 12,
  },
  logoImage: {
    width: 250,
    height: 200,
    marginTop: 0,
  },
  logoTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: C.TEXT,
    fontFamily: 'Lexend',
  },
  logoSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: C.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  challengeGuide: {
    width: 'calc(100% - 24px)' as any,
    maxWidth: 1200,
    alignSelf: 'center',
    marginHorizontal: 12,
    marginBottom: 18,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: C.TEAL + '55',
    backgroundColor: C.CARD_BG,
    overflow: 'hidden',
  },
  challengeGuideDesktop: { flexDirection: 'row' },
  challengeGuideCopy: { flex: 1, padding: 20 },
  challengeGuideEyebrow: { color: C.ORANGE, fontSize: 10, fontWeight: '900', letterSpacing: 1.1, marginBottom: 5 },
  challengeGuideTitle: { color: C.TEXT, fontSize: 22, lineHeight: 28, fontWeight: '900', fontFamily: 'Lexend', marginBottom: 8 },
  challengeGuideBody: { color: C.TEXT_SECONDARY, fontSize: 14, lineHeight: 21, marginBottom: 14 },
  challengeGuideDefinitions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  challengeGuideDefinition: {
    flex: 1,
    minWidth: 145,
    padding: 11,
    borderRadius: borderRadius.lg,
    backgroundColor: C.CARD_BG2,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  challengeGuideDefinitionLabel: { color: C.TEAL, fontSize: 12, fontWeight: '900', marginBottom: 3 },
  challengeGuideDefinitionText: { color: C.TEXT_SECONDARY, fontSize: 11, lineHeight: 16 },
  challengeGuideMedia: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#090D18',
    borderTopWidth: 1,
    borderTopColor: C.CARD_BORDER,
    overflow: 'hidden',
  },
  challengeGuideMediaDesktop: {
    width: '42%' as any,
    maxWidth: 500,
    alignSelf: 'stretch',
    aspectRatio: undefined,
    minHeight: 270,
    borderTopWidth: 0,
    borderLeftWidth: 1,
    borderLeftColor: C.CARD_BORDER,
  },
  challengeGuidePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  challengeGuidePlayCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.ORANGE + '22',
    borderWidth: 1,
    borderColor: C.ORANGE + '88',
    marginBottom: 10,
  },
  challengeGuidePlayIcon: { color: C.ORANGE, fontSize: 20, marginLeft: 3 },
  challengeGuidePlaceholderTitle: { color: C.TEXT, fontSize: 15, fontWeight: '800', marginBottom: 4, textAlign: 'center' },
  challengeGuidePlaceholderText: { color: C.TEXT_MUTED, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  quoteBanner: {
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 16,
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  quoteText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.TEXT,
    textAlign: 'center',
    lineHeight: 22,
  },
  quoteAuthor: {
    fontSize: 12,
    fontWeight: '400',
    color: C.TEXT_MUTED,
    textAlign: 'center',
    marginTop: 8,
  },
  featuredBanner: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    minHeight: 200,
    backgroundColor: C.CARD_BG,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  featuredImg: { width: '100%', height: '100%', minHeight: 200 },
  featuredImgWrap: { flex: 1, minHeight: 200 },
  featuredInfoPanel: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
    backgroundColor: C.CARD_BG,
  },
  featuredActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.TEAL + '22',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.TEAL + '55',
  },
  featuredActiveBadgeText: { color: C.TEAL, fontSize: 12, fontWeight: '700' },
  featuredDescText: { color: C.TEXT_SECONDARY, fontSize: 12, lineHeight: 17, marginTop: 4, marginBottom: 8 },
  featuredStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 4 },
  featuredStatCell: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: C.CARD_BG2,
    borderRadius: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  featuredStatLabel: { color: C.TEXT_MUTED, fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginBottom: 1 },
  featuredStatVal: { color: C.TEXT, fontSize: 14, fontWeight: '700' },
  featuredOverlay: {},  // kept for compatibility
  featuredBadge: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
    backgroundImage: 'linear-gradient(90deg, #F55B09, #FFD000)' as any,
    backgroundColor: C.ORANGE,
  },
  featuredBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  featuredTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    fontFamily: "'Lexend', sans-serif",
    marginBottom: 4,
    lineHeight: 28,
  },
  featuredDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  featuredMeta: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 2 },
  featuredChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  featuredChipText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  featuredMetaText: { color: 'rgba(255,255,255,0.95)', fontSize: 13, fontWeight: '500' },

  // Feeling picker
  searchArea: {
    marginHorizontal: 12,
    marginBottom: 10,
    zIndex: 5,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.INPUT_BG,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  searchIcon: { color: C.TEXT_MUTED, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  searchInput: { flex: 1, color: C.TEXT, fontSize: 15, fontWeight: '800', fontFamily: "'Inter', sans-serif" },
  searchPlaceholder: { color: C.TEXT_MUTED, fontWeight: '700' },
  clearBtn: { paddingHorizontal: 8 },
  clearBtnText: { fontSize: 16, color: C.TEXT_MUTED },
  dropdownCaret: { color: C.TEXT, fontSize: 16, fontWeight: '900', width: 18, textAlign: 'center' },
  dropdownPanel: {
    marginTop: 8,
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.CARD_BORDER,
  },
  dropdownOptionActive: {
    backgroundColor: C.TEAL + '22',
  },
  dropdownOptionType: {
    width: 72,
    color: C.TEXT_MUTED,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  dropdownOptionText: {
    flex: 1,
    color: C.TEXT,
    fontSize: 14,
    fontWeight: '800',
  },
  dropdownOptionTextActive: {
    color: C.TEAL,
  },
  statusSection: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
    marginBottom: 12,
    backgroundColor: C.NAV_BG,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  statusTitle: {
    color: C.TEXT,
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Lexend',
    marginBottom: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tab: {
    paddingVertical: 13,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.pill,
    backgroundColor: C.CARD_BG,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    minWidth: 116,
  },
  tabActive: {
    backgroundColor: C.ORANGE,
    borderColor: C.ORANGE,
  },
  tabText: {
    color: C.TEXT_SECONDARY,
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'Lexend',
  },
  tabTextActive: { color: '#fff' },

  // Category Pills
  categoryScroll: { flexGrow: 0, marginBottom: 4, marginTop: 4, minHeight: 44 },
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
  catText: { color: C.TEXT_SECONDARY, fontSize: 13, fontWeight: '500' },
  catTextActive: { color: C.TEAL, fontWeight: '700' },

  // Results bar
  resultsBar: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  resultsText: { color: C.TEXT_SECONDARY, fontSize: 13 },

  // List/Grid
  list: { padding: 12, paddingTop: 4 },
  listGrid: { paddingHorizontal: 12 },
  colWrapper: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginBottom: 16 },
  cardWrap: { flex: 1 },

  // Empty
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: C.TEXT, fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptyBody: { color: C.TEXT_MUTED, fontSize: 14, textAlign: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.CARD_BG,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  pillActive: {
    backgroundColor: C.ORANGE,
    borderColor: C.ORANGE,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.TEXT_SECONDARY,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  grid: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    marginHorizontal: 0,
  },
  challengeSlot: {
    height: 540,
  },
  challengeSlotPad: {
    opacity: 0,
  },
  signupBanner: {
    width: '92%',
    maxWidth: 520,
    paddingHorizontal: 18,
    paddingBottom: 14,
    backgroundColor: C.CARD_BG,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    alignItems: 'center',
    paddingTop: 24,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  signupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.TEXT,
    textAlign: 'center',
    marginBottom: 5,
  },
  signupSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: C.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 10,
  },
  signupButton: {
    paddingHorizontal: 26,
    minHeight: 42,
  },
  signupBannerContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  signupBannerClose: {
    position: 'absolute',
    top: 8,
    right: 10,
    zIndex: 1,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,14,26,0.72)',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  signupBannerCloseText: {
    fontSize: 16,
    lineHeight: 18,
    color: C.ORANGE,
    fontWeight: '900',
  },
});
