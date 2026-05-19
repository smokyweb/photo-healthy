import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { C, borderRadius } from '../theme';

const BASE = 'https://photoai.betaplanets.com';
const fullUrl = (url: string) => (!url ? '' : url.startsWith('http') ? url : BASE + url);

interface Challenge {
  id: number;
  title: string;
  description?: string;
  status?: string;
  category?: string;
  feeling_tag?: string;
  mood_tag?: string;
  movement_tag?: string;
  cover_image?: string;
  cover_image_url?: string;
  submission_count?: number;
  start_date?: string;
  end_date?: string;
  is_pro_only?: boolean;
  user_challenge?: {
    personal_end_date?: string;
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
  const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ChallengeCard({ challenge, onPress }: Props) {
  const daysLeft = getDaysLeft(challenge.end_date);
  const isEnded = challenge.status === 'ended' || challenge.status === 'completed' || (daysLeft !== null && daysLeft === 0);
  const isUpcoming = challenge.status === 'upcoming';

  const statusLabel = isEnded ? 'Ended' : isUpcoming ? 'Upcoming' : 'Active';
  const imageUrl = fullUrl(challenge.cover_image_url || challenge.cover_image || '');

  const tags = [
    challenge.category,
    challenge.feeling_tag || challenge.mood_tag,
    challenge.movement_tag,
  ].filter(Boolean) as string[];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Cover Image - 16:9 */}
      <View style={styles.imageWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.placeholderText}>📸</Text>
          </View>
        )}
        {/* Overlay badges */}
        <View style={styles.overlayBadges}>
          <View style={[styles.statusBadge, { backgroundColor: isEnded ? 'rgba(0,0,0,0.6)' : isUpcoming ? C.WARNING + 'dd' : C.SUCCESS + 'dd' }]}>
            <Text style={[styles.statusBadgeText, { color: isEnded ? C.TEXT_MUTED : '#FFFFFF' }]}>
              ● {statusLabel}
            </Text>
          </View>
          {challenge.is_pro_only && (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>⭐ PRO</Text>
            </View>
          )}
        </View>
        {challenge.user_challenge && (
          <View style={styles.enrolledBadge}>
            <Text style={styles.enrolledBadgeText}>
              {(challenge.user_challenge.days_remaining ?? 0) >= 0
                ? `📅 ${Math.max(0, challenge.user_challenge.days_remaining ?? 0)}d (your deadline)`
                : '⏰ Expired'}
            </Text>
          </View>
        )}
      </View>

      {/* Card Body */}
      <View style={styles.body}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>{challenge.title}</Text>

        {/* Date Range */}
        {(challenge.start_date || challenge.end_date) && (
          <Text style={styles.dateRange} numberOfLines={1}>
            {formatDate(challenge.start_date)}{challenge.end_date ? ` — ${formatDate(challenge.end_date)}` : ''}
          </Text>
        )}

          {/* Tags Row */}
          {tags.length > 0 && (
            <View style={styles.tagsRow}>
              {tags.map((tag, i) => (
                <View key={i} style={[styles.tag, i === 0 && styles.tagCategory]}>
                  <Text style={[styles.tagText, i === 0 && styles.tagCategoryText]}>{tag}</Text>
                </View>
              ))}
            </View>
        )}

        {/* Stats Footer */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={styles.personIcon}>
              <View style={styles.personHead} />
              <View style={styles.personBody} />
            </View>
            <Text style={styles.stat}>{challenge.submission_count || 0} participants</Text>
          </View>
          {daysLeft !== null && !isEnded && (
            <Text style={styles.stat}>⏱ {daysLeft} days left</Text>
          )}
          {isEnded && (
            <Text style={[styles.stat, { color: C.TEXT_MUTED }]}>Challenge ended</Text>
          )}
        </View>

        {/* View Challenge button */}
        <View style={styles.viewBtnWrap}>
          <TouchableOpacity style={styles.viewBtn} activeOpacity={0.85} onPress={onPress}>
            <Text style={styles.viewBtnText}>View Challenge →</Text>
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
    marginBottom: 0,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  // Image - 16:9
  imageWrap: {
    width: '100%',
    aspectRatio: 1.75,
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    backgroundColor: C.CARD_BG2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { fontSize: 36 },

  // Overlay badges
  overlayBadges: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    gap: 6,
  },
  statusBadge: {
    borderRadius: borderRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusBadgeText: { fontSize: 12, fontWeight: '800' },
  proBadge: {
    backgroundColor: C.ORANGE_MID,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  proBadgeText: { color: '#000', fontSize: 12, fontWeight: '800' },
  daysLeftBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: borderRadius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  daysLeftText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  enrolledBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: C.TEAL + 'cc',
    borderRadius: borderRadius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  enrolledBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Body
  body: { padding: 20, flex: 1 },
  title: {
    color: C.TEXT,
    fontSize: 18,
    fontWeight: '800',
    fontFamily: "'Lexend', sans-serif",
    marginBottom: 8,
    lineHeight: 24,
  },
  dateRange: {
    color: C.ORANGE_MID,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
    fontFamily: "'Inter', sans-serif",
  },

  // Tags
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagCategory: {
    backgroundColor: C.ORANGE + '18',
    borderColor: C.ORANGE + '55',
  },
  tagText: { color: C.TEXT_SECONDARY, fontSize: 12, fontWeight: '700' },
  tagCategoryText: { color: C.ORANGE },

  // Stats
  statsRow: { flexDirection: 'row', gap: 18, flexWrap: 'wrap', alignItems: 'center' },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  personIcon: {
    width: 12,
    height: 14,
    alignItems: 'center',
  },
  personHead: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.TEXT_SECONDARY,
    marginBottom: 1,
  },
  personBody: {
    width: 10,
    height: 7,
    borderRadius: 5,
    backgroundColor: C.TEXT_SECONDARY,
  },
  stat: { color: C.TEXT_SECONDARY, fontSize: 13, fontWeight: '700', fontFamily: "'Inter', sans-serif" },

  viewBtnWrap: {
    marginTop: 'auto',
    paddingTop: 16,
  },
  viewBtn: {
    borderRadius: borderRadius.pill,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundImage: 'linear-gradient(90deg, #F55B09 0%, #FFD000 100%)',
    backgroundColor: '#F55B09',
  } as any,
  viewBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
