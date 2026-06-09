import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Image,
  ImageBackground,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getAssetByID } from 'react-native-web/dist/modules/AssetRegistry';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import { getPublicSettings } from '../services/api';
import AppFooter from '../components/AppFooter';
import { C } from '../theme';
import { normalizeChallengeCategory, normalizeFeelingCategory, normalizeMovementCategory } from '../constants/taxonomy';

const LOGO_IMG = require('../../assets/29c8c384-1bd0-11f1-ad58-a2ad5845d919.png');
const PHOTO5_URBAN = require('../../assets/photo5-urban-sunset.png');
const PHOTO2_MOUNTAIN = require('../../assets/photo2-mountain-sunset.png');
const PHOTO1_CITY = require('../../assets/photo1-city-street.png');
const PHOTO3_FIELD = require('../../assets/photo3-field-sunset.png');
const PHOTO7_OCEAN = require('../../assets/photo7-ocean-sunset.png');
const PHOTO8_ALLEY = require('../../assets/photo8-dark-alley.png');
const PHOTO9_CLOUDS = require('../../assets/photo9-mountain-clouds.png');

const API_BASE_URL = 'https://photoai.betaplanets.com';
const fullUrl = (url?: string | null) =>
  url ? (url.startsWith('http') ? url : `${API_BASE_URL}${url}`) : '';

const isJoinableChallenge = (challenge: any) => {
  if (!challenge) return false;
  if (!(challenge.is_active || challenge.status === 'active')) return false;
  if (!challenge.end_date) return true;
  return new Date(challenge.end_date).getTime() >= Date.now();
};

const isProOnlyChallenge = (challenge: any) => {
  if (!challenge) return false;
  const value = challenge.is_pro_only ?? challenge.pro_only ?? challenge.requires_pro;
  if (value === true || value === 1) return true;
  const normalized = String(value ?? '').trim().toLowerCase();
  return ['1', 'true', 'yes', 'y', 'pro', 'pro_only', 'pro-only'].includes(normalized);
};

const PAGE_MAX_WIDTH = 1120;
const FONT_LEXEND = 'Lexend';
const FONT_INTER = 'Inter';
const type = {
  heading: { fontFamily: FONT_LEXEND, fontStyle: 'normal' as const, fontWeight: '800' as const },
  title: { fontFamily: FONT_LEXEND, fontStyle: 'normal' as const, fontWeight: '700' as const },
  label: { fontFamily: FONT_LEXEND, fontStyle: 'normal' as const, fontWeight: '700' as const },
  button: { fontFamily: FONT_LEXEND, fontStyle: 'normal' as const, fontWeight: '800' as const },
  subtext: { fontFamily: FONT_INTER, fontStyle: 'normal' as const, fontWeight: '500' as const },
};
const ORANGE_GRADIENT = 'linear-gradient(90deg, #F55B09 0%, #FFD000 100%)';
const ORANGE_GRADIENT_135 = 'linear-gradient(135deg, #F55B09 0%, #FFD000 100%)';
const orangeGradientText = {
  backgroundImage: ORANGE_GRADIENT,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
} as any;

const ionIcon = (name: string, color: string) => {
  const stroke = `stroke="${color}" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"`;
  const svg = (() => {
    switch (name) {
      case 'trophy':
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path ${stroke} fill="none" d="M176 464h160M256 336v128M384 128h48a32 32 0 0132 32v16c0 79.53-64.47 144-144 144M128 128H80a32 32 0 00-32 32v16c0 79.53 64.47 144 144 144"/><path ${stroke} fill="none" d="M128 48h256v144c0 70.69-57.31 128-128 128S128 262.69 128 192V48z"/></svg>`;
      case 'camera':
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path ${stroke} fill="none" d="M350.54 148.68l-26.62-42.06C318.31 100.08 310.62 96 302.42 96h-92.84c-8.2 0-15.89 4.08-21.5 10.62l-26.62 42.06C155.85 155.23 148.16 160 140 160H80a32 32 0 00-32 32v192a32 32 0 0032 32h352a32 32 0 0032-32V192a32 32 0 00-32-32h-60c-8.16 0-15.85-4.77-21.46-11.32z"/><circle ${stroke} fill="none" cx="256" cy="288" r="80"/></svg>`;
      case 'analytics':
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path ${stroke} fill="none" d="M48 408h416M112 352V176M208 352V96M304 352V224M400 352V144"/></svg>`;
      case 'instagram':
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect ${stroke} x="80" y="80" width="352" height="352" rx="96" ry="96" fill="none"/><circle ${stroke} cx="256" cy="256" r="80" fill="none"/><circle cx="348" cy="164" r="20" fill="${color}"/></svg>`;
      case 'facebook':
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="${color}" d="M480 257.35C480 133.46 379.76 33.22 255.87 33.22S32 133.46 32 257.35c0 111.95 81.95 204.78 189 221.65V322.12h-57V257.35h57V208c0-56.21 33.45-87.28 84.61-87.28 24.5 0 50.15 4.37 50.15 4.37v55.13h-28.26c-27.84 0-36.5 17.28-36.5 35v42.12h62.12l-9.92 64.77H291V479c107.05-16.87 189-109.7 189-221.65z"/></svg>`;
      case 'shop':
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path ${stroke} d="M160 96c0-35.3 28.7-64 64-64h64c35.3 0 64 28.7 64 64v16h32c17.7 0 32 14.3 32 32v48H128v-48c0-17.7 14.3-32 32-32h32V96zm-16 112h224v256H144V208zm32 32v192h160V240H176z" fill="none"/></svg>`;
      case 'partners':
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path ${stroke} d="M256 112c-48.6 0-88 39.4-88 88s39.4 88 88 88 88-39.4 88-88-39.4-88-88-88zm-48 88c0-26.5 21.5-48 48-48s48 21.5 48 48-21.5 48-48 48-48-21.5-48-48zm144 144h-48c-17.7 0-32 14.3-32 32v64h112v-64c0-17.7-14.3-32-32-32zm-192 0h-48c-17.7 0-32 14.3-32 32v64h112v-64c0-17.7-14.3-32-32-32z" fill="none"/></svg>`;
      case 'how-it-works':
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path ${stroke} d="M256 64C150 64 64 150 64 256s86 192 192 192 192-86 192-192S362 64 256 64zm0 352c-88.4 0-160-71.6-160-160S167.6 96 256 96s160 71.6 160 160-71.6 160-160 160zm-16-208h32v96h-32v-96zm0-48h32v32h-32v-32z" fill="none"/></svg>`;
      default:
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><circle cx="256" cy="256" r="160" fill="${color}"/></svg>`;
    }
  })();
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};

const IconGlyph = ({ name, color, size = 30 }: { name: string; color: string; size?: number }) => (
  <View
    style={{
      width: size,
      height: size,
      backgroundImage: ionIcon(name, color),
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: `${size}px ${size}px`,
    } as any}
  />
);

const StarField = React.memo(() => {
  const stars = useMemo(() => {
    const s = [];
    for (let i = 0; i < 80; i++) {
      s.push({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
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
            top: star.top as any,
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

const numberOrNull = (value: any) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const sameChallengeId = (submission: any, challenge: any) =>
  challenge?.id != null && String(submission?.challenge_id ?? submission?.challengeId ?? '') === String(challenge.id);

const submissionsForChallenge = (challenge: any, submissions: any[] = []) =>
  challenge?.id == null ? [] : submissions.filter((submission) => sameChallengeId(submission, challenge));

const displayTag = (normalized: string, fallback?: string | null) => {
  const value = (normalized && normalized !== '-') ? normalized : fallback;
  return String(value || '').trim() || 'Not set';
};

const getChallengeStats = (challenge: any, submissions: any[] = [], fallbackDays?: any) => {
  const matchingSubmissions = submissionsForChallenge(challenge, submissions);
  const backendSubmissions = numberOrNull(challenge?.submission_count) ?? 0;
  const submissionCount = Math.max(backendSubmissions, matchingSubmissions.length);
  const localComments = matchingSubmissions.reduce((sum: number, submission: any) => {
    const comments = numberOrNull(submission?.comment_count ?? submission?.comments_count);
    return sum + (comments ?? 0);
  }, 0);
  const commentCount = Math.max(numberOrNull(challenge?.comment_count) ?? 0, localComments);
  const uniqueSubmitters = new Set(
    matchingSubmissions
      .map((submission: any) => submission?.user_id ?? submission?.user_email ?? submission?.user_name)
      .filter(Boolean)
      .map(String)
  ).size;
  const participantCount = Math.max(
    numberOrNull(challenge?.participant_count) ?? 0,
    uniqueSubmitters,
    submissionCount
  );

  const userDays = numberOrNull(challenge?.user_challenge?.days_remaining);
  let days = userDays;
  if (days == null && challenge?.end_date) {
    const end = new Date(challenge.end_date).getTime();
    if (Number.isFinite(end)) {
      days = Math.ceil((end - Date.now()) / 86400000);
    }
  }
  if (days == null) days = numberOrNull(challenge?.duration_days ?? fallbackDays);

  return {
    submissionCount,
    commentCount,
    participantCount,
    daysLeft: days == null ? '-' : Math.max(0, days),
  };
};

/* ========== LOGGED-IN HOME ========== */
const CITY_BG = require('../../assets/city-bg.png');

// Calculate consecutive day streak from submissions
const calcStreak = (submissions: any[], userId: number): number => {
  const mine = submissions.filter((s: any) => s.user_id === userId);
  if (mine.length === 0) return 0;
  const dates = new Set(
    mine.map((s: any) => new Date(s.created_at).toISOString().split('T')[0])
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cursor = new Date(today);
  // If nothing submitted today, start checking from yesterday
  if (!dates.has(today.toISOString().split('T')[0])) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (dates.has(cursor.toISOString().split('T')[0])) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

const FOOTER_NAV_MAP: Record<string, string | { screen: string; params?: any }> = {
  'About Us': 'About', 'FAQ': 'FAQ', 'Shop': 'Shop', 'Contact': 'Contact',
  'Partners': 'Partners',
  'Privacy Policy': { screen: 'Legal', params: { section: 'privacy' } },
  'Terms of Service': { screen: 'Legal', params: { section: 'terms' } },
  'Community Guidelines': { screen: 'Legal', params: { section: 'guidelines' } },
  'How It Works': 'HowItWorks',
  'Gallery': 'Gallery', 'Sign Up': 'Register', 'Log In': 'Login',
};
let _footerNavFn: ((route: string, params?: any) => void) | null = null;
const setFooterNav = (fn: (route: string, params?: any) => void) => { _footerNavFn = fn; };
const goFooterLink = (label: string) => {
  const route = FOOTER_NAV_MAP[label];
  if (route && _footerNavFn) {
    if (typeof route === 'string') _footerNavFn(route);
    else _footerNavFn(route.screen, route.params);
  }
};
const goPlaceholderLink = () => {};


const FooterLink = ({ label }: { label: string }) => (
  <Pressable
    accessibilityRole="link"
    onPress={() => goFooterLink(label)}
    style={({ hovered }: any) => [
      bottom.footerLinkTouch,
      hovered && bottom.footerLinkTouchHovered,
    ]}
  >
    {({ hovered }: any) => (
      <Text style={[bottom.footerLink, hovered && bottom.footerLinkHovered]}>
        {label}
      </Text>
    )}
  </Pressable>
);

const FooterSocialLink = ({ name, label }: { name: string; label: string }) => (
  <Pressable
    accessibilityRole="link"
    accessibilityLabel={label}
    onPress={goPlaceholderLink}
    style={({ hovered }: any) => [
      bottom.socialLink,
      hovered && bottom.socialLinkHovered,
    ]}
  >
    {({ hovered }: any) => (
      <IconGlyph name={name} color={hovered ? '#FFFFFF' : C.TEXT_SECONDARY} size={20} />
    )}
  </Pressable>
);

const HomeBottomSections = ({ isMobile, showHow = true, onHowItWorksLayout, onHowItWorksPress }: { isMobile: boolean; showHow?: boolean; onHowItWorksLayout?: (e: any) => void; onHowItWorksPress?: () => void }) => {
  const howItems = [
    {
      icon: 'trophy',
      title: 'Join Challenges',
      desc: 'Browse weekly photography challenges across various themes and skill levels. Pick the ones that inspire you most.',
    },
    {
      icon: 'camera',
      title: 'Submit Photos',
      desc: 'Upload your best shots directly to the challenge. Share your creative vision with a community of passionate photographers.',
    },
    {
      icon: 'analytics',
      title: 'Engage & Grow',
      desc: 'Get feedback, discover new techniques, and connect with fellow photographers. Watch your skills improve with every challenge.',
    },
  ];

  return (
    <View style={bottom.wrap}>
      {showHow && (
        <View
          style={[bottom.howItWorks, isMobile && bottom.howItWorksMobile]}
          onLayout={onHowItWorksLayout}
        >
          <TouchableOpacity style={bottom.headingRow} onPress={onHowItWorksPress} activeOpacity={0.85}>
            <View style={bottom.headingLine} />
            <Text style={bottom.heading}>How It Works</Text>
            <View style={bottom.headingLine} />
          </TouchableOpacity>

          <View style={[bottom.howGrid, isMobile && bottom.howGridMobile]}>
            {howItems.map((item) => (
              <TouchableOpacity key={item.title} style={[bottom.howItem, isMobile && bottom.howItemMobile]} onPress={onHowItWorksPress} activeOpacity={0.85}>
                <View style={bottom.iconCircle}>
                  <IconGlyph name={item.icon} color="#FFFFFF" size={30} />
                </View>
                <Text style={bottom.howTitle}>{item.title}</Text>
                <Text style={bottom.howDesc}>{item.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={[bottom.footer, isMobile && bottom.footerMobile]}>
        <View style={[bottom.footerGrid, isMobile && bottom.footerGridMobile]}>
          <View style={[bottom.footerBrand, isMobile && bottom.footerBrandMobile]}>
            <Text style={bottom.footerBrandTitle}>Photo Healthy</Text>
            <Text style={bottom.footerBrandCopy}>
              Empowering and encouraging you to grow, connect, share in your wellness community.
            </Text>
          </View>

          <View style={[bottom.footerCol, isMobile && bottom.footerColMobile]}>
            <Text style={bottom.footerColTitle}>Company</Text>
            {['About Us', 'FAQ', 'Shop', 'Contact', 'Partners'].map((item) => (
              <FooterLink key={item} label={item} />
            ))}
          </View>

          <View style={[bottom.footerCol, isMobile && bottom.footerColMobile]}>
            <Text style={bottom.footerColTitle}>Legal</Text>
            {['Privacy Policy', 'Terms of Service', 'Community Guidelines'].map((item) => (
              <FooterLink key={item} label={item} />
            ))}
          </View>

          <View style={[bottom.footerCol, isMobile && bottom.footerColMobile]}>
            <Text style={bottom.footerColTitle}>Connect</Text>
            <View style={bottom.socialRow}>
              <FooterSocialLink name="instagram" label="Instagram" />
              <FooterSocialLink name="facebook" label="Facebook" />
            </View>
          </View>
        </View>

        <View style={bottom.footerRule} />
        <Text style={bottom.copyright}>© 2026 Photo Healthy. All rights reserved.</Text>
      </View>
    </View>
  );
};

const LoggedInHome = ({ user, featured, challenges, submissions, userStats, daysLeft, navigation, recent, streak, motivationalQuote, quoteAuthor }: any) => {
  const firstName = (user.name || 'User').split(' ')[0];
  const today = formatDate(new Date());
  const [notifications, setNotifications] = useState<any[]>([]);
  useEffect(() => {
    api.getMyNotifications?.()
      .then((data: any) => setNotifications(data?.notifications || []))
      .catch(() => setNotifications([]));
  }, []);
  const latestNotification = notifications[0];
  const orderNotifications = notifications
    .filter((n: any) => ['order_paid', 'order_processed', 'order_shipped', 'tracking_updated'].includes(n.type))
    .slice(0, 3);
  const fallbackMilesTracked = submissions
    .filter((s: any) => !s.user_id || s.user_id === user?.id)
    .reduce((sum: number, s: any) => sum + (parseFloat(s.miles ?? s.distance ?? s.miles_tracked ?? 0) || 0), 0);
  const photosSubmitted = userStats?.submissions ?? userStats?.submission_count ?? submissions.filter((s: any) => s.user_id === user?.id).length;
  const displayStreak = userStats?.streak ?? streak;
  const milesTracked = Number(userStats?.totalMiles ?? userStats?.total_miles ?? fallbackMilesTracked) || 0;
  const activeStats = getChallengeStats(featured, submissions, daysLeft);
  const challengeCategory = displayTag(normalizeChallengeCategory(featured?.category), featured?.category);
  const challengeFeeling = displayTag(normalizeFeelingCategory(featured?.feeling_category || featured?.feeling_tag), featured?.feeling_category || featured?.feeling_tag);
  const challengeMovement = displayTag(normalizeMovementCategory(featured?.movement_category || featured?.movement_tag), featured?.movement_category || featured?.movement_tag);

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
          <Text style={li.noAlertsText}>
            {latestNotification ? latestNotification.title : 'No Alerts'}
          </Text>
        </View>
      </View>
    </ImageBackground>

    {/* Active Challenge Card */}
    {featured && (
      <View style={li.section}>
        <View style={li.challengeCard}>
          <Image source={featured.cover_image_url ? { uri: fullUrl(featured.cover_image_url) } : PHOTO5_URBAN} style={li.challengeCover} resizeMode="cover" />
          <View style={li.challengeInfo}>
            <View style={li.challengeTitleRow}>
              <Text style={li.challengeTitle}>{featured.title}</Text>
              <View style={li.activeBadge}>
                <Text style={li.activeBadgeText}>Active Challenge</Text>
              </View>
              {isProOnlyChallenge(featured) && (
                <View style={li.proOnlyBadge}>
                  <Text style={li.proOnlyText}>Pro Only</Text>
                </View>
              )}
            </View>
            <Text style={li.challengeDesc} numberOfLines={2}>
              {featured.description || 'Capture the breathtaking beauty of golden hour. Show us how the warm, soft light transforms ordinary scenes.'}
            </Text>
            <Text style={li.challengeCategoryLabel}>Challenge Category</Text>
            <Text style={li.challengeCategoryValue}>{challengeCategory}</Text>

            {/* 2x2 Stats Mini-Grid */}
            <View style={li.miniGrid}>
              <View style={li.miniRow}>
                <View style={li.miniCard}>
                  <Text style={li.miniLabel}>Feeling</Text>
                  <Text style={li.miniTagValue} numberOfLines={2}>{challengeFeeling}</Text>
                </View>
                <View style={li.miniCard}>
                  <Text style={li.miniLabel}>Movement</Text>
                  <Text style={li.miniTagValue} numberOfLines={2}>{challengeMovement}</Text>
                </View>
              </View>
              <View style={li.miniRow}>
                <View style={li.miniCard}>
                  <Text style={li.miniLabel}>Days Left</Text>
                  <Text style={li.miniValue}>{activeStats.daysLeft}</Text>
                </View>
                <View style={li.miniCard}>
                  <Text style={li.miniLabel}>Participants</Text>
                  <Text style={li.miniValue}>{activeStats.participantCount}</Text>
                </View>
              </View>
            </View>

            <View style={li.challengeActions}>
              <TouchableOpacity
                style={li.submitBtn}
                onPress={() => featured?.id
                  ? navigation.navigate('SubmitPhoto', { challengeId: featured.id, id: featured.id })
                  : navigation.navigate('ChallengesTab')}
              >
                <Text style={li.submitBtnText}>Submit Photos</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={li.browseBtn}
                onPress={() => navigation.navigate('ChallengesTab')}
              >
                <Text style={li.browseBtnText}>Browse Challenges</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    )}

    {/* Motivation Quote Banner */}
    <View style={li.quoteBanner}>
      <Text style={li.quoteText}>
        {motivationalQuote}
      </Text>
      {quoteAuthor ? <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 8, fontStyle: 'normal' }}>— {quoteAuthor}</Text> : null}
    </View>

    {/* Stats Row (3 cards) */}
    <View style={li.section}>
      <View style={li.statsRow}>
        <View style={li.statCard}>
          <Text style={[li.statIcon, {fontSize:20, color:'#fff'}]}>{"Photos"}</Text>
          <Text style={li.statNum}>{photosSubmitted}</Text>
          <Text style={li.statLabel}>Photos Submitted</Text>
        </View>
        <View style={li.statCard}>
          <Text style={[li.statIcon, {fontSize:20, color:'#fff'}]}>{"Streak"}</Text>
          <Text style={[li.statNum, { color: displayStreak > 0 ? C.ORANGE : C.TEXT }]}>{displayStreak}</Text>
          <Text style={li.statLabel}>Day Streak</Text>
          <Text style={li.statNote}>{daysLeft} days remaining</Text>
        </View>
        <View style={li.statCard}>
          <Text style={[li.statIcon, {fontSize:20, color:'#fff'}]}>{"Miles"}</Text>
          <Text style={li.statNum}>{milesTracked.toFixed(1)}</Text>
          <Text style={li.statLabel}>Miles Tracked</Text>
        </View>
      </View>
    </View>

    {orderNotifications.length > 0 && (
      <View style={li.section}>
        <View style={li.orderUpdatesCard}>
          <View style={li.orderUpdatesHeader}>
            <Text style={li.sectionTitle}>Order Updates</Text>
            <TouchableOpacity onPress={() => navigation.navigate('OrderHistory')}>
              <Text style={li.orderUpdatesLink}>My Orders</Text>
            </TouchableOpacity>
          </View>
          {orderNotifications.map((note: any) => (
            <TouchableOpacity
              key={note.id}
              style={li.orderUpdateItem}
              onPress={() => navigation.navigate('OrderHistory')}
              activeOpacity={0.82}
            >
              <View style={li.orderUpdateDot} />
              <View style={{ flex: 1 }}>
                <Text style={li.orderUpdateTitle}>{note.title}</Text>
                {!!note.message && <Text style={li.orderUpdateMessage}>{note.message}</Text>}
              </View>
              <Text style={li.orderUpdateDate}>
                {note.created_at ? new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    )}

    {/* Recent Community Submissions (full-width cards) */}
    <View style={li.section}>
      <Text style={li.sectionTitle}>Recent Community Submissions</Text>
      <View style={li.communityGrid}>
        {(recent.length > 0 ? recent : [
          { id: 1, user_name: 'sarah_lens', title: 'Golden hour reflections', photo1_url: null, _localPhoto: PHOTO2_MOUNTAIN, like_count: 234, comment_count: 18 },
          { id: 2, user_name: 'mike_photo', title: 'City lights at dusk', photo1_url: null, _localPhoto: PHOTO8_ALLEY, like_count: 189, comment_count: 24 },
        ]).slice(0, 4).map((sub: any) => (
          <TouchableOpacity
            key={sub.id}
            style={li.communityCard}
            onPress={() => sub.id && navigation.navigate('SubmissionDetail', { submissionId: sub.id, id: sub.id })}
          >
            <Image source={sub._localPhoto || { uri: fullUrl(sub.photo1_url) }} style={li.communityImg} resizeMode="contain" />
            <View style={li.communityInfo}>
              <Text style={li.communityUser}>@{sub.user_name || 'unknown'}</Text>
              <Text style={li.communityTitle}>{sub.title || 'Untitled'}</Text>
              <View style={li.communityStats}>
                <Text style={li.communityStat}>?? {sub.like_count || 0}</Text>
                <Text style={li.communityStat}>?? {sub.comment_count || 0}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>

    {/* Quick Actions Grid (3 buttons) */}
    <View style={li.section}>
      <Text style={li.sectionTitle}>Quick Actions</Text>
      <View style={li.quickGrid}>
        {[
          { icon: 'trophy', title: 'Browse Challenges', desc: 'Discover new photography challenges', nav: 'ChallengesTab' },
          { icon: 'camera', title: 'View Gallery', desc: 'See all your submitted photos', nav: 'Gallery' },
          { icon: 'analytics', title: 'Subscription', desc: 'Unlock photo experiences', nav: 'Subscription' },
          { icon: 'shop', title: 'Visit Shop', desc: 'Browse photography gear', nav: 'Shop' },
        ].map((item, i) => (
          <TouchableOpacity
            key={i}
            style={li.quickCard}
            onPress={() => navigation.navigate(item.nav)}
          >
            <View style={li.quickIcon}><IconGlyph name={item.icon} color="#FFFFFF" size={18} /></View>
            <Text style={li.quickTitle}>{item.title}</Text>
            <Text style={li.quickDesc}>{item.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>

    <HomeBottomSections isMobile={false} />
  </>
  );
};

const MobileLoggedInHome = ({ user, featured, challenges, submissions, userStats, daysLeft, navigation, recent, streak, motivationalQuote }: any) => {
  const firstName = (user?.name || 'User').split(' ')[0];
  const [notifications, setNotifications] = useState<any[]>([]);
  useEffect(() => {
    api.getMyNotifications?.()
      .then((data: any) => setNotifications(data?.notifications || []))
      .catch(() => setNotifications([]));
  }, []);
  const latestNotification = notifications[0];
  const orderNotifications = notifications
    .filter((n: any) => ['order_paid', 'order_processed', 'order_shipped', 'tracking_updated'].includes(n.type))
    .slice(0, 2);
  const fallbackMilesTracked = submissions
    .filter((s: any) => !s.user_id || s.user_id === user?.id)
    .reduce((sum: number, s: any) => sum + (parseFloat(s.miles ?? s.distance ?? s.miles_tracked ?? 0) || 0), 0);
  const photosSubmitted = userStats?.submissions ?? userStats?.submission_count ?? submissions.filter((s: any) => s.user_id === user?.id).length;
  const displayStreak = userStats?.streak ?? streak;
  const milesTracked = Number(userStats?.totalMiles ?? userStats?.total_miles ?? fallbackMilesTracked) || 0;
  const challenge = featured || {
    title: 'Golden Hour Magic',
    description: 'Capture the breathtaking beauty of golden hour. Show us how the warm, soft light transforms ordinary scenes.',
    cover_image_url: null,
    _localCover: PHOTO3_FIELD,
    submission_count: 144,
  };
  const challengeImage = challenge.cover_image_url ? { uri: fullUrl(challenge.cover_image_url) } : (challenge._localCover || PHOTO3_FIELD);
  const challengeCategory = displayTag(normalizeChallengeCategory(challenge.category), challenge.category);
  const challengeFeeling = displayTag(normalizeFeelingCategory(challenge.feeling_category || challenge.feeling_tag), challenge.feeling_category || challenge.feeling_tag);
  const challengeMovement = displayTag(normalizeMovementCategory(challenge.movement_category || challenge.movement_tag), challenge.movement_category || challenge.movement_tag);
  const challengeStats = getChallengeStats(challenge, submissions, daysLeft);
  const cards = recent.length > 0 ? recent : [
    { id: 1, user_name: 'hannah_jane', title: 'Golden hour reflections', photo1_url: null, _localPhoto: PHOTO7_OCEAN, like_count: 234, comment_count: 18 },
    { id: 2, user_name: 'mike_photo', title: 'City lights at dusk', photo1_url: null, _localPhoto: PHOTO1_CITY, like_count: 189, comment_count: 24 },
  ];

  return (
    <View style={pm.wrap}>
      <ImageBackground
        source={CITY_BG}
        style={pm.welcome}
        imageStyle={pm.welcomeImage}
      >
        <View style={pm.welcomeOverlay}>
          <View>
            <Text style={pm.welcomeTitle}>Welcome back, {firstName}!</Text>
            <Text style={pm.welcomeDate}>{formatDate(new Date())}</Text>
          </View>
          <View style={pm.alertPill}>
            <Text style={pm.alertText}>{latestNotification ? latestNotification.title : 'No Alerts'}</Text>
          </View>
        </View>
      </ImageBackground>

      <View style={pm.challengeCard}>
        <Image
          source={challengeImage}
          style={pm.challengeImg}
          resizeMode="cover"
        />
        <View style={pm.challengeBody}>
          <View style={pm.challengeHead}>
            <Text style={pm.challengeTitle}>{challenge.title}</Text>
            <View style={pm.activePill}><Text style={pm.activeText}>Active Challenge</Text></View>
            {isProOnlyChallenge(challenge) && (
              <View style={pm.proOnlyPill}><Text style={pm.proOnlyText}>Pro Only</Text></View>
            )}
          </View>
          <Text style={pm.challengeDesc} numberOfLines={3}>{challenge.description}</Text>
          <Text style={pm.kicker}>Challenge Category</Text>
          <View style={pm.metaGrid}>
            <View style={pm.metaBox}>
              <Text style={pm.metaLabel}>Category</Text>
              <Text style={pm.metaValue}>{challengeCategory}</Text>
            </View>
            <View style={pm.metaBox}>
              <Text style={pm.metaLabel}>Feeling</Text>
              <Text style={pm.metaValue}>{challengeFeeling}</Text>
            </View>
            <View style={pm.metaBox}>
              <Text style={pm.metaLabel}>Movement</Text>
              <Text style={pm.metaValue}>{challengeMovement}</Text>
            </View>
            <View style={pm.metaBox}>
              <Text style={pm.metaLabel}>Days Left</Text>
              <Text style={pm.metaValue}>{challengeStats.daysLeft}</Text>
            </View>
            <View style={pm.metaBox}>
              <Text style={pm.metaLabel}>Participants</Text>
              <Text style={pm.metaValue}>{challengeStats.participantCount}</Text>
            </View>
          </View>
          <View style={pm.challengeActions}>
            <TouchableOpacity
              style={pm.submitBtn}
              onPress={() => challenge?.id
                ? navigation.navigate('SubmitPhoto', { challengeId: challenge.id, id: challenge.id })
                : navigation.navigate('ChallengesTab')}
            >
              <Text style={pm.submitText}>Submit Photos</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ImageBackground source={PHOTO9_CLOUDS} style={pm.quote} imageStyle={pm.quoteImage}>
        <Text style={pm.quoteText}>{motivationalQuote}</Text>
      </ImageBackground>

      <View style={pm.statRow}>
        {[
          { icon: '?', value: String(photosSubmitted), label: 'Photos Submitted' },
          { icon: '?', value: String(displayStreak), label: `Day Streak - ${daysLeft} days remaining` },
          { icon: '?', value: milesTracked.toFixed(1), label: 'Miles Tracked' },
        ].map((item) => (
          <View key={item.label} style={pm.statCard}>
            <View style={pm.statIcon}><Text style={pm.statIconText}>{item.icon}</Text></View>
            <Text style={pm.statValue}>{item.value}</Text>
            <Text style={pm.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {orderNotifications.length > 0 && (
        <>
          <Text style={pm.sectionTitle}>Order Updates</Text>
          <View style={pm.orderUpdatesCard}>
            {orderNotifications.map((note: any) => (
              <TouchableOpacity
                key={note.id}
                style={pm.orderUpdateItem}
                onPress={() => navigation.navigate('OrderHistory')}
                activeOpacity={0.82}
              >
                <View style={pm.orderUpdateDot} />
                <View style={{ flex: 1 }}>
                  <Text style={pm.orderUpdateTitle}>{note.title}</Text>
                  {!!note.message && <Text style={pm.orderUpdateMessage}>{note.message}</Text>}
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={pm.orderUpdatesLinkBtn} onPress={() => navigation.navigate('OrderHistory')}>
              <Text style={pm.orderUpdatesLinkText}>View My Orders</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <Text style={pm.sectionTitle}>Recent Community Submissions</Text>
      {cards.slice(0, 2).map((sub: any) => (
        <TouchableOpacity
          key={sub.id}
          style={pm.submission}
          onPress={() => sub.id && navigation.navigate('SubmissionDetail', { submissionId: sub.id, id: sub.id })}
        >
          <Image source={sub._localPhoto || { uri: fullUrl(sub.photo1_url) }} style={pm.submissionImg} resizeMode="contain" />
          <View style={pm.submissionBody}>
            <Text style={pm.userName}>@{sub.user_name}</Text>
            <Text style={pm.subTitle}>{sub.title}</Text>
            <View style={pm.subStats}>
              <Text style={pm.subStat}>? {sub.like_count || 0}</Text>
              <Text style={pm.subStat}>?? {sub.comment_count || 0}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}

      <Text style={pm.sectionTitle}>Quick Actions</Text>
      <View style={pm.quickGrid}>
        {[
          { icon: 'trophy', title: 'Browse Challenges', desc: 'Discover new photography challenges', nav: 'ChallengesTab' },
          { icon: 'camera', title: 'View Gallery', desc: 'See all your submitted photos', nav: 'Gallery' },
          { icon: 'analytics', title: 'Subscription', desc: 'Unlock photo experiences', nav: 'Subscription' },
          { icon: 'shop', title: 'Visit Shop', desc: 'Browse photography gear', nav: 'Shop' },
        ].map((item) => (
          <TouchableOpacity key={item.title} style={pm.quickCard} onPress={() => navigation.navigate(item.nav)}>
            <View style={pm.quickIcon}><IconGlyph name={item.icon} color="#FFFFFF" size={14} /></View>
            <Text style={pm.quickTitle}>{item.title}</Text>
            <Text style={pm.quickDesc}>{item.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <HomeBottomSections isMobile showHow={false} />
    </View>
  );
};

const assetUri = (source: any) => {
  if (typeof source === 'number') {
    const asset = getAssetByID(source);
    if (!asset) return '';
    return `${asset.httpServerLocation}/${asset.name}.${asset.type}`;
  }
  return typeof source === 'string' ? source : source?.uri || source?.src || source?.default || '';
};

const AssetView = ({ source, style, resizeMode = 'cover' }: { source: any; style: any; resizeMode?: 'cover' | 'contain' }) => {
  const uri = assetUri(source);

  return (
    <View
      style={[
        style,
        {
          backgroundImage: uri ? `url("${uri}")` : undefined,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: resizeMode,
        } as any,
      ]}
    />
  );
};

const SkySection = ({ children, style, alt = false, bgPosition = 'center', bgSize = 'cover' }: { children: React.ReactNode; style?: any; alt?: boolean; bgPosition?: string; bgSize?: string }) => {
  const uri = assetUri(CITY_BG);
  return (
    <View
      style={[
        landing.skySection,
        style,
        {
          backgroundImage: uri ? `url("${uri}")` : undefined,
          backgroundPosition: bgPosition,
          backgroundRepeat: 'no-repeat',
          backgroundSize: bgSize,
        } as any,
      ]}
    >
      <View style={[landing.skyTint, alt && landing.skyTintAlt]}>{children}</View>
    </View>
  );
};

const PublicLandingHome = ({ featured, submissions, recent, daysLeft, navigation, isMobile }: any) => {
  const featuredStats = getChallengeStats(featured, submissions, daysLeft);
  const featuredCategory = displayTag(normalizeChallengeCategory(featured?.category), featured?.category || 'Photo Challenge');
  const fallbackShareItems = [
    { id: 'local-1', user_name: 'Skyline', challenge_title: 'Color after dusk', _localPhoto: PHOTO2_MOUNTAIN, like_count: 93 },
    { id: 'local-2', user_name: 'Renew', challenge_title: 'Morning portrait', _localPhoto: PHOTO7_OCEAN, like_count: 129 },
    { id: 'local-3', user_name: 'Trailblazer', challenge_title: 'Small discoveries', _localPhoto: PHOTO3_FIELD, like_count: 84 },
    { id: 'local-4', user_name: 'Mindful', challenge_title: 'Community light', _localPhoto: PHOTO8_ALLEY, like_count: 111 },
  ];
  const shareItems = (recent.length > 0 ? recent : fallbackShareItems).slice(0, 4);
  const openShareItem = (item: any) => {
    if (item?.id && !String(item.id).startsWith('local-')) {
      navigation.navigate('SubmissionDetail' as never, { submissionId: item.id, id: item.id } as never);
    } else {
      navigation.navigate('Main' as never, { screen: 'CommunityTab' } as never);
    }
  };

  const benefits = [
    { title: 'You start small', body: 'Small guided photo actions create easy wellness moments.' },
    { title: 'You feel momentum', body: 'Your wellness habit grows through gentle challenges.' },
    { title: 'You belong', body: 'Your photos help shape a kind, shared community.' },
  ];

  return (
    <View style={[landing.wrap, isMobile && landing.wrapMobile]}>
      <SkySection style={[landing.heroSky, isMobile && landing.skySectionMobile]}>
        <View style={[landing.hero, isMobile && landing.heroMobile]}>
          <View style={[landing.heroCopy, isMobile && landing.heroCopyMobile]}>
          <Text style={[landing.heroTitle, isMobile && landing.heroTitleMobile]}>
            <Text style={landing.heroWelcome}>Welcome</Text>
            {' '}
            <Text style={landing.heroSomewhere}>somewhere</Text>
            {' '}that feels{' '}
            <Text style={landing.heroGoodTo}>good to</Text>
            {' '}be
          </Text>
            <Text style={landing.heroText}>
              Join a vibrant community of photographers sharing inspiring wellness moments and participating in fun photo challenges.
            </Text>
            <View style={[landing.heroActions, isMobile && landing.heroActionsMobile]}>
              <TouchableOpacity style={landing.primaryBtn} onPress={() => navigation.navigate('Register')}>
                <Text style={landing.primaryBtnText}>Get Started</Text>
              </TouchableOpacity>
              <TouchableOpacity style={landing.secondaryBtn} onPress={() => navigation.navigate('HowItWorks')}>
                <Text style={landing.secondaryBtnText}>Learn More</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[landing.heroArt, isMobile && landing.heroArtMobile]}>
            <AssetView source={LOGO_IMG} style={[landing.heroPhone, isMobile && landing.heroPhoneMobile]} resizeMode="contain" />
          </View>
        </View>
      </SkySection>

      {featured && (
        <SkySection style={isMobile && landing.skySectionMobile} bgPosition="center 99%" bgSize="130% auto" alt>
            <View style={landing.challengePanel}>
              <View style={landing.challengeHeaderRow}>
                <AssetView source={LOGO_IMG} style={landing.challengeIcon} resizeMode="contain" />
                <Text style={landing.challengeKicker}>Photo Challenge</Text>
                {isProOnlyChallenge(featured) && (
                  <View style={landing.proOnlyBadge}><Text style={landing.proOnlyText}>Pro Only</Text></View>
                )}
              </View>
              <View style={[landing.challengeBody, isMobile && landing.challengeBodyMobile]}>
                <View style={landing.challengeInfo}>
              <Text style={landing.challengeTitle}>{featured.title || 'Current Photo Challenge'}</Text>
              <View style={[landing.metaRow, isMobile && landing.metaRowMobile]}>
              <Text style={landing.metaText}>Category: {featuredCategory}</Text>
              <Text style={landing.metaText}>Submissions: {featuredStats.submissionCount}</Text>
              <Text style={landing.metaText}>Participants: {featuredStats.participantCount}</Text>
                <Text style={landing.metaText}>Ends: {featuredStats.daysLeft}d</Text>
                  </View>
                  <TouchableOpacity style={landing.submitBtn} onPress={() => navigation.navigate('Register')}>
                    <Text style={landing.submitBtnText}>Submit Your Photo</Text>
                  </TouchableOpacity>
                </View>
                <AssetView
                  source={featured.cover_image_url ? { uri: fullUrl(featured.cover_image_url) } : PHOTO1_CITY}
                  style={landing.challengeImage}
                  resizeMode="cover"
                />
              </View>
            </View>
        </SkySection>
      )}

      <SkySection style={isMobile && landing.skySectionMobile} bgPosition="center 108%" bgSize="135% auto">
        <View style={landing.shareSection}>
          <Text style={landing.sectionTitle}>Here's what people are sharing NOW</Text>
          <View style={[landing.shareGrid, isMobile && landing.shareGridMobile]}>
            {shareItems.map((item: any) => (
              <TouchableOpacity key={item.id} style={landing.shareCard} onPress={() => openShareItem(item)}>
                <AssetView
                  source={item._localPhoto || (item.photo1_url ? { uri: fullUrl(item.photo1_url) } : PHOTO2_MOUNTAIN)}
                  style={landing.shareImage}
                  resizeMode="cover"
                />
                <View style={landing.shareInfo}>
                  <View style={landing.shareUserRow}>
                    <View style={landing.shareAvatar}>
                      <Text style={landing.shareAvatarText}>{(item.user_name || 'P')[0]}</Text>
                    </View>
                    <Text style={landing.shareUser} numberOfLines={1}>{item.user_name || 'Photo Healthy'}</Text>
                  </View>
                  <Text style={landing.shareCaption} numberOfLines={1}>{item.challenge_title || item.title || 'Wellness moment'}</Text>
                  <Text style={landing.shareMeta}>{item.like_count || 0} likes</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={landing.browseBtn} onPress={() => navigation.navigate('Main' as never, { screen: 'CommunityTab' } as never)}>
            <Text style={landing.browseBtnText}>Browse All</Text>
          </TouchableOpacity>
        </View>
      </SkySection>

      <SkySection style={isMobile && landing.skySectionMobile} bgPosition="center 124%" bgSize="140% auto" alt>
        <View style={[landing.benefits, isMobile && landing.benefitsMobile]}>
          <Text style={landing.sectionTitle}>What this becomes over time</Text>
          <View style={[landing.benefitGrid, isMobile && landing.benefitGridMobile]}>
            {benefits.map((item) => (
              <View key={item.title} style={[landing.benefitItem, isMobile && landing.benefitItemMobile]}>
                <AssetView source={LOGO_IMG} style={landing.benefitIcon} resizeMode="contain" />
                <Text style={landing.benefitTitle}>{item.title}</Text>
                <Text style={landing.benefitBody}>{item.body}</Text>
              </View>
            ))}
          </View>
        </View>
      </SkySection>
      <AppFooter />
    </View>
  );
};

/* ========== MAIN HOME SCREEN ========== */
const HomeScreen = () => {
  const navigation = useNavigation<any>();

  const [motivationalQuote, setMotivationalQuote] = useState('The secret of getting ahead is getting started. — Mark Twain');
  const [quoteAuthor, setQuoteAuthor] = useState('');
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
      .catch(() => {});
  }, []);  setFooterNav((r: string, params?: any) => navigation.navigate(r as never, params as never));
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [challenges, setChallenges] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<ScrollView>(null);
  const howItWorksY = useRef(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        try {
          const [cData, sData, statsData] = await Promise.all([
            api.getChallenges(),
            api.getSubmissions(),
            user ? api.getUserStats().catch(() => null) : Promise.resolve(null),
          ]);
          if (!active) return;
          setChallenges(cData.challenges || []);
          setSubmissions(sData.submissions || []);
          setUserStats(statsData);
        } catch {} finally {
          if (active) setLoading(false);
        }
      };
      load();
      return () => {
        active = false;
      };
    }, [user?.id])
  );

  const featured = challenges.find(isJoinableChallenge) ||
    challenges.find((c) => c.is_active || c.status === 'active') ||
    challenges[0];
  const recent = [...submissions]
    .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 8);

  const daysLeft = getChallengeStats(featured, submissions).daysLeft;

  const publicHeroContent = (
    <>
      <View style={[s.heroRight, isMobile ? s.heroRightMobile : s.publicHeroRight]}>
        <Image
          source={LOGO_IMG}
          style={[
            s.heroLogo,
            isMobile ? { width: 240, height: 240 } : { width: 320, height: 320 },
          ]}
          resizeMode="center"
        />
      </View>
      <View style={[s.heroLeft, isMobile ? s.heroLeftMobile : s.publicHeroLeft]}>
        <Text style={[s.heroHeading, s.publicHeroHeading, isMobile && s.heroHeadingMobile]}>
          Welcome somewhere that feels{' '}
          <Text style={s.heroGood}>good</Text>
          {' '}to be
        </Text>
        <Text style={[s.heroSub, isMobile ? s.heroSubMobile : s.publicHeroSub]}>
          Join a vibrant community of photographers sharing inspiring wellness moments and participating in fun photo challenges.
        </Text>
        <View style={[s.heroBtns, isMobile ? s.heroBtnsMobile : s.heroBtnsCentered]}>
          <TouchableOpacity
            style={[s.getStartedBtn, isMobile && s.getStartedBtnMobile]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={[s.getStartedText, isMobile && s.getStartedTextMobile]}>Join free / Start a challenge</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.learnMoreBtn, isMobile && s.learnMoreBtnMobile]}
            onPress={() => navigation.navigate('Main' as never, { screen: 'ChallengesTab' } as never)}
          >
            <Text style={[s.learnMoreText, isMobile && s.getStartedTextMobile]}>View Challenges</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  if (loading) {
    return (
      <View style={s.loadWrap}>
        <ActivityIndicator size="large" color={C.ORANGE} />
      </View>
    );
  }

  return (
    <ScrollView ref={scrollRef} style={s.root} contentContainerStyle={{ paddingBottom: 0 }}>
      <StarField />

      
      {user && isMobile ? (
        <MobileLoggedInHome
          user={user}
          featured={featured}
          challenges={challenges}
          submissions={submissions}
          userStats={userStats}
          daysLeft={daysLeft}
          navigation={navigation}
          recent={recent}
          streak={calcStreak(submissions, user?.id || 0)}
          motivationalQuote={motivationalQuote}
          quoteAuthor={quoteAuthor}
        />
      ) : user ? (
        /* ===== LOGGED-IN CONTENT ===== */
        <LoggedInHome
          user={user}
          featured={featured}
          challenges={challenges}
          submissions={submissions}
          userStats={userStats}
          daysLeft={daysLeft}
          navigation={navigation}
          recent={recent}
          streak={calcStreak(submissions, user?.id || 0)}
          motivationalQuote={motivationalQuote}
          quoteAuthor={quoteAuthor}
        />
      ) : (
        <PublicLandingHome
          featured={featured}
          submissions={submissions}
          recent={recent}
          daysLeft={daysLeft}
          navigation={navigation}
          isMobile={isMobile}
        />
      )}
    </ScrollView>
  );
};

/* ========== PUBLIC / SHARED STYLES ========== */
const landing = StyleSheet.create({
  wrap: {
    width: '100%' as any,
    alignSelf: 'center',
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  wrapMobile: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 92,
  },
  assetImage: {
    width: '100%',
    height: '100%',
  },
  assetFill: {
    flex: 1,
  },
  skySection: {
    width: '100%' as any,
    overflow: 'hidden',
    marginBottom: 0,
    borderWidth: 0,
    backgroundColor: '#08101F',
  },
  skySectionMobile: {
    marginBottom: 0,
  },
  skyImage: {
    opacity: 0.78,
  },
  skyImageAlt: {
    opacity: 0.64,
  },
  skyTint: {
    backgroundColor: 'rgba(5, 9, 20, 0.38)',
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  skyTintAlt: {
    backgroundColor: 'rgba(5, 9, 20, 0.48)',
  },
  heroSky: {
    borderWidth: 0,
  },
  hero: {
    width: '100%' as any,
    maxWidth: PAGE_MAX_WIDTH,
    alignSelf: 'center',
    minHeight: 330,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
  },
  heroMobile: {
    minHeight: 0,
    flexDirection: 'column-reverse',
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
  },
  heroCopy: {
    flex: 1,
    maxWidth: 500,
    paddingLeft: 18,
  },
  heroCopyMobile: {
    paddingLeft: 0,
    maxWidth: '100%' as any,
    alignItems: 'center',
  },
  heroTitle: {
    ...type.heading,
    color: '#FFFFFF',
    fontSize: 54,
    lineHeight: 60,
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.38)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  heroTitleMobile: {
    fontSize: 42,
    lineHeight: 48,
    textAlign: 'center',
  },
  heroWelcome: {
    color: C.ORANGE,
  },
  heroSomewhere: {
    color: '#54DFB6',
  },
  heroGoodTo: {
    color: '#FFD000',
  },
  heroText: {
    ...type.subtext,
    color: '#E5EAF5',
    fontSize: 20,
    lineHeight: 30,
    maxWidth: 560,
    marginBottom: 24,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroActionsMobile: {
    justifyContent: 'center',
  },
  primaryBtn: {
    minWidth: 170,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 30,
    alignItems: 'center',
    backgroundColor: C.ORANGE,
    backgroundImage: ORANGE_GRADIENT,
    shadowColor: C.ORANGE,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  } as any,
  primaryBtnText: {
    ...type.button,
    color: '#FFFFFF',
    fontSize: 17,
  },
  secondaryBtn: {
    minWidth: 145,
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 26,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.38)',
    backgroundColor: 'rgba(4, 8, 18, 0.44)',
  },
  secondaryBtnText: {
    ...type.button,
    color: '#FFFFFF',
    fontSize: 17,
  },
  heroArt: {
    flex: 1,
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroArtMobile: {
    minHeight: 230,
    width: '100%' as any,
  },
  heroPhone: {
    width: 560,
    height: 410,
  },
  heroPhoneMobile: {
    width: 340,
    height: 265,
  },
  challengePanel: {
    width: '100%' as any,
    maxWidth: PAGE_MAX_WIDTH,
    alignSelf: 'center',
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderWidth: 0,
    padding: 28,
    marginTop: 0,
    marginBottom: 0,
    shadowOpacity: 0,
  } as any,
  challengeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  challengeIcon: {
    width: 42,
    height: 42,
  },
  proOnlyBadge: {
    backgroundColor: C.ORANGE,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FFD000',
  },
  proOnlyText: { ...type.button, color: '#FFFFFF', fontSize: 12 },
  challengeKicker: {
    ...type.heading,
    color: '#FFFFFF',
    fontSize: 24,
  },
  challengeBody: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'stretch',
  },
  challengeBodyMobile: {
    flexDirection: 'column-reverse',
    gap: 14,
  },
  challengeInfo: {
    flex: 1,
    minWidth: 0,
  },
  challengeTitle: {
    ...type.heading,
    color: '#FFFFFF',
    fontSize: 36,
    lineHeight: 43,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 22,
    marginBottom: 24,
  },
  metaRowMobile: {
    gap: 8,
  },
  metaText: {
    ...type.subtext,
    color: '#D5DEEF',
    fontSize: 17,
    lineHeight: 25,
  },
  submitBtn: {
    width: 360,
    maxWidth: '100%' as any,
    borderRadius: 8,
    paddingVertical: 18,
    minHeight: 58,
    alignItems: 'center',
    backgroundColor: C.ORANGE,
    backgroundImage: 'linear-gradient(90deg, #FF6A00 0%, #FFD000 54%, #29B6E0 100%)',
  } as any,
  submitBtnText: {
    ...type.button,
    color: '#FFFFFF',
    fontSize: 19,
  },
  challengeImage: {
    width: 430,
    minHeight: 230,
    borderRadius: 6,
    backgroundColor: 'rgba(5, 9, 20, 0.26)',
  },
  shareSection: {
    width: '100%' as any,
    maxWidth: PAGE_MAX_WIDTH,
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: 0,
  },
  sectionTitle: {
    ...type.heading,
    color: '#FFFFFF',
    fontSize: 32,
    lineHeight: 40,
    textAlign: 'center',
    marginBottom: 28,
  },
  shareGrid: {
    width: '100%' as any,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  shareGridMobile: {
    flexWrap: 'wrap',
    gap: 12,
  },
  shareCard: {
    width: 240,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  shareImage: {
    width: '100%' as any,
    height: 164,
    backgroundColor: '#111827',
  },
  shareInfo: {
    padding: 14,
  },
  shareUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 8,
  },
  shareAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.ORANGE,
  },
  shareAvatarText: {
    ...type.label,
    color: '#FFFFFF',
    fontSize: 13,
  },
  shareUser: {
    ...type.label,
    color: '#111827',
    fontSize: 14,
    flex: 1,
  },
  shareCaption: {
    ...type.subtext,
    color: '#334155',
    fontSize: 13,
    marginBottom: 8,
  },
  shareMeta: {
    ...type.label,
    color: '#F55B09',
    fontSize: 13,
  },
  browseBtn: {
    marginTop: 28,
    minWidth: 190,
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 32,
    alignItems: 'center',
    backgroundColor: C.ORANGE,
    backgroundImage: 'linear-gradient(90deg, #FF6A00 0%, #FFD000 54%, #29B6E0 100%)',
  } as any,
  browseBtnText: {
    ...type.button,
    color: '#FFFFFF',
    fontSize: 16,
  },
  benefits: {
    width: '100%' as any,
    maxWidth: PAGE_MAX_WIDTH,
    alignSelf: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 0,
  },
  benefitsMobile: {
    maxWidth: '100%' as any,
    paddingHorizontal: 0,
  },
  benefitGrid: {
    width: '100%' as any,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 64,
  },
  benefitGridMobile: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  benefitItem: {
    flex: 1,
    maxWidth: 320,
    alignItems: 'center',
  },
  benefitItemMobile: {
    flex: 0,
    width: '100%' as any,
    maxWidth: 360,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingVertical: 18,
    marginBottom: 18,
  },
  benefitIcon: {
    width: 160,
    height: 108,
    marginBottom: 10,
    alignSelf: 'center',
  },
  benefitTitle: {
    ...type.heading,
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 34,
    textAlign: 'center',
    marginBottom: 6,
  },
  benefitBody: {
    ...type.subtext,
    color: '#D5DEEF',
    fontSize: 18,
    lineHeight: 27,
    textAlign: 'center',
    maxWidth: 300,
  },
  copyright: {
    ...type.subtext,
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  desktopWidth: {
    width: '100%' as any,
    maxWidth: PAGE_MAX_WIDTH,
    alignSelf: 'center',
  },
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
  headerLogo: {
    width: 36,
    height: 36,
  },
  headerLogoMobile: {
    width: 52,
    height: 44,
  },
  brandText: {
    ...type.label,
    color: C.TEXT_SECONDARY,
    fontSize: 12,
    opacity: 0.6,
    textTransform: 'uppercase',
  },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellBtn: { padding: 4 },
  authButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loginHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#54DFB6',
  },
  loginHeaderText: {
    ...type.button,
    color: '#54DFB6',
    fontSize: 12,
  },
  signupHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: C.ORANGE,
    backgroundImage: ORANGE_GRADIENT,
  } as any,
  signupHeaderText: {
    ...type.button,
    color: '#FFFFFF',
    fontSize: 12,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.ORANGE,
    backgroundImage: ORANGE_GRADIENT_135,
    justifyContent: 'center',
    alignItems: 'center',
  } as any,
  avatarText: { ...type.label, color: '#fff', fontSize: 15 },

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
    alignItems: 'center',
  },
  publicHeroBg: {
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 20,
    borderRadius: 0,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingTop: 44,
    paddingBottom: 24,
    height: 450,
  },
  publicHeroBgMobile: {
    height: 630,
    paddingTop: 30,
    paddingBottom: 30,
  },
  publicHeroBgDesktop: {
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 28,
    width: '100%' as any,
    height: 520,
    paddingHorizontal: 56,
    paddingTop: 72,
    paddingBottom: 46,
    justifyContent: 'flex-start',
  },
  heroLeft: {
    flex: 1,
    paddingRight: 24,
  },
  publicHeroLeft: {
    flex: 0,
    paddingRight: 0,
    alignItems: 'center',
    zIndex: 1,
    maxWidth: 760,
  },
  heroLeftMobile: {
    paddingRight: 0,
    marginBottom: 18,
    alignItems: 'center',
    zIndex: 1,
  },
  heroHeading: {
    ...type.heading,
    color: C.TEXT,
    fontSize: 36,
    lineHeight: 44,
    marginBottom: 16,
  },
  heroHeadingMobile: {
    fontSize: 28,
    lineHeight: 36,
    textAlign: 'center',
  },
  publicHeroHeading: {
    textAlign: 'center',
  },
  heroGood: {
    ...type.heading,
    ...orangeGradientText,
    fontStyle: 'italic',
    display: 'inline-block',
    paddingRight: 8,
    paddingBottom: 2,
    overflow: 'visible',
  } as any,
  heroSub: {
    ...type.subtext,
    color: C.TEXT_SECONDARY,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 24,
  },
  heroSubMobile: {
    textAlign: 'center',
    maxWidth: 470,
    color: '#D8DEEA',
  },
  publicHeroSub: {
    textAlign: 'center',
    maxWidth: 620,
    color: '#D8DEEA',
  },
  heroBtns: {
    flexDirection: 'row',
    gap: 12,
  },
  heroBtnsMobile: {
    width: '100%',
    maxWidth: 340,
    flexDirection: 'column',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 10,
  },
  heroBtnsCentered: {
    justifyContent: 'center',
    alignSelf: 'center',
  },
  getStartedBtn: {
    backgroundImage: ORANGE_GRADIENT_135,
    backgroundColor: C.ORANGE,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 28,
  } as any,
  getStartedBtnMobile: {
    width: '100%',
    paddingVertical: 13,
    paddingHorizontal: 18,
    alignItems: 'center',
  } as any,
  getStartedText: {
    ...type.button,
    color: '#FFFFFF',
    fontSize: 15,
  },
  getStartedTextMobile: {
    fontSize: 14,
    textAlign: 'center',
  },
  learnMoreBtn: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 28,
    backgroundColor: 'transparent',
  },
  learnMoreBtnMobile: {
    width: '100%',
    backgroundColor: 'rgba(10,14,26,0.42)',
    paddingVertical: 13,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  learnMoreText: {
    ...type.button,
    color: '#FFFFFF',
    fontSize: 15,
  },
  heroRight: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 240,
  },
  heroRightMobile: {
    width: '100%' as any,
    zIndex: 1,
  },
  publicHeroRight: {
    width: '100%' as any,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    marginBottom: 14,
  },
  heroLogo: {
    zIndex: 1,
  },

  // Stats
  section: { paddingHorizontal: 20, marginBottom: 32 },
  quickActionsSection: {
    paddingTop: 48,
    paddingBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  quickActionsGridMobile: {
    flexDirection: 'column',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: 'rgba(245, 91, 9, 0.08)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 91, 9, 0.3)',
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
  },
  quickActionCardHovered: {
    backgroundColor: 'rgba(245, 91, 9, 0.15)',
    borderColor: '#F55B09',
    transform: [{ translateY: -2 }],
  },
  quickActionTitle: {
    ...type.heading,
    color: C.TEXT,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  quickActionDesc: {
    ...type.subtext,
    color: C.TEXT_SECONDARY,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
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
  statNum: { ...type.heading, color: C.TEXT, fontSize: 25 },
  statLabel: { ...type.subtext, color: '#FFFFFF', fontSize: 12, marginTop: 4 },

  // ===== CHALLENGE CARD =====
  currentChallengeSection: {
    marginTop: 34,
    marginBottom: 46,
  },
  currentChallengeHeader: {
    ...type.heading,
    color: C.TEXT,
    fontSize: 30,
    lineHeight: 38,
    textAlign: 'center',
    marginBottom: 12,
  },
  currentChallengeSubtext: {
    ...type.subtext,
    color: C.TEXT_SECONDARY,
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    maxWidth: 860,
    alignSelf: 'center',
    marginBottom: 24,
  },
  challengeCard: {
    backgroundColor: C.CARD_BG,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  challengeLeft: {
    padding: 18,
  },
  challengeLabel: {
    ...type.label,
    ...orangeGradientText,
    fontSize: 13,
    marginBottom: 8,
  },
  challengeTitle: {
    ...type.heading,
    color: C.TEXT,
    fontSize: 24,
    marginBottom: 10,
  },
  challengeDescription: {
    ...type.subtext,
    color: C.TEXT_SECONDARY,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
  },
  challengeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 26,
    marginBottom: 22,
  },
  challengeMetaLabel: {
    ...type.label,
    color: C.TEXT,
    fontSize: 15,
  },
  challengeMeta: {
    ...type.subtext,
    color: C.TEXT_SECONDARY,
    fontSize: 12,
    lineHeight: 18,
  },
  submitBtn: {
    backgroundImage: ORANGE_GRADIENT_135,
    backgroundColor: C.ORANGE,
    borderRadius: 12,
    paddingVertical: 16,
    minHeight: 50,
    alignItems: 'center',
    shadowColor: C.ORANGE,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  } as any,
  submitBtnText: {
    ...type.button,
    color: '#FFFFFF',
    fontSize: 15,
  },
  challengeImg: {
    width: '100%',
    height: 280,
    backgroundColor: '#1A1E30',
  },
  challengeImgPlaceholder: {
    backgroundColor: '#1A1E30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  publicQuoteBanner: {
    backgroundColor: C.CARD_BG2,
    marginHorizontal: 20,
    marginBottom: 52,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  } as any,
  publicQuoteText: {
    ...type.subtext,
    color: '#FFFFFF',
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
    textAlign: 'center',
  },
  publicQuoteAuthor: {
    ...type.subtext,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },

  // Section title
  sectionTitle: {
    ...type.heading,
    color: C.TEXT,
    fontSize: 20,
    marginBottom: 16,
  },

  // Submissions grid
  communitySection: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  communityTitle: {
    ...type.heading,
    color: C.TEXT,
    fontSize: 28,
    lineHeight: 36,
    textAlign: 'center',
    marginBottom: 30,
  },
  subGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
    justifyContent: 'center',
  },
  subCard: {
    width: '48%' as any,
    backgroundColor: C.CARD_BG,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  subCardDesktop: {
    width: '23%' as any,
  },
  subImg: {
    width: '100%',
    height: 210,
    backgroundColor: '#1A1E30',
  },
  subInfo: { padding: 12 },
  subUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  subAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.ORANGE,
    backgroundImage: ORANGE_GRADIENT_135,
    justifyContent: 'center',
    alignItems: 'center',
  } as any,
  subAvatarText: { ...type.label, color: '#fff', fontSize: 11 },
  subUserName: {
    ...type.label,
    color: C.TEXT,
    fontSize: 12,
    flex: 1,
  },
  subCategory: {
    ...type.subtext,
    color: C.ORANGE,
    fontSize: 12,
    marginBottom: 8,
  },
  subStats: { flexDirection: 'row', gap: 12 },
  subStat: { ...type.subtext, color: '#FF5A5F', fontSize: 12 },
  communitySignUpBtn: {
    backgroundImage: ORANGE_GRADIENT_135,
    backgroundColor: C.ORANGE,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignSelf: 'center',
    marginTop: 34,
    shadowColor: C.ORANGE,
    shadowOpacity: 0.32,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  } as any,
  communitySignUpText: {
    ...type.button,
    color: '#FFFFFF',
    fontSize: 13,
  },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { ...type.subtext, color: C.TEXT_SECONDARY, fontSize: 16, marginTop: 12 },

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
    ...type.heading,
    color: C.TEXT,
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  hiwDesc: {
    ...type.subtext,
    color: C.TEXT_SECONDARY,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});

const bottom = StyleSheet.create({
  wrap: {
    marginTop: 20,
    width: '100%' as any,
  },
  howItWorks: {
    backgroundColor: C.NAV_BG,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.CARD_BORDER,
    paddingHorizontal: 36,
    paddingTop: 42,
    paddingBottom: 38,
  },
  howItWorksMobile: {
    paddingHorizontal: 22,
    paddingTop: 34,
    paddingBottom: 34,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
    gap: 16,
  },
  headingLine: {
    flex: 1,
    maxWidth: 260,
    height: 1,
    borderTopWidth: 1,
    borderColor: 'rgba(148,163,184,0.28)',
    borderStyle: 'dashed',
  },
  heading: {
    ...type.heading,
    color: C.TEXT,
    fontSize: 26,
    lineHeight: 32,
    textAlign: 'center',
  },
  howGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 36,
    maxWidth: PAGE_MAX_WIDTH,
    alignSelf: 'center',
    width: '100%',
  },
  howGridMobile: {
    flexDirection: 'column',
    gap: 28,
  },
  howItem: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
  },
  howItemMobile: {
    width: '100%' as any,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: C.ORANGE,
    backgroundImage: ORANGE_GRADIENT_135,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: C.ORANGE,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.26,
    shadowRadius: 18,
  } as any,
  howTitle: {
    ...type.heading,
    color: C.TEXT,
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 10,
  },
  howDesc: {
    ...type.subtext,
    color: C.TEXT_SECONDARY,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 260,
  },
  footer: {
    backgroundColor: C.NAV_BG,
    paddingHorizontal: 36,
    paddingTop: 42,
    paddingBottom: 28,
  },
  footerMobile: {
    paddingHorizontal: 22,
    paddingTop: 34,
    paddingBottom: 26,
  },
  footerGrid: {
    flexDirection: 'row',
    gap: 42,
    maxWidth: PAGE_MAX_WIDTH,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'flex-start',
  },
  footerGridMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 24,
  },
  footerBrand: {
    flex: 1.45,
    maxWidth: 270,
  },
  footerBrandMobile: {
    flex: 0,
    maxWidth: '100%' as any,
    width: '100%' as any,
    minHeight: 92,
  },
  footerBrandTitle: {
    ...type.heading,
    color: C.TEXT,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 14,
  },
  footerBrandCopy: {
    ...type.subtext,
    color: C.TEXT_SECONDARY,
    fontSize: 12,
    lineHeight: 20,
  },
  footerCol: {
    flex: 1,
    minWidth: 110,
  },
  footerColMobile: {
    flex: 0,
    width: '100%' as any,
    minWidth: 0,
    minHeight: 150,
  },
  footerColTitle: {
    ...type.heading,
    color: C.TEXT,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  footerLink: {
    ...type.subtext,
    color: C.TEXT_SECONDARY,
    fontSize: 11,
    lineHeight: 18,
  },
  footerLinkTouch: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    marginBottom: 3,
    cursor: 'pointer',
  } as any,
  footerLinkTouchHovered: {
    transform: [{ translateX: 2 }],
  },
  footerLinkHovered: {
    ...orangeGradientText,
    textShadowColor: 'rgba(255, 208, 0, 0.32)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  socialLink: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  } as any,
  socialLinkHovered: {
    backgroundColor: C.ORANGE,
    backgroundImage: ORANGE_GRADIENT_135,
    boxShadow: '0 0 14px rgba(255, 208, 0, 0.35)',
    transform: [{ translateY: -1 }],
  } as any,
  footerRule: {
    maxWidth: PAGE_MAX_WIDTH,
    width: '100%',
    alignSelf: 'center',
    height: 1,
    backgroundColor: C.CARD_BORDER,
    marginTop: 30,
    marginBottom: 22,
  },
  copyright: {
    ...type.subtext,
    color: C.TEXT_MUTED,
    fontSize: 11,
    textAlign: 'center',
  },
});

const pm = StyleSheet.create({
  wrap: {
    backgroundColor: '#343747',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 0,
  },
  welcome: {
    height: 64,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 18,
    backgroundColor: '#101421',
  },
  welcomeImage: {
    borderRadius: 8,
    opacity: 0.72,
  },
  welcomeOverlay: {
    flex: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(6,10,22,0.5)',
  },
  welcomeTitle: { ...type.heading, color: '#FFFFFF', fontSize: 14 },
  welcomeDate: { ...type.subtext, color: '#B8C0D0', fontSize: 9, marginTop: 3 },
  alertPill: {
    backgroundColor: '#0A2235',
    borderWidth: 1,
    borderColor: C.TEAL,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  alertText: { ...type.button, color: C.TEAL, fontSize: 9 },

  challengeCard: {
    backgroundColor: '#272B3B',
    borderRadius: 7,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#3A4056',
    marginBottom: 14,
  },
  challengeImg: { width: '100%', height: 178, backgroundColor: '#1A1E30' },
  challengeBody: { padding: 14 },
  challengeHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  challengeTitle: { ...type.heading, color: '#FFFFFF', fontSize: 15, flex: 1 },
  activePill: {
    backgroundColor: C.TEAL,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  activeText: { ...type.button, color: '#15202C', fontSize: 8 },
  proOnlyPill: {
    backgroundColor: C.ORANGE,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FFD000',
  },
  proOnlyText: { ...type.button, color: '#FFFFFF', fontSize: 8 },
  challengeDesc: { ...type.subtext, color: '#D5DAE6', fontSize: 10, lineHeight: 16, marginBottom: 12 },
  kicker: { ...type.label, color: '#FFFFFF', fontSize: 9, marginBottom: 8 },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metaBox: { width: '47%' as any },
  metaLabel: { ...type.subtext, color: '#B7BDCB', fontSize: 9, marginBottom: 3 },
  metaValue: { ...type.label, color: '#FFFFFF', fontSize: 9 },
  submitBtn: {
    flex: 1,
    minHeight: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F55B09',
    backgroundImage: ORANGE_GRADIENT,
    paddingHorizontal: 18,
    paddingVertical: 14,
  } as any,
  submitText: { ...type.button, color: '#FFFFFF', fontSize: 14 },
  challengeActions: { gap: 8 },
  browseBtn: {
    flex: 1,
    height: 38,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.TEAL,
    backgroundColor: 'rgba(84,223,182,0.08)',
  },
  browseText: { ...type.button, color: C.TEAL, fontSize: 10 },

  quote: {
    height: 58,
    borderRadius: 4,
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginBottom: 12,
    overflow: 'hidden',
    backgroundColor: '#6C5A25',
    borderWidth: 1,
    borderColor: 'rgba(255, 208, 0, 0.18)',
  } as any,
  quoteImage: { opacity: 0.45 },
  quoteText: { ...type.heading, color: '#FFFFFF', fontSize: 13, fontStyle: 'italic', lineHeight: 19, textAlign: 'center' },

  statRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  statCard: {
    flex: 1,
    backgroundColor: '#272B40',
    borderRadius: 4,
    padding: 10,
    minHeight: 92,
    borderWidth: 1,
    borderColor: '#363B55',
  },
  statIcon: {
    width: 22,
    height: 22,
    borderRadius: 3,
    backgroundColor: '#1D2337',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statIconText: { ...type.button, color: C.TEAL, fontSize: 10 },
  statValue: { ...type.heading, color: '#FFFFFF', fontSize: 15 },
  statLabel: { ...type.subtext, color: '#B7BDCB', fontSize: 9, lineHeight: 12, marginTop: 2 },

  orderUpdatesCard: {
    backgroundColor: '#272B40',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#54DFB655',
    padding: 12,
    marginBottom: 16,
  },
  orderUpdateItem: {
    flexDirection: 'row',
    gap: 9,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff10',
  },
  orderUpdateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.TEAL,
    marginTop: 5,
  },
  orderUpdateTitle: { ...type.heading, color: '#FFFFFF', fontSize: 11, marginBottom: 3 },
  orderUpdateMessage: { ...type.subtext, color: '#C8CEDA', fontSize: 9, lineHeight: 13 },
  orderUpdatesLinkBtn: {
    marginTop: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.TEAL,
    paddingVertical: 9,
    alignItems: 'center',
  },
  orderUpdatesLinkText: { ...type.button, color: C.TEAL, fontSize: 10 },

  sectionTitle: { ...type.heading, color: '#FFFFFF', fontSize: 14, marginBottom: 12, marginTop: 4 },
  submission: {
    backgroundColor: '#272B40',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#363B55',
    marginBottom: 12,
  },
  submissionImg: { width: '100%', height: 134, backgroundColor: '#1A1E30' },
  submissionBody: { padding: 10 },
  userName: { ...type.label, color: C.TEAL, fontSize: 10, marginBottom: 3 },
  subTitle: { ...type.subtext, color: '#FFFFFF', fontSize: 10, marginBottom: 7 },
  subStats: { flexDirection: 'row', gap: 12 },
  subStat: { ...type.subtext, color: '#C8CEDA', fontSize: 9 },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 0 },
  quickCard: {
    width: '47%' as any,
    backgroundColor: '#272B40',
    borderRadius: 5,
    padding: 12,
    minHeight: 88,
    borderWidth: 1,
    borderColor: '#363B55',
  },
  quickIcon: {
    width: 22,
    height: 22,
    borderRadius: 3,
    backgroundColor: '#1D2337',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickIconText: { ...type.button, color: '#FFFFFF', fontSize: 10 },
  quickTitle: { ...type.heading, color: '#FFFFFF', fontSize: 10, marginBottom: 4 },
  quickDesc: { ...type.subtext, color: '#B7BDCB', fontSize: 8, lineHeight: 11 },
});

/* ========== LOGGED-IN STYLES ========== */
const li = StyleSheet.create({
  section: {
    maxWidth: 1180,
    width: '100%' as any,
    alignSelf: 'center',
    paddingHorizontal: 28,
    marginBottom: 28,
  },
  sectionTitle: { ...type.heading, color: C.TEXT, fontSize: 23, marginBottom: 18 },

  // Welcome Banner
  welcomeBanner: {
    borderRadius: 16,
    overflow: 'hidden' as const,
    maxWidth: 1180,
    width: '100%' as any,
    alignSelf: 'center',
    marginHorizontal: 28,
    marginTop: 12,
    height: 136,
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
  welcomeTitle: { ...type.heading, color: '#FFFFFF', fontSize: 25 },
  welcomeDate: { ...type.subtext, color: '#94A3B8', fontSize: 14, marginTop: 5 },
  noAlertsBadge: {
    backgroundColor: '#0A2235',
    borderWidth: 1,
    borderColor: C.TEAL,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  noAlertsText: { ...type.button, color: C.TEAL, fontSize: 13 },

  // Active Challenge Card
  challengeCard: {
    flexDirection: 'row',
    backgroundColor: '#272B40',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#363B55',
  },
  challengeCover: { width: '42%' as any, minHeight: 400, backgroundColor: '#1A1E30' },
  challengeInfo: { flex: 1, padding: 30, justifyContent: 'center' },
  challengeTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  challengeTitle: { ...type.heading, color: C.TEXT, fontSize: 27, flex: 1 },
  activeBadge: {
    backgroundColor: C.TEAL,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  activeBadgeText: { ...type.button, color: '#FFFFFF', fontSize: 12 },
  proOnlyBadge: {
    backgroundColor: C.ORANGE,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#FFD000',
  },
  proOnlyText: { ...type.button, color: '#FFFFFF', fontSize: 12 },
  challengeDesc: { ...type.subtext, color: C.TEXT_SECONDARY, fontSize: 16, lineHeight: 25, marginBottom: 16 },
  challengeCategoryLabel: {
    ...type.label,
    color: C.TEXT_SECONDARY,
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  challengeCategoryValue: {
    ...type.heading,
    color: C.TEAL,
    fontSize: 18,
    marginBottom: 12,
  },

  // Mini stat cards (2x2)
  miniGrid: { gap: 10, marginBottom: 18 },
  miniRow: { flexDirection: 'row', gap: 10 },
  miniCard: {
    flex: 1,
    backgroundColor: '#1E2235',
    borderRadius: 7,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  miniIcon: { fontSize: 24, marginBottom: 4 },
  miniLabel: { ...type.subtext, color: C.TEXT_SECONDARY, fontSize: 13 },
  miniValue: { ...type.heading, color: C.TEXT, fontSize: 23, marginTop: 5 },
  miniTagValue: { ...type.heading, color: C.TEAL, fontSize: 18, marginTop: 7, textAlign: 'center' },

  challengeActions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },

  // Submit button
  submitBtn: {
    flex: 1,
    minWidth: 190,
    backgroundImage: ORANGE_GRADIENT_135,
    backgroundColor: C.ORANGE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  } as any,
  submitBtnText: { ...type.button, color: '#FFFFFF', fontSize: 18 },
  browseBtn: {
    flex: 1,
    minWidth: 190,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.TEAL,
    backgroundColor: 'rgba(84,223,182,0.08)',
  },
  browseBtnText: { ...type.button, color: C.TEAL, fontSize: 18 },

  // Quote banner
  quoteBanner: {
    maxWidth: 1180,
    width: '100%' as any,
    alignSelf: 'center',
    backgroundColor: '#272B40',
    marginHorizontal: 28,
    marginBottom: 24,
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  quoteText: {
    ...type.subtext,
    color: '#FFFFFF',
    fontSize: 17,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Stats row
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: '#272B40',
    borderRadius: 7,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  statIcon: { fontSize: 24, marginBottom: 6 },
  statNum: { ...type.heading, color: C.TEXT, fontSize: 25 },
  statLabel: { ...type.subtext, color: C.TEXT_SECONDARY, fontSize: 13, marginTop: 5, textAlign: 'center' },
  statNote: { ...type.subtext, color: C.TEAL, fontSize: 12, marginTop: 5, textAlign: 'center' },

  orderUpdatesCard: {
    backgroundColor: '#272B40',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#54DFB655',
    padding: 18,
  },
  orderUpdatesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderUpdatesLink: { ...type.button, color: C.TEAL, fontSize: 14 },
  orderUpdateItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#ffffff10',
  },
  orderUpdateDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.TEAL,
    marginTop: 5,
  },
  orderUpdateTitle: { ...type.heading, color: C.TEXT, fontSize: 16, marginBottom: 4 },
  orderUpdateMessage: { ...type.subtext, color: C.TEXT_SECONDARY, fontSize: 14, lineHeight: 20 },
  orderUpdateDate: { ...type.subtext, color: C.TEXT_MUTED, fontSize: 12, marginTop: 2 },

  // Community submissions (full-width)
  communityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  communityCard: {
    width: '48.8%' as any,
    backgroundColor: '#272B40',
    borderRadius: 7,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    marginBottom: 16,
  },
  communityImg: { width: '100%' as any, height: 220, backgroundColor: '#1A1E30' },
  communityInfo: { padding: 14 },
  communityUser: { ...type.label, color: C.TEAL, fontSize: 15, marginBottom: 3 },
  communityTitle: { ...type.label, color: C.TEXT, fontSize: 17, marginBottom: 9 },
  communityStats: { flexDirection: 'row', gap: 16 },
  communityStat: { ...type.subtext, color: C.TEXT_SECONDARY, fontSize: 14 },

  // Quick actions (2x2)
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  quickCard: {
    width: '23.9%' as any,
    backgroundColor: '#272B40',
    borderRadius: 7,
    padding: 20,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  quickIcon: {
    width: 30,
    height: 30,
    borderRadius: 5,
    backgroundColor: '#1D2337',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickTitle: { ...type.heading, color: C.TEXT, fontSize: 16, marginTop: 0 },
  quickDesc: { ...type.subtext, color: C.TEXT_SECONDARY, fontSize: 13, marginTop: 5, lineHeight: 18 },

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
  footerColTitle: { ...type.heading, color: C.TEXT, fontSize: 15, marginBottom: 12 },
  footerLink: { ...type.subtext, color: C.TEXT_SECONDARY, fontSize: 13, marginBottom: 8 },
  socialRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 16 },
  copyright: { ...type.subtext, color: C.TEXT_SECONDARY, fontSize: 12, textAlign: 'center' },
});

export default HomeScreen;
