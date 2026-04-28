import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView,
  TouchableOpacity, RefreshControl, useWindowDimensions, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getChallenges, getSubmissions, getPublicSettings, getUserStats } from '../services/api';
import GradientButton from '../components/GradientButton';
import LoadingSpinner from '../components/LoadingSpinner';
import AppFooter from '../components/AppFooter';
import { C, borderRadius, fonts, spacing } from '../theme';

const BASE = 'https://photoai.betaplanets.com';
const fullUrl = (url: string) => (!url ? '' : url.startsWith('http') ? url : BASE + url);

const QUOTES = [
  '"The secret of getting ahead is getting started." – Mark Twain',
  '"Take care of your body. It\'s the only place you have to live." – Jim Rohn',
  '"A healthy outside starts from the inside." – Robert Urich',
  '"Your health is an investment, not an expense."',
];

const HOW_IT_WORKS = [
  { icon: '📸', title: 'Join a Challenge', desc: 'Browse active photo challenges aligned with your wellness goals.' },
  { icon: '🌟', title: 'Submit Your Photos', desc: 'Capture your healthy moments and share them with the community.' },
  { icon: '🏆', title: 'Track Progress', desc: 'Watch your streak grow and celebrate milestones with your peers.' },
];

const QUICK_ACTIONS = [
  { icon: '🏅', label: 'Challenges', screen: 'ChallengesTab' },
  { icon: '🖼️', label: 'Gallery', screen: 'Gallery' },
  { icon: '⭐', label: 'Subscription', screen: 'Subscription' },
  { icon: '🛒', label: 'Shop', screen: 'Shop' },
];

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [featured, setFeatured] = useState<any>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  const load = async () => {
    try {
      const calls: Promise<any>[] = [
        getChallenges({ status: 'active', limit: '5' }),
        getSubmissions({ limit: '9', sort: 'recent' }),
        getPublicSettings(),
      ];
      if (user) calls.push(getUserStats());

      const results = await Promise.allSettled(calls);

      const cData = results[0];
      const sData = results[1];
      const statsData = results[3];

      if (cData.status === 'fulfilled') {
        const list = cData.value?.challenges || cData.value || [];
        setFeatured(list[0] || null);
      }
      if (sData.status === 'fulfilled') {
        setRecentSubmissions(sData.value?.submissions || sData.value || []);
      }
      if (statsData?.status === 'fulfilled') {
        setUserStats(statsData.value || {});
      }
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(); };

  const getDaysLeft = (endDate: string) => {
    if (!endDate) return null;
    const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  if (loading) return <LoadingSpinner fullScreen />;

  // ─── LOGGED-IN VIEW ───────────────────────────────────────────────────────
  if (user) {
    return (
      <ScrollView
        style={styles.screen}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.ORANGE} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Banner */}
        <View style={styles.welcomeBanner}>
          <View>
            <Text style={styles.welcomeGreeting}>Welcome back, {user.name.split(' ')[0]}! 👋</Text>
            <Text style={styles.welcomeDate}>{today}</Text>
          </View>
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => navigation.navigate('SubmitPhoto', {})}
          >
            <Text style={styles.submitBtnText}>📸 Submit</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userStats.challenges || userStats.challenge_count || 0}</Text>
            <Text style={styles.statLabel}>Challenges</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userStats.streak || 0}</Text>
            <Text style={styles.statLabel}>Day Streak 🔥</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{(userStats.totalMiles || 0).toFixed(1)}</Text>
            <Text style={styles.statLabel}>Miles Tracked</Text>
          </View>
        </View>

        {/* Featured Challenge */}
        {featured && <FeaturedChallengeCard challenge={featured} navigation={navigation} getDaysLeft={getDaysLeft} />}

        {/* Quote Banner */}
        <QuoteBanner quote={quote} />

        {/* Recent Community Submissions */}
        {recentSubmissions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Community Photos</Text>
              <TouchableOpacity onPress={() => navigation.navigate('CommunityTab')}>
                <Text style={styles.seeAll}>See all →</Text>
              </TouchableOpacity>
            </View>
            <SubmissionsGrid submissions={recentSubmissions} navigation={navigation} isDesktop={isDesktop} />
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {QUICK_ACTIONS.map(action => (
              <TouchableOpacity
                key={action.screen}
                style={styles.quickActionCard}
                onPress={() => navigation.navigate(action.screen)}
                activeOpacity={0.8}
              >
                <Text style={styles.quickActionIcon}>{action.icon}</Text>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <AppFooter />
      </ScrollView>
    );
  }

  // ─── LOGGED-OUT (PUBLIC) VIEW ─────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.screen}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.ORANGE} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>🌿 Wellness Community</Text>
        </View>
        <Text style={styles.heroTitle}>Welcome to Your{'\n'}Wellness Community</Text>
        <Text style={styles.heroSubtext}>
          Join thousands of members documenting their healthy lifestyle through photography.
          Track challenges, share moments, and inspire others.
        </Text>
        <View style={styles.heroButtons}>
          <TouchableOpacity
            style={styles.heroJoinBtn}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.85}
          >
            <Text style={styles.heroJoinBtnText}>Join Free →</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.heroViewBtn}
            onPress={() => navigation.navigate('ChallengesTab')}
            activeOpacity={0.85}
          >
            <Text style={styles.heroViewBtnText}>View Challenges</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Featured Challenge */}
      {featured && <FeaturedChallengeCard challenge={featured} navigation={navigation} getDaysLeft={getDaysLeft} isGuest />}

      {/* Quote Banner */}
      <QuoteBanner quote={quote} />

      {/* Recent Community Submissions */}
      {recentSubmissions.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Community Photos</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CommunityTab')}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          <SubmissionsGrid submissions={recentSubmissions} navigation={navigation} isDesktop={isDesktop} />
        </View>
      )}

      {/* How It Works */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>How It Works</Text>
        <View style={[styles.howItWorksRow, isDesktop && styles.howItWorksRowDesktop]}>
          {HOW_IT_WORKS.map((item, idx) => (
            <View key={idx} style={[styles.howItWorksCard, isDesktop && styles.howItWorksCardDesktop]}>
              <View style={styles.howItWorksIconWrap}>
                <Text style={styles.howItWorksIcon}>{item.icon}</Text>
              </View>
              <Text style={styles.howItWorksTitle}>{item.title}</Text>
              <Text style={styles.howItWorksDesc}>{item.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bottom CTA */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>Ready to start your journey?</Text>
        <Text style={styles.ctaBody}>
          Create a free account and join the challenge today.
        </Text>
        <GradientButton
          label="Create Free Account"
          onPress={() => navigation.navigate('Register')}
          style={{ marginTop: 16, alignSelf: 'center' }}
        />
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={{ marginTop: 12, alignItems: 'center' }}
        >
          <Text style={{ color: C.TEXT_MUTED, fontSize: 14 }}>Already a member? Sign In</Text>
        </TouchableOpacity>
      </View>

      <AppFooter />
    </ScrollView>
  );
}

// ─── Featured Challenge Card ───────────────────────────────────────────────
function FeaturedChallengeCard({ challenge, navigation, getDaysLeft, isGuest }: any) {
  const daysLeft = getDaysLeft(challenge.end_date);
  const tags = [
    challenge.category,
    challenge.feeling_tag || challenge.mood_tag,
    challenge.movement_tag,
  ].filter(Boolean);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Featured Challenge</Text>
      <View style={styles.featuredCard}>
        {/* Cover Image */}
        <View style={styles.featuredImageWrap}>
          {challenge.cover_image_url || challenge.cover_image ? (
            <Image
              source={{ uri: fullUrl(challenge.cover_image_url || challenge.cover_image) }}
              style={styles.featuredImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.featuredImage, styles.featuredImagePlaceholder]}>
              <Text style={{ fontSize: 48 }}>🏆</Text>
            </View>
          )}
          <View style={styles.featuredImageOverlay} />
          <View style={styles.featuredBadgeWrap}>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>● ACTIVE</Text>
            </View>
            {challenge.is_pro_only && (
              <View style={styles.proBadgeOverlay}>
                <Text style={styles.proBadgeOverlayText}>⭐ PRO</Text>
              </View>
            )}
          </View>
          {daysLeft !== null && (
            <View style={styles.daysLeftBadge}>
              <Text style={styles.daysLeftText}>{daysLeft}d left</Text>
            </View>
          )}
        </View>

        {/* Card Body */}
        <View style={styles.featuredBody}>
          <Text style={styles.featuredTitle} numberOfLines={2}>{challenge.title}</Text>

          {/* Tags */}
          {tags.length > 0 && (
            <View style={styles.tagsRow}>
              {tags.map((tag: string, i: number) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {challenge.description ? (
            <Text style={styles.featuredDesc} numberOfLines={2}>{challenge.description}</Text>
          ) : null}

          {/* Stats Row */}
          <View style={styles.featuredStats}>
            {challenge.submission_count !== undefined && (
              <Text style={styles.featuredStat}>📷 {challenge.submission_count} submissions</Text>
            )}
            {daysLeft !== null && (
              <Text style={styles.featuredStat}>⏳ {daysLeft} days left</Text>
            )}
          </View>

          {/* Buttons */}
          <View style={styles.featuredButtons}>
            {!isGuest ? (
              <TouchableOpacity
                style={styles.submitPhotoBtn}
                onPress={() => navigation.navigate('SubmitPhoto', { challengeId: challenge.id })}
                activeOpacity={0.85}
              >
                <Text style={styles.submitPhotoBtnText}>📸 Submit Photos</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[styles.browseBtn, isGuest && { flex: 1 }]}
              onPress={() => navigation.navigate('ChallengesTab')}
              activeOpacity={0.85}
            >
              <Text style={styles.browseBtnText}>Browse Challenges</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Quote Banner ──────────────────────────────────────────────────────────
function QuoteBanner({ quote }: { quote: string }) {
  return (
    <View style={styles.quoteBanner}>
      <Text style={styles.quoteIcon}>💬</Text>
      <Text style={styles.quoteText}>{quote}</Text>
    </View>
  );
}

// ─── Submissions Grid ──────────────────────────────────────────────────────
function SubmissionsGrid({ submissions, navigation, isDesktop }: any) {
  return (
    <View style={[styles.submissionsGrid, isDesktop && styles.submissionsGridDesktop]}>
      {submissions.slice(0, 9).map((s: any) => (
        <TouchableOpacity
          key={s.id}
          style={[styles.submissionCard, isDesktop && styles.submissionCardDesktop]}
          onPress={() => navigation.navigate('SubmissionDetail', { submissionId: s.id })}
          activeOpacity={0.85}
        >
          <View style={styles.submissionImageWrap}>
            {s.image_url || s.photo_url ? (
              <Image
                source={{ uri: fullUrl(s.image_url || s.photo_url) }}
                style={styles.submissionImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.submissionImage, styles.submissionImagePlaceholder]}>
                <Text>📷</Text>
              </View>
            )}
          </View>
          <View style={styles.submissionInfo}>
            <Text style={styles.submissionUsername} numberOfLines={1}>
              @{s.username || s.user_name || 'user'}
            </Text>
            {s.title ? (
              <Text style={styles.submissionTitle} numberOfLines={1}>{s.title}</Text>
            ) : null}
            <View style={styles.submissionMeta}>
              <Text style={styles.submissionMetaText}>❤️ {s.like_count || s.likes || 0}</Text>
              <Text style={styles.submissionMetaText}>💬 {s.comment_count || s.comments || 0}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.BG },

  // Welcome Banner
  welcomeBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: C.CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: C.CARD_BORDER,
  },
  welcomeGreeting: {
    color: C.TEXT,
    fontSize: 17,
    fontWeight: '700',
    fontFamily: "'Lexend', sans-serif",
    marginBottom: 2,
  },
  welcomeDate: { color: C.TEXT_MUTED, fontSize: 13, fontFamily: "'Inter', sans-serif" },
  submitBtn: {
    backgroundColor: C.ORANGE,
    backgroundImage: 'linear-gradient(90deg, #F55B09, #FFD000)' as any,
    borderRadius: borderRadius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  submitBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    paddingVertical: 16,
  },
  statCard: { flex: 1, alignItems: 'center' },
  statNumber: {
    color: C.ORANGE,
    fontSize: 24,
    fontWeight: '800',
    fontFamily: "'Lexend', sans-serif",
  },
  statLabel: { color: C.TEXT_MUTED, fontSize: 11, marginTop: 2, fontFamily: "'Inter', sans-serif" },
  statDivider: { width: 1, backgroundColor: C.CARD_BORDER },

  // Sections
  section: { paddingHorizontal: 16, marginTop: 24, marginBottom: 4 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: C.TEXT,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: "'Lexend', sans-serif",
    marginBottom: 12,
  },
  seeAll: { color: C.ORANGE, fontSize: 13 },

  // Featured Challenge Card
  featuredCard: {
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  featuredImageWrap: { position: 'relative', height: 200 },
  featuredImage: { width: '100%', height: '100%' },
  featuredImagePlaceholder: {
    backgroundColor: C.CARD_BG2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  featuredBadgeWrap: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 6,
  },
  activeBadge: {
    backgroundColor: C.SUCCESS,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  activeBadgeText: { color: '#000', fontSize: 10, fontWeight: '800' },
  proBadgeOverlay: {
    backgroundColor: C.ORANGE_MID,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  proBadgeOverlayText: { color: '#000', fontSize: 10, fontWeight: '800' },
  daysLeftBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: borderRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  daysLeftText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  featuredBody: { padding: 16 },
  featuredTitle: {
    color: C.TEXT,
    fontSize: 20,
    fontWeight: '800',
    fontFamily: "'Lexend', sans-serif",
    marginBottom: 8,
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  tag: {
    backgroundColor: C.TEAL + '22',
    borderWidth: 1,
    borderColor: C.TEAL + '55',
    borderRadius: borderRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tagText: { color: C.TEAL, fontSize: 11, fontWeight: '600' },
  featuredDesc: {
    color: C.TEXT_SECONDARY,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: "'Inter', sans-serif",
  },
  featuredStats: { flexDirection: 'row', gap: 16, marginBottom: 14 },
  featuredStat: { color: C.TEXT_MUTED, fontSize: 13 },
  featuredButtons: { flexDirection: 'row', gap: 10 },
  submitPhotoBtn: {
    flex: 1,
    backgroundColor: C.ORANGE,
    backgroundImage: 'linear-gradient(90deg, #F55B09, #FFD000)' as any,
    borderRadius: borderRadius.pill,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitPhotoBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  browseBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: C.ORANGE,
    borderRadius: borderRadius.pill,
    paddingVertical: 12,
    alignItems: 'center',
  },
  browseBtnText: { color: C.ORANGE, fontWeight: '700', fontSize: 14 },

  // Quote Banner
  quoteBanner: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: C.TEAL + '18',
    borderLeftWidth: 3,
    borderLeftColor: C.TEAL,
    borderRadius: borderRadius.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  quoteIcon: { fontSize: 20 },
  quoteText: {
    flex: 1,
    color: C.TEXT_SECONDARY,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 22,
    fontFamily: "'Inter', sans-serif",
  },

  // Submissions Grid
  submissionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  submissionsGridDesktop: { gap: 12 },
  submissionCard: {
    width: '31%',
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  submissionCardDesktop: { width: '31.5%' },
  submissionImageWrap: { width: '100%', aspectRatio: 1 },
  submissionImage: { width: '100%', height: '100%' },
  submissionImagePlaceholder: {
    backgroundColor: C.CARD_BG2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submissionInfo: { padding: 6 },
  submissionUsername: {
    color: C.TEAL,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  submissionTitle: { color: C.TEXT, fontSize: 11, fontWeight: '600', marginBottom: 3 },
  submissionMeta: { flexDirection: 'row', gap: 6 },
  submissionMetaText: { color: C.TEXT_MUTED, fontSize: 10 },

  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  quickActionCard: {
    flex: 1,
    minWidth: 70,
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIcon: { fontSize: 26, marginBottom: 6 },
  quickActionLabel: {
    color: C.TEXT_SECONDARY,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: "'Inter', sans-serif",
  },

  // Hero (Logged Out)
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 40,
    alignItems: 'center',
    backgroundColor: C.CARD_BG2,
    borderBottomWidth: 1,
    borderBottomColor: C.CARD_BORDER,
  },
  heroBadge: {
    backgroundColor: C.TEAL + '22',
    borderWidth: 1,
    borderColor: C.TEAL + '55',
    borderRadius: borderRadius.pill,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 16,
  },
  heroBadgeText: { color: C.TEAL, fontSize: 13, fontWeight: '600' },
  heroTitle: {
    color: C.TEXT,
    fontSize: 32,
    fontWeight: '800',
    fontFamily: "'Lexend', sans-serif",
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 14,
  },
  heroSubtext: {
    color: C.TEXT_SECONDARY,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 440,
    marginBottom: 28,
    fontFamily: "'Inter', sans-serif",
  },
  heroButtons: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' },
  heroJoinBtn: {
    backgroundColor: C.ORANGE,
    backgroundImage: 'linear-gradient(90deg, #F55B09, #FFD000)' as any,
    borderRadius: borderRadius.pill,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  heroJoinBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  heroViewBtn: {
    borderWidth: 1.5,
    borderColor: C.TEXT_SECONDARY,
    borderRadius: borderRadius.pill,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  heroViewBtnText: { color: C.TEXT_SECONDARY, fontWeight: '600', fontSize: 15 },

  // How It Works
  howItWorksRow: { gap: 12 },
  howItWorksRowDesktop: { flexDirection: 'row' },
  howItWorksCard: {
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    padding: 20,
    marginBottom: 12,
  },
  howItWorksCardDesktop: { flex: 1, marginBottom: 0 },
  howItWorksIconWrap: {
    width: 48,
    height: 48,
    backgroundColor: C.ORANGE + '22',
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  howItWorksIcon: { fontSize: 24 },
  howItWorksTitle: {
    color: C.TEXT,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: "'Lexend', sans-serif",
    marginBottom: 6,
  },
  howItWorksDesc: {
    color: C.TEXT_SECONDARY,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "'Inter', sans-serif",
  },

  // CTA Section
  ctaSection: {
    margin: 16,
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.xl,
    padding: 28,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    alignItems: 'center',
  },
  ctaTitle: {
    color: C.TEXT,
    fontSize: 22,
    fontWeight: '800',
    fontFamily: "'Lexend', sans-serif",
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaBody: {
    color: C.TEXT_SECONDARY,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    fontFamily: "'Inter', sans-serif",
  },
});
