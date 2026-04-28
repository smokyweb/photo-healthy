import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, RefreshControl, Switch, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import {
  adminGetDashboardStats, adminGetUsers, adminGetSettings, adminUpdateSettings,
  adminGetProducts, createProduct, updateProduct, deleteProduct,
  getChallenges, createChallenge, updateChallenge, deleteChallenge,
  getSubmissions, deleteSubmission,
  adminGetOrders, deleteUser, updateUser,
} from '../services/api';
import GradientButton from '../components/GradientButton';
import LoadingSpinner from '../components/LoadingSpinner';
import Input from '../components/Input';
import { C, borderRadius } from '../theme';

const TABS = ['Dashboard', 'Challenges', 'Users', 'Submissions', 'Products', 'Orders', 'Settings'];

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
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});

  // Challenge form state
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<any>(null);
  const [challengeForm, setChallengeForm] = useState({
    title: '', description: '', start_date: '', end_date: '',
    category: '', feeling_category: '', movement_category: '', is_pro_only: false,
    duration_days: '30', global_end_date: '',
  });

  // Product form state
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '', description: '', price: '', is_pro_only: false, featured: false,
  });

  // Admin access check
  if (!user?.is_admin && user?.role !== 'admin') {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center', flex: 1 }]}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🔒</Text>
        <Text style={{ color: C.TEXT, fontSize: 20, fontWeight: '700', marginBottom: 8 }}>Access Denied</Text>
        <Text style={{ color: C.TEXT_MUTED, marginBottom: 24 }}>Admin access required.</Text>
        <GradientButton label="Go Back" onPress={() => navigation.goBack()} variant="outline" />
      </View>
    );
  }

  const loadTab = async (tab: string) => {
    setLoading(true);
    try {
      switch (tab) {
        case 'Dashboard': {
          const data = await adminGetDashboardStats();
          setStats(data || {});
          break;
        }
        case 'Challenges': {
          const data = await getChallenges();
          setChallenges(data?.challenges || data || []);
          break;
        }
        case 'Users': {
          const data = await adminGetUsers();
          setUsers(data?.users || data || []);
          break;
        }
        case 'Submissions': {
          const data = await getSubmissions({ limit: '50' });
          setSubmissions(data?.submissions || data || []);
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

  // ── Dashboard ──────────────────────────────────────────────────────────────
  const renderDashboard = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📊 Overview</Text>
      <View style={styles.statsGrid}>
        {[
          { label: 'Total Users', value: stats.total_users ?? 0, icon: '👥' },
          { label: 'Submissions', value: stats.total_submissions ?? 0, icon: '📷' },
          { label: 'Active Challenges', value: stats.active_challenges ?? 0, icon: '🏆' },
          { label: 'Pro Members', value: stats.pro_members ?? 0, icon: '⭐' },
          { label: 'Orders Today', value: stats.orders_today ?? 0, icon: '🛒' },
          { label: 'Monthly Revenue', value: stats.monthly_revenue ? `$${Number(stats.monthly_revenue).toFixed(2)}` : '$0.00', icon: '💰' },
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

  // ── Challenges ─────────────────────────────────────────────────────────────
  const openChallengeForm = (ch?: any) => {
    if (ch) {
      setEditingChallenge(ch);
      setChallengeForm({
        title: ch.title || '',
        description: ch.description || '',
        start_date: ch.start_date || '',
        end_date: ch.end_date || '',
        category: ch.category || '',
        feeling_category: ch.feeling_category || '',
        movement_category: ch.movement_category || '',
        is_pro_only: !!ch.is_pro_only,
        duration_days: String(ch.duration_days || 30),
        global_end_date: ch.global_end_date || '',
      });
    } else {
      setEditingChallenge(null);
      setChallengeForm({ title: '', description: '', start_date: '', end_date: '', category: '', feeling_category: '', movement_category: '', is_pro_only: false, duration_days: '30', global_end_date: '' });
    }
    setShowChallengeForm(true);
  };

  const saveChallenge = async () => {
    try {
      const payload = {
        ...challengeForm,
        duration_days: parseInt(challengeForm.duration_days) || 30,
        global_end_date: challengeForm.global_end_date || null,
      };
      if (editingChallenge) {
        await updateChallenge(editingChallenge.id, payload);
        setChallenges(cs => cs.map(c => c.id === editingChallenge.id ? { ...c, ...payload } : c));
      } else {
        const created = await createChallenge(payload);
        setChallenges(cs => [...cs, created?.challenge || created]);
      }
      setShowChallengeForm(false);
      Alert.alert('Saved', editingChallenge ? 'Challenge updated.' : 'Challenge created.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDeleteChallenge = (id: number, title: string) => {
    Alert.alert('Delete Challenge', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteChallenge(id);
            setChallenges(cs => cs.filter(c => c.id !== id));
          } catch (e: any) { Alert.alert('Error', e.message); }
        },
      },
    ]);
  };

  const renderChallenges = () => (
    <View style={styles.section}>
      <View style={styles.rowBetween}>
        <Text style={styles.sectionTitle}>🏆 Challenges ({challenges.length})</Text>
        <GradientButton label="+ New" onPress={() => openChallengeForm()} variant="primary" size="sm" />
      </View>

      {showChallengeForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{editingChallenge ? 'Edit Challenge' : 'New Challenge'}</Text>
          <Input label="Title" value={challengeForm.title} onChangeText={v => setChallengeForm(f => ({ ...f, title: v }))} />
          <Input label="Description" value={challengeForm.description} onChangeText={v => setChallengeForm(f => ({ ...f, description: v }))} multiline numberOfLines={3} />
          <Input label="Start Date (YYYY-MM-DD)" value={challengeForm.start_date} onChangeText={v => setChallengeForm(f => ({ ...f, start_date: v }))} />
          <Input label="End Date (YYYY-MM-DD)" value={challengeForm.end_date} onChangeText={v => setChallengeForm(f => ({ ...f, end_date: v }))} />
          <Input label="Category" value={challengeForm.category} onChangeText={v => setChallengeForm(f => ({ ...f, category: v }))} />
          <Input label="Feeling Category" value={challengeForm.feeling_category} onChangeText={v => setChallengeForm(f => ({ ...f, feeling_category: v }))} />
          <Input label="Movement Category" value={challengeForm.movement_category} onChangeText={v => setChallengeForm(f => ({ ...f, movement_category: v }))} />
          <Input label="Duration (days)" value={challengeForm.duration_days} onChangeText={v => setChallengeForm(f => ({ ...f, duration_days: v }))} keyboardType="numeric" />
          <Input label="Global End Date (optional, YYYY-MM-DD)" value={challengeForm.global_end_date} onChangeText={v => setChallengeForm(f => ({ ...f, global_end_date: v }))} placeholder="Leave blank if no expiry" />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Pro Only</Text>
            <Switch value={challengeForm.is_pro_only} onValueChange={v => setChallengeForm(f => ({ ...f, is_pro_only: v }))} trackColor={{ true: C.ORANGE }} />
          </View>
          <View style={styles.formBtns}>
            <GradientButton label="Save" onPress={saveChallenge} variant="primary" style={{ flex: 1, marginRight: 8 }} />
            <GradientButton label="Cancel" onPress={() => setShowChallengeForm(false)} variant="outline" style={{ flex: 1 }} />
          </View>
        </View>
      )}

      {challenges.map(ch => (
        <View key={ch.id} style={styles.listItem}>
          <View style={styles.listItemInfo}>
            <Text style={styles.listItemTitle}>{ch.title}</Text>
            <Text style={styles.listItemSub}>{ch.category || 'No category'} {ch.is_pro_only ? '⭐ Pro' : ''}</Text>
            <Text style={styles.listItemMeta}>{ch.start_date} → {ch.end_date}</Text>
          </View>
          <View style={styles.actionBtns}>
            <TouchableOpacity onPress={() => openChallengeForm(ch)} style={styles.iconBtn}>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteChallenge(ch.id, ch.title)} style={styles.iconBtn}>
              <Text style={styles.deleteIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      {challenges.length === 0 && <Text style={styles.emptyText}>No challenges found.</Text>}
    </View>
  );

  // ── Users ──────────────────────────────────────────────────────────────────
  const handleDeleteUser = (id: number, name: string) => {
    Alert.alert('Delete User', `Delete ${name}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteUser(id);
            setUsers(us => us.filter(u => u.id !== id));
          } catch (e: any) { Alert.alert('Error', e.message); }
        },
      },
    ]);
  };

  const handlePromoteAdmin = (id: number, name: string) => {
    Alert.alert('Promote to Admin', `Promote ${name} to admin?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Promote',
        onPress: async () => {
          try {
            await updateUser(id, { role: 'admin', is_admin: 1 });
            setUsers(us => us.map(u => u.id === id ? { ...u, role: 'admin', is_admin: 1 } : u));
            Alert.alert('Promoted', `${name} is now an admin.`);
          } catch (e: any) { Alert.alert('Error', e.message); }
        },
      },
    ]);
  };

  const renderUsers = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>👥 Users ({users.length})</Text>
      {users.map(u => (
        <View key={u.id} style={styles.listItem}>
          <View style={styles.listItemInfo}>
            <Text style={styles.listItemTitle}>{u.name}</Text>
            <Text style={styles.listItemSub}>{u.email}</Text>
            <Text style={styles.listItemMeta}>
              Role: {u.role} | {u.subscription_status || (u.is_pro ? 'pro' : 'free')} | {u.created_at ? new Date(u.created_at).toLocaleDateString() : ''}
            </Text>
          </View>
          <View style={styles.actionBtns}>
            {u.role !== 'admin' && (
              <TouchableOpacity onPress={() => handlePromoteAdmin(u.id, u.name)} style={styles.iconBtn}>
                <Text style={styles.editIcon}>👑</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => handleDeleteUser(u.id, u.name)} style={styles.iconBtn}>
              <Text style={styles.deleteIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      {users.length === 0 && <Text style={styles.emptyText}>No users found.</Text>}
    </View>
  );

  // ── Submissions ────────────────────────────────────────────────────────────
  const handleDeleteSubmission = (id: number, title: string) => {
    Alert.alert('Delete Submission', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteSubmission(id);
            setSubmissions(ss => ss.filter(s => s.id !== id));
          } catch (e: any) { Alert.alert('Error', e.message); }
        },
      },
    ]);
  };

  const renderSubmissions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📷 Submissions ({submissions.length})</Text>
      {submissions.map(s => (
        <View key={s.id} style={styles.submissionItem}>
          {s.image_url ? (
            <Image source={{ uri: s.image_url }} style={styles.thumbImage} resizeMode="cover" />
          ) : (
            <View style={[styles.thumbImage, styles.thumbPlaceholder]}>
              <Text style={{ fontSize: 20 }}>📷</Text>
            </View>
          )}
          <View style={styles.listItemInfo}>
            <Text style={styles.listItemTitle}>{s.title || 'Untitled'}</Text>
            <Text style={styles.listItemSub}>{s.user_name || s.user?.name || 'Unknown user'}</Text>
            <Text style={styles.listItemMeta}>{s.created_at ? new Date(s.created_at).toLocaleDateString() : ''}</Text>
          </View>
          <TouchableOpacity onPress={() => handleDeleteSubmission(s.id, s.title || 'Untitled')} style={styles.iconBtn}>
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      ))}
      {submissions.length === 0 && <Text style={styles.emptyText}>No submissions found.</Text>}
    </View>
  );

  // ── Products ───────────────────────────────────────────────────────────────
  const handleProductToggle = async (product: any, field: 'featured' | 'is_pro_only', val: boolean) => {
    try {
      await updateProduct(product.id, { [field]: val });
      setProducts(ps => ps.map(p => p.id === product.id ? { ...p, [field]: val } : p));
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleProductPriceChange = (id: number, val: string) => {
    setProducts(ps => ps.map(p => p.id === id ? { ...p, _editPrice: val } : p));
  };

  const saveProductPrice = async (product: any) => {
    const price = parseFloat(product._editPrice ?? product.price);
    if (isNaN(price)) return;
    try {
      await updateProduct(product.id, { price });
      setProducts(ps => ps.map(p => p.id === product.id ? { ...p, price, _editPrice: undefined } : p));
      Alert.alert('Saved', 'Price updated.');
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleCreateProduct = async () => {
    if (!productForm.name || !productForm.price) {
      Alert.alert('Validation', 'Name and price are required.');
      return;
    }
    try {
      const created = await createProduct({
        ...productForm,
        price: parseFloat(productForm.price),
      });
      setProducts(ps => [...ps, created?.product || created]);
      setProductForm({ name: '', description: '', price: '', is_pro_only: false, featured: false });
      setShowProductForm(false);
      Alert.alert('Created', 'Product created successfully.');
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleDeleteProduct = (id: number, name: string) => {
    Alert.alert('Delete Product', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteProduct(id);
            setProducts(ps => ps.filter(p => p.id !== id));
          } catch (e: any) { Alert.alert('Error', e.message); }
        },
      },
    ]);
  };

  const renderProducts = () => (
    <View style={styles.section}>
      <View style={styles.rowBetween}>
        <Text style={styles.sectionTitle}>🛍️ Products ({products.length})</Text>
        <GradientButton label="+ New" onPress={() => setShowProductForm(v => !v)} variant="primary" size="sm" />
      </View>

      {showProductForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>New Product</Text>
          <Input label="Name" value={productForm.name} onChangeText={v => setProductForm(f => ({ ...f, name: v }))} />
          <Input label="Description" value={productForm.description} onChangeText={v => setProductForm(f => ({ ...f, description: v }))} multiline numberOfLines={2} />
          <Input label="Price" value={productForm.price} onChangeText={v => setProductForm(f => ({ ...f, price: v }))} keyboardType="numeric" />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Featured</Text>
            <Switch value={productForm.featured} onValueChange={v => setProductForm(f => ({ ...f, featured: v }))} trackColor={{ true: C.TEAL }} />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Pro Only</Text>
            <Switch value={productForm.is_pro_only} onValueChange={v => setProductForm(f => ({ ...f, is_pro_only: v }))} trackColor={{ true: C.ORANGE }} />
          </View>
          <View style={styles.formBtns}>
            <GradientButton label="Create" onPress={handleCreateProduct} variant="primary" style={{ flex: 1, marginRight: 8 }} />
            <GradientButton label="Cancel" onPress={() => setShowProductForm(false)} variant="outline" style={{ flex: 1 }} />
          </View>
        </View>
      )}

      {products.map(p => (
        <View key={p.id} style={styles.listItem}>
          <View style={styles.listItemInfo}>
            <Text style={styles.listItemTitle}>{p.name}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.listItemSub}>$</Text>
              <Input
                value={p._editPrice !== undefined ? p._editPrice : String(p.price ?? '')}
                onChangeText={v => handleProductPriceChange(p.id, v)}
                keyboardType="numeric"
                style={{ flex: 1, marginLeft: 2, marginBottom: 0 }}
                inputStyle={{ paddingVertical: 4, fontSize: 13 }}
              />
              <TouchableOpacity onPress={() => saveProductPrice(p)} style={[styles.iconBtn, { marginLeft: 4 }]}>
                <Text style={{ color: C.TEAL, fontSize: 12 }}>Save</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.toggleRow}>
              <View style={styles.toggleItem}>
                <Text style={styles.toggleLabel}>Featured</Text>
                <Switch value={!!p.featured} onValueChange={v => handleProductToggle(p, 'featured', v)} trackColor={{ true: C.TEAL }} />
              </View>
              <View style={styles.toggleItem}>
                <Text style={styles.toggleLabel}>Pro</Text>
                <Switch value={!!p.is_pro_only} onValueChange={v => handleProductToggle(p, 'is_pro_only', v)} trackColor={{ true: C.ORANGE }} />
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={() => handleDeleteProduct(p.id, p.name)} style={styles.iconBtn}>
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      ))}
      {products.length === 0 && <Text style={styles.emptyText}>No products found.</Text>}
    </View>
  );

  // ── Orders ─────────────────────────────────────────────────────────────────
  const renderOrders = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🛒 Orders ({orders.length})</Text>
      {orders.map(o => (
        <View key={o.id} style={styles.listItem}>
          <View style={styles.listItemInfo}>
            <Text style={styles.listItemTitle}>Order #{o.id}</Text>
            <Text style={styles.listItemSub}>{o.user_name || o.user?.name || 'Unknown'} · ${ Number(o.total ?? 0).toFixed(2)}</Text>
            <Text style={[styles.listItemMeta, { color: o.status === 'completed' ? C.TEAL : C.TEXT_MUTED }]}>
              {o.status} · {o.created_at ? new Date(o.created_at).toLocaleDateString() : ''}
            </Text>
          </View>
        </View>
      ))}
      {orders.length === 0 && <Text style={styles.emptyText}>No orders found.</Text>}
    </View>
  );

  // ── Settings ───────────────────────────────────────────────────────────────
  const renderSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>⚙️ Site Settings</Text>
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
        value={String(settings.max_free_submissions ?? 3)}
        onChangeText={v => setSettings((s: any) => ({ ...s, max_free_submissions: parseInt(v) || 3 }))}
        keyboardType="numeric"
      />
      <GradientButton
        label="💾 Save Settings"
        onPress={() =>
          adminUpdateSettings(settings)
            .then(() => Alert.alert('Saved', 'Settings updated successfully.'))
            .catch((e: any) => Alert.alert('Error', e.message))
        }
        style={{ marginTop: 12 }}
      />
    </View>
  );

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🛡️ Admin Panel</Text>
      </View>

      {/* Tab Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadTab(activeTab); }}
              tintColor={C.ORANGE}
            />
          }
        >
          {activeTab === 'Dashboard' && renderDashboard()}
          {activeTab === 'Challenges' && renderChallenges()}
          {activeTab === 'Users' && renderUsers()}
          {activeTab === 'Submissions' && renderSubmissions()}
          {activeTab === 'Products' && renderProducts()}
          {activeTab === 'Orders' && renderOrders()}
          {activeTab === 'Settings' && renderSettings()}
          <View style={{ height: 60 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.BG },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.DIVIDER,
  },
  backBtn: { padding: 4 },
  backText: { color: C.ORANGE, fontSize: 15, fontWeight: '600' },
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
  tabText: { color: C.TEXT_MUTED, fontSize: 13, fontWeight: '500' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '700' },
  content: { flex: 1 },
  section: { padding: 16 },
  sectionTitle: { color: C.TEXT, fontSize: 18, fontWeight: '700', marginBottom: 14 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
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
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: C.CARD_BG, borderRadius: borderRadius.md,
    padding: 12, marginBottom: 8, borderWidth: 1, borderColor: C.CARD_BORDER,
  },
  submissionItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.CARD_BG, borderRadius: borderRadius.md,
    padding: 10, marginBottom: 8, borderWidth: 1, borderColor: C.CARD_BORDER,
    gap: 10,
  },
  thumbImage: {
    width: 56, height: 56, borderRadius: borderRadius.sm,
    backgroundColor: C.CARD_BG,
  },
  thumbPlaceholder: {
    justifyContent: 'center', alignItems: 'center',
  },
  listItemInfo: { flex: 1 },
  listItemTitle: { color: C.TEXT, fontWeight: '600', marginBottom: 2 },
  listItemSub: { color: C.TEXT_SECONDARY, fontSize: 13, marginBottom: 2 },
  listItemMeta: { color: C.TEXT_MUTED, fontSize: 11 },
  actionBtns: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  iconBtn: { padding: 6 },
  editIcon: { fontSize: 16 },
  deleteIcon: { fontSize: 16 },
  emptyText: { color: C.TEXT_MUTED, textAlign: 'center', paddingVertical: 32, fontSize: 14 },
  formCard: {
    backgroundColor: C.CARD_BG, borderRadius: borderRadius.lg,
    padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.CARD_BORDER,
  },
  formTitle: { color: C.TEXT, fontWeight: '700', fontSize: 16, marginBottom: 12 },
  formBtns: { flexDirection: 'row', marginTop: 8 },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.DIVIDER, marginBottom: 8,
  },
  switchLabel: { color: C.TEXT, fontSize: 14 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  toggleRow: { flexDirection: 'row', gap: 16, marginTop: 4 },
  toggleItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toggleLabel: { color: C.TEXT_MUTED, fontSize: 12 },
});
