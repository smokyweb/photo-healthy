import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView,
  TouchableOpacity, TextInput, RefreshControl, Alert,
  useWindowDimensions, Platform, Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getChallenge, getSubmissions, getUserAccess } from '../services/api';
import GradientButton from '../components/GradientButton';
import LoadingSpinner from '../components/LoadingSpinner';
import AppFooter from '../components/AppFooter';
import { C, borderRadius } from '../theme';

const BASE = 'https://photoai.betaplanets.com';
const fullUrl = (url?: string | null) =>
  url ? (url.startsWith('http') ? url : BASE + url) : null;

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default function ChallengeDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { challengeId } = route.params || {};
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const [challenge, setChallenge] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [access, setAccess] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subSearch, setSubSearch] = useState('');

  const load = async () => {
    try {
      const [cData, sData] = await Promise.all([
        getChallenge(challengeId),
        getSubmissions({ challengeId: String(challengeId), limit: '30' }),
      ]);
      setChallenge(cData?.challenge || cData);
      setSubmissions(sData?.submissions || sData || []);

      if (user) {
        const a = await getUserAccess().catch(() => ({}));
        setAccess(a);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load challenge');
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { if (challengeId) load(); }, [challengeId]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleSubmit = () => {
    if (!user) { navigation.navigate('Login'); return; }
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
  const remainingSubmissions = access?.remainingSubmissions;
  const hasPartner = !!challenge.partner_url;

  const filteredSubs = subSearch.trim()
    ? submissions.filter(
        s =>
          (s.user_name || '').toLowerCase().includes(subSearch.toLowerCase()) ||
          (s.title || '').toLowerCase().includes(subSearch.toLowerCase()),
      )
    : submissions;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 0 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.ORANGE} />
      }
    >
      {/* Back button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {/* ── Hero: 2-col on desktop ── */}
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
          <Text style={styles.infoTitle}>{challenge.title}</Text>

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

          {/* 2×2 stats grid */}
          <View style={styles.statsGrid}>
            {[
              { label: 'Category', val: challenge.category || '—' },
              {
                label: 'Feeling',
                val: challenge.feeling_category || challenge.feeling_tag || '—',
              },
              {
                label: 'Movement',
                val: challenge.movement_category || challenge.movement_tag || '—',
              },
              {
                label: daysLeft !== null ? 'Days Left' : 'Status',
                val: daysLeft !== null ? String(daysLeft) : (challenge.status || '—'),
              },
            ].map(({ label, val }) => (
              <View key={label} style={styles.statItem}>
                <Text style={styles.statLabel}>{label}</Text>
                <Text style={styles.statVal}>{val}</Text>
              </View>
            ))}
          </View>

          {/* Participants */}
          {challenge.submission_count !== undefined && (
            <Text style={styles.participantsText}>
              👥 {challenge.submission_count} participants
            </Text>
          )}

          {/* Submit Photos (primary) */}
          {isActive && (
            <GradientButton
              label="Submit Photos"
              variant="primary"
              onPress={handleSubmit}
              style={styles.actionBtn}
            />
          )}

          {/* Become a PRO (outline orange) */}
          {!isPro && user && (
            <GradientButton
              label="Become a PRO ⭐"
              variant="outline"
              onPress={() => navigation.navigate('Subscription')}
              style={styles.actionBtn}
            />
          )}

          {/* Partner link (teal outline) */}
          {hasPartner && (
            <GradientButton
              label="Visit Partner →"
              variant="outline-teal"
              onPress={() => Linking.openURL(challenge.partner_url)}
              style={styles.actionBtn}
            />
          )}

          {/* Remaining submissions */}
          {remainingSubmissions !== undefined && (
            <Text style={styles.remainingText}>
              {remainingSubmissions} submission
              {remainingSubmissions !== 1 ? 's' : ''} remaining this month
            </Text>
          )}
        </View>
      </View>

      {/* ── Community Submissions ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Community Submissions ({filteredSubs.length})
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
              <Text style={{ color: C.TEXT_MUTED, fontSize: 14 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Submissions 3-col grid */}
        {filteredSubs.length > 0 ? (
          <View style={styles.subGrid}>
            {filteredSubs.map((sub: any) => {
              const imgUrl = fullUrl(sub.photo1_url || sub.image_url);
              return (
                <TouchableOpacity
                  key={sub.id}
                  style={styles.subCard}
                  onPress={() =>
                    navigation.navigate('SubmissionDetail', { submissionId: sub.id })
                  }
                  activeOpacity={0.88}
                >
                  {imgUrl ? (
                    <Image source={{ uri: imgUrl }} style={styles.subImg} resizeMode="cover" />
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
                    <View style={styles.subMeta}>
                      <Text style={styles.subMetaText}>❤️ {sub.like_count || 0}</Text>
                      <Text style={styles.subMetaText}>💬 {sub.comment_count || 0}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
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
  screen: { backgroundColor: C.BG },
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
  infoTitle: {
    color: C.TEXT,
    fontSize: 26,
    fontWeight: '800',
    fontFamily: "'Lexend', sans-serif",
    marginBottom: 8,
    lineHeight: 34,
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

  // 2×2 Stats grid
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
    fontSize: 10,
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

  // Empty state
  emptyWrap: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: C.TEXT_MUTED, fontSize: 15 },
});
