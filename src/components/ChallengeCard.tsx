import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { C, borderRadius } from '../theme';
import { normalizeChallengeCategory, normalizeFeelingCategory, normalizeMovementCategory } from '../constants/taxonomy';

const BASE = 'https://photoai.betaplanets.com';
const fullUrl = (url: string) => (!url ? '' : url.startsWith('http') ? url : BASE + url);

interface Challenge {
  id: number;
  title: string;
  status?: string;
  category?: string;
  feeling_tag?: string;
  feeling_category?: string;
  mood_tag?: string;
  movement_tag?: string;
  movement_category?: string;
  cover_image?: string;
  cover_image_url?: string;
  submission_count?: number;
  participant_count?: number;
  end_date?: string;
  is_pro_only?: boolean;
  user_challenge?: {
    days_remaining?: number;
    status?: string;
  } | null;
}

interface Props {
  challenge: Challenge;
  onPress: () => void;
}

function getDaysLeft(endDate?: string): number | null {
  if (!endDate) return null;
  const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  return diff > 0 ? diff : 0;
}

export default function ChallengeCard({ challenge, onPress }: Props) {
  const daysLeft = getDaysLeft(challenge.end_date);
  const isEnded = challenge.status === 'ended' || challenge.status === 'completed' || (daysLeft !== null && daysLeft === 0);
  const isUpcoming = challenge.status === 'upcoming';
  const imageUrl = fullUrl(challenge.cover_image_url || challenge.cover_image || '');
  const participantCount = challenge.participant_count ?? challenge.submission_count ?? 0;
  const userStatus = challenge.user_challenge?.status;
  const statusLabel = userStatus === 'completed' ? 'Completed' : userStatus === 'active' ? 'Active' : isEnded ? 'Ended' : isUpcoming ? 'Upcoming' : 'Open';
  const category = normalizeChallengeCategory(challenge.category);
  const feeling = normalizeFeelingCategory(challenge.feeling_category || challenge.feeling_tag || challenge.mood_tag);
  const movement = normalizeMovementCategory(challenge.movement_category || challenge.movement_tag);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.placeholderText}>Photo</Text>
          </View>
        )}
        <View style={styles.overlayBadges}>
          <View style={[styles.statusBadge, { backgroundColor: userStatus === 'completed' ? C.TEAL + 'dd' : userStatus === 'active' ? C.ORANGE + 'dd' : isEnded ? 'rgba(0,0,0,0.65)' : isUpcoming ? C.WARNING + 'dd' : C.SUCCESS + 'dd' }]}>
            <Text style={[styles.statusBadgeText, { color: isEnded && !userStatus ? C.TEXT_MUTED : '#FFFFFF' }]}>
              {statusLabel}
            </Text>
          </View>
          {challenge.is_pro_only && (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          )}
        </View>
        {challenge.user_challenge && (
          <View style={styles.enrolledBadge}>
            <Text style={styles.enrolledBadgeText}>
              {(challenge.user_challenge.days_remaining ?? 0) >= 0
                ? `${Math.max(0, challenge.user_challenge.days_remaining ?? 0)}d deadline`
                : 'Expired'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{challenge.title}</Text>

        <View style={styles.challengeInfoList}>
          <View style={styles.infoLine}>
            <Text style={styles.infoLabel}>Category</Text>
            <View style={[styles.tag, styles.tagCategory]}>
              <Text style={[styles.tagText, styles.tagCategoryText]} numberOfLines={1}>{category}</Text>
            </View>
          </View>
          <View style={styles.infoLine}>
            <Text style={styles.infoLabel}>Feeling</Text>
            <View style={styles.tag}>
              <Text style={styles.tagText} numberOfLines={1}>{feeling}</Text>
            </View>
          </View>
          <View style={styles.infoLine}>
            <Text style={styles.infoLabel}>Movement</Text>
            <View style={styles.tag}>
              <Text style={styles.tagText} numberOfLines={1}>{movement}</Text>
            </View>
          </View>
          <View style={styles.metaLine}>
            <Text style={styles.stat}>{daysLeft !== null && !isEnded ? `${daysLeft} days left` : isEnded ? 'Challenge ended' : 'Open now'}</Text>
          </View>
          <View style={styles.metaLine}>
            <View style={styles.personIcon}>
              <View style={styles.personHead} />
              <View style={styles.personBody} />
            </View>
            <Text style={styles.stat}>{participantCount} participants</Text>
          </View>
        </View>

        <View style={styles.viewBtnWrap}>
          <TouchableOpacity style={styles.viewBtn} activeOpacity={0.85} onPress={onPress}>
            <Text style={styles.viewBtnText}>
              {userStatus === 'completed' ? 'Completed' : userStatus === 'active' ? 'Complete Challenge' : 'Join Challenge'} →
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: '100%',
    backgroundColor: C.CARD_BG,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  imageWrap: { width: '100%', aspectRatio: 1.75, position: 'relative' },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { backgroundColor: C.CARD_BG2, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: C.TEXT_MUTED, fontSize: 14, fontWeight: '700' },
  overlayBadges: { position: 'absolute', top: 14, right: 14, flexDirection: 'row', gap: 6 },
  statusBadge: { borderRadius: borderRadius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  statusBadgeText: { fontSize: 12, fontWeight: '800' },
  proBadge: { backgroundColor: C.ORANGE_MID, borderRadius: borderRadius.sm, paddingHorizontal: 8, paddingVertical: 5 },
  proBadgeText: { color: '#000', fontSize: 12, fontWeight: '800' },
  enrolledBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: C.TEAL + 'dd',
    borderRadius: borderRadius.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  enrolledBadgeText: { color: '#0A0E1A', fontSize: 12, fontWeight: '800' },
  body: { padding: 18, flex: 1 },
  title: {
    color: C.TEXT,
    fontSize: 18,
    fontWeight: '800',
    fontFamily: "'Lexend', sans-serif",
    marginBottom: 12,
    lineHeight: 24,
  },
  challengeInfoList: { gap: 8, flex: 1 },
  infoLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  infoLabel: { color: C.TEXT_MUTED, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', minWidth: 70 },
  tag: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagCategory: { backgroundColor: C.ORANGE + '18', borderColor: C.ORANGE + '55' },
  tagText: { color: C.TEXT_SECONDARY, fontSize: 12, fontWeight: '700' },
  tagCategoryText: { color: C.ORANGE_MID },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 22 },
  personIcon: { width: 16, height: 16, alignItems: 'center', position: 'relative' },
  personHead: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.TEXT_MUTED, marginTop: 1 },
  personBody: { width: 13, height: 7, borderTopLeftRadius: 7, borderTopRightRadius: 7, backgroundColor: C.TEXT_MUTED, marginTop: 1 },
  stat: { color: C.TEXT_SECONDARY, fontSize: 13, fontWeight: '700' },
  viewBtnWrap: { marginTop: 14 },
  viewBtn: {
    backgroundColor: C.ORANGE,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundImage: 'linear-gradient(90deg, #F55B09, #FFD000)' as any,
  },
  viewBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
