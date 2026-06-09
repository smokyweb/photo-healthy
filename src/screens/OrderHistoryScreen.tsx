import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getMyOrders } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { C, borderRadius } from '../theme';
import AppFooter from '../components/AppFooter';

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  pending: { color: '#f59e0b', label: 'Payment Pending' },
  paid: { color: '#3b82f6', label: 'Paid - Packing' },
  processed: { color: '#8b5cf6', label: 'Packed - Ready' },
  fulfilled: { color: '#22c55e', label: 'Shipped' },
  shipped: { color: '#22c55e', label: 'Shipped' },
  cancelled: { color: '#ef4444', label: 'Cancelled' },
  refunded: { color: '#ef4444', label: 'Refunded' },
  failed: { color: '#ef4444', label: 'Payment Failed' },
};

export default function OrderHistoryScreen() {
  const navigation = useNavigation<any>();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const goBackToProfile = () => {
    if (navigation.canGoBack?.()) navigation.goBack();
    else navigation.navigate('Main' as never, { screen: 'ProfileTab' } as never);
  };

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
        <TouchableOpacity onPress={goBackToProfile}>
          <Text style={styles.back}>Back</Text>
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
              <TouchableOpacity onPress={() => toggleExpand(o.id)} activeOpacity={0.8} style={styles.cardHeader}>
                <View style={styles.headerMain}>
                  <View style={styles.titleRow}>
                    <Text style={styles.orderId}>Order #{o.id}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: cfg.color + '22', borderColor: cfg.color + '66' }]}>
                      <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.orderDate}>
                    {o.created_at ? new Date(o.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                  </Text>
                  <View style={styles.metaRow}>
                    {total !== null && <Text style={styles.orderTotal}>Total: ${total.toFixed(2)}</Text>}
                    <Text style={styles.muted}>{items.length} item{items.length !== 1 ? 's' : ''}</Text>
                  </View>
                  {o.tracking_number && (
                    <Text style={styles.tracking}>Tracking: {o.tracking_number}</Text>
                  )}
                </View>
                <Text style={[styles.expandIcon, { color: isOpen ? C.ORANGE : C.TEXT_MUTED }]}>{isOpen ? 'Hide' : 'Details'}</Text>
              </TouchableOpacity>

              {isOpen && (
                <View style={styles.detail}>
                  <Text style={styles.sectionLabel}>Items Ordered</Text>
                  {items.length === 0 ? (
                    <Text style={styles.muted}>No item details available</Text>
                  ) : items.map((item: any, i: number) => (
                    <View key={i} style={[styles.lineItem, i < items.length - 1 && styles.lineItemBorder]}>
                      <View style={styles.lineItemInfo}>
                        <Text style={styles.itemName}>{item.title || item.name || ('Item ' + (i + 1))}</Text>
                        {item.size ? <Text style={styles.muted}>Size: {item.size}</Text> : null}
                        <Text style={styles.muted}>Qty: {item.quantity || 1}</Text>
                      </View>
                      <Text style={styles.itemPrice}>
                        ${(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}
                      </Text>
                    </View>
                  ))}

                  {total !== null && (
                    <View style={styles.totalsBox}>
                      <View style={styles.totalsRow}>
                        <Text style={styles.muted}>Subtotal</Text>
                        <Text style={styles.muted}>${total.toFixed(2)}</Text>
                      </View>
                      {o.shipping_method && (
                        <View style={styles.totalsRow}>
                          <Text style={styles.muted}>Shipping ({o.shipping_method})</Text>
                          <Text style={styles.muted}>Calculated at checkout</Text>
                        </View>
                      )}
                      <View style={[styles.totalsRow, styles.totalFinal]}>
                        <Text style={styles.totalLabel}>Total Charged</Text>
                        <Text style={styles.totalAmount}>${total.toFixed(2)} {o.currency?.toUpperCase() || 'USD'}</Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.infoBox}>
                    <Text style={styles.sectionLabel}>Shipping</Text>
                    {addr ? (
                      [addr.name || o.customer_name, addr.line1, addr.line2, [addr.city, addr.state].filter(Boolean).join(', ') + (addr.postal_code ? ' ' + addr.postal_code : ''), addr.country]
                        .filter(Boolean)
                        .map((line: string, i: number) => <Text key={i} style={styles.addressLine}>{line}</Text>)
                    ) : (
                      <Text style={styles.muted}>Address details are not available yet. You will receive updates when the order status changes.</Text>
                    )}
                  </View>

                  {o.tracking_number && (
                    <View style={[styles.infoBox, styles.trackingBox]}>
                      <Text style={[styles.sectionLabel, { color: '#22c55e' }]}>Tracking Number</Text>
                      <Text style={styles.trackingNumber}>{o.tracking_number}</Text>
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
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySub}>Your order history will appear here after checkout.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Shop' as never)} style={styles.shopBtn}>
              <Text style={styles.shopBtnText}>Browse Shop</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          <View>
            <View style={styles.footerGap} />
            <AppFooter />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderBottomWidth: 1, borderBottomColor: C.DIVIDER },
  back: { color: C.ORANGE, fontSize: 15, fontWeight: '700' },
  title: { color: C.TEXT, fontSize: 22, fontWeight: '900' },
  list: { padding: 16, paddingBottom: 0 },
  card: {
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.lg,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    overflow: 'visible',
  },
  cardHeader: { padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headerMain: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 },
  orderId: { color: C.TEXT, fontWeight: '900', fontSize: 17 },
  statusBadge: { borderRadius: borderRadius.pill, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  statusText: { fontSize: 13, fontWeight: '900' },
  orderDate: { color: '#D6DEEA', fontSize: 13, marginTop: 2, fontWeight: '600' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginTop: 5 },
  orderTotal: { color: C.ORANGE, fontWeight: '900', fontSize: 16 },
  tracking: { color: '#22c55e', fontSize: 13, fontWeight: '800', marginTop: 5 },
  expandIcon: { fontSize: 13, lineHeight: 18, fontWeight: '900', marginTop: 2 },
  detail: {
    borderTopWidth: 1,
    borderTopColor: C.CARD_BORDER,
    padding: 16,
    paddingTop: 14,
    overflow: 'visible',
  },
  sectionLabel: { color: '#EAF0F8', fontSize: 13, fontWeight: '900', textTransform: 'uppercase' as any, marginBottom: 8, marginTop: 4 },
  lineItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 9 },
  lineItemBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  lineItemInfo: { flex: 1, minWidth: 0 },
  itemName: { color: C.TEXT, fontSize: 15, lineHeight: 20, fontWeight: '800' },
  itemPrice: { color: C.TEAL, fontWeight: '900', fontSize: 15, flexShrink: 0 },
  muted: { color: '#D6DEEA', fontSize: 13, lineHeight: 19, fontWeight: '600' },
  totalsBox: { marginTop: 12, paddingTop: 8 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 5, flexWrap: 'wrap' },
  totalFinal: { borderTopWidth: 1, borderTopColor: C.DIVIDER, paddingTop: 11, marginTop: 6 },
  totalLabel: { color: C.TEXT, fontWeight: '900', fontSize: 15 },
  totalAmount: { color: C.ORANGE, fontWeight: '900', fontSize: 16 },
  infoBox: {
    backgroundColor: C.CARD_BG2,
    borderRadius: 10,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  addressLine: { color: C.TEXT, fontSize: 14, lineHeight: 21, fontWeight: '700' },
  trackingBox: { backgroundColor: '#22c55e11', borderColor: '#22c55e33' },
  trackingNumber: { color: '#22c55e', fontSize: 16, fontWeight: '900', lineHeight: 22 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32, paddingBottom: 40 },
  emptyTitle: { color: C.TEXT, fontSize: 20, fontWeight: '900', marginBottom: 8 },
  emptySub: { color: '#D6DEEA', fontSize: 15, textAlign: 'center', marginBottom: 20, lineHeight: 21 },
  shopBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, backgroundColor: C.ORANGE },
  shopBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  footerGap: { height: 96 },
});
