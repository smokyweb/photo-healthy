import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView,
  TouchableOpacity, TextInput, RefreshControl, Alert,
  useWindowDimensions, Platform, Linking,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getChallenge, getSubmissions, getUserAccess, getChallengeEnrollment, enterChallenge } from '../services/api';
import GradientButton from '../components/GradientButton';
import LoadingSpinner from '../components/LoadingSpinner';
import AppFooter from '../components/AppFooter';
import { C, borderRadius } from '../theme';
import { normalizeChallengeCategory, normalizeFeelingCategory, normalizeMovementCategory } from '../constants/taxonomy';

const BASE = 'https://photoai.betaplanets.com';
const fullUrl = (url?: string | null) =>
  url ? (url.startsWith('http') ? url : BASE + url) : null;

const isEnabledFlag = (value: any) => {
  if (value === true || value === 1) return true;
  const normalized = String(value ?? '').trim().toLowerCase();
  return ['1', 'true', 'yes', 'y', 'pro', 'pro_only', 'pro-only'].includes(normalized);
};

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default function ChallengeDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { challengeId: _cid, id: _id, tagFilter: initialTagFilter } = route.params || {};
  const rawChallengeId = _cid || _id;
  const challengeId = typeof rawChallengeId === 'object'
    ? rawChallengeId?.challengeId || rawChallengeId?.id
    : String(rawChallengeId || '').match(/\d+/)?.[0] || rawChallengeId;
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const [challenge, setChallenge] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [access, setAccess] = useState<any>({});
  const [enrollment, setEnrollment] = useState<any>(null); // { enrolled, user_challenge }
  const [enrolling, setEnrolling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subSearch, setSubSearch] = useState('');
  const [activeTagFilter, setActiveTagFilter] = useState<{ type: 'category' | 'feeling' | 'movement'; value: string } | null>(null);

  useEffect(() => {
    if (
      initialTagFilter?.value &&
      ['category', 'feeling', 'movement'].includes(initialTagFilter.type)
    ) {
      setActiveTagFilter(initialTagFilter);
    }
  }, [initialTagFilter?.type, initialTagFilter?.value]);

  const load = async () => {
    try {
      const [cData, sData] = await Promise.all([
        getChallenge(challengeId),
        getSubmissions({ challenge_id: String(challengeId), limit: '30' }),
      ]);
      setChallenge(cData?.challenge || cData);
      setSubmissions(sData?.submissions || sData || []);

      if (user) {
        const [a, e] = await Promise.all([
          getUserAccess().catch(() => ({})),
          getChallengeEnrollment(challengeId).catch(() => ({ enrolled: false, user_challenge: null })),
        ]);
        setAccess(a);
        setEnrollment(e);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load challenge');
    }
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => {
    if (challengeId) {
      load().catch(e => console.error('[ChallengeDetail] load error:', e?.message));
    }
  }, [challengeId]));

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleEnterChallenge = async () => {
    if (enrolling) return;
    if (!user) {
      navigation.navigate('Register' as never);
      return;
    }
    if (isEnabledFlag(challenge?.is_pro_only) && !isPro) {
      Alert.alert(
        'Pro Members Only',
        'This challenge is exclusive to Pro members. Upgrade to access all Pro challenges.',
        [
          { text: 'Maybe Later' },
          { text: 'Go Pro ⭐', onPress: () => navigation.navigate('Subscription') },
        ]
      );
      return;
    }
    setEnrolling(true);
    try {
      const result = await enterChallenge(challengeId);
      const e = await getChallengeEnrollment(challengeId).catch(() => null);
      setEnrollment(e || { enrolled: true, user_challenge: result.user_challenge });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to enter challenge');
    }
    setEnrolling(false);
  };

  const handleSubmit = () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please log in to submit photos.', [
        { text: 'Log In', onPress: () => navigation.navigate('Login') },
        { text: 'Sign Up', onPress: () => navigation.navigate('Register') },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    if (remainingSubmissions !== undefined && remainingSubmissions <= 0) {
      Alert.alert(
        'Monthly Limit Reached',
        'You have 0 remaining this month. Upgrade to Pro for unlimited submissions.',
        [
          { text: 'Maybe Later' },
          { text: 'Go Pro ⭐', onPress: () => navigation.navigate('Subscription') },
        ]
      );
      return;
    }
    navigation.navigate('SubmitPhoto', { challengeId });
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!challenge) {
    return (
      <View style={styles.center}>
        <Text style={{ color: C.TEXT_MUTED }}>Challenge not found</Text>
      </View>
    );
  }

  const coverImg = fullUrl(challenge.cover_image_url || challenge.cover_image);
  const isActive = challenge.status === 'active' || challenge.is_active;
  const daysLeft =
    challenge.end_date
      ? Math.max(0, Math.floor((new Date(challenge.end_date).getTime() - Date.now()) / 86400000))
      : null;
  const isPro = access?.isPro;
  const isProOnly = isEnabledFlag(challenge?.is_pro_only) || isEnabledFlag(challenge?.pro_only) || isEnabledFlag(challenge?.requires_pro);
  const remainingSubmissions = access?.remainingSubmissions;
  const hasPartner = !!challenge.partner_url;
  const isEnrolled = !!enrollment?.enrolled;
  const userChallenge = enrollment?.user_challenge;
  const userChallengeStatus = userChallenge?.status || challenge.user_challenge?.status;
  const hasSubmitted = userChallengeStatus === 'completed' || !!userChallenge?.has_submission || !!challenge.user_challenge?.has_submission;
  const personalDaysLeft = userChallenge ? Math.max(0, userChallenge.days_remaining ?? 0) : null;
  const personalDeadlineExpired = isEnrolled && userChallenge && userChallenge.days_remaining < 0;
  const cleanTagValue = (normalized: string, fallback?: string) => {
    const value = normalized && normalized !== '-' ? normalized : fallback;
    return String(value || '').split(',')[0].replace(/^[^\w]+/u, '').trim();
  };
  const rawCategoryLabel = challenge.category || challenge.challenge_category;
  const rawFeelingLabel = challenge.feeling_category || challenge.feeling_tag || challenge.challenge_feeling_category;
  const rawMovementLabel = challenge.movement_category || challenge.movement_tag || challenge.challenge_movement_category;
  const categoryLabel = cleanTagValue(normalizeChallengeCategory(rawCategoryLabel), rawCategoryLabel);
  const feelingLabel = cleanTagValue(normalizeFeelingCategory(rawFeelingLabel), rawFeelingLabel);
  const movementLabel = cleanTagValue(normalizeMovementCategory(rawMovementLabel), rawMovementLabel);

  const getSubmissionTag = (sub: any, type: 'category' | 'feeling' | 'movement') => {
    if (type === 'category') {
      const raw = sub.category || sub.challenge_category || challenge.category;
      return cleanTagValue(normalizeChallengeCategory(raw), raw);
    }
    if (type === 'feeling') {
      const raw = sub.feeling_category || sub.feeling_tag || sub.challenge_feeling_category || challenge.feeling_category || challenge.feeling_tag;
      return cleanTagValue(normalizeFeelingCategory(raw), raw);
    }
    const raw = sub.movement_category || sub.movement_tag || sub.challenge_movement_category || challenge.movement_category || challenge.movement_tag;
    return cleanTagValue(normalizeMovementCategory(raw), raw);
  };

  const searchedSubs = subSearch.trim()
    ? submissions.filter(
        s =>
          (s.user_name || '').toLowerCase().includes(subSearch.toLowerCase()) ||
          (s.title || '').toLowerCase().includes(subSearch.toLowerCase()),
      )
    : submissions;

  const filteredSubs = activeTagFilter
    ? searchedSubs.filter(s => getSubmissionTag(s, activeTagFilter.type) === activeTagFilter.value)
    : searchedSubs;
  const showingFilteredSubmissions = !!activeTagFilter || !!subSearch.trim();
  const submissionDisplayCount = showingFilteredSubmissions
    ? filteredSubs.length
    : (challenge.submission_count ?? filteredSubs.length);
  const participantDisplayCount = challenge.participant_count ?? 0;
  const commentDisplayCount = challenge.comment_count ?? submissions.reduce((sum, sub) => sum + (Number(sub.comment_count ?? sub.comments_count ?? sub.comments ?? 0) || 0), 0);
  const countText = (value: any) => {
    const n = Number(value);
    return Number.isFinite(n) ? String(n) : '0';
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 0 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.ORANGE} />
      }
    >
      {/* Back button */}
      <TouchableOpacity onPress={() => {
          navigation.navigate('Main' as never, { screen: 'ChallengesTab' } as never);
        }} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {/* Hero: 2-column on desktop */}
      <View style={[styles.heroWrap, isDesktop && styles.heroWrapDesktop]}>

        {/* Cover image */}
        <View style={[styles.coverWrap, isDesktop && styles.coverWrapDesktop]}>
          {coverImg ? (
            <Image source={{ uri: coverImg }} style={styles.cover} resizeMode="cover" />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]}>
              <Text style={{ fontSize: 60 }}>🏆</Text>
            </View>
          )}
        </View>

        {/* Info Panel */}
        <View style={[styles.infoPanel, isDesktop && styles.infoPanelDesktop]}>
          {/* Title */}
          <View style={styles.titleRow}>
            <Text style={styles.infoTitle}>{challenge.title}</Text>
            {isProOnly && (
              <View style={styles.proOnlyBadge}>
                <Text style={styles.proOnlyText}>Pro Only</Text>
              </View>
            )}
          </View>

          {/* Date range */}
          {(challenge.start_date || challenge.end_date) && (
            <Text style={styles.dateRange}>
              📅 {formatDate(challenge.start_date)}
              {challenge.end_date ? ` → ${formatDate(challenge.end_date)}` : ''}
            </Text>
          )}

          {/* Description */}
          {challenge.description && (
            <Text style={styles.description}>{challenge.description}</Text>
          )}

          {/* Stats grid */}
          <View style={styles.statsGrid}>
            {[
              { label: 'Category', val: categoryLabel },
              {
                label: 'Feeling',
                val: feelingLabel,
              },
              {
                label: 'Movement',
                val: movementLabel,
              },
              { label: 'Days Left', val: daysLeft !== null ? String(daysLeft) : '—' },
              { label: 'Submissions', val: countText(submissionDisplayCount) },
              { label: 'Comments', val: countText(commentDisplayCount) },
              ...(isProOnly ? [{ label: 'Access', val: 'Pro Only' }] : []),
            ].map(({ label, val }) => (
              <View key={label} style={styles.statItem}>
                <Text style={styles.statLabel}>{label}</Text>
                <Text style={styles.statVal}>{val}</Text>
              </View>
            ))}
          </View>

          {/* Participants */}
          {(challenge.participant_count !== undefined || challenge.submission_count !== undefined) && (
            <Text style={styles.participantsText}>
              👥 {countText(participantDisplayCount)} participants
            </Text>
          )}

          {/* Enrollment / Submit flow */}
          {isActive && !isEnrolled && (
            <GradientButton
              label={enrolling ? 'Joining...' : isProOnly && !isPro ? 'Pro Members Only' : 'Join Challenge'}
              variant={isProOnly && !isPro ? 'outline' : 'primary'}
              onPress={handleEnterChallenge}
              loading={enrolling}
              disabled={enrolling}
              style={styles.actionBtn}
            />
          )}
          {isActive && isEnrolled && hasSubmitted && (
            <GradientButton
              label="Challenge Completed"
              variant="outline-teal"
              onPress={() => {}}
              style={styles.actionBtn}
            />
          )}
          {isActive && isEnrolled && !hasSubmitted && !personalDeadlineExpired && (
            <>
              <View style={styles.daysLeftBadge}>
                <Text style={styles.daysLeftText}>📅 Your personal deadline: {personalDaysLeft} day{personalDaysLeft !== 1 ? 's' : ''} left</Text>
              </View>
              <GradientButton
                label={remainingSubmissions === 0 ? 'Monthly Limit Reached' : 'Submit Photos'}
                variant="primary"
                onPress={handleSubmit}
                style={styles.actionBtn}
              />
              <View style={[styles.secondaryActionRow, isDesktop && styles.secondaryActionRowDesktop]}>
                <GradientButton
                  label="Become a PRO"
                  variant="outline"
                  pill={false}
                  onPress={() => navigation.navigate('Subscription')}
                  style={styles.secondaryActionBtn}
                />
                {hasPartner && (
                  <GradientButton
                    label="Partner Link"
                    variant="outline-teal"
                    pill={false}
                    onPress={() => Linking.openURL(challenge.partner_url)}
                    style={styles.secondaryActionBtn}
                  />
                )}
              </View>
            </>
          )}
          {isActive && isEnrolled && personalDeadlineExpired && (
            <GradientButton
              label="Challenge Expired"
              variant="outline" pill={false}
              onPress={() => {}}
              style={[styles.actionBtn, { opacity: 0.5 }]}
            />
          )}

          {!isEnrolled && (
            <GradientButton
              label="Become a PRO"
              variant="outline" pill={false}
              onPress={() => navigation.navigate('Subscription')}
              style={styles.actionBtn}
            />
          )}

          {hasPartner && !isEnrolled && (
            <GradientButton
              label="Partner Link"
              variant="outline-teal" pill={false}
              onPress={() => Linking.openURL(challenge.partner_url)}
              style={styles.actionBtn}
            />
          )}

          {/* Remaining submissions */}
          {remainingSubmissions !== undefined && (
            <Text style={styles.remainingText}>
              {remainingSubmissions} remaining this month
            </Text>
          )}
        </View>
      </View>

      {/* Community Submissions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Community Submissions ({submissionDisplayCount})
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search submissions..."
            placeholderTextColor={C.TEXT_MUTED}
            value={subSearch}
            onChangeText={setSubSearch}
          />
          {subSearch.length > 0 && (
            <TouchableOpacity onPress={() => setSubSearch('')}>
              <Text style={{ color: C.TEXT_MUTED, fontSize: 14 }}>x</Text>
            </TouchableOpacity>
          )}
        </View>

        {activeTagFilter && (
          <View style={styles.activeFilterRow}>
            <Text style={styles.activeFilterText}>
              Showing {activeTagFilter.type}: {activeTagFilter.value}
            </Text>
            <TouchableOpacity onPress={() => setActiveTagFilter(null)} style={styles.clearFilterBtn}>
              <Text style={styles.clearFilterText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Submissions 3-col grid */}
        {filteredSubs.length > 0 ? (
          <View style={styles.subGrid}>
            {filteredSubs.map((sub: any) => {
              const imgUrl = fullUrl(sub.photo1_url || sub.image_url);
              const subTags = [
                { type: 'category' as const, label: 'Category', value: getSubmissionTag(sub, 'category') },
                { type: 'feeling' as const, label: 'Feeling', value: getSubmissionTag(sub, 'feeling') },
                { type: 'movement' as const, label: 'Movement', value: getSubmissionTag(sub, 'movement') },
              ].filter(tag => tag.value && tag.value !== '-');
              return (
                <View
                  key={sub.id}
                  style={styles.subCard}
                >
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('SubmissionDetail' as never, {
                        submissionId: sub.id,
                        id: sub.id,
                        challengeTags: {
                          category: getSubmissionTag(sub, 'category'),
                          feeling: getSubmissionTag(sub, 'feeling'),
                          movement: getSubmissionTag(sub, 'movement'),
                        },
                      } as never)
                    }
                    activeOpacity={0.88}
                  >
                    {imgUrl ? (
                      <Image source={{ uri: imgUrl }} style={styles.subImg} resizeMode="contain" />
                    ) : (
                      <View style={[styles.subImg, styles.subImgPlaceholder]}>
                        <Text style={{ fontSize: 24 }}>📷</Text>
                      </View>
                    )}
                    <View style={styles.subInfo}>
                      <Text style={styles.subUser} numberOfLines={1}>
                        @{sub.user_name || 'user'}
                      </Text>
                      <Text style={styles.subTitle} numberOfLines={1}>
                        {sub.title || 'Untitled'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.subInfoTags}>
                    <View style={styles.subTagRow}>
                      {subTags.map(tag => {
                        const isActiveTag = activeTagFilter?.type === tag.type && activeTagFilter?.value === tag.value;
                        return (
                          <TouchableOpacity
                            key={tag.type}
                            style={[styles.subTagChip, isActiveTag && styles.subTagChipActive]}
                            onPress={() => setActiveTagFilter({ type: tag.type, value: tag.value })}
                            activeOpacity={0.75}
                            accessibilityLabel={`Filter submissions by ${tag.label} ${tag.value}`}
                          >
                            <Text style={[styles.subTagText, isActiveTag && styles.subTagTextActive]} numberOfLines={1}>
                              {tag.value}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    <View style={styles.subMeta}>
                      <Text style={styles.subMetaText}>Like {countText(sub.like_count ?? sub.likes)}</Text>
                      <Text style={styles.subMetaText}>💬 {countText(sub.comment_count ?? sub.comments_count ?? sub.comments)}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>📷</Text>
            <Text style={styles.emptyText}>No submissions yet. Be the first!</Text>
          </View>
        )}
      </View>

      <AppFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.BG,
  },

  // Back button
  backBtn: {
    padding: 16,
    paddingBottom: 8,
    alignSelf: 'flex-start',
  },
  backText: {
    color: C.ORANGE,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: "'Inter', sans-serif",
  } as any,

  // Hero wrapper
  heroWrap: { padding: 16, paddingTop: 8 },
  heroWrapDesktop: {
    flexDirection: 'row',
    gap: 32,
    alignItems: 'flex-start',
    maxWidth: 1280,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 32,
  },

  // Cover image
  coverWrap: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: C.CARD_BG,
    marginBottom: 16,
  },
  coverWrapDesktop: { flex: 45, marginBottom: 0 },
  cover: { width: '100%', aspectRatio: 16 / 9 },
  coverPlaceholder: {
    aspectRatio: 16 / 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.CARD_BG2,
  },

  // Info panel
  infoPanel: {},
  infoPanelDesktop: { flex: 55 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  infoTitle: {
    color: C.TEXT,
    fontSize: 26,
    fontWeight: '800',
    fontFamily: "'Lexend', sans-serif",
    lineHeight: 34,
    flexShrink: 1,
  } as any,
  proOnlyBadge: {
    backgroundColor: C.ORANGE,
    borderRadius: borderRadius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#FFD000',
    marginTop: 2,
  },
  proOnlyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  } as any,
  dateRange: {
    color: C.TEXT_MUTED,
    fontSize: 13,
    marginBottom: 12,
    fontFamily: "'Inter', sans-serif",
  } as any,
  description: {
    color: C.TEXT_SECONDARY,
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 16,
    fontFamily: "'Inter', sans-serif",
  } as any,

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  statItem: {
    backgroundColor: C.CARD_BG,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    minWidth: '45%',
    flex: 1,
  },
  statLabel: {
    color: C.TEXT_MUTED,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  } as any,
  statVal: { color: C.TEXT, fontSize: 14, fontWeight: '700' },

  participantsText: {
    color: C.TEXT_MUTED,
    fontSize: 13,
    marginBottom: 14,
    fontFamily: "'Inter', sans-serif",
  } as any,

  actionBtn: { marginBottom: 10 },
  secondaryActionRow: {
    gap: 10,
    marginBottom: 10,
  },
  secondaryActionRowDesktop: {
    flexDirection: 'row',
  },
  secondaryActionBtn: {
    flex: 1,
    minWidth: 160,
  },
  daysLeftBadge: {
    backgroundColor: C.TEAL + '22',
    borderWidth: 1,
    borderColor: C.TEAL + '55',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  daysLeftText: {
    color: C.TEAL,
    fontSize: 14,
    fontWeight: '700',
  } as any,

  remainingText: {
    color: C.TEXT_MUTED,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    fontFamily: "'Inter', sans-serif",
  } as any,

  // Community Submissions section
  section: {
    padding: 16,
    paddingTop: 8,
    maxWidth: 1280,
    alignSelf: 'center',
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: C.TEXT,
    fontSize: 20,
    fontWeight: '800',
    fontFamily: "'Lexend', sans-serif",
  } as any,

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 16,
  },
  searchIcon: { fontSize: 15 },
  searchInput: {
    flex: 1,
    color: C.TEXT,
    fontSize: 15,
    fontFamily: "'Inter', sans-serif",
  } as any,
  activeFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: C.CARD_BG,
    borderWidth: 1,
    borderColor: C.TEAL + '66',
    borderRadius: borderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: -6,
    marginBottom: 14,
  },
  activeFilterText: {
    color: C.TEXT,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  clearFilterBtn: {
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  clearFilterText: { color: C.ORANGE, fontSize: 12, fontWeight: '800' },

  // Submissions 3-col grid
  subGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  subCard: {
    width: '31%',
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  subImg: { width: '100%', aspectRatio: 1, backgroundColor: C.CARD_BG2 },
  subImgPlaceholder: {
    backgroundColor: C.CARD_BG2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subInfo: { padding: 8, paddingBottom: 4 },
  subInfoTags: { paddingHorizontal: 8, paddingBottom: 8 },
  subUser: { color: C.TEXT_SECONDARY, fontSize: 13 },
  subTitle: {
    color: C.TEXT,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    fontFamily: "'Inter', sans-serif",
  } as any,
  subTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 2 },
  subTagChip: {
    maxWidth: '100%',
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  subTagChipActive: {
    borderColor: C.TEAL,
    backgroundColor: C.TEAL + '22',
  },
  subTagText: { color: C.TEXT_SECONDARY, fontSize: 11, fontWeight: '700' },
  subTagTextActive: { color: C.TEAL },
  subMeta: { flexDirection: 'row', gap: 8, marginTop: 4 },
  subMetaText: { color: C.TEXT_SECONDARY, fontSize: 13 },

  // Empty state
  emptyWrap: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: C.TEXT_MUTED, fontSize: 15 },
});
