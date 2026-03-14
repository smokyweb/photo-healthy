import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, RefreshControl, ActivityIndicator, TextInput } from 'react-native';
import { api } from '../services/api';
import { colors, spacing, borderRadius, shadows } from '../theme';

const GalleryScreen = ({ navigation }: any) => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchSubmissions = useCallback(async () => {
    try {
      const data = await api.getSubmissions();
      setSubmissions(data.submissions || []);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const filtered = submissions.filter(s =>
    s.title?.toLowerCase().includes(search.toLowerCase()) ||
    s.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.challenge_title?.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: any) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('SubmissionDetail', { id: item.id })}>
      <Image source={{ uri: item.photo1_url }} style={styles.photo} />
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardMeta}>
          by {item.user_name || 'Unknown'} · {item.challenge_title || ''}
        </Text>
        {item.description ? <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text> : null}
      </View>
    </TouchableOpacity>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gallery</Text>
        <Text style={styles.headerSub}>{submissions.length} photos shared</Text>
      </View>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput} placeholder="Search photos..."
          placeholderTextColor={colors.gray[400]} value={search} onChangeText={setSearch}
        />
      </View>
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSubmissions(); }} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🖼️</Text>
            <Text style={styles.emptyText}>No photos yet</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primaryBg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.lg },
  headerTitle: { color: colors.white, fontSize: 22, fontWeight: '700' },
  headerSub: { color: colors.primaryLight, fontSize: 13, marginTop: 2 },
  searchWrap: { padding: spacing.md, maxWidth: 600, width: '100%', alignSelf: 'center' },
  searchInput: {
    backgroundColor: colors.white, borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 15,
    borderWidth: 1, borderColor: colors.gray[200], color: colors.black,
  },
  list: { padding: spacing.md, maxWidth: 600, width: '100%', alignSelf: 'center' },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, marginBottom: spacing.md, overflow: 'hidden', ...shadows.sm },
  photo: { width: '100%', height: 220, backgroundColor: colors.gray[100] },
  cardBody: { padding: spacing.md },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.black },
  cardMeta: { fontSize: 12, color: colors.gray[400], marginTop: 2 },
  cardDesc: { fontSize: 14, color: colors.gray[600], marginTop: spacing.xs, lineHeight: 20 },
  empty: { alignItems: 'center', marginTop: spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { fontSize: 16, color: colors.gray[500] },
});

export default GalleryScreen;
