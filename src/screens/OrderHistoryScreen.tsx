import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getMyOrders } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { C, borderRadius } from '../theme';
import AppFooter from '../components/AppFooter';

const STATUS_COLORS: Record<string, string> = {
  paid: '#22c55e',
  pending: '#f59e0b',
  fulfilled: '#3b82f6',
  shipped: '#8b5cf6',
  cancelled: '#ef4444',
  refunded: '#ef4444',
};

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

  const getTotal = (order: any) => {
    // API returns total_amount (string or number)
    const t = order.total_amount ?? order.total ?? order.amount_total;
    const n = typeof t === 'string' ? parseFloat(t) : Number(t);
    return isNaN(n) ? null : n;
  };

  const getItems = (order: any): any[] => {
    if (Array.isArray(order.items)) return order.items;
    if (typeof order.items_json === 'string') {
      try { return JSON.parse(order.items_json); } catch {}
    }
    return [];
  };

  const getStatusColor = (status: string) => STATUS_COLORS[status?.toLowerCase()] || '#8B9AB0';

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      paid: 'Paid',
      pending: 'Pending',
      fulfilled: 'Fulfilled',
      shipped: 'Shipped',
      cancelled: 'Cancelled',
      refunded: 'Refunded',
    };
    return labels[status?.toLowerCase()] || status || 'Unknown';
  };

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
        renderItem={({ item }) => {
          const total = getTotal(item);
          const lineItems = getItems(item);
          const statusColor = getStatusColor(item.status);
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.orderId}>Order #{item.id}</Text>
                <View style={[styles.badge, { backgroundColor: statusColor + '22', borderColor: statusColor + '55', borderWidth: 1 }]}>
                  <Text style={[styles.badgeText, { color: statusColor }]}>{getStatusLabel(item.status)}</Text>
                </View>
              </View>

              <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</Text>

              {total !== null && (
                <Text style={styles.total}>${total.toFixed(2)} {item.currency?.toUpperCase() || 'USD'}</Text>
              )}

              {lineItems.length > 0 && (
                <View style={styles.itemsSection}>
                  <Text style={styles.itemsLabel}>Items:</Text>
                  {lineItems.map((oi: any, idx: number) => (
                    <Text key={idx} style={styles.orderItem}>
                      • {oi.title || oi.name} {oi.size ? '(' + oi.size + ')' : ''} × {oi.quantity}
                      {oi.price ? '  —  $' + Number(oi.price * oi.quantity).toFixed(2) : ''}
                    </Text>
                  ))}
                </View>
              )}

              {item.tracking_number && (
                <Text style={styles.tracking}>Tracking: {item.tracking_number}</Text>
              )}

              {item.customer_email && (
                <Text style={styles.email}>Confirmation sent to: {item.customer_email}</Text>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📦</Text>
            <Text style={styles.emptyText}>No orders yet</Text>
            <Text style={styles.emptySub}>Your order history will appear here after checkout.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Shop' as never)} style={styles.shopBtn}>
              <Text style={styles.shopBtnText}>Browse Shop →</Text>
            </TouchableOpacity>
          </View>
        }
      />
      <AppFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.BG },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    padding: 16, borderBottomWidth: 1, borderBottomColor: C.DIVIDER,
  },
  back: { color: C.ORANGE, fontSize: 15, fontWeight: '600' },
  title: { color: C.TEXT, fontSize: 20, fontWeight: '700' },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: C.CARD_BG, borderRadius: borderRadius.lg,
    padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.CARD_BORDER,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderId: { color: C.TEXT, fontWeight: '700', fontSize: 15 },
  badge: { borderRadius: borderRadius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  date: { color: C.TEXT_MUTED, fontSize: 12, marginBottom: 6 },
  total: { color: C.ORANGE, fontWeight: '800', fontSize: 18, marginBottom: 10 },
  itemsSection: { marginBottom: 8 },
  itemsLabel: { color: C.TEXT_SECONDARY, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  orderItem: { color: C.TEXT_SECONDARY, fontSize: 13, marginBottom: 3, lineHeight: 18 },
  tracking: { color: C.TEAL, fontSize: 13, marginTop: 6, fontWeight: '600' },
  email: { color: C.TEXT_MUTED, fontSize: 12, marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyText: { color: C.TEXT, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySub: { color: C.TEXT_MUTED, fontSize: 14, textAlign: 'center', marginBottom: 20 },
  shopBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, backgroundColor: C.ORANGE },
  shopBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
