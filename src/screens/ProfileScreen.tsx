import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  ScrollView, Alert, RefreshControl, useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getUserStats, getSubscriptionStatus, getSubmissions, getMyChallenges } from '../services/api';
import GradientButton from '../components/GradientButton';
import LoadingSpinner from '../components/LoadingSpinner';
import AppFooter from '../components/AppFooter';
import { C, borderRadius } from '../theme';

const BASE = 'https://photoai.betaplanets.com';
const fullUrl = (url?: string) => (!url ? '' : url.startsWith('http') ? url : BASE + url);

const ACTION_BUTTONS = [
  { icon: '\u270F\uFE0F', label: 'Edit Profile',   screen: 'EditProfile',   color: '#54DFB6' },
  { icon: '\uD83D\uDCCA', label: 'My Progress',    screen: 'MyProgress',    color: '#29B6E0' },
  { icon: '\uD83D\uDDBC\uFE0F', label: 'My Gallery', screen: 'Gallery',     color: '#F55B09' },
  { icon: '\uD83D\uDED2', label: 'My Orders',      screen: 'OrderHistory',  color: '#FFD000' },
  { icon: '\u2B50',       label: 'Subscription',   screen: 'Subscription',  color: '#F55B09' },
];

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [stats, setStats] = useState<any>({});
  const [subscription, setSubscription] = useState<any>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [myChallenges, setMyChallenges] = useState<{ active: any[]; past: any[] }>({ active: [], past: [] });
  const [challengesTab, setChallengesTab] = useState<'active' | 'past'>('active');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const [sData, subData, submissionsData, myChallengesData] = await Promise.allSettled([
        getUserStats(),
        getSubscriptionStatus(),
        getSubmissions({ limit: '6', userId: String(user.id) }),
        getMyChallenges(),
      ]);
      if (sData.status === 'fulfilled') setStats(sData.value || {});
      if (subData.status === 'fulfilled') setSubscription(subData.value);
      if (submissionsData.status === 'fulfilled') {
        setRecentSubmissions(submissionsData.value?.submissions || submissionsData.value || []);
      }
      if (myChallengesData.status === 'fulfilled') {
        setMyChallenges(myChallengesData.value || { active: [], past: [] });
      }
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive', onPress: () => {
          logout();
          // Navigate to login after logout
          setTimeout(() => navigation.reset({ index: 0, routes: [{ name: 'Main' as never }] }), 100);
        }
      },
    ]);
  };

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n.charAt(0).toUpperCase()).slice(0, 2).join('')
    : '?';

  const isPro = subscription?.is_pro || subscription?.isPro
    || user?.subscription_status === 'active' || user?.role === 'pro';
  const planLabel = isPro ? 'Pro' : 'Free';

  if (!user) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.guestContainer}>
          <View style={styles.guestIconWrap}>
            <Text style={styles.guestIcon}>{'\uD83D\uDC64'}</Text>
          </View>
          <Text style={styles.guestTitle}>Join the Community</Text>
          <Text style={styles.guestBody}>
            Create an account to track your progress, join challenges, and connect with others.
          </Text>
          <GradientButton
            label="Sign Up Free"
            onPress={() => navigation.navigate('Register')}
            style={{ marginTop: 24, paddingHorizontal: 40 } as any}
          />
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 14 }}>
            <Text style={{ color: C.TEXT_MUTED, fontSize: 14 }}>Already a member? Sign In</Text>
          </TouchableOpacity>
        </View>
        <AppFooter />
      </ScrollView>
    );
  }

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.ORANGE} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarRing}>
          {(user.avatar_url || user.avatar) ? (
            <Image source={{ uri: fullUrl(user.avatar_url || user.avatar) }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
        </View>
        <Text style={styles.profileName}>{user.name}</Text>
        <Text style={styles.profileEmail}>{user.email}</Text>
        {isPro && (
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>{'\u2B50'} PRO Member</Text>
          </View>
        )}
        <GradientButton
          label="Edit Profile"
          variant="outline"
          onPress={() => navigation.navigate('EditProfile')}
          style={{ marginTop: 14, paddingHorizontal: 28 } as any}
          size="sm"
        />
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatBlock label="Photos"     value={stats.submissions || stats.submission_count || 0} />
        <StatBlock label="Challenges" value={stats.challenges  || stats.challenge_count  || 0} icon={'\uD83C\uDFC5'} />
        <StatBlock label="Streak"     value={`${stats.streak || 0} \uD83D\uDD25`} />
        <StatBlock label="Miles"      value={parseFloat(stats.totalMiles || 0).toFixed(1)} />
        <StatBlock label="Likes"      value={stats.likesReceived || stats.total_likes || 0} icon={'\u2764\uFE0F'} />
        <StatBlock label="Plan"       value={planLabel} highlight={isPro} />
      </View>

      {/* My Challenges Section */}
      {(myChallenges.active.length > 0 || myChallenges.past.length > 0) && (
        <View style={styles.myChallengesSection}>
          <Text style={styles.sectionTitle}>🏅 My Challenges</Text>
          <View style={styles.challengeTabRow}>
            <TouchableOpacity
              style={[styles.challengeTab, challengesTab === 'active' && styles.challengeTabActive]}
              onPress={() => setChallengesTab('active')}
            >
              <Text style={[styles.challengeTabText, challengesTab === 'active' && styles.challengeTabTextActive]}>
                Active ({myChallenges.active.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.challengeTab, challengesTab === 'past' && styles.challengeTabActive]}
              onPress={() => setChallengesTab('past')}
            >
              <Text style={[styles.challengeTabText, challengesTab === 'past' && styles.challengeTabTextActive]}>
                Past ({myChallenges.past.length})
              </Text>
            </TouchableOpacity>
          </View>
          {(challengesTab === 'active' ? myChallenges.active : myChallenges.past).length === 0 ? (
            <Text style={styles.noChallengesText}>
              {challengesTab === 'active' ? 'No active challenges. Enter a challenge to get started!' : 'No past challenges yet.'}
            </Text>
          ) : (
            (challengesTab === 'active' ? myChallenges.active : myChallenges.past).map((item: any) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.challengeItem, challengesTab === 'past' && styles.challengeItemPast]}
                onPress={() => navigation.navigate('ChallengeDetail' as never, { challengeId: item.challenge_id } as never)}
                activeOpacity={0.85}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.challengeItemTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.challengeItemMeta}>
                    {challengesTab === 'active'
                      ? `🗓 ${Math.max(0, item.days_remaining ?? 0)} day${item.days_remaining !== 1 ? 's' : ''} left`
                      : item.has_submitted ? '✅ Completed' : '⏰ Expired'}
                  </Text>
                </View>
                {challengesTab === 'active' && (
                  <View style={styles.daysLeftPill}>
                    <Text style={styles.daysLeftPillText}>{Math.max(0, item.days_remaining ?? 0)}d</Text>
                  </View>
                )}
                {challengesTab === 'past' && (
                  <View style={[styles.daysLeftPill, item.has_submitted ? styles.completedPill : styles.expiredPill]}>
                    <Text style={styles.daysLeftPillText}>{item.has_submitted ? '✅' : '⏰'}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>My Account</Text>
        <View style={styles.actionsGrid}>
          {ACTION_BUTTONS.map(btn => (
            <TouchableOpacity
              key={btn.screen}
              style={styles.actionBtn}
              onPress={() => navigation.navigate(btn.screen as never)}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: btn.color + '22' }]}>
                <Text style={styles.actionIcon}>{btn.icon}</Text>
              </View>
              <Text style={styles.actionLabel}>{btn.label}</Text>
              <Text style={styles.actionArrow}>â€º</Text>
            </TouchableOpacity>
          ))}
          {(user.role === 'admin' || user.is_admin) && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Admin' as never)}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: '#ef444422' }]}>
                <Text style={styles.actionIcon}>{'\uD83D\uDEE1\uFE0F'}</Text>
              </View>
              <Text style={styles.actionLabel}>Admin Panel</Text>
              <Text style={styles.actionArrow}>â€º</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Recent Submissions */}
      {recentSubmissions.length > 0 && (
        <View style={styles.submissionsSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>My Recent Photos</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Gallery' as never)}>
              <Text style={styles.seeAll}>See all â†’</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.submissionsGrid, isDesktop && { gap: 10 }]}>
            {recentSubmissions.slice(0, 6).map((s: any) => (
              <TouchableOpacity
                key={s.id}
                style={styles.submissionThumb}
                onPress={() => navigation.navigate('SubmissionDetail' as never, { submissionId: s.id } as never)}
                activeOpacity={0.85}
              >
                {(s.image_url || s.photo_url) ? (
                  <Image
                    source={{ uri: fullUrl(s.image_url || s.photo_url) }}
                    style={styles.submissionImg}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.submissionImg, styles.submissionPlaceholder]}>
                    <Text style={{ fontSize: 24 }}>{'\uD83D\uDCF7'}</Text>
                  </View>
                )}
                <View style={styles.submissionOverlay}>
                  <Text style={styles.submissionLikes}>{'\u2764\uFE0F'} {s.like_count || s.likes || 0}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Sign Out */}
      <View style={styles.signOutSection}>
        <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.signOutIcon}>{'\uD83D\uDEAA'}</Text>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <AppFooter />
    </ScrollView>
  );
}

function StatBlock({ label, value, icon, highlight }: { label: string; value: any; icon?: string; highlight?: boolean }) {
  return (
    <View style={statStyles.block}>
      <Text style={[statStyles.value, highlight && statStyles.highlight]}>
        {icon ? `${icon} ` : ''}{value}
      </Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  block: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
  },
  value: {
    color: C.ORANGE,
    fontSize: 20,
    fontWeight: '800',
    fontFamily: "'Lexend', sans-serif",
    marginBottom: 3,
  },
  highlight: { color: '#FFD000' },
  label: { color: C.TEXT_MUTED, fontSize: 11, textAlign: 'center', fontFamily: "'Inter', sans-serif" },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.BG },

  guestContainer: {
    flex: 1,
    backgroundColor: C.BG,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 400,
  },
  guestIconWrap: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: C.CARD_BG, alignItems: 'center', justifyContent: 'center',
    marginBottom: 20, borderWidth: 2, borderColor: C.CARD_BORDER,
  },
  guestIcon: { fontSize: 40 },
  guestTitle: { color: C.TEXT, fontSize: 24, fontWeight: '800', fontFamily: "'Lexend', sans-serif", marginBottom: 10 },
  guestBody: { color: C.TEXT_MUTED, fontSize: 15, textAlign: 'center', lineHeight: 24 },

  profileHeader: {
    alignItems: 'center', paddingTop: 32, paddingBottom: 24, paddingHorizontal: 20,
    backgroundColor: C.CARD_BG2, borderBottomWidth: 1, borderBottomColor: C.CARD_BORDER,
  },
  avatarRing: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 3, borderColor: C.ORANGE, overflow: 'hidden',
    marginBottom: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: C.CARD_BG,
  },
  avatar: { width: '100%', height: '100%' },
  avatarFallback: { width: '100%', height: '100%', backgroundColor: C.ORANGE, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { color: '#fff', fontSize: 34, fontWeight: '800' },
  profileName: { color: C.TEXT, fontSize: 22, fontWeight: '800', fontFamily: "'Lexend', sans-serif", marginBottom: 4 },
  profileEmail: { color: C.TEXT_MUTED, fontSize: 14, marginBottom: 10 },
  proBadge: {
    backgroundColor: C.ORANGE + '22', borderWidth: 1, borderColor: C.ORANGE + '66',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5,
  },
  proBadgeText: { color: '#FFD000', fontSize: 13, fontWeight: '700' },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: C.CARD_BG, borderRadius: 16,
    borderWidth: 1, borderColor: C.CARD_BORDER, overflow: 'hidden',
  },

  actionsSection: { marginHorizontal: 16, marginTop: 24 },
  sectionTitle: { color: C.TEXT, fontSize: 17, fontWeight: '700', fontFamily: "'Lexend', sans-serif", marginBottom: 12 },
  actionsGrid: { gap: 8 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.CARD_BG, borderRadius: 16,
    padding: 14, borderWidth: 1, borderColor: C.CARD_BORDER, gap: 12,
  },
  actionIconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionIcon: { fontSize: 20 },
  actionLabel: { flex: 1, color: C.TEXT, fontSize: 15, fontWeight: '600' },
  actionArrow: { color: C.TEXT_MUTED, fontSize: 20, fontWeight: '300' },

  submissionsSection: { marginHorizontal: 16, marginTop: 24 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  seeAll: { color: C.ORANGE, fontSize: 13 },
  submissionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  submissionThumb: { width: '31%', aspectRatio: 1, borderRadius: 10, overflow: 'hidden', backgroundColor: C.CARD_BG },
  submissionImg: { width: '100%', height: '100%' },
  submissionPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: C.CARD_BG2 },
  submissionOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 5, backgroundColor: 'rgba(0,0,0,0.15)' },
  submissionLikes: { color: '#fff', fontSize: 11, fontWeight: '600' },

  myChallengesSection: { marginHorizontal: 16, marginTop: 24 },
  challengeTabRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  challengeTab: {
    flex: 1, paddingVertical: 8, alignItems: 'center',
    borderRadius: 10, backgroundColor: C.CARD_BG,
    borderWidth: 1, borderColor: C.CARD_BORDER,
  },
  challengeTabActive: { backgroundColor: C.ORANGE + '22', borderColor: C.ORANGE },
  challengeTabText: { color: C.TEXT_MUTED, fontSize: 13, fontWeight: '600' },
  challengeTabTextActive: { color: C.ORANGE },
  noChallengesText: { color: C.TEXT_MUTED, fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  challengeItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.CARD_BG, borderRadius: 12,
    padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: C.CARD_BORDER, gap: 10,
  },
  challengeItemPast: { opacity: 0.65 },
  challengeItemTitle: { color: C.TEXT, fontSize: 14, fontWeight: '700', marginBottom: 3 },
  challengeItemMeta: { color: C.TEXT_MUTED, fontSize: 12 },
  daysLeftPill: {
    backgroundColor: C.TEAL + '22', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: C.TEAL + '55',
  },
  completedPill: { backgroundColor: '#22c55e22', borderColor: '#22c55e55' },
  expiredPill: { backgroundColor: C.TEXT_MUTED + '22', borderColor: C.TEXT_MUTED + '55' },
  daysLeftPillText: { color: C.TEAL, fontSize: 12, fontWeight: '700' },

  signOutSection: { marginHorizontal: 16, marginTop: 20, marginBottom: 24 },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#ef444415', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#ef444444', gap: 10,
  },
  signOutIcon: { fontSize: 18 },
  signOutText: { color: '#ef4444', fontSize: 15, fontWeight: '700' },
});
