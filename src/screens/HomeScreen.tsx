import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ImageBackground, RefreshControl, useWindowDimensions, Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getChallenges, getSubmissions } from '../services/api';
import AppFooter from '../components/AppFooter';
import ChallengeCard from '../components/ChallengeCard';
import GradientButton from '../components/GradientButton';
import { C, borderRadius } from '../theme';

const BASE = 'https://photoai.betaplanets.com';
const fullUrl = (url?: string) => url ? (url.startsWith('http') ? url : BASE + url) : null;

const CITY_BG = { uri: 'https://photoai.betaplanets.com/city-bg.png' };

// ── Logged-In Home Dashboard ────────────────────────────────────────────────
function LoggedInHome({
  user, challenges, submissions, navigation, refreshing, onRefresh,
}: any) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const featured = challenges.find((c: any) => c.is_active) || challenges[0];
  const activeCount = challenges.filter((c: any) => c.is_active).length;
  const submissionsCount = submissions.filter((s: any) => String(s.user_id) === String(user?.id)).length;

  const daysLeft = featured?.end_date
    ? Math.max(0, Math.floor((new Date(featured.end_date).getTime() - Date.now()) / 86400000))
    : 0;

  const coverImg = featured ? fullUrl(featured.cover_image_url) : null;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={{ paddingBottom: 0 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.ORANGE} />}
    >
      {/* Welcome Banner */}
      <ImageBackground source={CITY_BG} style={[s.welcomeBanner, isDesktop && { height: 140 }]} resizeMode="cover">
        <View style={s.welcomeOverlay}>
          <View style={{ flex: 1 }}>
            <Text style={s.welcomeTitle}>Welcome back, {(user?.name || 'User').split(' ')[0]}! 👋</Text>
            <Text style={s.welcomeDate}>{today}</Text>
          </View>
          <View style={s.noAlertsBadge}>
            <Text style={s.noAlertsText}>No Alerts</Text>
          </View>
        </View>
      </ImageBackground>

      {/* Stats row */}
      <View style={[s.statsRow, isDesktop && { maxWidth: 900, alignSelf: 'center', width: '100%' }]}>
        <View style={s.statCard}>
          <Text style={s.statIcon}>🏆</Text>
          <Text style={s.statNum}>{submissionsCount}</Text>
          <Text style={s.statLabel}>Photos Submitted</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statIcon}>🔥</Text>
          <Text style={[s.statNum, { color: '#FBBF24' }]}>{activeCount}</Text>
          <Text style={s.statLabel}>Active Challenges</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statIcon}>🚶</Text>
          <Text style={[s.statNum, { color: C.TEAL }]}>{Number(user?.total_miles || 0).toFixed(1)}</Text>
          <Text style={s.statLabel}>Miles Tracked</Text>
        </View>
      </View>

      {/* Main content - desktop: 2 columns, mobile: 1 column */}
      <View style={[s.mainContent, isDesktop && { flexDirection: 'row', gap: 24 }]}>

        {/* Left: Featured Challenge */}
        {featured && (
          <View style={[s.featuredWrap, isDesktop && { flex: 2 }]}>
            <Text style={s.sectionLabel}>FEATURED CHALLENGE</Text>
            <TouchableOpacity
              style={s.featuredCard}
              onPress={() => navigation.navigate('ChallengeDetail', { challengeId: featured.id })}
              activeOpacity={0.9}
            >
              {/* Cover image */}
              <View style={s.featuredImgWrap}>
                {coverImg
                  ? <Image source={{ uri: coverImg }} style={s.featuredImg} resizeMode="cover" />
                  : <View style={[s.featuredImg, { backgroundColor: C.CARD_BG2, alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={{ fontSize: 60 }}>🏔️</Text>
                    </View>
                }
                <View style={s.activeBadge}><Text style={s.activeBadgeText}>● Active</Text></View>
              </View>

              {/* Challenge info */}
              <View style={s.featuredInfo}>
                <Text style={s.featuredTitle}>{featured.title}</Text>
                {featured.description && (
                  <Text style={s.featuredDesc} numberOfLines={2}>{featured.description}</Text>
                )}

                {/* Meta grid */}
                <View style={s.metaGrid}>
                  {[
                    { label: 'Category', val: featured.category || 'General' },
                    { label: 'Feeling', val: featured.feeling_category || '—' },
                    { label: 'Movement', val: featured.movement_category || '—' },
                    { label: 'Days Left', val: String(daysLeft) },
                    { label: 'Submissions', val: String(featured.submission_count ?? submissions.filter((s: any) => s.challenge_id === featured.id).length) },
                  ].map(({ label, val }) => (
                    <View key={label} style={s.metaItem}>
                      <Text style={s.metaLabel}>{label}</Text>
                      <Text style={s.metaVal}>{val}</Text>
                    </View>
                  ))}
                </View>

                {/* Action buttons */}
                <View style={s.featuredBtns}>
                  <GradientButton
                    label="Submit Photos"
                    variant="primary"
                    onPress={() => navigation.navigate('SubmitPhoto', { challengeId: featured.id })}
                    style={{ flex: 1 }}
                    size="md"
                  />
                  <GradientButton
                    label="Browse Challenges"
                    variant="outline"
                    onPress={() => navigation.navigate('Main', { screen: 'ChallengesTab' })}
                    style={{ flex: 1 }}
                    size="md"
                  />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Right: Quick Actions */}
        <View style={[s.quickWrap, isDesktop && { flex: 1 }]}>
          <Text style={s.sectionLabel}>QUICK ACTIONS</Text>
          <View style={s.quickGrid}>
            {[
              { icon: '🧭', bg: '#16A34A', title: 'Browse Challenges', nav: 'Main', params: { screen: 'ChallengesTab' } },
              { icon: '🖼️', bg: '#0891B2', title: 'View Gallery', nav: 'Gallery' },
              { icon: '👑', bg: '#CA8A04', title: 'Go Pro', nav: 'Subscription' },
              { icon: '🛍️', bg: '#DC2626', title: 'Visit Shop', nav: 'Shop' },
            ].map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[s.quickCard, { backgroundColor: item.bg + '18', borderColor: item.bg + '40' }]}
                onPress={() => navigation.navigate(item.nav as any, item.params)}
                activeOpacity={0.85}
              >
                <Text style={s.quickIcon}>{item.icon}</Text>
                <Text style={s.quickTitle}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Active Challenges list */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Active Challenges</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'ChallengesTab' })}>
            <Text style={s.seeAll}>See all →</Text>
          </TouchableOpacity>
        </View>
        {challenges.filter((c: any) => c.is_active).slice(0, 3).map((challenge: any) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            onPress={() => navigation.navigate('ChallengeDetail', { challengeId: challenge.id })}
          />
        ))}
      </View>

      {/* Recent community submissions */}
      {submissions.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Recent Community Submissions</Text>
          <View style={s.subGrid}>
            {submissions.slice(0, 6).map((sub: any) => {
              const imgUrl = fullUrl(sub.photo1_url);
              return (
                <TouchableOpacity
                  key={sub.id}
                  style={s.subCard}
                  onPress={() => navigation.navigate('SubmissionDetail', { submissionId: sub.id })}
                  activeOpacity={0.88}
                >
                  {imgUrl
                    ? <Image source={{ uri: imgUrl }} style={s.subImg} resizeMode="cover" />
                    : <View style={[s.subImg, { backgroundColor: C.CARD_BG2, alignItems: 'center', justifyContent: 'center' }]}>
                        <Text style={{ fontSize: 24 }}>📷</Text>
                      </View>
                  }
                  <View style={s.subInfo}>
                    <Text style={s.subUser} numberOfLines={1}>@{sub.user_name || 'user'}</Text>
                    <Text style={s.subTitle} numberOfLines={1}>{sub.title || 'Untitled'}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <AppFooter />
    </ScrollView>
  );
}

// ── Public Landing Page ─────────────────────────────────────────────────────
function PublicHome({ challenges, submissions, navigation }: any) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;
  const featured = challenges.find((c: any) => c.is_active) || challenges[0];
  const coverImg = featured ? fullUrl(featured.cover_image_url) : null;

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 0 }}>
      {/* Hero */}
      <ImageBackground source={CITY_BG} style={[s.hero, isDesktop && { height: 520 }]} resizeMode="cover">
        <View style={s.heroOverlay}>
          <View style={s.heroContent}>
            <Text style={[s.heroHeading, isDesktop && { fontSize: 48, maxWidth: 600 }]}>
              Welcome to Your{'\n'}Wellness Community
            </Text>
            <Text style={s.heroSub}>
              Join photo challenges, track your movement, and share your wellness journey with a community that moves.
            </Text>
            <View style={s.heroBtns}>
              <GradientButton label="Join Free / Start a Challenge" variant="primary" onPress={() => navigation.navigate('Register')} size="lg" />
              <GradientButton label="View Challenges" variant="outline" onPress={() => navigation.navigate('Main', { screen: 'ChallengesTab' })} size="lg" />
            </View>
          </View>
        </View>
      </ImageBackground>

      {/* Feature pills */}
      <View style={[s.featurePills, isDesktop && { flexDirection: 'row', justifyContent: 'center' }]}>
        {[
          { icon: '📷', title: 'Weekly Challenges', sub: 'New wellness prompts every week' },
          { icon: '🌟', title: 'Community Gallery', sub: 'See what others are creating' },
          { icon: '🏆', title: 'Pro Rewards', sub: 'Unlock exclusive content' },
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
            onPress={() => navigation.navigate('ChallengeDetail', { challengeId: featured.id })}
            activeOpacity={0.9}
          >
            <View style={s.featuredImgWrap}>
              {coverImg
                ? <Image source={{ uri: coverImg }} style={s.featuredImg} resizeMode="cover" />
                : <View style={[s.featuredImg, { backgroundColor: C.CARD_BG2, alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 60 }}>🏔️</Text>
                  </View>
              }
              <View style={s.activeBadge}><Text style={s.activeBadgeText}>● Active</Text></View>
            </View>
            <View style={s.featuredInfo}>
              <Text style={s.featuredTitle}>{featured.title}</Text>
              {featured.description && <Text style={s.featuredDesc} numberOfLines={3}>{featured.description}</Text>}
              <GradientButton label="Sign Up to Participate" variant="primary" onPress={() => navigation.navigate('Register')} style={{ marginTop: 12 }} />
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
                <TouchableOpacity key={sub.id} style={s.subCard} onPress={() => navigation.navigate('Login')} activeOpacity={0.88}>
                  {imgUrl
                    ? <Image source={{ uri: imgUrl }} style={s.subImg} resizeMode="cover" />
                    : <View style={[s.subImg, { backgroundColor: C.CARD_BG2, alignItems: 'center', justifyContent: 'center' }]}><Text style={{ fontSize: 24 }}>📷</Text></View>
                  }
                  <View style={s.subInfo}>
                    <Text style={s.subUser} numberOfLines={1}>@{sub.user_name || 'user'}</Text>
                    <Text style={s.subTitle} numberOfLines={1}>{sub.title || 'Untitled'}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          <GradientButton label="Sign Up to See More" variant="primary" onPress={() => navigation.navigate('Register')} style={{ marginTop: 16, alignSelf: 'center', paddingHorizontal: 40 } as any} />
        </View>
      )}

      {/* How It Works */}
      <View style={s.section}>
        <Text style={[s.sectionTitle, { textAlign: 'center', marginBottom: 24 }]}>How It Works</Text>
        <View style={[s.hiwRow, { flexDirection: 'column' }]}>
          {[
            { icon: '🏆', title: 'Join Challenges', desc: 'Browse weekly photography challenges across various themes. Pick the ones that inspire you.' },
            { icon: '📷', title: 'Submit Photos', desc: 'Upload your best shots to the challenge. Share your creative vision with our community.' },
            { icon: '📈', title: 'Engage & Grow', desc: 'Get feedback, connect with fellow photographers, and watch your skills improve.' },
          ].map((card, i) => (
            <View key={i} style={s.hiwCard}>
              <Text style={s.hiwIcon}>{card.icon}</Text>
              <Text style={s.hiwTitle}>{card.title}</Text>
              <Text style={s.hiwDesc}>{card.desc}</Text>
            </View>
          ))}
        </View>
        <GradientButton label="Get Started Free →" variant="primary" onPress={() => navigation.navigate('Register')} style={{ marginTop: 24, alignSelf: 'center', paddingHorizontal: 40 } as any} />
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
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [cData, sData] = await Promise.all([
        getChallenges(),
        getSubmissions(),
      ]);
      setChallenges(cData?.challenges || cData || []);
      setSubmissions(sData?.submissions || sData || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleRefresh = () => { setRefreshing(true); load(); };

  if (loading) {
    return <View style={[s.screen, { justifyContent: 'center', alignItems: 'center' }]}><Text style={{ color: C.ORANGE, fontSize: 16 }}>Loading...</Text></View>;
  }

  if (user) {
    return <LoggedInHome user={user} challenges={challenges} submissions={submissions} navigation={navigation} refreshing={refreshing} onRefresh={handleRefresh} />;
  }

  return <PublicHome challenges={challenges} submissions={submissions} navigation={navigation} />;
}

// ── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.BG },

  // Welcome banner
  welcomeBanner: { height: 120, justifyContent: 'flex-end' },
  welcomeOverlay: { flex: 1, backgroundColor: 'rgba(32,35,51,0.6)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  welcomeTitle: { color: C.WHITE, fontSize: 22, fontWeight: '800', fontFamily: "'Lexend', sans-serif" } as any,
  welcomeDate: { color: C.TEXT_MUTED, fontSize: 13, marginTop: 2 },
  noAlertsBadge: { backgroundColor: C.CARD_BG, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: C.CARD_BORDER },
  noAlertsText: { color: C.TEXT_SECONDARY, fontSize: 12, fontWeight: '600' },

  // Stats
  statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: C.CARD_BG, borderRadius: borderRadius.lg, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: C.CARD_BORDER },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statNum: { color: C.ORANGE, fontSize: 22, fontWeight: '800', fontFamily: "'Lexend', sans-serif" } as any,
  statLabel: { color: C.TEXT_MUTED, fontSize: 11, marginTop: 3, textAlign: 'center', fontFamily: "'Inter', sans-serif" } as any,

  // Main content layout
  mainContent: { paddingHorizontal: 16, paddingBottom: 8 },
  featuredWrap: {},
  quickWrap: { marginTop: 20 },

  // Section labels
  sectionLabel: { color: C.ORANGE, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12, fontFamily: "'Inter', sans-serif" } as any,
  sectionTitle: { color: C.TEXT, fontSize: 20, fontWeight: '800', marginBottom: 16, fontFamily: "'Lexend', sans-serif" } as any,
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  seeAll: { color: C.ORANGE, fontSize: 14, fontWeight: '600' },
  section: { padding: 16 },

  // Featured challenge card
  featuredCard: { backgroundColor: C.CARD_BG, borderRadius: borderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: C.CARD_BORDER, marginBottom: 8 },
  featuredImgWrap: { position: 'relative' },
  featuredImg: { width: '100%', aspectRatio: 16 / 9 },
  activeBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(72,187,120,0.9)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  activeBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  featuredInfo: { padding: 16 },
  featuredTitle: { color: C.TEXT, fontSize: 20, fontWeight: '800', marginBottom: 6, fontFamily: "'Lexend', sans-serif" } as any,
  featuredDesc: { color: C.TEXT_SECONDARY, fontSize: 14, lineHeight: 21, marginBottom: 14 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  metaItem: { backgroundColor: C.BG, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: C.CARD_BORDER, minWidth: 80 },
  metaLabel: { color: C.TEXT_MUTED, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 } as any,
  metaVal: { color: C.TEXT, fontSize: 13, fontWeight: '600' },
  featuredBtns: { flexDirection: 'row', gap: 10 },

  // Quick actions
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: { width: '47%', borderRadius: borderRadius.lg, padding: 16, borderWidth: 1, alignItems: 'center', gap: 8 },
  quickIcon: { fontSize: 28 },
  quickTitle: { color: C.TEXT, fontSize: 13, fontWeight: '700', textAlign: 'center', fontFamily: "'Inter', sans-serif" } as any,

  // Submissions grid
  subGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  subCard: { width: '31%', backgroundColor: C.CARD_BG, borderRadius: borderRadius.md, overflow: 'hidden', borderWidth: 1, borderColor: C.CARD_BORDER },
  subImg: { width: '100%', aspectRatio: 1 },
  subInfo: { padding: 8 },
  subUser: { color: C.TEXT_MUTED, fontSize: 11 },
  subTitle: { color: C.TEXT, fontSize: 12, fontWeight: '600', marginTop: 2 },

  // Hero (public)
  hero: { height: 400 },
  heroOverlay: { flex: 1, backgroundColor: 'rgba(32,35,51,0.65)', justifyContent: 'flex-end', padding: 24 },
  heroContent: { maxWidth: 600 },
  heroHeading: { color: C.WHITE, fontSize: 32, fontWeight: '800', lineHeight: 42, marginBottom: 14, fontFamily: "'Lexend', sans-serif" } as any,
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 16, lineHeight: 25, marginBottom: 24 },
  heroBtns: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },

  // Feature pills
  featurePills: { padding: 20, gap: 12 },
  featurePill: { flexDirection: 'row', gap: 14, backgroundColor: C.CARD_BG, borderRadius: borderRadius.lg, padding: 14, borderWidth: 1, borderColor: C.CARD_BORDER, alignItems: 'center' },
  featurePillIcon: { fontSize: 28 },
  featurePillTitle: { color: C.TEXT, fontSize: 14, fontWeight: '700' },
  featurePillSub: { color: C.TEXT_MUTED, fontSize: 12, marginTop: 2 },

  // How It Works
  hiwRow: { gap: 12 },
  hiwCard: { backgroundColor: C.CARD_BG, borderRadius: borderRadius.lg, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: C.CARD_BORDER },
  hiwIcon: { fontSize: 36, marginBottom: 12 },
  hiwTitle: { color: C.TEXT, fontSize: 17, fontWeight: '700', marginBottom: 8, textAlign: 'center', fontFamily: "'Lexend', sans-serif" } as any,
  hiwDesc: { color: C.TEXT_SECONDARY, fontSize: 14, lineHeight: 21, textAlign: 'center' },
});
