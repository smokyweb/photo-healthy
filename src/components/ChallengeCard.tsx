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
  const isActive = challenge.status === 'active';
  const isEnded = challenge.status === 'ended' || challenge.status === 'completed' || (daysLeft !== null && daysLeft === 0);
  const isUpcoming = challenge.status === 'upcoming';

  const statusLabel = isEnded ? 'Ended' : isUpcoming ? 'Upcoming' : 'Active';
  const statusColor = isEnded ? C.TEXT_MUTED : isUpcoming ? C.WARNING : C.SUCCESS;

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
            <Text style={[styles.statusBadgeText, { color: isEnded ? C.TEXT_MUTED : '#000' }]}>
              ● {statusLabel}
            </Text>
          </View>
          {challenge.is_pro_only && (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>⭐ PRO</Text>
            </View>
          )}
        </View>
        {daysLeft !== null && !isEnded && (
          <View style={styles.daysLeftBadge}>
            <Text style={styles.daysLeftText}>{daysLeft}d left</Text>
          </View>
        )}
      </View>

      {/* Card Body */}
      <View style={styles.body}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>{challenge.title}</Text>

        {/* Date Range */}
        {(challenge.start_date || challenge.end_date) && (
          <Text style={styles.dateRange}>
            📅 {formatDate(challenge.start_date)}{challenge.end_date ? ` → ${formatDate(challenge.end_date)}` : ''}
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
          {challenge.submission_count !== undefined && (
            <Text style={styles.stat}>📷 {challenge.submission_count} submissions</Text>
          )}
          {daysLeft !== null && !isEnded && (
            <Text style={styles.stat}>⏳ {daysLeft} days left</Text>
          )}
          {isEnded && (
            <Text style={[styles.stat, { color: C.TEXT_MUTED }]}>Challenge ended</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    overflow: 'hidden',
    marginBottom: 14,
  },

  // Image - 16:9
  imageWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
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
    top: 10,
    left: 10,
    flexDirection: 'row',
    gap: 6,
  },
  statusBadge: {
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  proBadge: {
    backgroundColor: C.ORANGE_MID,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  proBadgeText: { color: '#000', fontSize: 10, fontWeight: '800' },
  daysLeftBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: borderRadius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  daysLeftText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // Body
  body: { padding: 14 },
  title: {
    color: C.TEXT,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: "'Lexend', sans-serif",
    marginBottom: 6,
    lineHeight: 22,
  },
  dateRange: {
    color: C.TEXT_MUTED,
    fontSize: 12,
    marginBottom: 8,
    fontFamily: "'Inter', sans-serif",
  },

  // Tags
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10 },
  tag: {
    backgroundColor: C.TEAL + '1A',
    borderWidth: 1,
    borderColor: C.TEAL + '44',
    borderRadius: borderRadius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  tagCategory: {
    backgroundColor: C.ORANGE + '1A',
    borderColor: C.ORANGE + '55',
  },
  tagText: { color: C.TEAL, fontSize: 11, fontWeight: '600' },
  tagCategoryText: { color: C.ORANGE },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  stat: { color: C.TEXT_MUTED, fontSize: 12, fontFamily: "'Inter', sans-serif" },
});
