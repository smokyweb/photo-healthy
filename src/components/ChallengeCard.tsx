import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { C, borderRadius } from '../theme';

interface Challenge {
  id: number;
  title: string;
  description?: string;
  status?: string;
  category?: string;
  cover_image?: string;
  submission_count?: number;
  end_date?: string;
}

interface Props {
  challenge: Challenge;
  onPress: () => void;
}

export default function ChallengeCard({ challenge, onPress }: Props) {
  const statusColor =
    challenge.status === 'active' ? C.SUCCESS :
    challenge.status === 'upcoming' ? C.WARNING :
    C.TEXT_MUTED;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {challenge.cover_image ? (
        <Image source={{ uri: challenge.cover_image }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={styles.placeholderText}>📸</Text>
        </View>
      )}
      <View style={styles.info}>
        <View style={styles.header}>
          {challenge.category && (
            <Text style={styles.category}>{challenge.category}</Text>
          )}
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {challenge.status || 'active'}
            </Text>
          </View>
        </View>
        <Text style={styles.title} numberOfLines={2}>{challenge.title}</Text>
        {challenge.description && (
          <Text style={styles.description} numberOfLines={2}>
            {challenge.description}
          </Text>
        )}
        <View style={styles.footer}>
          {challenge.submission_count !== undefined && (
            <Text style={styles.meta}>📷 {challenge.submission_count} submissions</Text>
          )}
          {challenge.end_date && (
            <Text style={styles.meta}>
              📅 Ends {new Date(challenge.end_date).toLocaleDateString()}
            </Text>
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
    marginBottom: 12,
  },
  image: { width: '100%', height: 160 },
  imagePlaceholder: {
    backgroundColor: C.CARD_BG2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { fontSize: 40 },
  info: { padding: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  category: { color: C.TEAL, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  statusBadge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  title: { color: C.TEXT, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  description: { color: C.TEXT_SECONDARY, fontSize: 13, marginBottom: 8 },
  footer: { flexDirection: 'row', gap: 12 },
  meta: { color: C.TEXT_MUTED, fontSize: 12 },
});
