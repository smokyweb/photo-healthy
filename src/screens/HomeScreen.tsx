import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView,
  TouchableOpacity, FlatList, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getChallenges, getSubmissions, getPublicSettings } from '../services/api';
import ChallengeCard from '../components/ChallengeCard';
import GradientButton from '../components/GradientButton';
import LoadingSpinner from '../components/LoadingSpinner';
import { C, borderRadius, fonts, spacing } from '../theme';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [featured, setFeatured] = useState<any>(null);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [cData, sData, pubSettings] = await Promise.allSettled([
        getChallenges({ status: 'active', limit: '5' }),
        getSubmissions({ limit: '8', sort: 'recent' }),
        getPublicSettings(),
      ]);

      if (cData.status === 'fulfilled') {
        const list = cData.value?.challenges || cData.value || [];
        setChallenges(list.slice(0, 4));
        setFeatured(list[0] || null);
      }
      if (sData.status === 'fulfilled') {
        setRecentSubmissions(sData.value?.submissions || sData.value || []);
      }
      if (pubSettings.status === 'fulfilled') {
        setSettings(pubSettings.value || {});
      }
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <ScrollView
      style={styles.screen}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.ORANGE} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {user ? `Welcome back, ${user.name.split(' ')[0]}! 👋` : 'Welcome to PhotoHealthy 📸'}
          </Text>
          <Text style={styles.tagline}>
            {settings.tagline || 'Capture your healthy journey'}
          </Text>
        </View>
        {!user && (
          <GradientButton
            label="Join Free"
            onPress={() => navigation.navigate('Register')}
            style={styles.joinBtn}
          />
        )}
      </View>

      {/* Featured Challenge */}
      {featured && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Challenge</Text>
          <TouchableOpacity
            style={styles.featuredCard}
            onPress={() => navigation.navigate('ChallengeDetail', { challengeId: featured.id })}
            activeOpacity={0.9}
          >
            {featured.cover_image ? (
              <Image source={{ uri: featured.cover_image }} style={styles.featuredImage} />
            ) : (
              <View style={[styles.featuredImage, styles.featuredPlaceholder]}>
                <Text style={{ fontSize: 60 }}>🏆</Text>
              </View>
            )}
            <View style={styles.featuredOverlay} />
            <View style={styles.featuredContent}>
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeText}>ACTIVE</Text>
              </View>
              <Text style={styles.featuredTitle}>{featured.title}</Text>
              {featured.description && (
                <Text style={styles.featuredDesc} numberOfLines={2}>
                  {featured.description}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Active Challenges */}
      {challenges.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Challenges</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ChallengesTab')}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          {challenges.map(c => (
            <ChallengeCard
              key={c.id}
              challenge={c}
              onPress={() => navigation.navigate('ChallengeDetail', { challengeId: c.id })}
            />
          ))}
        </View>
      )}

      {/* Recent Submissions */}
      {recentSubmissions.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Photos</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CommunityTab')}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.photoGrid}>
            {recentSubmissions.map(s => (
              <TouchableOpacity
                key={s.id}
                style={styles.photoThumb}
                onPress={() => navigation.navigate('SubmissionDetail', { submissionId: s.id })}
              >
                {s.image_url ? (
                  <Image source={{ uri: s.image_url }} style={styles.photoImg} />
                ) : (
                  <View style={[styles.photoImg, styles.photoPlaceholder]}>
                    <Text>📷</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* CTA for guests */}
      {!user && (
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to start your journey?</Text>
          <Text style={styles.ctaBody}>
            Join thousands of members documenting their healthy lifestyle through photography.
          </Text>
          <GradientButton
            label="Create Free Account"
            onPress={() => navigation.navigate('Register')}
            style={{ marginTop: 16 }}
          />
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={{ marginTop: 12, alignItems: 'center' }}
          >
            <Text style={{ color: C.TEXT_MUTED, fontSize: 14 }}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.BG },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 16,
  },
  greeting: { color: C.TEXT, fontSize: 18, fontWeight: '700', marginBottom: 4 },
  tagline: { color: C.TEXT_SECONDARY, fontSize: 13 },
  joinBtn: { paddingHorizontal: 16, height: 38 },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { color: C.TEXT, fontSize: 18, fontWeight: '700' },
  seeAll: { color: C.ORANGE, fontSize: 13 },
  featuredCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    height: 220,
    backgroundColor: C.CARD_BG,
  },
  featuredImage: { width: '100%', height: '100%' },
  featuredPlaceholder: {
    backgroundColor: C.CARD_BG2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.8) 100%)' as any,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  featuredContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  featuredBadge: {
    backgroundColor: C.ORANGE,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  featuredBadgeText: { color: C.WHITE, fontSize: 10, fontWeight: '800' },
  featuredTitle: { color: C.WHITE, fontSize: 20, fontWeight: '800', marginBottom: 4 },
  featuredDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  photoThumb: {
    width: '24%',
    aspectRatio: 1,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  photoImg: { width: '100%', height: '100%' },
  photoPlaceholder: {
    backgroundColor: C.CARD_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaSection: {
    margin: 16,
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  ctaTitle: { color: C.TEXT, fontSize: 22, fontWeight: '800', marginBottom: 8 },
  ctaBody: { color: C.TEXT_SECONDARY, fontSize: 14, lineHeight: 22 },
});
