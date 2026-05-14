import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getMyOrders } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { C, borderRadius } from '../theme';
import AppFooter from '../components/AppFooter';

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: string }> = {
  pending:   { color: '#f59e0b', label: 'Payment Pending',   icon: '⏳' },
  paid:      { color: '#3b82f6', label: 'Paid — Packing',    icon: '📦' },
  processed: { color: '#8b5cf6', label: 'Packed — Ready',    icon: '📦' },
  fulfilled: { color: '#22c55e', label: 'Shipped',           icon: '🚚' },
  shipped:   { color: '#22c55e', label: 'Shipped',           icon: '🚚' },
  cancelled: { color: '#ef4444', label: 'Cancelled',         icon: '❌' },
  refunded:  { color: '#ef4444', label: 'Refunded',          icon: '❌' },
  failed:    { color: '#ef4444', label: 'Payment Failed',    icon: '❌' },
};

export default function OrderHistoryScreen() {
  const navigation = useNavigation<any>();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

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

  const getItems = (order: any): any[] => {
    if (Array.isArray(order.items)) return order.items;
    if (typeof order.items_json === 'string') {
      try { return JSON.parse(order.items_json); } catch {}
    }
    return [];
  };

  const getTotal = (order: any): number | null => {
    const t = order.total_amount ?? order.total ?? order.amount_total;
    const n = typeof t === 'string' ? parseFloat(t) : Number(t);
    return isNaN(n) ? null : n;
  };

  const getAddress = (order: any) => {
    if (!order.shipping_address_json) return null;
    try {
      return typeof order.shipping_address_json === 'string'
        ? JSON.parse(order.shipping_address_json)
        : order.shipping_address_json;
    } catch { return null; }
  };

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Orders</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.ORANGE} />}
        renderItem={({ item: o }) => {
          const cfg = STATUS_CONFIG[o.status?.toLowerCase()] || STATUS_CONFIG.pending;
          const total = getTotal(o);
          const items = getItems(o);
          const addr = getAddress(o);
          const isOpen = expanded.has(o.id);

          return (
            <View style={styles.card}>
              {/* Order header - always visible */}
              <TouchableOpacity onPress={() => toggleExpand(o.id)} activeOpacity={0.8}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Text style={styles.orderId}>Order #{o.id}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: cfg.color + '22', borderColor: cfg.color + '55' }]}>
                        <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.icon} {cfg.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.orderDate}>{o.created_at ? new Date(o.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</Text>
                    {total !== null && <Text style={styles.orderTotal}>Total: ${total.toFixed(2)}</Text>}
                    {o.tracking_number && (
                      <Text style={styles.tracking}>🚚 Tracking: {o.tracking_number}</Text>
                    )}
                  </View>
                  <Text style={{ color: C.TEXT_MUTED, fontSize: 18 }}>{isOpen ? '▼' : '▶'}</Text>
                </View>
              </TouchableOpacity>

              {/* Expanded detail */}
              {isOpen && (
                <View style={styles.detail}>

                  {/* Items */}
                  <Text style={styles.sectionLabel}>📦 Items Ordered</Text>
                  {items.length === 0 ? (
                    <Text style={styles.muted}>No item details available</Text>
                  ) : items.map((item: any, i: number) => (
                    <View key={i} style={styles.lineItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{item.title || item.name || ('Item ' + (i + 1))}</Text>
                        {item.size ? <Text style={styles.muted}>Size: {item.size}</Text> : null}
                        <Text style={styles.muted}>Qty: {item.quantity || 1}</Text>
                      </View>
                      <Text style={styles.itemPrice}>
                        ${(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}
                      </Text>
                    </View>
                  ))}

                  {/* Totals */}
                  {total !== null && (
                    <View style={styles.totalsRow}>
                      <Text style={styles.muted}>Subtotal</Text>
                      <Text style={styles.muted}>${total.toFixed(2)}</Text>
                    </View>
                  )}
                  {o.shipping_method && (
                    <View style={styles.totalsRow}>
                      <Text style={styles.muted}>Shipping ({o.shipping_method})</Text>
                      <Text style={styles.muted}>—</Text>
                    </View>
                  )}
                  {total !== null && (
                    <View style={[styles.totalsRow, styles.totalFinal]}>
                      <Text style={styles.totalLabel}>Total Charged</Text>
                      <Text style={styles.totalAmount}>${total.toFixed(2)} {o.currency?.toUpperCase() || 'USD'}</Text>
                    </View>
                  )}

                  {/* Shipping address */}
                  {addr ? (
                    <View style={styles.addressBox}>
                      <Text style={styles.sectionLabel}>🚚 Shipping To</Text>
                      {[addr.name || o.customer_name, addr.line1, addr.line2, [addr.city, addr.state].filter(Boolean).join(', ') + (addr.postal_code ? ' ' + addr.postal_code : ''), addr.country].filter(Boolean).map((line: string, i: number) => (
                        <Text key={i} style={styles.addressLine}>{line}</Text>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.addressBox}>
                      <Text style={styles.sectionLabel}>🚚 Shipping Address</Text>
                      <Text style={styles.muted}>Address details not yet available — you'll receive a confirmation email when shipped.</Text>
                    </View>
                  )}

                  {/* Tracking */}
                  {o.tracking_number && (
                    <View style={[styles.addressBox, { backgroundColor: '#22c55e11', borderColor: '#22c55e33' }]}>
                      <Text style={[styles.sectionLabel, { color: '#22c55e' }]}>🚚 Tracking Number</Text>
                      <Text style={{ color: '#22c55e', fontSize: 15, fontWeight: '700' }}>{o.tracking_number}</Text>
                      {o.fulfilled_at && <Text style={styles.muted}>Shipped on {new Date(o.fulfilled_at).toLocaleDateString()}</Text>}
                    </View>
                  )}

                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📦</Text>
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySub}>Your order history will appear here after checkout.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Shop' as never)} style={styles.shopBtn}>
              <Text style={styles.shopBtnText}>🛒 Browse Shop</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderBottomWidth: 1, borderBottomColor: C.DIVIDER },
  back: { color: C.ORANGE, fontSize: 15, fontWeight: '600' },
  title: { color: C.TEXT, fontSize: 20, fontWeight: '700' },
  list: { padding: 16, paddingBottom: 32 },
  card: { backgroundColor: C.CARD_BG, borderRadius: borderRadius.lg, marginBottom: 12, borderWidth: 1, borderColor: C.CARD_BORDER, overflow: 'hidden' },
  cardHeader: { padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  orderId: { color: C.TEXT, fontWeight: '700', fontSize: 15 },
  statusBadge: { borderRadius: borderRadius.pill, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  statusText: { fontSize: 12, fontWeight: '700' },
  orderDate: { color: C.TEXT_MUTED, fontSize: 12, marginTop: 3 },
  orderTotal: { color: C.ORANGE, fontWeight: '800', fontSize: 16, marginTop: 2 },
  tracking: { color: '#22c55e', fontSize: 12, fontWeight: '600', marginTop: 2 },
  detail: { borderTopWidth: 1, borderTopColor: C.CARD_BORDER, padding: 14 },
  sectionLabel: { color: C.TEXT_SECONDARY, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 12 },
  lineItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.CARD_BORDER },
  itemName: { color: C.TEXT, fontSize: 14, fontWeight: '600' },
  itemPrice: { color: C.ORANGE, fontWeight: '700', fontSize: 14 },
  muted: { color: C.TEXT_MUTED, fontSize: 12 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, marginTop: 4 },
  totalFinal: { borderTopWidth: 1, borderTopColor: C.DIVIDER, paddingTop: 10, marginTop: 4 },
  totalLabel: { color: C.TEXT, fontWeight: '700', fontSize: 14 },
  totalAmount: { color: C.ORANGE, fontWeight: '800', fontSize: 16 },
  addressBox: { backgroundColor: C.CARD_BG2, borderRadius: 10, padding: 12, marginTop: 12, borderWidth: 1, borderColor: C.CARD_BORDER },
  addressLine: { color: C.TEXT, fontSize: 13, lineHeight: 20 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle: { color: C.TEXT, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySub: { color: C.TEXT_MUTED, fontSize: 14, textAlign: 'center', marginBottom: 20 },
  shopBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, backgroundColor: C.ORANGE },
  shopBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
