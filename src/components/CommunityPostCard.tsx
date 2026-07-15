import React from 'react';
import { Image, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fullUrl } from '../config/api';
import { C, borderRadius } from '../theme';

type Props = {
  post: any;
  compact?: boolean;
};

const openPostLink = async (url: string) => {
  const next = String(url || '').trim();
  if (!next) return;
  if (Platform.OS === 'web' && next.startsWith('/') && typeof window !== 'undefined') {
    window.location.assign(next);
    return;
  }
  if (!/^(https?:|mailto:)/i.test(next)) return;
  if (await Linking.canOpenURL(next)) await Linking.openURL(next);
};

export default function CommunityPostCard({ post, compact = false }: Props) {
  const imageUri = post?.image_url ? fullUrl(post.image_url) : '';
  const publishedAt = post?.published_at || post?.created_at;
  const dateLabel = publishedAt
    ? new Date(publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      {imageUri ? <Image source={{ uri: imageUri }} style={[styles.image, compact && styles.imageCompact]} resizeMode="cover" /> : null}
      <View style={[styles.content, compact && styles.contentCompact]}>
        <View style={styles.badgeRow}>
          <View style={styles.teamBadge}>
            <Text style={styles.teamBadgeText}>PHOTO HEALTHY UPDATE</Text>
          </View>
          {post?.is_pinned ? (
            <View style={styles.pinnedBadge}><Text style={styles.pinnedBadgeText}>PINNED</Text></View>
          ) : null}
        </View>
        <Text style={[styles.title, compact && styles.titleCompact]}>{post?.title || 'Community update'}</Text>
        <Text style={[styles.body, compact && styles.bodyCompact]} numberOfLines={compact ? 4 : undefined}>
          {post?.body || ''}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.meta}>{post?.author_name || 'Photo Healthy Team'}{dateLabel ? ` · ${dateLabel}` : ''}</Text>
          {post?.cta_url ? (
            <TouchableOpacity style={styles.cta} activeOpacity={0.82} onPress={() => openPostLink(post.cta_url)}>
              <Text style={styles.ctaText}>{post?.cta_label || 'Learn more'} →</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    backgroundColor: C.CARD_BG2,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(245,91,9,0.3)',
    marginBottom: 14,
  },
  cardCompact: { marginBottom: 12 },
  image: { width: '100%', height: 240, backgroundColor: C.CARD_BG },
  imageCompact: { height: 180 },
  content: { padding: 22 },
  contentCompact: { padding: 18 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  teamBadge: { backgroundColor: 'rgba(245,91,9,0.16)', borderRadius: borderRadius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  teamBadgeText: { color: C.ORANGE_MID, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  pinnedBadge: { backgroundColor: 'rgba(84,223,182,0.12)', borderRadius: borderRadius.pill, paddingHorizontal: 9, paddingVertical: 5 },
  pinnedBadgeText: { color: C.TEAL, fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
  title: { color: C.TEXT, fontSize: 22, lineHeight: 28, fontWeight: '800', fontFamily: "'Lexend', sans-serif", marginBottom: 9 },
  titleCompact: { fontSize: 19, lineHeight: 25 },
  body: { color: C.TEXT_SECONDARY, fontSize: 15, lineHeight: 23 },
  bodyCompact: { fontSize: 14, lineHeight: 21 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  meta: { color: C.TEXT_MUTED, fontSize: 12, fontWeight: '600' },
  cta: { backgroundColor: C.ORANGE, borderRadius: borderRadius.md, paddingHorizontal: 14, paddingVertical: 9 },
  ctaText: { color: C.WHITE, fontSize: 13, fontWeight: '800' },
});
