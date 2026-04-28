import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getMyOrders } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { C, borderRadius } from '../theme';
import AppFooter from '../components/AppFooter';

export default function OrderHistoryScreen() {
  const navigation = useNavigation<any>();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await getMyOrders();
      setOrders(data?.orders || data || []);
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
        <Text style={styles.title}>Order History</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.ORANGE} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.orderId}>Order #{item.id}</Text>
              <View style={[styles.badge, { backgroundColor: item.status === 'completed' ? C.SUCCESS + '22' : C.WARNING + '22' }]}>
                <Text style={[styles.badgeText, { color: item.status === 'completed' ? C.SUCCESS : C.WARNING }]}>
                  {item.status}
                </Text>
              </View>
            </View>
            <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
            <Text style={styles.total}>Total: ${Number(item.total).toFixed(2)}</Text>
            {item.items && item.items.map((oi: any, idx: number) => (
              <Text key={idx} style={styles.orderItem}>
                • {oi.name} × {oi.quantity}
              </Text>
            ))}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No orders yet</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Shop')} style={{ marginTop: 12 }}>
              <Text style={{ color: C.ORANGE, fontSize: 14 }}>Browse Shop →</Text>
            </TouchableOpacity>
          </View>
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
  list: { padding: 16 },
  card: {
    backgroundColor: C.CARD_BG, borderRadius: borderRadius.lg,
    padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.CARD_BORDER,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  orderId: { color: C.TEXT, fontWeight: '700' },
  badge: { borderRadius: borderRadius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  date: { color: C.TEXT_MUTED, fontSize: 12, marginBottom: 4 },
  total: { color: C.ORANGE, fontWeight: '700', marginBottom: 6 },
  orderItem: { color: C.TEXT_SECONDARY, fontSize: 13, marginBottom: 2 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: C.TEXT_MUTED, fontSize: 16 },
});
