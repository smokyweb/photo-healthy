import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ImageBackground, RefreshControl, useWindowDimensions, Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getChallenges, getSubmissions, getUserStats } from '../services/api';
import AppFooter from '../components/AppFooter';
import GradientButton from '../components/GradientButton';
import { C, borderRadius } from '../theme';

const BASE = 'https://photoai.betaplanets.com';
const fullUrl = (url?: string | null) =>
  url ? (url.startsWith('http') ? url : BASE + url) : null;

const CITY_BG = { uri: 'https://photoai.betaplanets.com/city-bg.png' };
const MOTIVATION_QUOTE =
  '"Every step forward, no matter how small, is still progress. Keep moving."';

// ── Logged-In Home Dashboard ─────────────────────────────────────────────────
function LoggedInHome({
  user, challenges, submissions, stats, navigation, refreshing, onRefresh,
}: any) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;
  const isLargeDesktop = Platform.OS === 'web' && width >= 1200;

  const featured = challenges.find((c: any) => c.is_active) || challenges[0];
  const daysLeft = featured?.end_date
    ? Math.max(0, Math.floor((new Date(featured.end_date).getTime() - Date.now()) / 86400000))
    : 0;
  const coverImg = featured
    ? fullUrl(featured.cover_image_url || featured.cover_image)
    : null;
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  const firstName = (user?.name || 'User').split(' ')[0];

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={{ paddingBottom: 0 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.ORANGE} />
      }
    >
      {/* ── Welcome Banner ── */}
      <ImageBackground source={CITY_BG} style={s.welcomeBanner} resizeMode="cover">
        <View style={s.bannerOverlay}>
          <View style={s.bannerLeft}>
            <Text style={s.bannerTitle}>Welcome back, {firstName}! 👋</Text>
            <Text style={s.bannerDate}>{today}</Text>
          </View>
          <View style={s.alertsBox}>
            <Text style={s.alertsTitle}>🔔 Alerts</Text>
            <Text style={s.alertsBody}>No new alerts</Text>
          </View>
        </View>
      </ImageBackground>

      {/* ── Page Content ── */}
      <View style={[s.pageWrap, isDesktop && s.pageWrapDesktop]}>

        {/* ── Hero Section ── */}
        {featured && (
          <View style={[s.heroSection, isDesktop && s.heroSectionDesktop]}>
            {/* Left: Cover Image 60% */}
            <TouchableOpacity
              style={[s.heroImgWrap, isDesktop && { flex: 6 }]}
              onPress={() =>
                navigation.navigate('ChallengeDetail', { challengeId: featured.id })
              }
              activeOpacity={0.9}
            >
              {coverImg ? (
                <Image source={{ uri: coverImg }} style={s.heroImg} resizeMode="cover" />
              ) : (
                <View style={[s.heroImg, s.heroImgPlaceholder]}>
                  <Text style={{ fontSize: 60 }}>ðŸ”ï¸</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Right: Challenge Info Card 40% */}
            <View style={[s.challengeCard, isDesktop && { flex: 4 }]}>
              <View style={s.activeBadge}>
                <Text style={s.activeBadgeText}>â— Active Challenge</Text>
              </View>

              <Text style={s.challengeTitle} numberOfLines={2}>
                {featured.title}
              </Text>

              {featured.description && (
                <Text style={s.challengeDesc} numberOfLines={3}>
                  {featured.description}
                </Text>
              )}

              {/* 2×2 Stats Grid */}
              <View style={s.metaGrid}>
                {[
                  { label: 'Feeling', val: featured.feeling_category || featured.feeling_tag || '—' },
                  { label: 'Movement', val: featured.movement_category || featured.movement_tag || '—' },
                  { label: 'Days Left', val: String(daysLeft) },
                  { label: 'Participants', val: String(featured.submission_count ?? 0) },
                ].map(({ label, val }) => (
                  <View key={label} style={s.metaItem}>
                    <Text style={s.metaLabel}>{label}</Text>
                    <Text style={s.metaVal}>{val}</Text>
                  </View>
                ))}
              </View>

              {/* Action Buttons */}
              <View style={s.challengeBtns}>
                <GradientButton
                  label="Submit Photos"
                  variant="primary"
                  onPress={() =>
                    navigation.navigate('SubmitPhoto', { challengeId: featured.id })
                  }
                  style={{ flex: 1 }}
                  size="sm"
                />
                <GradientButton
                  label="Browse Challenges"
                  variant="outline"
                  onPress={() =>
                    navigation.navigate('Main', { screen: 'ChallengesTab' })
                  }
                  style={{ flex: 1 }}
                  size="sm"
                />
              </View>
            </View>
          </View>
        )}

        {/* ── Motivation Quote Banner ── */}
        <View style={s.quoteBanner}>
          <Text style={s.quoteAccent}>â</Text>
          <Text style={s.quoteText}>{MOTIVATION_QUOTE}</Text>
        </View>

        {/* ── Stats Row (3 equal cols) ── */}
        <View style={[s.statsRow, isDesktop && { gap: 24 }]}>
          {[
            {
              icon: 'ðŸ†',
              num: stats?.challenges ?? 0,
              label: 'Challenges Completed',
              color: C.ORANGE_MID,
              trend: 'All time',
            },
            {
              icon: 'ðŸ”¥',
              num: stats?.streak ?? 0,
              label: 'Day Streak',
              color: '#FBBF24',
              trend: 'Keep it up!',
            },
            {
              icon: 'ðŸš¶',
              num: Number(stats?.totalMiles ?? 0).toFixed(1),
              label: 'Miles Tracked',
              color: C.TEAL,
              trend: 'Great progress',
            },
          ].map(({ icon, num, label, color, trend }) => (
            <View key={label} style={s.statCard}>
              <Text style={s.statIcon}>{icon}</Text>
              <Text style={[s.statNum, { color }]}>{num}</Text>
              <Text style={s.statLabel}>{label}</Text>
              <Text style={s.statTrend}>{trend}</Text>
            </View>
          ))}
        </View>

        {/* ── Community Submissions ── */}
        {submissions.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Community Submissions</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Community')}
              >
                <Text style={s.seeAll}>See all â†'</Text>
              </TouchableOpacity>
            </View>
            <View style={s.subGrid}>
              {submissions.slice(0, isLargeDesktop ? 8 : 6).map((sub: any) => {
                const imgUrl = fullUrl(sub.photo1_url);
                return (
                  <TouchableOpacity
                    key={sub.id}
                    style={[s.subCard, isLargeDesktop && s.subCard4]}
                    onPress={() =>
                      navigation.navigate('SubmissionDetail', { submissionId: sub.id })
                    }
                    activeOpacity={0.88}
                  >
                    {imgUrl ? (
                      <Image
                        source={{ uri: imgUrl }}
                        style={s.subImg}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[s.subImg, s.subImgPlaceholder]}>
                        <Text style={{ fontSize: 24 }}>ðŸ“·</Text>
                      </View>
                    )}
                    <View style={s.subInfo}>
                      <Text style={s.subUser} numberOfLines={1}>
                        @{sub.user_name || 'user'}
                      </Text>
                      <Text style={s.subTitle} numberOfLines={1}>
                        {sub.title || 'Untitled'}
                      </Text>
                      <View style={s.subMeta}>
                        <Text style={s.subMetaText}>❤️ {sub.like_count || 0}</Text>
                        <Text style={s.subMetaText}>ðŸ'¬ {sub.comment_count || 0}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Quick Actions (4 equal cols) ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Quick Actions</Text>
          <View style={[s.quickGrid, isDesktop && s.quickGridDesktop]}>
            {[
              {
                icon: 'ðŸ§­',
                bg: '#16A34A',
                title: 'Browse Challenges',
                desc: 'Find your next challenge',
                nav: 'Main',
                params: { screen: 'ChallengesTab' },
              },
              {
                icon: 'ðŸ–¼ï¸',
                bg: '#0891B2',
                title: 'View Gallery',
                desc: 'Your photo collection',
                nav: 'Gallery',
                params: undefined,
              },
              {
                icon: '👑',
                bg: '#CA8A04',
                title: 'Go Pro',
                desc: 'Unlock premium features',
                nav: 'Subscription',
                params: undefined,
              },
              {
                icon: 'ðŸ›ï¸',
                bg: '#DC2626',
                title: 'Visit Shop',
                desc: 'Wellness products',
                nav: 'Shop',
                params: undefined,
              },
            ].map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  s.quickCard,
                  isDesktop && s.quickCardDesktop,
                  { backgroundColor: item.bg + '18', borderColor: item.bg + '40' },
                ]}
                onPress={() => navigation.navigate(item.nav as any, item.params)}
                activeOpacity={0.85}
              >
                <View
                  style={[s.quickIconCircle, { backgroundColor: item.bg + '33' }]}
                >
                  <Text style={s.quickIcon}>{item.icon}</Text>
                </View>
                <Text style={s.quickTitle}>{item.title}</Text>
                <Text style={s.quickDesc}>{item.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <AppFooter />
    </ScrollView>
  );
}

// ── Public Landing Page ──────────────────────────────────────────────────────
function PublicHome({ challenges, submissions, navigation }: any) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;
  const featured = challenges.find((c: any) => c.is_active) || challenges[0];
  const coverImg = featured
    ? fullUrl(featured.cover_image_url || featured.cover_image)
    : null;

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 0 }}>
      {/* Hero */}
      <ImageBackground
        source={CITY_BG}
        style={[s.hero, isDesktop && { height: 520 }]}
        resizeMode="cover"
      >
        <View style={s.heroOverlay}>
          <View style={s.heroContent}>
            <Text style={[s.heroHeading, isDesktop && { fontSize: 48, maxWidth: 600 }]}>
              Welcome to Your{'\n'}Wellness Community
            </Text>
            <Text style={s.heroSub}>
              Join photo challenges, track your movement, and share your wellness journey
              with a community that moves.
            </Text>
            <View style={s.heroBtns}>
              <GradientButton
                label="Join Free / Start a Challenge"
                variant="primary"
                onPress={() => navigation.navigate('Register')}
                size="lg"
              />
              <GradientButton
                label="View Challenges"
                variant="outline"
                onPress={() => navigation.navigate('Main', { screen: 'ChallengesTab' })}
                size="lg"
              />
            </View>
          </View>
        </View>
      </ImageBackground>

      {/* Feature pills */}
      <View style={[s.featurePills, isDesktop && { flexDirection: 'row', justifyContent: 'center' }]}>
        {[
          { icon: 'ðŸ“·', title: 'Weekly Challenges', sub: 'New wellness prompts every week' },
          { icon: '🌟', title: 'Community Gallery', sub: 'See what others are creating' },
          { icon: 'ðŸ†', title: 'Pro Rewards', sub: 'Unlock exclusive content' },
        ].map((f, i) => (
          <View key={i} style={s.featurePill}>
            <Text style={s.featurePillIcon}>{f.icon}</Text>
            <View>
              <Text style={s.featurePillTitle}>{f.title}</Text>
              <Text style={s.featurePillSub}>{f.sub}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Current Challenge */}
      {featured && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Current Challenge</Text>
          <TouchableOpacity
            style={s.featuredCard}
            onPress={() =>
              navigation.navigate('ChallengeDetail', { challengeId: featured.id })
            }
            activeOpacity={0.9}
          >
            <View style={s.featuredImgWrap}>
              {coverImg ? (
                <Image
                  source={{ uri: coverImg }}
                  style={s.featuredImg}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    s.featuredImg,
                    { backgroundColor: C.CARD_BG2, alignItems: 'center', justifyContent: 'center' },
                  ]}
                >
                  <Text style={{ fontSize: 60 }}>ðŸ”ï¸</Text>
                </View>
              )}
              <View style={s.activeBadge}>
                <Text style={s.activeBadgeText}>â— Active</Text>
              </View>
            </View>
            <View style={s.featuredInfo}>
              <Text style={s.challengeTitle}>{featured.title}</Text>
              {featured.description && (
                <Text style={s.challengeDesc} numberOfLines={3}>
                  {featured.description}
                </Text>
              )}
              <GradientButton
                label="Sign Up to Participate"
                variant="primary"
                onPress={() => navigation.navigate('Register')}
                style={{ marginTop: 12 }}
              />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Recent submissions */}
      {submissions.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Here's what people are sharing NOW</Text>
          <View style={s.subGrid}>
            {submissions.slice(0, 6).map((sub: any) => {
              const imgUrl = fullUrl(sub.photo1_url);
              return (
                <TouchableOpacity
                  key={sub.id}
                  style={s.subCard}
                  onPress={() => navigation.navigate('Login')}
                  activeOpacity={0.88}
                >
                  {imgUrl ? (
                    <Image
                      source={{ uri: imgUrl }}
                      style={s.subImg}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[s.subImg, s.subImgPlaceholder]}>
                      <Text style={{ fontSize: 24 }}>ðŸ“·</Text>
                    </View>
                  )}
                  <View style={s.subInfo}>
                    <Text style={s.subUser} numberOfLines={1}>
                      @{sub.user_name || 'user'}
                    </Text>
                    <Text style={s.subTitle} numberOfLines={1}>
                      {sub.title || 'Untitled'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          <GradientButton
            label="Sign Up to See More"
            variant="primary"
            onPress={() => navigation.navigate('Register')}
            style={{ marginTop: 16, alignSelf: 'center', paddingHorizontal: 40 } as any}
          />
        </View>
      )}

      {/* How It Works */}
      <View style={s.section}>
        <Text style={[s.sectionTitle, { textAlign: 'center', marginBottom: 24 }]}>
          How It Works
        </Text>
        <View style={s.hiwRow}>
          {[
            {
              icon: 'ðŸ†',
              title: 'Join Challenges',
              desc: 'Browse weekly photography challenges across various themes.',
            },
            {
              icon: 'ðŸ“·',
              title: 'Submit Photos',
              desc: 'Upload your best shots and share your creative vision.',
            },
            {
              icon: '📈',
              title: 'Engage & Grow',
              desc: 'Get feedback, connect with others, and watch your skills improve.',
            },
          ].map((card, i) => (
            <View key={i} style={s.hiwCard}>
              <Text style={s.hiwIcon}>{card.icon}</Text>
              <Text style={s.hiwTitle}>{card.title}</Text>
              <Text style={s.hiwDesc}>{card.desc}</Text>
            </View>
          ))}
        </View>
        <GradientButton
          label="Get Started Free â†'"
          variant="primary"
          onPress={() => navigation.navigate('Register')}
          style={{ marginTop: 24, alignSelf: 'center', paddingHorizontal: 40 } as any}
        />
      </View>

      <AppFooter />
    </ScrollView>
  );
}

// ── Main HomeScreen ──────────────────────────────────────────────────────────
export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        getChallenges(),
        getSubmissions(),
        user ? getUserStats() : Promise.resolve(null),
      ]);
      const [cRes, sRes, stRes] = results;
      if (cRes.status === 'fulfilled') {
        const d = cRes.value;
        setChallenges(d?.challenges || d || []);
      }
      if (sRes.status === 'fulfilled') {
        const d = sRes.value;
        setSubmissions(d?.submissions || d || []);
      }
      if (stRes.status === 'fulfilled' && stRes.value) {
        setStats(stRes.value);
      }
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleRefresh = () => { setRefreshing(true); load(); };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.BG, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: C.ORANGE, fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  if (user) {
    return (
      <LoggedInHome
        user={user}
        challenges={challenges}
        submissions={submissions}
        stats={stats}
        navigation={navigation}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    );
  }

  return (
    <PublicHome
      challenges={challenges}
      submissions={submissions}
      navigation={navigation}
    />
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: { backgroundColor: C.BG },

  // Welcome Banner
  welcomeBanner: { height: 120, justifyContent: 'flex-end' },
  bannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(32,35,51,0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  bannerLeft: { flex: 65 },
  bannerTitle: {
    color: C.WHITE,
    fontSize: 20,
    fontWeight: '800',
    fontFamily: "'Lexend', sans-serif",
  } as any,
  bannerDate: { color: C.TEXT_MUTED, fontSize: 13, marginTop: 3 },
  alertsBox: {
    flex: 35,
    backgroundColor: 'rgba(59,62,79,0.85)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    alignItems: 'center',
  },
  alertsTitle: {
    color: C.TEXT,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: "'Inter', sans-serif",
  } as any,
  alertsBody: { color: C.TEXT_MUTED, fontSize: 11, marginTop: 2 },

  // Page content wrapper
  pageWrap: { padding: 16 },
  pageWrapDesktop: { maxWidth: 1280, alignSelf: 'center', width: '100%', paddingHorizontal: 32 },

  // Hero section
  heroSection: { marginBottom: 24 },
  heroSectionDesktop: { flexDirection: 'row', gap: 32, alignItems: 'flex-start' },
  heroImgWrap: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    aspectRatio: 16 / 9,
    maxHeight: 320,
    backgroundColor: C.CARD_BG,
  },
  heroImg: { width: '100%', height: '100%' },
  heroImgPlaceholder: {
    backgroundColor: C.CARD_BG2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Challenge info card
  challengeCard: {
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    marginTop: 16,
  },
  activeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#16A34A22',
    borderRadius: borderRadius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#16A34A55',
    marginBottom: 12,
  },
  activeBadgeText: { color: '#4ADE80', fontSize: 12, fontWeight: '700' },
  challengeTitle: {
    color: C.TEXT,
    fontSize: 20,
    fontWeight: '800',
    fontFamily: "'Lexend', sans-serif",
    marginBottom: 8,
  } as any,
  challengeDesc: {
    color: C.TEXT_SECONDARY,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
    fontFamily: "'Inter', sans-serif",
  } as any,
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  metaItem: {
    backgroundColor: C.BG,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    minWidth: '45%',
    flex: 1,
  },
  metaLabel: {
    color: C.TEXT_MUTED,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  } as any,
  metaVal: { color: C.TEXT, fontSize: 13, fontWeight: '600' },
  challengeBtns: { flexDirection: 'row', gap: 10 },

  // Quote banner
  quoteBanner: {
    backgroundColor: C.CARD_BG2,
    borderRadius: borderRadius.lg,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    marginBottom: 24,
  },
  quoteAccent: {
    color: C.TEAL,
    fontSize: 32,
    lineHeight: 32,
    marginBottom: 8,
    fontFamily: "'Lexend', sans-serif",
  } as any,
  quoteText: {
    color: C.TEXT_SECONDARY,
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: "'Inter', sans-serif",
  } as any,

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.lg,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  statIcon: { fontSize: 24, marginBottom: 6 },
  statNum: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: "'Lexend', sans-serif",
    marginBottom: 4,
  } as any,
  statLabel: {
    color: C.TEXT_MUTED,
    fontSize: 11,
    textAlign: 'center',
    fontFamily: "'Inter', sans-serif",
  } as any,
  statTrend: {
    color: C.TEXT_MUTED,
    fontSize: 10,
    marginTop: 4,
    fontFamily: "'Inter', sans-serif",
  } as any,

  // Sections
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    color: C.TEXT,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
    fontFamily: "'Lexend', sans-serif",
  } as any,
  seeAll: { color: C.ORANGE, fontSize: 14, fontWeight: '600' },

  // Submissions grid (3 cols default, 4 on large desktop)
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
  subCard4: { width: '23.5%' },
  subImg: { width: '100%', aspectRatio: 1 },
  subImgPlaceholder: {
    backgroundColor: C.CARD_BG2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subInfo: { padding: 8 },
  subUser: { color: C.TEXT_MUTED, fontSize: 11 },
  subTitle: {
    color: C.TEXT,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    fontFamily: "'Inter', sans-serif",
  } as any,
  subMeta: { flexDirection: 'row', gap: 8, marginTop: 4 },
  subMetaText: { color: C.TEXT_MUTED, fontSize: 11 },

  // Quick Actions grid
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickGridDesktop: { flexWrap: 'nowrap', gap: 20 },
  quickCard: {
    width: '47.5%',
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  quickCardDesktop: { flex: 1, width: undefined },
  quickIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickIcon: { fontSize: 26 },
  quickTitle: {
    color: C.TEXT,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: "'Inter', sans-serif",
  } as any,
  quickDesc: {
    color: C.TEXT_MUTED,
    fontSize: 11,
    textAlign: 'center',
    fontFamily: "'Inter', sans-serif",
  } as any,

  // Public hero
  hero: { height: 260 },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(32,35,51,0.65)',
    justifyContent: 'flex-end',
    padding: 24,
  },
  heroContent: { maxWidth: 600 },
  heroHeading: {
    color: C.WHITE,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 42,
    marginBottom: 14,
    fontFamily: "'Lexend', sans-serif",
  } as any,
  heroSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    lineHeight: 25,
    marginBottom: 24,
  },
  heroBtns: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },

  // Feature pills
  featurePills: { padding: 20, gap: 12 },
  featurePill: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    alignItems: 'center',
  },
  featurePillIcon: { fontSize: 28 },
  featurePillTitle: { color: C.TEXT, fontSize: 14, fontWeight: '700' },
  featurePillSub: { color: C.TEXT_MUTED, fontSize: 12, marginTop: 2 },

  // Featured challenge (public)
  featuredCard: {
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  featuredImgWrap: { position: 'relative' },
  featuredImg: { width: '100%', aspectRatio: 16 / 9 },
  featuredInfo: { padding: 16 },

  // How It Works
  hiwRow: { gap: 12 },
  hiwCard: {
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.lg,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  hiwIcon: { fontSize: 36, marginBottom: 12 },
  hiwTitle: {
    color: C.TEXT,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: "'Lexend', sans-serif",
  } as any,
  hiwDesc: {
    color: C.TEXT_SECONDARY,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
});
