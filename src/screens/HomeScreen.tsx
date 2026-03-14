import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { C } from '../theme';

const LOGO_IMG = require('../../assets/logo.png');
const PHOTO5_URBAN = require('../../assets/photo5-urban-sunset.png');
const PHOTO2_MOUNTAIN = require('../../assets/photo2-mountain-sunset.png');
const PHOTO8_ALLEY = require('../../assets/photo8-dark-alley.png');
const PHOTO9_CLOUDS = require('../../assets/photo9-mountain-clouds.png');

const StarField = React.memo(() => {
  const stars = useMemo(() => {
    const s = [];
    for (let i = 0; i < 80; i++) {
      s.push({
        left: `${Math.random() * 100}%`,
        top: Math.random() * 4000,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.3 + 0.05,
      });
    }
    return s;
  }, []);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map((star, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: star.left as any,
            top: star.top,
            width: star.size,
            height: star.size,
            borderRadius: star.size,
            backgroundColor: '#FFFFFF',
            opacity: star.opacity,
          }}
        />
      ))}
    </View>
  );
});

const formatDate = (date: Date) => {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

/* ========== LOGGED-IN HOME ========== */
const CITY_BG = require('../../assets/city-bg.png');

const LoggedInHome = ({ user, featured, challenges, submissions, daysLeft, navigation, recent }: any) => {
  const firstName = (user.name || 'User').split(' ')[0];
  const today = formatDate(new Date());

  return (
  <>
    {/* Welcome Banner */}
    <ImageBackground
      source={CITY_BG}
      style={li.welcomeBanner}
      imageStyle={{ borderRadius: 16, opacity: 0.75 }}
    >
      <View style={li.welcomeOverlay}>
        <View style={{ flex: 1 }}>
          <Text style={li.welcomeTitle}>Welcome Back, {firstName}!</Text>
          <Text style={li.welcomeDate}>{today}</Text>
        </View>
        <View style={li.noAlertsBadge}>
          <Text style={li.noAlertsText}>No Alerts</Text>
        </View>
      </View>
    </ImageBackground>

    {/* Active Challenge Card */}
    {featured && (
      <View style={li.section}>
        <View style={li.challengeCard}>
          <Image source={featured.cover_image_url ? { uri: featured.cover_image_url } : PHOTO5_URBAN} style={li.challengeCover} resizeMode="cover" />
          <View style={li.challengeInfo}>
            <View style={li.challengeTitleRow}>
              <Text style={li.challengeTitle}>{featured.title}</Text>
              <View style={li.activeBadge}>
                <Text style={li.activeBadgeText}>Active Challenge</Text>
              </View>
            </View>
            <Text style={li.challengeDesc} numberOfLines={2}>
              {featured.description || 'Capture the breathtaking beauty of golden hour. Show us how the warm, soft light transforms ordinary scenes.'}
            </Text>
            <Text style={li.challengeCategoryLabel}>Challenge Category</Text>

            {/* 2x2 Stats Mini-Grid */}
            <View style={li.miniGrid}>
              <View style={li.miniRow}>
                <View style={li.miniCard}>
                  <Text style={li.miniIcon}>❤️</Text>
                  <Text style={li.miniLabel}>Feeling</Text>
                </View>
                <View style={li.miniCard}>
                  <Text style={li.miniIcon}>🏃</Text>
                  <Text style={li.miniLabel}>Movement</Text>
                </View>
              </View>
              <View style={li.miniRow}>
                <View style={li.miniCard}>
                  <Text style={li.miniLabel}>Days Left</Text>
                  <Text style={li.miniValue}>{daysLeft}</Text>
                </View>
                <View style={li.miniCard}>
                  <Text style={li.miniLabel}>Participants</Text>
                  <Text style={li.miniValue}>{featured.submission_count || submissions.length}</Text>
                </View>
              </View>
            </View>

            {/* Submit Photos Button */}
            <TouchableOpacity
              style={li.submitBtn}
              onPress={() => navigation.navigate('ChallengesTab')}
            >
              <Text style={li.submitBtnText}>Submit Photos</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )}

    {/* Motivation Quote Banner */}
    <View style={li.quoteBanner}>
      <Text style={li.quoteText}>
        Every photo tells a story. Make yours worth telling.
      </Text>
    </View>

    {/* Stats Row (3 cards) */}
    <View style={li.section}>
      <View style={li.statsRow}>
        <View style={li.statCard}>
          <Text style={li.statIcon}>🏆</Text>
          <Text style={li.statNum}>{challenges.length || 24}</Text>
          <Text style={li.statLabel}>Challenges Complete</Text>
        </View>
        <View style={li.statCard}>
          <Text style={li.statIcon}>⚡</Text>
          <Text style={[li.statNum, { color: C.TEAL }]}>8</Text>
          <Text style={li.statLabel}>Day Streak</Text>
        </View>
        <View style={li.statCard}>
          <Text style={li.statIcon}>👟</Text>
          <Text style={li.statNum}>123</Text>
          <Text style={li.statLabel}>Miles Tracked</Text>
        </View>
      </View>
    </View>

    {/* Recent Community Submissions (full-width cards) */}
    <View style={li.section}>
      <Text style={li.sectionTitle}>Recent Community Submissions</Text>
      {(recent.length > 0 ? recent : [
        { id: 1, user_name: 'sarah_lens', title: 'Golden hour reflections', photo1_url: null, _localPhoto: PHOTO2_MOUNTAIN, like_count: 234, comment_count: 18 },
        { id: 2, user_name: 'mike_photo', title: 'City lights at dusk', photo1_url: null, _localPhoto: PHOTO8_ALLEY, like_count: 189, comment_count: 24 },
      ]).map((sub: any) => (
        <TouchableOpacity
          key={sub.id}
          style={li.communityCard}
          onPress={() => sub.photo1_url && navigation.navigate('SubmissionDetail', { id: sub.id })}
        >
          <Image source={sub._localPhoto || { uri: sub.photo1_url }} style={li.communityImg} resizeMode="cover" />
          <View style={li.communityInfo}>
            <Text style={li.communityUser}>@{sub.user_name || 'unknown'}</Text>
            <Text style={li.communityTitle}>{sub.title || 'Untitled'}</Text>
            <View style={li.communityStats}>
              <Text style={li.communityStat}>❤️ {sub.like_count || 0}</Text>
              <Text style={li.communityStat}>💬 {sub.comment_count || 0}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>

    {/* Quick Actions Grid (2x2) */}
    <View style={li.section}>
      <Text style={li.sectionTitle}>Recent Community Submissions</Text>
      <View style={li.quickGrid}>
        {[
          { icon: '🏆', title: 'Browse Challenges', desc: 'Discover new photography challenges', nav: 'ChallengesTab' },
          { icon: '🖼️', title: 'View Gallery', desc: 'See all your submitted photos', nav: 'ChallengesTab' },
          { icon: '💳', title: 'Subscription', desc: 'Update billing preferences', nav: 'ProfileTab' },
          { icon: '🛍️', title: 'Visit Shop', desc: 'Browse photography gear', nav: 'ChallengesTab' },
        ].map((item, i) => (
          <TouchableOpacity
            key={i}
            style={li.quickCard}
            onPress={() => navigation.navigate(item.nav)}
          >
            <Text style={{ fontSize: 28 }}>{item.icon}</Text>
            <Text style={li.quickTitle}>{item.title}</Text>
            <Text style={li.quickDesc}>{item.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>

    {/* Footer */}
    <View style={li.footer}>
      <View style={li.footerColumns}>
        <View style={li.footerCol}>
          <Text style={li.footerColTitle}>Company</Text>
          {['About Us', 'FAQ', 'Shop', 'Contact', 'Partners', 'Profile'].map((t) => (
            <Text key={t} style={li.footerLink}>{t}</Text>
          ))}
        </View>
        <View style={li.footerCol}>
          <Text style={li.footerColTitle}>Legal</Text>
          {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'].map((t) => (
            <Text key={t} style={li.footerLink}>{t}</Text>
          ))}
        </View>
      </View>
      <View style={li.socialRow}>
        <Text style={{ fontSize: 24, marginRight: 16 }}>📘</Text>
        <Text style={{ fontSize: 24 }}>📸</Text>
      </View>
      <Text style={li.copyright}>© 2026 Photo Healthy. All rights reserved.</Text>
    </View>
  </>
  );
};

/* ========== MAIN HOME SCREEN ========== */
const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [challenges, setChallenges] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<ScrollView>(null);
  const howItWorksY = useRef(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [cData, sData] = await Promise.all([
          api.getChallenges(),
          api.getSubmissions(),
        ]);
        setChallenges(cData.challenges || []);
        setSubmissions(sData.submissions || []);
      } catch {} finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const featured = challenges.find(
    (c) => c.is_active && new Date(c.end_date) > new Date(),
  ) || challenges[0];
  const recent = submissions.slice(0, 4);

  const daysLeft = featured
    ? Math.max(0, Math.ceil((new Date(featured.end_date).getTime() - Date.now()) / 86400000))
    : 0;

  if (loading) {
    return (
      <View style={s.loadWrap}>
        <ActivityIndicator size="large" color={C.ORANGE} />
      </View>
    );
  }

  return (
    <ScrollView ref={scrollRef} style={s.root} contentContainerStyle={{ paddingBottom: 40 }}>
      <StarField />

      {/* Top bar */}
      <View style={s.topBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Image
            source={LOGO_IMG}
            style={{ width: 36, height: 36 }}
            resizeMode="contain"
          />
        </View>
        <View style={s.topRight}>
          <TouchableOpacity style={s.bellBtn}>
            <Text style={{ fontSize: 18 }}>🔔</Text>
          </TouchableOpacity>
          {user && (
            <TouchableOpacity style={s.bellBtn}>
              <Text style={{ fontSize: 20, color: C.TEXT }}>☰</Text>
            </TouchableOpacity>
          )}
          {user ? (
            <TouchableOpacity onPress={() => navigation.navigate('ProfileTab')}>
              <View style={s.avatarCircle}>
                <Text style={s.avatarText}>
                  {(user.name || 'U')[0].toUpperCase()}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <View style={s.avatarCircle}>
                <Text style={s.avatarText}>?</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {user ? (
        /* ===== LOGGED-IN CONTENT ===== */
        <LoggedInHome
          user={user}
          featured={featured}
          challenges={challenges}
          submissions={submissions}
          daysLeft={daysLeft}
          navigation={navigation}
          recent={recent}
        />
      ) : (
        /* ===== PUBLIC CONTENT (hero, stats, challenge, submissions, how-it-works) ===== */
        <>
          {/* ===== HERO SECTION ===== */}
          <View style={[s.heroWrap, isMobile && s.heroWrapMobile]}>
            <View style={[s.heroLeft, isMobile && s.heroLeftMobile]}>
              <Text style={[s.heroHeading, isMobile && { fontSize: 28 }]}>
                Welcome somewhere that feels{' '}
                <Text style={s.heroGood}>good</Text>
                {' '}to be
              </Text>
              <Text style={s.heroSub}>
                Join a vibrant community of photographers sharing inspiring wellness moments and participating in fun photo challenges.
              </Text>
              <View style={s.heroBtns}>
                <TouchableOpacity
                  style={s.getStartedBtn}
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text style={s.getStartedText}>Get Started</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.learnMoreBtn}
                  onPress={() => {
                    if (howItWorksY.current > 0) {
                      scrollRef.current?.scrollTo({ y: howItWorksY.current, animated: true });
                    }
                  }}
                >
                  <Text style={s.learnMoreText}>Learn More</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={[s.heroRight, isMobile && s.heroRightMobile]}>
              <View style={s.heroGlow} />
              <Image
                source={LOGO_IMG}
                style={[
                  s.heroLogo,
                  isMobile ? { width: 150, height: 150 } : { width: 200, height: 200 },
                ]}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Stats row */}
          <View style={[s.section, { marginTop: 0 }]}>
            <View style={[s.statsRow, isMobile && { gap: 10 }]}>
              <View style={s.statCard}>
                <Text style={s.statNum}>{submissions.length || 27}</Text>
                <Text style={s.statLabel}>Photos</Text>
              </View>
              <View style={s.statCard}>
                <Text style={s.statNum}>5</Text>
                <Text style={s.statLabel}>Following</Text>
              </View>
              <View style={s.statCard}>
                <Text style={s.statNum}>148</Text>
                <Text style={s.statLabel}>Members</Text>
              </View>
            </View>
          </View>

          {/* ===== CURRENT CHALLENGE CARD ===== */}
          {featured && (
            <View style={s.section}>
              <View style={[s.challengeCard, isMobile && { flexDirection: 'column' }]}>
                <View style={[s.challengeLeft, isMobile && { width: '100%' as any, paddingBottom: 16 }]}>
                  <Text style={s.challengeLabel}>📷 Photo Challenge</Text>
                  <Text style={s.challengeTitle}>{featured.title}</Text>
                  <Text style={s.challengeMeta}>
                    Category: {featured.category || 'General'} | Submissions: {featured.submission_count || submissions.length} | Ends in: {daysLeft} days
                  </Text>
                  <TouchableOpacity
                    style={s.submitBtn}
                    onPress={() => navigation.navigate('Login')}
                  >
                    <Text style={s.submitBtnText}>Submit Your Photo</Text>
                  </TouchableOpacity>
                </View>
                <View style={[s.challengeRight, isMobile && { width: '100%' as any, height: 180 }]}>
                  <Image
                    source={featured.cover_image_url ? { uri: featured.cover_image_url } : PHOTO9_CLOUDS}
                    style={s.challengeImg}
                    resizeMode="cover"
                  />
                </View>
              </View>
            </View>
          )}

          {/* ===== RECENT SUBMISSIONS ===== */}
          <View style={s.section}>
            <Text style={[s.sectionTitle, { textAlign: 'center' }]}>
              Here's what people are sharing NOW
            </Text>
            <View style={[s.subGrid, isMobile && { gap: 12 }]}>
              {recent.map((sub: any) => (
                <TouchableOpacity
                  key={sub.id}
                  style={[s.subCard, isMobile && { width: '47%' as any }]}
                  onPress={() => navigation.navigate('SubmissionDetail', { id: sub.id })}
                >
                  <Image source={{ uri: sub.photo1_url }} style={s.subImg} />
                  <View style={s.subInfo}>
                    <View style={s.subUserRow}>
                      <View style={s.subAvatar}>
                        <Text style={s.subAvatarText}>
                          {(sub.user_name || 'U')[0]}
                        </Text>
                      </View>
                      <Text style={s.subUserName} numberOfLines={1}>
                        {sub.user_name || 'Unknown'}
                      </Text>
                    </View>
                    <View style={s.subStats}>
                      <Text style={s.subStat}>❤️ {sub.like_count || 0}</Text>
                      <Text style={s.subStat}>💬 {sub.comment_count || 0}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            {recent.length === 0 && (
              <View style={s.emptyState}>
                <Text style={{ fontSize: 48 }}>📷</Text>
                <Text style={s.emptyText}>No submissions yet</Text>
              </View>
            )}
            {recent.length > 0 && (
              <TouchableOpacity
                style={[s.getStartedBtn, { alignSelf: 'center', marginTop: 20, paddingHorizontal: 40 }]}
                onPress={() => navigation.navigate('ChallengesTab')}
              >
                <Text style={s.getStartedText}>Browse All</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ===== HOW IT WORKS ===== */}
          <View
            style={s.section}
            onLayout={(e) => { howItWorksY.current = e.nativeEvent.layout.y; }}
          >
            <Text style={[s.sectionTitle, { textAlign: 'center', marginBottom: 24 }]}>
              What this becomes over time
            </Text>
            <View style={[s.hiwRow, isMobile && { flexDirection: 'column' }]}>
              {[
                { title: 'You start small', desc: 'Every great journey starts with a single click of the shutter.' },
                { title: 'You feel momentum', desc: 'Challenges push you. Community lifts you.' },
                { title: 'You belong', desc: 'Find your people. Share your lens. Grow together.' },
              ].map((card, i) => (
                <View key={i} style={[s.hiwCard, isMobile && { width: '100%' as any }]}>
                  <Image source={LOGO_IMG} style={{ width: 40, height: 40, marginBottom: 12 }} resizeMode="contain" />
                  <Text style={s.hiwTitle}>{card.title}</Text>
                  <Text style={s.hiwDesc}>{card.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
};

/* ========== PUBLIC / SHARED STYLES ========== */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.BG },
  loadWrap: {
    flex: 1,
    backgroundColor: C.BG,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  brandText: {
    color: C.TEXT_SECONDARY,
    fontSize: 12,
    letterSpacing: 2,
    opacity: 0.6,
    textTransform: 'uppercase',
  },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellBtn: { padding: 4 },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // ===== HERO =====
  heroWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 32,
  },
  heroWrapMobile: {
    flexDirection: 'column',
    paddingTop: 20,
    paddingBottom: 20,
  },
  heroLeft: {
    flex: 1,
    paddingRight: 24,
  },
  heroLeftMobile: {
    paddingRight: 0,
    marginBottom: 24,
  },
  heroHeading: {
    color: C.TEXT,
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 44,
    marginBottom: 16,
  },
  heroGood: {
    color: '#FF8C00',
    fontStyle: 'italic',
    fontWeight: '700',
  },
  heroSub: {
    color: C.TEXT_SECONDARY,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 24,
  },
  heroBtns: {
    flexDirection: 'row',
    gap: 12,
  },
  getStartedBtn: {
    backgroundImage: 'linear-gradient(135deg, #FF8C00, #FFA500)',
    backgroundColor: C.ORANGE,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 28,
  } as any,
  getStartedText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  learnMoreBtn: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 28,
    backgroundColor: 'transparent',
  },
  learnMoreText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  heroRight: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 240,
  },
  heroRightMobile: {
    width: '100%' as any,
  },
  heroGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 140, 0, 0.12)',
  },
  heroLogo: {
    zIndex: 1,
  },

  // Stats
  section: { paddingHorizontal: 20, marginBottom: 32 },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.CARD_BG,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  statNum: { color: C.TEXT, fontSize: 22, fontWeight: '700' },
  statLabel: { color: C.TEXT_SECONDARY, fontSize: 12, marginTop: 4 },

  // ===== CHALLENGE CARD =====
  challengeCard: {
    flexDirection: 'row',
    backgroundColor: C.CARD_BG,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  challengeLeft: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  challengeLabel: {
    color: C.ORANGE,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  challengeTitle: {
    color: C.TEXT,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
  },
  challengeMeta: {
    color: C.TEXT_SECONDARY,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 20,
  },
  submitBtn: {
    backgroundImage: 'linear-gradient(135deg, #FF8C00, #FFA500)',
    backgroundColor: C.ORANGE,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  } as any,
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  challengeRight: {
    width: 280,
    minHeight: 220,
  },
  challengeImg: {
    width: '100%',
    height: '100%',
  },
  challengeImgPlaceholder: {
    backgroundColor: '#1A1E30',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Section title
  sectionTitle: {
    color: C.TEXT,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },

  // Submissions grid
  subGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  subCard: {
    width: '48%' as any,
    backgroundColor: C.CARD_BG,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  subImg: {
    width: '100%',
    height: 140,
    backgroundColor: '#1A1E30',
  },
  subInfo: { padding: 10 },
  subUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  subAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subAvatarText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  subUserName: {
    color: C.TEXT,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  subStats: { flexDirection: 'row', gap: 12 },
  subStat: { color: C.TEXT_SECONDARY, fontSize: 12 },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: C.TEXT_SECONDARY, fontSize: 16, marginTop: 12 },

  // ===== HOW IT WORKS =====
  hiwRow: {
    flexDirection: 'row',
    gap: 16,
  },
  hiwCard: {
    flex: 1,
    backgroundColor: C.CARD_BG,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  hiwTitle: {
    color: C.TEXT,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  hiwDesc: {
    color: C.TEXT_SECONDARY,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});

/* ========== LOGGED-IN STYLES ========== */
const li = StyleSheet.create({
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { color: C.TEXT, fontSize: 20, fontWeight: '700', marginBottom: 16 },

  // Welcome Banner
  welcomeBanner: {
    borderRadius: 16,
    overflow: 'hidden' as const,
    marginHorizontal: 16,
    marginTop: 12,
    height: 120,
    marginBottom: 24,
  },
  welcomeOverlay: {
    flex: 1,
    padding: 20,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 16,
  },
  welcomeTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' as const },
  welcomeDate: { color: '#94A3B8', fontSize: 13, marginTop: 4 },
  noAlertsBadge: {
    backgroundColor: '#06B6D4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  noAlertsText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' as const },

  // Active Challenge Card
  challengeCard: {
    backgroundColor: C.CARD_BG,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  challengeCover: { width: '100%' as any, height: 200 },
  challengeInfo: { padding: 20 },
  challengeTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  challengeTitle: { color: C.TEXT, fontSize: 20, fontWeight: '700', flex: 1 },
  activeBadge: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  activeBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  challengeDesc: { color: C.TEXT_SECONDARY, fontSize: 14, lineHeight: 20, marginBottom: 12 },
  challengeCategoryLabel: {
    color: C.TEXT_SECONDARY,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },

  // Mini stat cards (2x2)
  miniGrid: { gap: 10, marginBottom: 16 },
  miniRow: { flexDirection: 'row', gap: 10 },
  miniCard: {
    flex: 1,
    backgroundColor: '#1E2235',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  miniIcon: { fontSize: 24, marginBottom: 4 },
  miniLabel: { color: C.TEXT_SECONDARY, fontSize: 12 },
  miniValue: { color: C.TEXT, fontSize: 20, fontWeight: '700', marginTop: 4 },

  // Submit button
  submitBtn: {
    backgroundImage: 'linear-gradient(135deg, #FF8C00, #FFA500)',
    backgroundColor: C.ORANGE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  } as any,
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  // Quote banner
  quoteBanner: {
    backgroundColor: '#0891B2',
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 14,
    padding: 20,
  },
  quoteText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Stats row
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: C.CARD_BG,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  statIcon: { fontSize: 24, marginBottom: 6 },
  statNum: { color: C.TEXT, fontSize: 22, fontWeight: '700' },
  statLabel: { color: C.TEXT_SECONDARY, fontSize: 11, marginTop: 4, textAlign: 'center' },

  // Community submissions (full-width)
  communityCard: {
    backgroundColor: C.CARD_BG,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    marginBottom: 16,
  },
  communityImg: { width: '100%' as any, height: 180, backgroundColor: '#1A1E30' },
  communityInfo: { padding: 14 },
  communityUser: { color: C.TEAL, fontSize: 14, fontWeight: '600', marginBottom: 2 },
  communityTitle: { color: C.TEXT, fontSize: 15, fontWeight: '600', marginBottom: 8 },
  communityStats: { flexDirection: 'row', gap: 16 },
  communityStat: { color: C.TEXT_SECONDARY, fontSize: 13 },

  // Quick actions (2x2)
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickCard: {
    width: '47%' as any,
    backgroundColor: C.CARD_BG,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  quickTitle: { color: C.TEXT, fontSize: 14, fontWeight: '700', marginTop: 8 },
  quickDesc: { color: C.TEXT_SECONDARY, fontSize: 12, marginTop: 4 },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: C.CARD_BORDER,
  },
  footerColumns: { flexDirection: 'row', marginBottom: 24 },
  footerCol: { flex: 1 },
  footerColTitle: { color: C.TEXT, fontSize: 15, fontWeight: '700', marginBottom: 12 },
  footerLink: { color: C.TEXT_SECONDARY, fontSize: 13, marginBottom: 8 },
  socialRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 16 },
  copyright: { color: C.TEXT_SECONDARY, fontSize: 12, textAlign: 'center' },
});

export default HomeScreen;
