import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, Modal,
  TouchableOpacity, ScrollView, RefreshControl, useWindowDimensions,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getChallenges } from '../services/api';
import ChallengeCard from '../components/ChallengeCard';
import LoadingSpinner from '../components/LoadingSpinner';
import GradientButton from '../components/GradientButton';
import { C, borderRadius } from '../theme';
import AppFooter from '../components/AppFooter';
import { Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import {
  CHALLENGE_CATEGORIES,
  FEELING_CATEGORIES,
  MOVEMENT_CATEGORIES,
  normalizeChallengeCategory,
  normalizeFeelingCategory,
  normalizeMovementCategory,
} from '../constants/taxonomy';

const CHALLENGE_LOGO = require('../../assets/Pose_6-removebg-preview.png');

const BASE_URL = 'https://photoai.betaplanets.com';
const fullUrl = (u?: string) => u ? (u.startsWith('http') ? u : BASE_URL + u) : undefined;
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
const userChallengeStatus = (challenge: any) => challenge.user_challenge?.status || null;
const hasHardStopExpired = (challenge: any) => (
  !!challenge.end_date && new Date(challenge.end_date).getTime() < Date.now()
);
const isOpenChallenge = (challenge: any) => {
  if (!(challenge.is_active || challenge.status === 'active')) return false;
  return !hasHardStopExpired(challenge);
};
const hasMissedCommitmentWindow = (challenge: any) =>
  userChallengeStatus(challenge) === 'active' && Number(challenge.user_challenge?.days_remaining ?? 0) < 0;
const isAvailableChallenge = (challenge: any) =>
  isOpenChallenge(challenge) && !challenge.user_challenge;
const isActiveUserChallenge = (challenge: any) =>
  userChallengeStatus(challenge) === 'active' && !hasMissedCommitmentWindow(challenge) && !isCompletedUserChallenge(challenge);
const isCompletedUserChallenge = (challenge: any) =>
  userChallengeStatus(challenge) === 'completed' || !!challenge.user_challenge?.has_submission;
const isArchivedUserChallenge = (challenge: any) =>
  !isCompletedUserChallenge(challenge) &&
  (challenge.status === 'archived' || challenge.is_active === false || hasHardStopExpired(challenge) || hasMissedCommitmentWindow(challenge));
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
const challengeMovementValue = (challenge: any) =>
  tagDisplayValue(normalizeMovementCategory(challenge.movement_category || challenge.movement_tag || challenge.challenge_movement_category), challenge.movement_category || challenge.movement_tag || challenge.challenge_movement_category);

export default function ChallengesScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [motivationalQuote, setMotivationalQuote] = useState('The secret of getting ahead is getting started. — Mark Twain');
  const [quoteAuthor, setQuoteAuthor] = useState('');
  const [dismissSignupBanner, setDismissSignupBanner] = useState(false);
  
  React.useEffect(() => {
    fetch('https://motivational-spark-api.vercel.app/api/quotes/random')
      .then(r => r.json())
      .then((data: any) => {
        const q = data?.quote || data?.text || data?.content || (Array.isArray(data) ? data[0]?.quote : null);
        const a = data?.author || data?.name || '';
        if (q) {
          setMotivationalQuote(q);
          setQuoteAuthor(a && a !== 'null' ? a : '');
        }
      })
      .catch(() => {
        // Keep default quote on error
      });
  }, []);

  const [challenges, setChallenges] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('All');
  const [categoryOptions, setCategoryOptions] = useState<string[]>(['All', ...CHALLENGE_CATEGORIES]);
  const [feelingFilter, setFeelingFilter] = useState('All');
  const [movementFilter, setMovementFilter] = useState('All');
  const [feelingOptions, setFeelingOptions] = useState<string[]>(['All', ...FEELING_CATEGORIES]);
  const [movementOptions, setMovementOptions] = useState<string[]>(['All', ...MOVEMENT_CATEGORIES]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const { width } = useWindowDimensions();
  const numCols = width >= 1100 ? 3 : width >= 700 ? 2 : 1;
  const cardHeight = width >= 1100 ? 580 : width >= 700 ? 560 : 580;

  const load = async () => {
    try {
      const data = await getChallenges();
      const list = data?.challenges || data || [];
      setChallenges(list);

      applyFilters(list, search, status, category, feelingFilter, movementFilter);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const applyFilters = useCallback(
(list: any[], q: string, s: string, cat: string, feeling: string, movement: string) => {
      let result = [...list];
      result = statusFilteredChallenges(result, s);
      if (cat !== 'All') result = result.filter(c => filterMatches(challengeCategoryValue(c), cat));
      if (feeling !== 'All') result = result.filter(c =>
        filterMatches(challengeFeelingValue(c), feeling)
      );
      if (movement !== 'All') result = result.filter(c =>
        filterMatches(challengeMovementValue(c), movement)
      );
      if (q.trim()) {
        const lq = q.toLowerCase();
        result = result.filter(
          c =>
            c.title?.toLowerCase().includes(lq) ||
            c.description?.toLowerCase().includes(lq) ||
            challengeCategoryValue(c).toLowerCase().includes(lq) ||
            challengeFeelingValue(c).toLowerCase().includes(lq) ||
            challengeMovementValue(c).toLowerCase().includes(lq)
        );
      }
      setFiltered(result);
    },
    []
  );

  useFocusEffect(useCallback(() => { load(); }, []));
  useEffect(() => { applyFilters(challenges, search, status, category, feelingFilter, movementFilter); }, [search, status, category, feelingFilter, movementFilter, challenges]);
  useEffect(() => {
    const statusList = optionBaseChallenges(challenges, status);
    const nextCategories = uniqueOptions(CHALLENGE_CATEGORIES, statusList.map(challengeCategoryValue));
    const nextFeelings = uniqueOptions(FEELING_CATEGORIES, statusList.map(challengeFeelingValue));
    const nextMovements = uniqueOptions(MOVEMENT_CATEGORIES, statusList.map(challengeMovementValue));
    setCategoryOptions(nextCategories);
    setFeelingOptions(nextFeelings);
    setMovementOptions(nextMovements);
    if (!nextCategories.includes(category)) setCategory('All');
    if (!nextFeelings.includes(feelingFilter)) setFeelingFilter('All');
    if (!nextMovements.includes(movementFilter)) setMovementFilter('All');
  }, [challenges, status]);

  const onRefresh = () => { setRefreshing(true); load(); };

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

      {/* Motivational Quote Banner */}
      <View style={styles.quoteBanner}>
        <Text style={styles.quoteText}>
          {motivationalQuote}
        </Text>
        {quoteAuthor ? <Text style={styles.quoteAuthor}>— {quoteAuthor}</Text> : null}
      </View>

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
        <TouchableOpacity onPress={() => setFilterModalVisible(true)} style={styles.filterBtn}>
          <Text style={styles.filterBtnText}>⚙️ Filters</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickFilterRow}>
        <TouchableOpacity onPress={() => setFilterModalVisible(true)} style={styles.quickFilterBtn}>
          <Text style={styles.quickFilterLabel}>Feeling</Text>
          <Text style={styles.quickFilterValue}>{feelingFilter}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilterModalVisible(true)} style={styles.quickFilterBtn}>
          <Text style={styles.quickFilterLabel}>Movement</Text>
          <Text style={styles.quickFilterValue}>{movementFilter}</Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        persistentScrollbar
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {categoryOptions.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.pill, category === cat && styles.pillActive]}
            onPress={() => setCategory(cat)}
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
          <Text style={styles.emptyBody}>Try adjusting your filters or search terms.</Text>
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
        <TouchableOpacity onPress={() => setDismissSignupBanner(true)} style={styles.signupBannerClose}>
          <Text style={styles.signupBannerCloseText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.signupBanner}>
          <Text style={styles.signupTitle}>Sign up to participate in challenges</Text>
          <Text style={styles.signupSubtitle}>
            Be a part of our growing wellness community that encourages your every step. Connect and Share with people from around the world.
          </Text>
          <GradientButton
            label="Sign up now"
            variant="primary"
            size="md"
            onPress={() => navigation.navigate('Register')}
            style={styles.signupButton}
          />
        </View>
      </View>
    )}

    {/* Filter Modal */}
    <Modal
      visible={filterModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setFilterModalVisible(false)} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            {/* Status Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Status</Text>
              <View style={styles.pillsRow}>
                {STATUS_TABS.map(tab => (
                  <TouchableOpacity
                    key={tab.key}
                    style={[styles.pill, status === tab.key && styles.pillActive]}
                    onPress={() => { setStatus(tab.key); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.pillText, status === tab.key && styles.pillTextActive]}>{tab.label.split(' (')[0]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Feeling Filter */}
            {feelingOptions.length > 1 && (
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Feeling</Text>
                <View style={styles.pillsRow}>
                  {feelingOptions.map(feeling => (
                    <TouchableOpacity
                      key={feeling}
                      style={[styles.pill, feelingFilter === feeling && styles.pillActive]}
                      onPress={() => setFeelingFilter(feeling)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.pillText, feelingFilter === feeling && styles.pillTextActive]}>{feeling}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Movement Filter */}
            {movementOptions.length > 1 && (
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Movement</Text>
                <View style={styles.pillsRow}>
                  {movementOptions.map(movement => (
                    <TouchableOpacity
                      key={movement}
                      style={[styles.pill, movementFilter === movement && styles.pillActive]}
                      onPress={() => setMovementFilter(movement)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.pillText, movementFilter === movement && styles.pillTextActive]}>{movement}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity
            onPress={() => setFilterModalVisible(false)}
            style={styles.modalApplyBtn}
          >
            <Text style={styles.modalApplyText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
  clearBtn: { paddingHorizontal: 8 },
  clearBtnText: { fontSize: 16, color: C.TEXT_MUTED },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: C.CARD_BG,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    marginLeft: 8,
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.TEXT,
  },
  quickFilterRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 12,
    marginBottom: 8,
  },
  quickFilterBtn: {
    flex: 1,
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  quickFilterLabel: { color: C.TEXT_MUTED, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  quickFilterValue: { color: C.TEXT, fontSize: 13, fontWeight: '700', marginTop: 2 },
  statusSection: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
    marginBottom: 10,
    backgroundColor: C.CARD_BG2,
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
    gap: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.pill,
    backgroundColor: C.CARD_BG,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    minWidth: 78,
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
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginLeft: 12,
    marginBottom: 12,
  },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: C.BG,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.CARD_BORDER,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.TEXT,
  },
  modalCloseBtn: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 20,
    color: C.TEXT_MUTED,
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: C.TEXT,
    marginBottom: 10,
  },
  modalApplyBtn: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 14,
    backgroundColor: C.ORANGE,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  modalApplyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  signupBanner: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: C.CARD_BG,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    alignItems: 'center',
    paddingTop: 32,
  },
  signupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.TEXT,
    textAlign: 'center',
    marginBottom: 8,
  },
  signupSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: C.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  signupButton: {
    paddingHorizontal: 32,
  },
  signupBannerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.BG,
    paddingTop: 12,
  },
  signupBannerClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  signupBannerCloseText: {
    fontSize: 20,
    color: C.ORANGE,
    fontWeight: '600',
  },
});
