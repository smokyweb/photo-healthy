import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, Alert, RefreshControl, TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import {
  adminGetDashboardStats, adminGetUsers, adminGetSettings, adminUpdateSettings,
  adminGetProducts, createChallenge, updateChallenge, deleteChallenge,
  deleteSubmission, deleteUser, adminGetOrders, adminGetContactSubmissions,
  adminGetPartnerInquiries,
} from '../services/api';
import GradientButton from '../components/GradientButton';
import LoadingSpinner from '../components/LoadingSpinner';
import Input from '../components/Input';
import { C, borderRadius } from '../theme';

const TABS = ['Dashboard', 'Challenges', 'Users', 'Moderate', 'Products', 'Orders', 'Settings'];

export default function AdminScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [stats, setStats] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});

  // Check admin access
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      Alert.alert('Access Denied', 'Admin access required.');
      navigation.goBack();
    }
  }, [user]);

  const loadTab = async (tab: string) => {
    setLoading(true);
    try {
      switch (tab) {
        case 'Dashboard': {
          const data = await adminGetDashboardStats();
          setStats(data || {});
          break;
        }
        case 'Users': {
          const data = await adminGetUsers();
          setUsers(data?.users || data || []);
          break;
        }
        case 'Products': {
          const data = await adminGetProducts();
          setProducts(data?.products || data || []);
          break;
        }
        case 'Orders': {
          const data = await adminGetOrders();
          setOrders(data?.orders || data || []);
          break;
        }
        case 'Settings': {
          const data = await adminGetSettings();
          setSettings(data || {});
          break;
        }
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadTab(activeTab); }, [activeTab]);

  const renderDashboard = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Overview</Text>
      <View style={styles.statsGrid}>
        {[
          { label: 'Total Users', value: stats.total_users || 0, icon: 'ðŸ‘¥' },
          { label: 'Total Submissions', value: stats.total_submissions || 0, icon: 'ðŸ“·' },
          { label: 'Active Challenges', value: stats.active_challenges || 0, icon: 'ðŸ†' },
          { label: 'Pro Members', value: stats.pro_members || 0, icon: 'â­' },
          { label: 'Orders Today', value: stats.orders_today || 0, icon: 'ðŸ›’' },
          { label: 'Revenue (Month)', value: stats.monthly_revenue ? `$${stats.monthly_revenue}` : '$0', icon: 'ðŸ’°' },
        ].map(s => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statIcon}>{s.icon}</Text>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderUsers = () => (
    <FlatList
      data={users}
      keyExtractor={i => String(i.id)}
      contentContainerStyle={styles.section}
      ListHeaderComponent={<Text style={styles.sectionTitle}>Users ({users.length})</Text>}
      renderItem={({ item }) => (
        <View style={styles.listItem}>
          <View style={styles.listItemInfo}>
            <Text style={styles.listItemTitle}>{item.name}</Text>
            <Text style={styles.listItemSub}>{item.email}</Text>
            <Text style={styles.listItemMeta}>
              Role: {item.role} | {item.is_pro ? 'â­ Pro' : 'Free'} | Joined: {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => Alert.alert('Delete User', `Delete ${item.name}?`, [
              { text: 'Cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => deleteUser(item.id).then(() => setUsers(u => u.filter(x => x.id !== item.id))) },
            ])}
          >
            <Text style={styles.deleteBtn}>ðŸ—‘ï¸</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );

  const renderOrders = () => (
    <FlatList
      data={orders}
      keyExtractor={i => String(i.id)}
      contentContainerStyle={styles.section}
      ListHeaderComponent={<Text style={styles.sectionTitle}>Orders ({orders.length})</Text>}
      renderItem={({ item }) => (
        <View style={styles.listItem}>
          <View style={styles.listItemInfo}>
            <Text style={styles.listItemTitle}>Order #{item.id} â€” {item.user_name || 'Unknown'}</Text>
            <Text style={styles.listItemSub}>${Number(item.total || 0).toFixed(2)} Â· {item.status}</Text>
            <Text style={styles.listItemMeta}>{new Date(item.created_at).toLocaleDateString()}</Text>
          </View>
        </View>
      )}
    />
  );

  const renderSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Site Settings</Text>
      <Input
        label="Site Name"
        value={settings.site_name || ''}
        onChangeText={v => setSettings((s: any) => ({ ...s, site_name: v }))}
      />
      <Input
        label="Tagline"
        value={settings.tagline || ''}
        onChangeText={v => setSettings((s: any) => ({ ...s, tagline: v }))}
      />
      <Input
        label="Max Free Submissions Per Challenge"
        value={String(settings.max_free_submissions || 3)}
        onChangeText={v => setSettings((s: any) => ({ ...s, max_free_submissions: parseInt(v) || 3 }))}
        keyboardType="numeric"
      />
      <GradientButton
        label="Save Settings"
        onPress={() => adminUpdateSettings(settings).then(() => Alert.alert('Saved', 'Settings updated!'))}
        style={{ marginTop: 8 }}
      />
    </View>
  );

  if (!user || user.role !== 'admin') return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>â† Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>ðŸ›¡ï¸ Admin Panel</Text>
      </View>

      {/* Tab Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTab(activeTab); }} tintColor={C.ORANGE} />}
        >
          {activeTab === 'Dashboard' && renderDashboard()}
          {activeTab === 'Users' && renderUsers()}
          {activeTab === 'Orders' && renderOrders()}
          {activeTab === 'Settings' && renderSettings()}
          {(activeTab === 'Challenges' || activeTab === 'Moderate' || activeTab === 'Products') && (
            <View style={styles.section}>
              <Text style={styles.comingSoon}>
                {activeTab} management coming soon.
              </Text>
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: C.BG },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    padding: 16, borderBottomWidth: 1, borderBottomColor: C.DIVIDER,
  },
  back: { color: C.ORANGE, fontSize: 15 },
  title: { color: C.TEXT, fontSize: 20, fontWeight: '800' },
  tabBar: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: C.DIVIDER },
  tabBarContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 6, flexDirection: 'row' },
  tabBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: borderRadius.pill,
    backgroundColor: C.CARD_BG,
    borderWidth: 1, borderColor: C.CARD_BORDER,
  },
  tabBtnActive: { backgroundColor: C.ORANGE, borderColor: C.ORANGE },
  tabText: { color: C.TEXT_MUTED, fontSize: 13 },
  tabTextActive: { color: C.WHITE, fontWeight: '700' },
  content: { flex: 1 },
  section: { padding: 16 },
  sectionTitle: { color: C.TEXT, fontSize: 18, fontWeight: '700', marginBottom: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '47%', backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.lg, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: C.CARD_BORDER,
  },
  statIcon: { fontSize: 24, marginBottom: 4 },
  statValue: { color: C.ORANGE, fontSize: 22, fontWeight: '800', marginBottom: 2 },
  statLabel: { color: C.TEXT_MUTED, fontSize: 11, textAlign: 'center' },
  listItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.CARD_BG, borderRadius: borderRadius.md,
    padding: 12, marginBottom: 8, borderWidth: 1, borderColor: C.CARD_BORDER,
  },
  listItemInfo: { flex: 1 },
  listItemTitle: { color: C.TEXT, fontWeight: '600', marginBottom: 2 },
  listItemSub: { color: C.TEXT_SECONDARY, fontSize: 13, marginBottom: 2 },
  listItemMeta: { color: C.TEXT_MUTED, fontSize: 11 },
  deleteBtn: { fontSize: 20, padding: 4 },
  comingSoon: { color: C.TEXT_MUTED, fontSize: 16, textAlign: 'center', paddingTop: 40 },
});
