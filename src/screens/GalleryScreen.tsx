import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getSubmissions } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { C, borderRadius } from '../theme';
import AppFooter from '../components/AppFooter';

export default function GalleryScreen() {
  const navigation = useNavigation<any>();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await getSubmissions({ limit: '50' });
      setSubmissions(data?.submissions || data || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Gallery</Text>
      </View>

      <FlatList
        data={submissions}
        keyExtractor={i => String(i.id)}
        numColumns={3}
        contentContainerStyle={styles.grid}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.ORANGE} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('SubmissionDetail', { submissionId: item.id })}
          >
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.img} />
            ) : (
              <View style={[styles.img, styles.placeholder]}>
                <Text>📷</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}><Text style={styles.emptyText}>No photos yet</Text></View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.BG },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    padding: 16, borderBottomWidth: 1, borderBottomColor: C.DIVIDER,
  },
  back: { color: C.ORANGE, fontSize: 15 },
  title: { color: C.TEXT, fontSize: 20, fontWeight: '700' },
  grid: { padding: 2 },
  item: { width: '33.33%', padding: 2 },
  img: { width: '100%', aspectRatio: 1 },
  placeholder: { backgroundColor: C.CARD_BG, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: C.TEXT_MUTED, fontSize: 16 },
});
