import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { C, borderRadius } from '../theme';

const BASE = 'https://photoai.betaplanets.com';
const fullUrl = (url?: string) => url ? (url.startsWith('http') ? url : BASE + url) : null;

interface Challenge {
  id: number;
  title: string;
  description?: string;
  status?: string;
  is_active?: boolean;
  category?: string;
  cover_image?: string;
  cover_image_url?: string;
  submission_count?: number;
  end_date?: string;
  feeling_category?: string;
  movement_category?: string;
  is_pro_only?: boolean;
}

interface Props {
  challenge: Challenge;
  onPress: () => void;
}

export default function ChallengeCard({ challenge, onPress }: Props) {
  const imgUrl = fullUrl(challenge.cover_image_url || challenge.cover_image);
  const isActive = challenge.is_active !== false && (challenge.status === 'active' || !challenge.status);
  const daysLeft = challenge.end_date
    ? Math.max(0, Math.floor((new Date(challenge.end_date).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Cover image */}
      <View style={styles.imageWrap}>
        {imgUrl ? (
          <Image source={{ uri: imgUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.placeholderIcon}>📷</Text>
          </View>
        )}
        {/* Badges */}
        <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgeEnded]}>
          <Text style={styles.badgeText}>{isActive ? '● Active' : '○ Ended'}</Text>
        </View>
        {challenge.is_pro_only && (
          <View style={styles.proBadge}><Text style={styles.proBadgeText}>⭐ Pro</Text></View>
        )}
      </View>

      {/* Card body */}
      <View style={styles.body}>
        {/* Category chips */}
        {(challenge.category || challenge.feeling_category || challenge.movement_category) && (
          <View style={styles.chips}>
            {challenge.category && (
              <View style={styles.chip}><Text style={styles.chipText} numberOfLines={1}>{challenge.category}</Text></View>
            )}
            {challenge.feeling_category && (
              <View style={[styles.chip, { backgroundColor: C.TEAL + '22', borderColor: C.TEAL + '50' }]}>
                <Text style={[styles.chipText, { color: C.TEAL }]} numberOfLines={1}>{challenge.feeling_category}</Text>
              </View>
            )}
          </View>
        )}

        <Text style={styles.title} numberOfLines={2}>{challenge.title}</Text>

        {challenge.description && (
          <Text style={styles.description} numberOfLines={2}>{challenge.description}</Text>
        )}

        {/* Stats row */}
        <View style={styles.stats}>
          {challenge.submission_count !== undefined && (
            <Text style={styles.stat}>📷 {challenge.submission_count}</Text>
          )}
          {daysLeft !== null && (
            <Text style={styles.stat}>⏰ {daysLeft}d left</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    overflow: 'hidden',
    marginBottom: 14,
  },
  imageWrap: { position: 'relative' },
  image: { width: '100%', aspectRatio: 16 / 9 },
  imagePlaceholder: { backgroundColor: C.CARD_BG2, alignItems: 'center', justifyContent: 'center', aspectRatio: 16/9, width: '100%' },
  placeholderIcon: { fontSize: 36 },
  badge: { position: 'absolute', top: 10, right: 10, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  badgeActive: { backgroundColor: 'rgba(72,187,120,0.85)' },
  badgeEnded: { backgroundColor: 'rgba(100,116,139,0.85)' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  proBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(245,91,9,0.9)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  proBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  body: { padding: 14 },
  chips: { flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  chip: { backgroundColor: C.ORANGE + '20', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: C.ORANGE + '40' },
  chipText: { color: C.ORANGE, fontSize: 11, fontWeight: '600' },
  title: { color: C.TEXT, fontSize: 16, fontWeight: '700', marginBottom: 6, fontFamily: "'Lexend', sans-serif" } as any,
  description: { color: C.TEXT_SECONDARY, fontSize: 13, marginBottom: 10, lineHeight: 19 },
  stats: { flexDirection: 'row', gap: 14 },
  stat: { color: C.TEXT_MUTED, fontSize: 12 },
});
