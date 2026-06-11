import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getMyNotifications, markMyNotificationsRead } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import AppFooter from '../components/AppFooter';
import { C, borderRadius } from '../theme';

const PHOTO_TYPES = new Set(['photo_like', 'photo_comment']);
const ORDER_TYPES = new Set(['order_paid', 'order_processed', 'order_shipped', 'tracking_updated']);

function notificationLabel(type: string) {
  if (type === 'photo_like') return 'Like';
  if (type === 'photo_comment') return 'Comment';
  if (ORDER_TYPES.has(type)) return 'Order';
  return 'Notice';
}

function formatWhen(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (markRead = false) => {
    try {
      const data = await getMyNotifications();
      const rows = data?.notifications || [];
      setNotifications(rows);
      if (markRead && Number(data?.unread || 0) > 0) {
        markMyNotificationsRead().catch(() => {});
      }
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(true); }, [load]);
  useFocusEffect(useCallback(() => { load(true); }, [load]));

  const openNotification = (item: any) => {
    if (PHOTO_TYPES.has(item.type) && item.related_id) {
      navigation.navigate('SubmissionDetail' as never, {
        submissionId: item.related_id,
        id: item.related_id,
      } as never);
      return;
    }
    if (ORDER_TYPES.has(item.type)) {
      navigation.navigate('OrderHistory' as never);
      return;
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (navigation.canGoBack?.() ? navigation.goBack() : navigation.navigate('Main' as never, { screen: 'HomeTab' } as never))}
        >
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(true); }}
            tintColor={C.ORANGE}
          />
        }
        renderItem={({ item }) => {
          const unread = !item.is_read;
          const canOpen = (PHOTO_TYPES.has(item.type) && item.related_id) || ORDER_TYPES.has(item.type);
          return (
            <TouchableOpacity
              activeOpacity={canOpen ? 0.82 : 1}
              onPress={() => openNotification(item)}
              style={[styles.card, unread && styles.cardUnread]}
            >
              <View style={styles.cardTop}>
                <View style={styles.labelPill}>
                  <Text style={styles.labelText}>{notificationLabel(item.type)}</Text>
                </View>
                <Text style={styles.time}>{formatWhen(item.created_at)}</Text>
              </View>
              <Text style={styles.itemTitle}>{item.title}</Text>
              {!!item.message && <Text style={styles.message}>{item.message}</Text>}
              {canOpen && <Text style={styles.openHint}>{PHOTO_TYPES.has(item.type) ? 'View photo' : 'View order'}</Text>}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySub}>Likes, comments, and order updates will show up here.</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.DIVIDER,
  },
  back: { color: C.ORANGE, fontSize: 15, fontWeight: '800' },
  title: { color: C.TEXT, fontSize: 24, fontWeight: '900' },
  list: { padding: 16, paddingBottom: 0 },
  card: {
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    padding: 16,
    marginBottom: 12,
  },
  cardUnread: {
    borderColor: C.TEAL,
    backgroundColor: 'rgba(111, 230, 184, 0.08)',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 },
  labelPill: {
    borderRadius: borderRadius.pill,
    backgroundColor: 'rgba(255, 165, 0, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.45)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  labelText: { color: C.ORANGE, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' as any },
  time: { color: C.TEXT_MUTED, fontSize: 12, fontWeight: '700' },
  itemTitle: { color: C.TEXT, fontSize: 18, lineHeight: 23, fontWeight: '900', marginBottom: 6 },
  message: { color: '#D6DEEA', fontSize: 14, lineHeight: 20, fontWeight: '600' },
  openHint: { color: C.TEAL, fontSize: 13, fontWeight: '900', marginTop: 12 },
  empty: { alignItems: 'center', paddingTop: 70, paddingHorizontal: 28, paddingBottom: 40 },
  emptyTitle: { color: C.TEXT, fontSize: 21, fontWeight: '900', marginBottom: 8 },
  emptySub: { color: '#D6DEEA', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  footerGap: { height: 28 },
});
