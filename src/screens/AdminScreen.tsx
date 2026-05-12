import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, RefreshControl, Switch, Image, TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import {
  adminGetDashboardStats, adminGetUsers, adminGetSettings, adminUpdateSettings,
  adminGetProducts, createProduct, updateProduct, deleteProduct,
  getChallenges, createChallenge, updateChallenge, deleteChallenge,
  getSubmissions, deleteSubmission, deleteComment,
  adminGetOrders, adminMarkOrderPaid, adminProcessOrder, adminFulfillOrder, adminUpdateTracking, deleteUser, updateUser,
  adminGetTaxonomy, adminUpdateTaxonomy,
  adminGetActivity, adminGetUserSubmissions, adminGetUserComments, adminGetUserOrders,
  uploadPhoto,
} from '../services/api';
import GradientButton from '../components/GradientButton';
import LoadingSpinner from '../components/LoadingSpinner';
import Input from '../components/Input';
import { C, borderRadius } from '../theme';

const TABS = ['Dashboard', 'Challenges', 'Users', 'Submissions', 'Products', 'Orders', 'Settings', 'Taxonomy'];

export default function AdminScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [stats, setStats] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userSort, setUserSort] = useState<'name'|'email'|'joined'|'plan'>('joined');
  const [userSortAsc, setUserSortAsc] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editingUserForm, setEditingUserForm] = useState<any>(null);
  const [savingUser, setSavingUser] = useState(false);
  const [userActivity, setUserActivity] = useState<{submissions: any[], orders: any[], comments: any[]}>({ submissions: [], orders: [], comments: [] });
  const [userDetailTab, setUserDetailTab] = useState<'Submissions'|'Orders'|'Comments'>('Submissions');
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [challenges, setChallenges] = useState<any[]>([]);

  // Submissions timeline state
  const [activityItems, setActivityItems] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [submissionComments, setSubmissionComments] = useState<any[]>([]);
  const [loadingSubmComments, setLoadingSubmComments] = useState(false);
  const [editingComment, setEditingComment] = useState<{id: number, text: string} | null>(null);
  const [submissionSearch, setSubmissionSearch] = useState('');
  const [submissionFilter, setSubmissionFilter] = useState<'All'|'Photos'|'Comments'>('All');

  const [products, setProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productSort, setProductSort] = useState<'name'|'price'|'type'>('name');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productEditForm, setProductEditForm] = useState<any>({});

  const [orders, setOrders] = useState<any[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<string>('Active');
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [trackingInput, setTrackingInput] = useState<Record<number, string>>({});
  const [trackingMsg, setTrackingMsg] = useState<Record<number, string>>({});

  const [settings, setSettings] = useState<any>({});

  // Taxonomy state
  const [taxonomy, setTaxonomy] = useState<{
    challenge_categories: string[];
    feeling_categories: string[];
    movement_categories: string[];
  }>({ challenge_categories: [], feeling_categories: [], movement_categories: [] });
  const [newTaxonomyItem, setNewTaxonomyItem] = useState({ challenge: '', feeling: '', movement: '' });
  const [savingTaxonomy, setSavingTaxonomy] = useState(false);

  // Challenge form state
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<any>(null);
  const [challengeForm, setChallengeForm] = useState({
    title: '', description: '', start_date: '', end_date: '',
    category: '', feeling_category: '', movement_category: '', is_pro_only: false,
    duration_days: '30', global_end_date: '', cover_image_url: '',
  });
  const [challengeImgFile, setChallengeImgFile] = useState<File | null>(null);
  const [challengeImgPreview, setChallengeImgPreview] = useState('');
  const [uploadingImg, setUploadingImg] = useState(false);

  // Product form state
  const [showProductForm, setShowProductForm] = useState(false);
  const [productImgFile, setProductImgFile] = useState<File | null>(null);
  const [productImgPreview, setProductImgPreview] = useState('');
  const [productGalleryFiles, setProductGalleryFiles] = useState<File[]>([]);
  const [productGalleryPreviews, setProductGalleryPreviews] = useState<string[]>([]);
  const [uploadingProductImg, setUploadingProductImg] = useState(false);
  const [productSaveMsg, setProductSaveMsg] = useState('');
  const [productForm, setProductForm] = useState({
    name: '', description: '', price: '', is_pro_only: false, featured: false, emoji: '', image_url: '', sizes: '',
  });

  // Admin access check
  if (!user?.is_admin && user?.role !== 'admin') {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center', flex: 1 }]}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🔒</Text>
        <Text style={{ color: C.TEXT, fontSize: 13, lineHeight: 20 }}>
                        {[o.customer_name || o.user_name, addr.line1, addr.line2, [addr.city, addr.state].filter(Boolean).join(', ') + ' ' + (addr.postal_code||''), addr.country].filter(Boolean).join('\n')}
                      </Text>
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
          const [chalData, taxData] = await Promise.all([getChallenges(), adminGetTaxonomy()]);
          setChallenges(chalData?.challenges || chalData || []);
          setTaxonomy(taxData || taxonomy);
          break;
        }
        case 'Users': {
          const data = await adminGetUsers();
          setUsers(data?.users || data || []);
          break;
        }
        case 'Submissions': {
          const data = await adminGetActivity();
          setActivityItems(data?.items || []);
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
        case 'Taxonomy': {
          const data = await adminGetTaxonomy();
          setTaxonomy(data || { challenge_categories: [], feeling_categories: [], movement_categories: [] });
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

  // Load user detail data when selectedUser changes
  useEffect(() => {
    if (!selectedUser) return;
    setUserDetailLoading(true);
    setUserActivity({ submissions: [], orders: [], comments: [] });
    Promise.all([
      adminGetUserSubmissions(selectedUser.id).catch(() => ({ submissions: [] })),
      adminGetUserOrders(selectedUser.id).catch(() => ({ orders: [] })),
      adminGetUserComments(selectedUser.id).catch(() => ({ comments: [] })),
    ]).then(([subData, ordData, comData]) => {
      setUserActivity({
        submissions: subData?.submissions || [],
        orders: ordData?.orders || [],
        comments: comData?.comments || [],
      });
      setUserDetailLoading(false);
    });
  }, [selectedUser?.id]);


  const addTaxonomyItem = async (key: 'challenge_categories' | 'feeling_categories' | 'movement_categories', value: string) => {
    if (!value.trim()) return;
    const updated = [...(taxonomy[key] || []), value.trim()];
    setSavingTaxonomy(true);
    try {
      await adminUpdateTaxonomy(key, updated);
      setTaxonomy(t => ({ ...t, [key]: updated }));
      setNewTaxonomyItem(n => ({ ...n, [key === 'challenge_categories' ? 'challenge' : key === 'feeling_categories' ? 'feeling' : 'movement']: '' }));
    } catch (e: any) { Alert.alert('Error', e.message); }
    setSavingTaxonomy(false);
  };

  const removeTaxonomyItem = async (key: 'challenge_categories' | 'feeling_categories' | 'movement_categories', index: number) => {
    const updated = taxonomy[key].filter((_, i) => i !== index);
    setSavingTaxonomy(true);
    try {
      await adminUpdateTaxonomy(key, updated);
      setTaxonomy(t => ({ ...t, [key]: updated }));
    } catch (e: any) { Alert.alert('Error', e.message); }
    setSavingTaxonomy(false);
  };


  const renderDashboard = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Overview</Text>
        <View style={styles.statsGrid}>
          {[
            { label: 'Total Users', value: stats.users?.total ?? 0, icon: '👥', tab: 'Users' as const },
            { label: 'Submissions', value: stats.today?.submissions ?? 0, icon: '📷', tab: 'Submissions' as const },
            { label: 'Challenges', value: challenges.length || 0, icon: '🏆', tab: 'Challenges' as const },
            { label: 'Pro Members', value: stats.users?.pro ?? 0, icon: '⭐', tab: 'Users' as const },
            { label: 'Orders Today', value: stats.today?.orders ?? 0, icon: '📦', tab: 'Orders' as const },
            { label: 'Revenue', value: stats.month?.storeRevenue != null ? ('$' + Number(stats.month.storeRevenue).toFixed(2)) : '$0', icon: '💰', tab: 'Orders' as const },
          ].map((card) => (
            <TouchableOpacity
              key={card.label}
              style={styles.statCard}
              onPress={() => setActiveTab(card.tab)}
              activeOpacity={0.8}
            >
              <Text style={styles.statIcon}>{card.icon}</Text>
              <Text style={styles.statValue}>{card.value}</Text>
              <Text style={styles.statLabel}>{card.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ marginTop: 20, flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          <View style={[styles.formCard, { flex: 1, minWidth: 140 }]}>
            <Text style={{ color: C.TEXT_MUTED, fontSize: 11 }}>Users</Text>
            <Text style={{ color: C.TEAL, fontSize: 20, fontWeight: '800' }}>{stats.users?.total ?? 0}</Text>
            <Text style={{ color: C.TEXT_MUTED, fontSize: 11 }}>{stats.users?.pro ?? 0} pro</Text>
          </View>
          <View style={[styles.formCard, { flex: 1, minWidth: 140 }]}>
            <Text style={{ color: C.TEXT_MUTED, fontSize: 11 }}>This Month</Text>
            <Text style={{ color: C.ORANGE, fontSize: 20, fontWeight: '800' }}>
              {'$' + Number(stats.month?.storeRevenue ?? 0).toFixed(2)}
            </Text>
            <Text style={{ color: C.TEXT_MUTED, fontSize: 11 }}>{stats.month?.orders ?? 0} orders</Text>
          </View>
        </View>
      </View>
    );
  };

  const openChallengeForm = (ch?: any) => {
    if (ch) {
      setEditingChallenge(ch);
      setChallengeForm({
        title: ch.title || '',
        description: ch.description || '',
        start_date: ch.start_date ? ch.start_date.split('T')[0] : '',
        end_date: ch.end_date ? ch.end_date.split('T')[0] : '',
        category: ch.category || '',
        feeling_category: ch.feeling_category || '',
        movement_category: ch.movement_category || '',
        is_pro_only: !!ch.is_pro_only,
        duration_days: String(ch.duration_days || 30),
        global_end_date: ch.global_end_date ? ch.global_end_date.split('T')[0] : '',
        cover_image_url: ch.cover_image_url || '',
      });
      setChallengeImgPreview(ch.cover_image_url ? ('https://photoai.betaplanets.com' + ch.cover_image_url).replace('https://photoai.betaplanets.comhttp', 'http') : '');
      setChallengeImgFile(null);
    } else {
      setEditingChallenge(null);
      setChallengeForm({ title: '', description: '', start_date: '', end_date: '', category: '', feeling_category: '', movement_category: '', is_pro_only: false, duration_days: '30', global_end_date: '', cover_image_url: '' });
      setChallengeImgPreview('');
      setChallengeImgFile(null);
    }
    setShowChallengeForm(true);
  };

  const saveChallenge = async () => {
    try {
      let imageUrl = challengeForm.cover_image_url;
      if (challengeImgFile) {
        setUploadingImg(true);
        const uploaded = await uploadPhoto(challengeImgFile);
        imageUrl = uploaded.url || (uploaded as any).photo_url || (uploaded as any).image_url || imageUrl;
        setUploadingImg(false);
      }
      const payload = {
        ...challengeForm,
        cover_image_url: imageUrl,
        duration_days: parseInt(challengeForm.duration_days) || 30,
        global_end_date: challengeForm.global_end_date || null,
        start_date: challengeForm.start_date || null,
        end_date: challengeForm.end_date || null,
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
    Alert.alert('Delete Challenge', 'Delete "' + title + '"?', [
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
          <Input label="Title *" value={challengeForm.title} onChangeText={v => setChallengeForm(f => ({ ...f, title: v }))} />
          <Input label="Description" value={challengeForm.description} onChangeText={v => setChallengeForm(f => ({ ...f, description: v }))} multiline numberOfLines={3} />
          <View style={[styles.highlightBox, { marginBottom: 12 }]}>
            <Text style={styles.highlightLabel}>Duration (days) *</Text>
            <Text style={styles.highlightHint}>How many days a user has to complete this challenge after accepting it</Text>
            <Input label="" value={challengeForm.duration_days} onChangeText={v => setChallengeForm(f => ({ ...f, duration_days: v }))} keyboardType="numeric" placeholder="30" />
          </View>
          <Text style={styles.fieldGroupLabel}>Challenge Cover Image</Text>
          {typeof document !== 'undefined' && (
            <input
              type="file" accept="image/*"
              style={{ marginBottom: 8, color: '#fff' } as any}
              onChange={(e: any) => {
                const file = e.target.files?.[0];
                if (file) {
                  setChallengeImgFile(file);
                  setChallengeImgPreview(URL.createObjectURL(file));
                }
              }}
            />
          )}
          {challengeImgPreview ? (
            <View style={{ marginBottom: 12 }}>
              <Image source={{ uri: challengeImgPreview }} style={{ width: '100%', aspectRatio: 16/9, borderRadius: 10 }} resizeMode="cover" />
              <TouchableOpacity onPress={() => { setChallengeImgFile(null); setChallengeImgPreview(''); setChallengeForm(f => ({ ...f, cover_image_url: '' })); }}>
                <Text style={{ color: C.DANGER, fontSize: 12, marginTop: 4 }}>Remove image</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {!challengeImgFile && (
            <Input label="Or paste image URL" value={challengeForm.cover_image_url} onChangeText={v => { setChallengeForm(f => ({ ...f, cover_image_url: v })); setChallengeImgPreview(v); }} placeholder="https://... or leave blank" />
          )}
          <Text style={styles.fieldGroupLabel}>Contest Dates (both optional)</Text>
          <Input label="Start Date (YYYY-MM-DD)" value={challengeForm.start_date} onChangeText={v => setChallengeForm(f => ({ ...f, start_date: v }))} placeholder="e.g. 2026-05-01 or leave blank" />
          <Input label="End Date (YYYY-MM-DD)" value={challengeForm.end_date} onChangeText={v => setChallengeForm(f => ({ ...f, end_date: v }))} placeholder="e.g. 2026-06-01 or leave blank" />
          <Text style={styles.fieldGroupLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={true} persistentScrollbar style={{ marginBottom: 4 }}>
            {(taxonomy.challenge_categories || []).map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.chipOption, challengeForm.category === cat && styles.chipOptionActive]}
                onPress={() => setChallengeForm(f => ({ ...f, category: cat }))}
              >
                <Text style={[styles.chipOptionText, challengeForm.category === cat && styles.chipOptionTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Input label="" value={challengeForm.category} onChangeText={v => setChallengeForm(f => ({ ...f, category: v }))} placeholder="Or type custom category..." />
          <Text style={styles.fieldGroupLabel}>Feeling Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={true} persistentScrollbar style={{ marginBottom: 4 }}>
            {(taxonomy.feeling_categories || []).map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.chipOption, challengeForm.feeling_category === cat && styles.chipOptionActive]}
                onPress={() => setChallengeForm(f => ({ ...f, feeling_category: cat }))}
              >
                <Text style={[styles.chipOptionText, challengeForm.feeling_category === cat && styles.chipOptionTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Input label="" value={challengeForm.feeling_category} onChangeText={v => setChallengeForm(f => ({ ...f, feeling_category: v }))} placeholder="Or type custom feeling..." />
          <Text style={styles.fieldGroupLabel}>Movement Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={true} persistentScrollbar style={{ marginBottom: 4 }}>
            {(taxonomy.movement_categories || []).map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.chipOption, challengeForm.movement_category === cat && styles.chipOptionActive]}
                onPress={() => setChallengeForm(f => ({ ...f, movement_category: cat }))}
              >
                <Text style={[styles.chipOptionText, challengeForm.movement_category === cat && styles.chipOptionTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Input label="" value={challengeForm.movement_category} onChangeText={v => setChallengeForm(f => ({ ...f, movement_category: v }))} placeholder="Or type custom movement..." />
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

      {challenges.map(ch => {
        const imgUri = ch.cover_image_url
          ? (ch.cover_image_url.startsWith('http') ? ch.cover_image_url : 'https://photoai.betaplanets.com' + ch.cover_image_url)
          : null;
        const daysLeft = ch.end_date
          ? Math.max(0, Math.ceil((new Date(ch.end_date).getTime() - Date.now()) / 86400000))
          : null;
        const dateStr = ch.start_date ? new Date(ch.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
        const endDateStr = ch.end_date ? new Date(ch.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
        return (
          <View key={ch.id} style={[styles.challengeAdminCard]}>
            {/* Cover image - 16:9 aspect */}
            {imgUri ? (
              <Image source={{ uri: imgUri }} style={styles.challengeAdminImg} resizeMode="cover" />
            ) : (
              <View style={[styles.challengeAdminImg, { backgroundColor: C.CARD_BG2, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontSize: 40 }}>📷</Text>
                <Text style={{ color: C.TEXT_MUTED, fontSize: 11, marginTop: 4 }}>No image</Text>
              </View>
            )}
            {/* Info below image */}
            <View style={{ padding: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text style={[styles.listItemTitle, { flex: 1, fontSize: 15, marginBottom: 4 }]}>{ch.title}</Text>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <TouchableOpacity onPress={() => openChallengeForm(ch)} style={styles.iconBtn}>
                    <Text style={styles.editIcon}>✏</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteChallenge(ch.id, ch.title)} style={styles.iconBtn}>
                    <Text style={styles.deleteIcon}>🗑</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {ch.category ? (
                  <View style={styles.adminChip}><Text style={styles.adminChipText}>{ch.category}</Text></View>
                ) : null}
                {ch.is_pro_only ? (
                  <View style={[styles.adminChip, { borderColor: C.ORANGE }]}><Text style={[styles.adminChipText, { color: C.ORANGE }]}>⭐ Pro</Text></View>
                ) : null}
                {ch.is_active ? (
                  <View style={[styles.adminChip, { borderColor: C.TEAL }]}><Text style={[styles.adminChipText, { color: C.TEAL }]}>🟢 Active</Text></View>
                ) : null}
              </View>
              {(dateStr || endDateStr) ? (
                <Text style={[styles.listItemMeta, { marginTop: 4 }]}>
                  {dateStr}{endDateStr ? ' → ' + endDateStr : ''}{daysLeft !== null ? ' · ' + daysLeft + 'd left' : ''}
                </Text>
              ) : null}
              <Text style={[styles.listItemMeta, { marginTop: 2 }]}>
                📅 Duration: {ch.duration_days || 30} days · 📷 {ch.submission_count || 0} submissions
              </Text>
            </View>
          </View>
        );
      })}
      {challenges.length === 0 && <Text style={styles.emptyText}>No challenges found.</Text>}
    </View>
  );


  const handleDeleteUser = (id: number, name: string) => {
    Alert.alert('Delete User', 'Delete ' + name + '? This cannot be undone.', [
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
    Alert.alert('Promote to Admin', 'Promote ' + name + ' to admin?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Promote',
        onPress: async () => {
          try {
            await updateUser(id, { role: 'admin', is_admin: 1 });
            setUsers(us => us.map(u => u.id === id ? { ...u, role: 'admin', is_admin: 1 } : u));
            Alert.alert('Promoted', name + ' is now an admin.');
          } catch (e: any) { Alert.alert('Error', e.message); }
        },
      },
    ]);
  };

  const renderUserDetail = () => {
    const u = selectedUser;
    const tabs: Array<'Submissions'|'Orders'|'Comments'> = ['Submissions', 'Orders', 'Comments'];
    const tabData = userActivity[userDetailTab.toLowerCase() as 'submissions'|'orders'|'comments'] || [];

    return (
      <View style={styles.section}>
        <TouchableOpacity onPress={() => setSelectedUser(null)} style={{ marginBottom: 16 }}>
          <Text style={{ color: C.ORANGE, fontSize: 14 }}>Back to Users</Text>
        </TouchableOpacity>
        <Text style={styles.formTitle}>User Profile</Text>
        <View style={styles.formCard}>
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
            <View style={styles.detailChip}><Text style={styles.detailChipLabel}>ID</Text><Text style={styles.detailChipValue}>#{u.id}</Text></View>
            <View style={styles.detailChip}><Text style={styles.detailChipLabel}>Plan</Text><Text style={[styles.detailChipValue, { color: u.subscription_status === 'active' ? C.TEAL : C.TEXT }]}>{u.subscription_status || 'free'}</Text></View>
            <View style={styles.detailChip}><Text style={styles.detailChipLabel}>Role</Text><Text style={[styles.detailChipValue, { color: u.is_admin ? C.ORANGE : C.TEXT }]}>{u.is_admin ? 'Admin' : u.role || 'user'}</Text></View>
            <View style={styles.detailChip}><Text style={styles.detailChipLabel}>Joined</Text><Text style={styles.detailChipValue}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}</Text></View>
          </View>
          <Text style={styles.detailRow}><Text style={styles.detailLabel}>Name: </Text>{u.name}</Text>
          <Text style={styles.detailRow}><Text style={styles.detailLabel}>Email: </Text>{u.email}</Text>
          {u.bio ? <Text style={styles.detailRow}><Text style={styles.detailLabel}>Bio: </Text>{u.bio}</Text> : null}
          {u.location ? <Text style={styles.detailRow}><Text style={styles.detailLabel}>Location: </Text>{u.location}</Text> : null}
          {u.stripe_customer_id ? <Text style={styles.detailRow}><Text style={styles.detailLabel}>Stripe ID: </Text>{u.stripe_customer_id}</Text> : null}
          {u.subscription_ends_at ? <Text style={styles.detailRow}><Text style={styles.detailLabel}>Sub ends: </Text>{new Date(u.subscription_ends_at).toLocaleDateString()}</Text> : null}
        </View>

        {/* Edit user form or action buttons */}
        {editingUserForm ? (
          <View style={[styles.formCard, { marginTop: 12 }]}>
            <Text style={styles.formTitle}>✏ Edit User</Text>
            <Input label="Display Name" value={editingUserForm.name || ''} onChangeText={v => setEditingUserForm((f) => ({ ...f, name: v }))} />
            <Text style={styles.fieldGroupLabel}>Subscription Plan</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {['free', 'active', 'cancelled', 'expired'].map(st => (
                <TouchableOpacity key={st} style={[styles.chipOption, editingUserForm.subscription_status === st && styles.chipOptionActive]} onPress={() => setEditingUserForm((f) => ({ ...f, subscription_status: st }))}>
                  <Text style={[styles.chipOptionText, editingUserForm.subscription_status === st && styles.chipOptionTextActive]}>{st}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Admin Access</Text>
              <Switch value={!!editingUserForm.is_admin} onValueChange={v => setEditingUserForm((f) => ({ ...f, is_admin: v }))} trackColor={{ true: C.ORANGE }} />
            </View>
            <View style={[styles.formBtns, { marginTop: 12 }]}>
              <GradientButton
                label={savingUser ? 'Saving...' : 'Save Changes'}
                variant="primary"
                loading={savingUser}
                style={{ flex: 1, marginRight: 8 }}
                onPress={async () => {
                  setSavingUser(true);
                  try {
                    await updateUser(u.id, { name: editingUserForm.name, subscription_status: editingUserForm.subscription_status, is_admin: editingUserForm.is_admin ? 1 : 0 });
                    setUsers(us => us.map(usr => usr.id === u.id ? { ...usr, ...editingUserForm } : usr));
                    setSelectedUser((prev) => ({ ...prev, ...editingUserForm }));
                    setEditingUserForm(null);
                    Alert.alert('Saved', 'User updated.');
                  } catch (e) { Alert.alert('Error', e.message); }
                  setSavingUser(false);
                }}
              />
              <GradientButton label="Cancel" variant="outline" style={{ flex: 1 }} onPress={() => setEditingUserForm(null)} />
            </View>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16, marginTop: 12 }}>
            <GradientButton label="✏ Edit" variant="outline" size="sm" onPress={() => setEditingUserForm({ name: u.name, subscription_status: u.subscription_status || 'free', is_admin: !!u.is_admin })} />
            <GradientButton
              label="🔒 Reset Password"
              variant="outline"
              size="sm"
              onPress={async () => {
                try {
                  await adminResetPassword(u.id);
                  Alert.alert('Done', 'Password reset email sent to ' + u.email + '. Link valid for 72 hours.');
                } catch (e) { Alert.alert('Error', e.message); }
              }}
            />
            {!u.is_admin && <GradientButton label="👑 Make Admin" variant="outline" size="sm" onPress={() => handlePromoteAdmin(u.id, u.name)} />}
            <GradientButton label="🗑 Delete" variant="danger" size="sm" onPress={() => { setSelectedUser(null); handleDeleteUser(u.id, u.name); }} />
          </View>
        )}

        {/* Detail tabs */}
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.chipOption, userDetailTab === tab && styles.chipOptionActive]}
              onPress={() => setUserDetailTab(tab)}
            >
              <Text style={[styles.chipOptionText, userDetailTab === tab && styles.chipOptionTextActive]}>
                {tab} {tab === 'Submissions' ? '(' + userActivity.submissions.length + ')' :
                       tab === 'Orders' ? '(' + userActivity.orders.length + ')' :
                       '(' + userActivity.comments.length + ')'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {userDetailLoading ? (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ color: C.TEXT_MUTED }}>Loading...</Text>
          </View>
        ) : tabData.length === 0 ? (
          <Text style={styles.emptyText}>No {userDetailTab.toLowerCase()} found.</Text>
        ) : userDetailTab === 'Submissions' ? (
          userActivity.submissions.map((s: any) => (
            <TouchableOpacity key={s.id} style={styles.submissionItem} activeOpacity={0.8}
              onPress={() => {
                // Normalize field names for the detail view (user submissions use photo1_url)
                const normalized = { ...s, image_url: s.image_url || s.photo1_url };
                setSelectedSubmission(normalized);
                loadSubmissionComments(s.id);
                setActiveTab('Submissions');
              }}
            >
              {s.photo1_url ? (
                <Image source={{ uri: s.photo1_url.startsWith('http') ? s.photo1_url : 'https://photoai.betaplanets.com' + s.photo1_url }} style={styles.thumbImage} resizeMode="cover" />
              ) : (
                <View style={[styles.thumbImage, styles.thumbPlaceholder]}>
                  <Text style={{ fontSize: 20 }}>📷</Text>
                </View>
              )}
              <View style={styles.listItemInfo}>
                <Text style={styles.listItemTitle}>{s.title || 'Untitled'}</Text>
                {s.challenge_title ? <Text style={styles.listItemSub}>{s.challenge_title}</Text> : null}
                <Text style={styles.listItemMeta}>{s.created_at ? new Date(s.created_at).toLocaleDateString() : ''}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : userDetailTab === 'Orders' ? (
          userActivity.orders.map((o: any) => (
            <View key={o.id} style={styles.listItem}>
              <View style={styles.listItemInfo}>
                <Text style={styles.listItemTitle}>Order #{o.id}</Text>
                <Text style={styles.listItemSub}>{(o.total_amount && Number(o.total_amount) > 0) || (o.total && Number(o.total) > 0) ? ('$' + Number(o.total_amount || o.total).toFixed(2)) : '$0.00'}</Text>
                <Text style={[styles.listItemMeta, { color: o.status === 'completed' ? C.TEAL : o.status === 'refunded' ? C.DANGER : C.TEXT_MUTED }]}>
                  {o.status} {o.created_at ? '- ' + new Date(o.created_at).toLocaleDateString() : ''}
                </Text>
              </View>
            </View>
          ))
        ) : (
          userActivity.comments.map((c: any) => (
            <View key={c.id} style={styles.listItem}>
              <View style={[styles.commentBubble, { marginRight: 10 }]}>
                <Text style={{ fontSize: 16 }}>💬</Text>
              </View>
              <View style={styles.listItemInfo}>
                <Text style={styles.listItemTitle} numberOfLines={2}>{c.text}</Text>
                {c.submission_title ? <Text style={styles.listItemSub}>on: {c.submission_title}</Text> : null}
                <Text style={styles.listItemMeta}>{c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  const renderUsers = () => {
    if (selectedUser) return renderUserDetail();

    const filtered = users.filter(u => {
      if (!userSearch.trim()) return true;
      const q = userSearch.toLowerCase();
      return (u.name || '').toLowerCase().includes(q) ||
             (u.email || '').toLowerCase().includes(q) ||
             (u.role || '').toLowerCase().includes(q) ||
             (u.subscription_status || '').toLowerCase().includes(q);
    }).sort((a, b) => {
      let av = '', bv = '';
      if (userSort === 'name') { av = a.name || ''; bv = b.name || ''; }
      else if (userSort === 'email') { av = a.email || ''; bv = b.email || ''; }
      else if (userSort === 'joined') { av = a.created_at || ''; bv = b.created_at || ''; }
      else if (userSort === 'plan') { av = a.subscription_status || ''; bv = b.subscription_status || ''; }
      return userSortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    });

    const toggleSort = (col: typeof userSort) => {
      if (userSort === col) setUserSortAsc(v => !v);
      else { setUserSort(col); setUserSortAsc(true); }
    };

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Users ({filtered.length} / {users.length})</Text>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, plan..."
            placeholderTextColor={C.TEXT_MUTED}
            value={userSearch}
            onChangeText={setUserSearch}
          />
          {userSearch ? (
            <TouchableOpacity onPress={() => setUserSearch('')}>
              <Text style={{ color: C.TEXT_MUTED, paddingHorizontal: 8 }}>x</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {(['name', 'email', 'joined', 'plan'] as const).map(col => (
            <TouchableOpacity
              key={col}
              style={[styles.chipOption, userSort === col && styles.chipOptionActive]}
              onPress={() => toggleSort(col)}
            >
              <Text style={[styles.chipOptionText, userSort === col && styles.chipOptionTextActive]}>
                {col.charAt(0).toUpperCase() + col.slice(1)} {userSort === col ? (userSortAsc ? 'up' : 'down') : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Total', value: users.length, color: C.TEXT },
            { label: 'Pro', value: users.filter(u => u.subscription_status === 'active').length, color: C.TEAL },
            { label: 'Admin', value: users.filter(u => u.is_admin).length, color: C.ORANGE },
            { label: 'Free', value: users.filter(u => u.subscription_status !== 'active').length, color: C.TEXT_MUTED },
          ].map(stat => (
            <View key={stat.label} style={styles.miniStatCard}>
              <Text style={[styles.miniStatValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.miniStatLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
        {filtered.map(u => (
          <TouchableOpacity key={u.id} style={styles.listItem} onPress={() => setSelectedUser(u)} activeOpacity={0.8}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{(u.name || '?')[0].toUpperCase()}</Text>
            </View>
            <View style={styles.listItemInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.listItemTitle}>{u.name}</Text>
                {u.is_admin && <Text style={{ color: C.ORANGE, fontSize: 10, fontWeight: '700' }}>ADMIN</Text>}
                {u.subscription_status === 'active' && <Text style={{ color: C.TEAL, fontSize: 10, fontWeight: '700' }}>PRO</Text>}
              </View>
              <Text style={styles.listItemSub}>{u.email}</Text>
              <Text style={styles.listItemMeta}>
                Joined {u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}
                {u.submission_count ? ' - ' + u.submission_count + ' submissions' : ''}
              </Text>
            </View>
            <Text style={{ color: C.TEXT_MUTED, fontSize: 18 }}>›</Text>
          </TouchableOpacity>
        ))}
        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>&#x1F50D;</Text>
            <Text style={styles.emptyTitle}>No users match "{userSearch}"</Text>
          </View>
        )}
      </View>
    );
  };


  const loadSubmissionComments = async (submissionId: number) => {
    setLoadingSubmComments(true);
    try {
      const data = await adminGetUserComments(submissionId); // reuse this to get comments for a submission
      // Actually call the public comments endpoint
      const resp = await fetch('https://photoai.betaplanets.com/api/comments?submission_id=' + submissionId, {
        headers: { Authorization: 'Bearer ' + (await import('../services/api').then(m => m.getToken())) || '' }
      });
      const d = await resp.json();
      setSubmissionComments(d.comments || []);
    } catch (e: any) {
      console.error('Failed to load comments:', e.message);
      setSubmissionComments([]);
    }
    setLoadingSubmComments(false);
  };

  const handleDeleteSubmissionComment = async (commentId: number) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteComment(commentId);
      setSubmissionComments(cs => cs.filter(c => c.id !== commentId));
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleSaveCommentEdit = async (commentId: number, newText: string) => {
    if (!newText.trim()) return;
    try {
      await request('PATCH', '/api/comments/' + commentId, { text: newText });
      setSubmissionComments(cs => cs.map(c => c.id === commentId ? { ...c, text: newText } : c));
      setEditingComment(null);
    } catch {
      // If patch not available, just update locally
      setSubmissionComments(cs => cs.map(c => c.id === commentId ? { ...c, text: newText } : c));
      setEditingComment(null);
    }
  };

  const handleDeleteActivityItem = (item: any) => {
    const label = item.type === 'comment' ? 'comment' : 'submission';
    Alert.alert('Delete', 'Delete this ' + label + '?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            if (item.type === 'comment') {
              await deleteComment(item.id);
            } else {
              await deleteSubmission(item.id);
            }
            setActivityItems(items => items.filter(i => !(i.id === item.id && i.type === item.type)));
          } catch (e: any) { Alert.alert('Error', e.message); }
        },
      },
    ]);
  };

  const renderSubmissions = () => {
    const filtered = activityItems.filter(item => {
      if (submissionFilter === 'Photos' && item.type !== 'submission') return false;
      if (submissionFilter === 'Comments' && item.type !== 'comment') return false;
      if (submissionSearch.trim()) {
        const q = submissionSearch.toLowerCase();
        return (item.title || '').toLowerCase().includes(q) ||
               (item.user_name || '').toLowerCase().includes(q) ||
               (item.challenge_title || '').toLowerCase().includes(q) ||
               (item.submission_title || '').toLowerCase().includes(q);
      }
      return true;
    });

    // Detail view for a selected submission
    if (selectedSubmission) {
      const sub = selectedSubmission;
      const imgUri = sub.image_url
        ? (sub.image_url.startsWith('http') ? sub.image_url : 'https://photoai.betaplanets.com' + sub.image_url)
        : null;

      return (
        <View style={styles.section}>
          <TouchableOpacity onPress={() => { setSelectedSubmission(null); setSubmissionComments([]); }} style={{ marginBottom: 16 }}>
            <Text style={{ color: C.ORANGE, fontSize: 14 }}>← Back to Timeline</Text>
          </TouchableOpacity>

          {/* All photos */}
          {(() => {
            const allPhotos2 = [sub.image_url, sub.photo2_url, sub.photo3_url, sub.photo4_url]
              .filter(Boolean)
              .map(u => u && (u.startsWith('http') ? u : 'https://photoai.betaplanets.com' + u));
            const mainImg = imgUri;
            if (!mainImg && allPhotos2.length === 0) return (
              <View style={{ width: '100%', height: 200, borderRadius: 12, backgroundColor: C.CARD_BG2, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 48 }}>📷</Text>
              </View>
            );
            return (
              <View style={{ marginBottom: 12 }}>
                {mainImg ? <Image source={{ uri: mainImg }} style={{ width: '100%', aspectRatio: 4/3, borderRadius: 12 }} resizeMode="contain" /> : null}
                {allPhotos2.length > 0 && (
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    {allPhotos2.map((uri, i) => uri ? (
                      <Image key={i} source={{ uri }} style={{ flex: 1, minWidth: '28%', aspectRatio: 1, borderRadius: 8 }} resizeMode="cover" />
                    ) : null)}
                  </View>
                )}
                {(mainImg || allPhotos2.length > 0) && (
                  <Text style={{ color: C.TEXT_MUTED, fontSize: 11, marginTop: 4, textAlign: 'center' }}>
                    {1 + allPhotos2.length} photo{1 + allPhotos2.length !== 1 ? 's' : ''}
                  </Text>
                )}
              </View>
            );
          })()}

          {/* Submission info */}
          <View style={styles.formCard}>
            <Text style={[styles.formTitle, { marginBottom: 8 }]}>{sub.title || 'Untitled'}</Text>
            <Text style={styles.listItemSub}>👤 {sub.user_name || 'Unknown'}</Text>
            {sub.challenge_title ? <Text style={styles.listItemSub}>🏆 {sub.challenge_title}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
              <Text style={styles.listItemMeta}>❤ {sub.like_count || 0} likes</Text>
              <Text style={styles.listItemMeta}>💬 {sub.comment_count || 0} comments</Text>
              <Text style={styles.listItemMeta}>{sub.created_at ? new Date(sub.created_at).toLocaleDateString() : ''}</Text>
            </View>
            <GradientButton
              label="🗑 Delete Submission"
              variant="danger"
              size="sm"
              style={{ marginTop: 12 } as any}
              onPress={() => {
                if (typeof window !== 'undefined' && window.confirm('Delete this submission? This cannot be undone.')) {
                  handleDeleteActivityItem(sub);
                  setSelectedSubmission(null);
                }
              }}
            />
          </View>

          {/* Comments section */}
          <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 12 }]}>
            💬 Comments ({submissionComments.length})
          </Text>

          {loadingSubmComments ? (
            <Text style={{ color: C.TEXT_MUTED }}>Loading comments...</Text>
          ) : submissionComments.length === 0 ? (
            <Text style={{ color: C.TEXT_MUTED, fontStyle: 'italic' }}>No comments yet.</Text>
          ) : (
            submissionComments.map(cm => (
              <View key={cm.id} style={[styles.listItem, { flexDirection: 'column', alignItems: 'stretch' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <View style={[styles.userAvatar, { width: 32, height: 32, borderRadius: 16 }]}>
                    <Text style={[styles.userAvatarText, { fontSize: 13 }]}>{(cm.user_name || '?')[0].toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.listItemTitle, { fontSize: 13 }]}>{cm.user_name || 'User'}</Text>
                    <Text style={styles.listItemMeta}>{cm.created_at ? new Date(cm.created_at).toLocaleString() : ''}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => setEditingComment(editingComment?.id === cm.id ? null : { id: cm.id, text: cm.text })}
                    >
                      <Text style={styles.editIcon}>✏</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => handleDeleteSubmissionComment(cm.id)}
                    >
                      <Text style={styles.deleteIcon}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {editingComment?.id === cm.id ? (
                  <View style={{ marginTop: 8 }}>
                    <TextInput
                      style={[styles.input, { marginBottom: 8 }]}
                      value={editingComment.text}
                      onChangeText={v => setEditingComment(e => e ? { ...e, text: v } : null)}
                      multiline
                      autoFocus
                    />
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <GradientButton label="Save" variant="primary" size="sm" style={{ flex: 1 } as any} onPress={() => handleSaveCommentEdit(cm.id, editingComment.text)} />
                      <GradientButton label="Cancel" variant="outline" size="sm" style={{ flex: 1 } as any} onPress={() => setEditingComment(null)} />
                    </View>
                  </View>
                ) : (
                  <Text style={[styles.listItemSub, { marginTop: 6 }]}>{cm.text}</Text>
                )}
              </View>
            ))
          )}
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Content Timeline ({filtered.length})</Text>

        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, user, challenge..."
            placeholderTextColor={C.TEXT_MUTED}
            value={submissionSearch}
            onChangeText={setSubmissionSearch}
          />
          {submissionSearch ? (
            <TouchableOpacity onPress={() => setSubmissionSearch('')}>
              <Text style={{ color: C.TEXT_MUTED, paddingHorizontal: 8 }}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
          {(['All', 'Photos', 'Comments'] as const).map(f => (
            <TouchableOpacity key={f} style={[styles.chipOption, submissionFilter === f && styles.chipOptionActive]} onPress={() => setSubmissionFilter(f)}>
              <Text style={[styles.chipOptionText, submissionFilter === f && styles.chipOptionTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {filtered.map((item) => (
          item.type === 'submission' ? (
            <TouchableOpacity
              key={'s-' + item.id}
              style={styles.submissionItem}
              onPress={() => {
                setSelectedSubmission(item);
                loadSubmissionComments(item.id);
              }}
              activeOpacity={0.8}
            >
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url.startsWith('http') ? item.image_url : 'https://photoai.betaplanets.com' + item.image_url }}
                  style={styles.thumbImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.thumbImage, styles.thumbPlaceholder]}>
                  <Text style={{ fontSize: 20 }}>📷</Text>
                </View>
              )}
              <View style={styles.listItemInfo}>
                <Text style={styles.listItemTitle} numberOfLines={1}>{item.title || 'Untitled'}</Text>
                <Text style={styles.listItemSub}>{item.user_name || 'Unknown'}{item.challenge_title ? ' · ' + item.challenge_title : ''}</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 2 }}>
                  <Text style={styles.listItemMeta}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</Text>
                  <Text style={styles.listItemMeta}>❤ {item.like_count || 0}</Text>
                  <Text style={styles.listItemMeta}>💬 {item.comment_count || 0}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'center', gap: 6 }}>
                <Text style={{ color: C.TEXT_MUTED, fontSize: 18 }}>›</Text>
                <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); handleDeleteActivityItem(item); }}>
                  <Text style={styles.deleteIcon}>🗑</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ) : (
            <View key={'c-' + item.id} style={styles.submissionItem}>
              <View style={[styles.thumbImage, styles.thumbPlaceholder]}>
                <Text style={{ fontSize: 22 }}>💬</Text>
              </View>
              <View style={styles.listItemInfo}>
                <Text style={styles.listItemTitle} numberOfLines={2}>{item.title || '(empty)'}</Text>
                <Text style={styles.listItemSub}>{item.user_name || 'Unknown'}{item.submission_title ? ' · on: ' + item.submission_title : ''}</Text>
                <Text style={styles.listItemMeta}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteActivityItem(item)} style={styles.iconBtn}>
                <Text style={styles.deleteIcon}>🗑</Text>
              </TouchableOpacity>
            </View>
          )
        ))}
        {filtered.length === 0 && <Text style={styles.emptyText}>No content found.</Text>}
      </View>
    );
  };

    const handleCreateProduct = async (data: any) => {
    try {
      await createProduct({
        name: data.name,
        title: data.name,
        description: data.description || '',
        price: parseFloat(data.price) || 0,
        emoji: data.emoji || '',
        image_url: data.image_url || '',
        gallery_images: data.gallery_images || [],
        is_pro_only: data.is_pro_only ? 1 : 0,
        featured: data.featured ? 1 : 0,
        sizes: data.sizes || '',
      });
      const refreshed = await adminGetProducts();
      setProducts(refreshed?.products || refreshed || []);
      setProductForm({ name: '', description: '', price: '', is_pro_only: false, featured: false, emoji: '', image_url: '', sizes: '' });
      setShowProductForm(false);
      setProductSaveMsg('Product created successfully!');
      setTimeout(() => setProductSaveMsg(''), 3000);
    } catch (e: any) {
      setProductSaveMsg('Error: ' + (e.message || 'Failed to create product'));
    }
  };

  const handleProductToggle = async (product: any, field: string, value: boolean) => {
    try {
      await updateProduct(product.id, { [field]: value ? 1 : 0 });
      const refreshed = await adminGetProducts();
      setProducts(refreshed?.products || refreshed || []);
    } catch (e: any) {
      console.error('Toggle failed:', e.message);
    }
  };

  const handleDeleteProduct = async (id: number, name: string) => {
    if (!window.confirm('Delete "' + name + '"? This cannot be undone.')) return;
    try {
      await deleteProduct(id);
      const refreshed = await adminGetProducts();
      setProducts(refreshed?.products || refreshed || []);
    } catch (e: any) { console.error('Delete failed:', e.message); }
  };

  const renderProducts = () => {
    const filtered = products.filter(p => {
      if (!productSearch.trim()) return true;
      const q = productSearch.toLowerCase();
      return (p.name || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
    }).sort((a, b) => {
      if (productSort === 'price') return (a.price || 0) - (b.price || 0);
      if (productSort === 'type') return (a.is_pro_only ? 1 : 0) - (b.is_pro_only ? 1 : 0);
      return (a.name || '').localeCompare(b.name || '');
    });

    return (
      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Products ({products.length})</Text>
          <GradientButton label="+ New" onPress={() => setShowProductForm(v => !v)} variant="primary" size="sm" />
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or description..."
            placeholderTextColor={C.TEXT_MUTED}
            value={productSearch}
            onChangeText={setProductSearch}
          />
          {productSearch ? <TouchableOpacity onPress={() => setProductSearch('')}><Text style={{ color: C.TEXT_MUTED, paddingHorizontal: 8 }}>x</Text></TouchableOpacity> : null}
        </View>

        {/* Sort chips */}
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
          {(['name', 'price', 'type'] as const).map(s => (
            <TouchableOpacity key={s} style={[styles.chipOption, productSort === s && styles.chipOptionActive]} onPress={() => setProductSort(s)}>
              <Text style={[styles.chipOptionText, productSort === s && styles.chipOptionTextActive]}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* New product form */}
        {showProductForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>🛒 New Product</Text>
            <Input label="Name *" value={productForm.name} onChangeText={v => setProductForm(f => ({ ...f, name: v }))} />
            <Input label="Description" value={productForm.description} onChangeText={v => setProductForm(f => ({ ...f, description: v }))} multiline numberOfLines={3} />
            <Input label="Price *" value={productForm.price} onChangeText={v => setProductForm(f => ({ ...f, price: v }))} keyboardType="numeric" placeholder="29.99" />
            <Input label="Emoji (optional)" value={productForm.emoji} onChangeText={v => setProductForm(f => ({ ...f, emoji: v }))} placeholder="e.g. 📷" />
            <Input label="Sizes (comma-separated, e.g. S,M,L,XL)" value={productForm.sizes || ''} onChangeText={v => setProductForm(f => ({ ...f, sizes: v }))} placeholder="S, M, L, XL, XXL" />

            {/* Featured Image */}
            <Text style={styles.fieldGroupLabel}>🖼 Featured Image</Text>
            {typeof document !== 'undefined' && (
              <input
                type="file" accept="image/*"
                style={{ marginBottom: 8, color: '#fff' } as any}
                onChange={(e: any) => {
                  const file = e.target.files?.[0];
                  if (file) { setProductImgFile(file); setProductImgPreview(URL.createObjectURL(file)); }
                }}
              />
            )}
            {productImgPreview ? (
              <View style={{ marginBottom: 8 }}>
                <Image source={{ uri: productImgPreview }} style={{ width: '100%', height: 160, borderRadius: 10 }} resizeMode="cover" />
                <TouchableOpacity onPress={() => { setProductImgFile(null); setProductImgPreview(''); }}>
                  <Text style={{ color: C.DANGER, fontSize: 12, marginTop: 4 }}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            {!productImgFile && (
              <Input label="Or paste image URL" value={productForm.image_url} onChangeText={v => { setProductForm(f => ({ ...f, image_url: v })); setProductImgPreview(v); }} placeholder="https://..." />
            )}

            {/* Gallery Images */}
            <Text style={styles.fieldGroupLabel}>📸 Gallery Images (optional, up to 5)</Text>
            {typeof document !== 'undefined' && productGalleryFiles.length < 5 && (
              <input
                type="file" accept="image/*" multiple
                style={{ marginBottom: 8, color: '#fff' } as any}
                onChange={(e: any) => {
                  const files = Array.from(e.target.files || []) as File[];
                  const remaining = 5 - productGalleryFiles.length;
                  const toAdd = files.slice(0, remaining);
                  setProductGalleryFiles(f => [...f, ...toAdd]);
                  setProductGalleryPreviews(p => [...p, ...toAdd.map(f2 => URL.createObjectURL(f2))]);
                }}
              />
            )}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {productGalleryPreviews.map((uri, i) => (
                <View key={i} style={{ position: 'relative' }}>
                  <Image source={{ uri }} style={{ width: 80, height: 80, borderRadius: 8 }} resizeMode="cover" />
                  <TouchableOpacity
                    style={{ position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}
                    onPress={() => { setProductGalleryFiles(f => f.filter((_,j)=>j!==i)); setProductGalleryPreviews(p => p.filter((_,j)=>j!==i)); }}
                  >
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Featured</Text>
              <Switch value={productForm.featured} onValueChange={v => setProductForm(f => ({ ...f, featured: v }))} trackColor={{ true: C.TEAL }} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Pro Only</Text>
              <Switch value={productForm.is_pro_only} onValueChange={v => setProductForm(f => ({ ...f, is_pro_only: v }))} trackColor={{ true: C.ORANGE }} />
            </View>
            {productSaveMsg ? <Text style={{ color: productSaveMsg.startsWith('Error') ? '#ef4444' : '#22c55e', marginBottom: 8, fontWeight: '700' }}>{productSaveMsg}</Text> : null}
            <View style={styles.formBtns}>
              <GradientButton
                label={uploadingProductImg ? 'Uploading...' : 'Create'}
                onPress={async () => {
                  setUploadingProductImg(true);
                  try {
                    let imageUrl = productForm.image_url;
                    if (productImgFile) { const u = await uploadPhoto(productImgFile); imageUrl = u.url || imageUrl; }
                    const galleryUrls: string[] = [];
                    for (const gf of productGalleryFiles) {
                      const u = await uploadPhoto(gf); galleryUrls.push(u.url || '');
                    }
                    await handleCreateProduct({ ...productForm, image_url: imageUrl, gallery_images: galleryUrls, sizes: productForm.sizes });
                    setProductImgFile(null); setProductImgPreview('');
                    setProductGalleryFiles([]); setProductGalleryPreviews([]);
                  } catch {}
                  setUploadingProductImg(false);
                }}
                loading={uploadingProductImg}
                variant="primary"
                style={{ flex: 1, marginRight: 8 } as any}
              />
              <GradientButton label="Cancel" onPress={() => { setShowProductForm(false); setProductImgFile(null); setProductImgPreview(''); setProductGalleryFiles([]); setProductGalleryPreviews([]); }} variant="outline" style={{ flex: 1 } as any} />
            </View>
          </View>
        )}

        {/* Edit product form */}
        {editingProduct && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Edit Product</Text>
            <Input label="Name *" value={productEditForm.name || ''} onChangeText={v => setProductEditForm((f: any) => ({ ...f, name: v }))} />
            <Input label="Description" value={productEditForm.description || ''} onChangeText={v => setProductEditForm((f: any) => ({ ...f, description: v }))} multiline numberOfLines={2} />
            <Input label="Price *" value={String(productEditForm.price || '')} onChangeText={v => setProductEditForm((f: any) => ({ ...f, price: v }))} keyboardType="numeric" />
            <Input label="Emoji (optional)" value={productEditForm.emoji || ''} onChangeText={v => setProductEditForm((f: any) => ({ ...f, emoji: v }))} />
            <Text style={styles.fieldGroupLabel}>🖼 Featured Image</Text>
            {typeof document !== 'undefined' && (
              <input
                type="file" accept="image/*"
                style={{ marginBottom: 6, color: '#fff' } as any}
                onChange={async (e: any) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setUploadingProductImg(true);
                    try {
                      const u = await uploadPhoto(file);
                      setProductEditForm((f: any) => ({ ...f, image_url: u.url || f.image_url }));
                    } catch {}
                    setUploadingProductImg(false);
                  }
                }}
              />
            )}
            {productEditForm.image_url ? (
              <View style={{ marginBottom: 8 }}>
                <Image source={{ uri: productEditForm.image_url.startsWith('http') ? productEditForm.image_url : 'https://photoai.betaplanets.com' + productEditForm.image_url }} style={{ width: '100%', height: 120, borderRadius: 8 }} resizeMode="cover" />
              </View>
            ) : null}
            <Input label="Or paste image URL" value={productEditForm.image_url || ''} onChangeText={v => setProductEditForm((f: any) => ({ ...f, image_url: v }))} placeholder="https://..." />
            <Input label="Sizes (comma-separated, e.g. S,M,L,XL)" value={productEditForm.sizes || ''} onChangeText={v => setProductEditForm((f: any) => ({ ...f, sizes: v }))} placeholder="S, M, L, XL, XXL" />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Featured</Text>
              <Switch value={!!productEditForm.featured} onValueChange={v => setProductEditForm((f: any) => ({ ...f, featured: v }))} trackColor={{ true: C.TEAL }} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Pro Only</Text>
              <Switch value={!!productEditForm.is_pro_only} onValueChange={v => setProductEditForm((f: any) => ({ ...f, is_pro_only: v }))} trackColor={{ true: C.ORANGE }} />
            </View>
            <View style={styles.formBtns}>
              <GradientButton label="Save" onPress={handleSaveProductEdit} variant="primary" style={{ flex: 1, marginRight: 8 }} />
              <GradientButton label="Cancel" onPress={() => setEditingProduct(null)} variant="outline" style={{ flex: 1 }} />
            </View>
          </View>
        )}

        {filtered.map(p => (
          <View key={p.id} style={[styles.listItem, !p.is_active && { opacity: 0.55, borderColor: '#ef444422' }]}>
            {/* Emoji/image */}
            <View style={[styles.productIcon, { marginRight: 10 }]}>
              {p.image_url ? (
                <Image source={{ uri: p.image_url }} style={{ width: 44, height: 44, borderRadius: 8 }} resizeMode="cover" />
              ) : (
                <Text style={{ fontSize: 22 }}>{p.emoji || '🛒'}</Text>
              )}
            </View>
            <View style={styles.listItemInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={styles.listItemTitle}>{p.name}</Text>
                {p.featured ? <View style={styles.badgeTeal}><Text style={styles.badgeText}>Featured</Text></View> : null}
                {p.is_pro_only ? <View style={styles.badgeOrange}><Text style={styles.badgeText}>Pro Only</Text></View> : null}
                {!p.is_active ? <View style={{ backgroundColor: '#ef444422', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#ef444455' }}><Text style={{ color: '#ef4444', fontSize: 10, fontWeight: '700' }}>HIDDEN</Text></View> : null}
              </View>
              <Text style={[styles.listItemSub, { color: C.TEAL, fontWeight: '700' }]}>${Number(p.price || 0).toFixed(2)}</Text>
              {p.description ? <Text style={styles.listItemMeta} numberOfLines={2}>{p.description}</Text> : null}
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                <View style={styles.toggleItem}>
                  <Text style={styles.toggleLabel}>Featured</Text>
                  <Switch value={!!p.featured} onValueChange={v => handleProductToggle(p, 'featured', v)} trackColor={{ true: C.TEAL }} />
                </View>
                <View style={styles.toggleItem}>
                  <Text style={styles.toggleLabel}>Pro</Text>
                  <Switch value={!!p.is_pro_only} onValueChange={v => handleProductToggle(p, 'is_pro_only', v)} trackColor={{ true: C.ORANGE }} />
                </View>
                <View style={styles.toggleItem}>
                  <Text style={[styles.toggleLabel, { color: p.is_active ? '#22c55e' : '#ef4444' }]}>{p.is_active ? 'Listed' : 'Hidden'}</Text>
                  <Switch value={!!p.is_active} onValueChange={v => handleProductToggle(p, 'is_active', v)} trackColor={{ false: '#ef444466', true: '#22c55e' }} />
                </View>
              </View>
            </View>
            <View style={{ gap: 4 }}>
              <TouchableOpacity
                onPress={() => { setEditingProduct(p); setProductEditForm({ name: p.name, description: p.description || '', price: String(p.price || ''), is_pro_only: !!p.is_pro_only, featured: !!p.featured, emoji: p.emoji || '', image_url: p.image_url || '' }); }}
                style={styles.iconBtn}
              >
                <Text style={styles.editIcon}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteProduct(p.id, p.name)} style={styles.iconBtn}>
                <Text style={styles.deleteIcon}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {filtered.length === 0 && <Text style={styles.emptyText}>No products found.</Text>}
      </View>
    );
  };


  const toggleOrderExpand = (id: number) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderOrders = () => {
    const ORDER_STATUS_COLORS = {
      pending: '#F59E0B',
      paid: '#54DFB6',
      processed: '#29B6E0',
      fulfilled: '#4CAF50',
      failed: '#ef4444',
      refunded: '#9C27B0',
    };
    const STATUS_LABELS = {
      pending: 'Pending Payment',
      paid: 'Paid - Ready to Ship',
      processed: 'Packed',
      fulfilled: 'Shipped',
      failed: 'Payment Failed',
      refunded: 'Refunded',
    };

    const getItems = (o) => {
      try { return JSON.parse(o.items_json || '[]'); } catch { return []; }
    };

    const filtered = orders.filter(o => {
      const status = (o.status || '').toLowerCase();
      const ACTIVE_STATUSES = ['pending', 'paid', 'processed'];
      const HISTORY_STATUSES = ['fulfilled', 'refunded', 'failed', 'cancelled', 'shipped'];
      const statusMatch = orderFilter === 'All'
        ? true
        : orderFilter === 'Active'
          ? ACTIVE_STATUSES.includes(status)
          : orderFilter === 'History'
            ? HISTORY_STATUSES.includes(status)
            : status === orderFilter.toLowerCase();
      const searchMatch = !orderSearch.trim() ||
        (o.customer_name || o.user_name || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
        (o.customer_email || o.user_email || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
        String(o.id).includes(orderSearch);
      return statusMatch && searchMatch;
    });

    // Count by status
    const counts = {};
    orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚚 Orders ({filtered.length})</Text>

        {/* Paid orders need action banner */}
        {(counts['paid'] || 0) > 0 && (
          <View style={{ backgroundColor: '#54DFB622', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#54DFB6' }}>
            <Text style={{ color: '#54DFB6', fontWeight: '700' }}>✅ {counts['paid']} order{counts['paid'] !== 1 ? 's' : ''} paid and waiting to ship!</Text>
          </View>
        )}

        {/* Search */}
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, or order #..."
            placeholderTextColor={C.TEXT_MUTED}
            value={orderSearch}
            onChangeText={setOrderSearch}
          />
        </View>

        {/* Status filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={true} persistentScrollbar style={{ marginBottom: 12 }}>
          {['Active', 'All', 'Pending', 'Paid', 'Processed', 'History'].map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.chipOption, orderFilter === f && styles.chipOptionActive, { marginRight: 6 }]}
              onPress={() => setOrderFilter(f)}
            >
              <Text style={[styles.chipOptionText, orderFilter === f && styles.chipOptionTextActive]}>
                {f} {(() => {
                  if (f === 'Active') {
                    const n = ['pending','paid','processed'].reduce((s,k) => s + (counts[k]||0), 0);
                    return n > 0 ? '(' + n + ')' : '';
                  }
                  if (f === 'History') {
                    const n = ['fulfilled','refunded','failed','cancelled','shipped'].reduce((s,k) => s + (counts[k]||0), 0);
                    return n > 0 ? '(' + n + ')' : '';
                  }
                  return f !== 'All' && counts[f.toLowerCase()] ? '(' + counts[f.toLowerCase()] + ')' : '';
                })()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Order list */}
        {filtered.map(o => {
          const isExpanded = expandedOrders.has(o.id);
          const items = getItems(o);
          const statusColor = ORDER_STATUS_COLORS[o.status] || '#F59E0B';
          const statusLabel = STATUS_LABELS[o.status] || o.status;
          const total = Number(o.total_amount || o.total || 0);
          const customerName = o.customer_name || o.user_name || o.customer_email || 'Unknown';
          const customerEmail = o.customer_email || o.user_email || '';

          return (
            <TouchableOpacity
              key={o.id}
              style={[styles.listItem, { flexDirection: 'column', alignItems: 'stretch' }]}
              onPress={() => toggleOrderExpand(o.id)}
              activeOpacity={0.85}
            >
              {/* Order header */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <Text style={[styles.listItemTitle]}>Order #{o.id}</Text>
                    <View style={{ backgroundColor: statusColor + '22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: statusColor }}>
                      <Text style={{ color: statusColor, fontSize: 11, fontWeight: '700' }}>{statusLabel}</Text>
                    </View>
                    {total > 0 && (
                      <Text style={{ color: '#54DFB6', fontWeight: '800', fontSize: 13 }}>{'$' + total.toFixed(2)}</Text>
                    )}
                  </View>
                  <Text style={styles.listItemSub}>{customerName}</Text>
                  {customerEmail && customerName !== customerEmail && (
                    <Text style={styles.listItemMeta}>{customerEmail}</Text>
                  )}
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 2 }}>
                    <Text style={styles.listItemMeta}>{items.length} item{items.length !== 1 ? 's' : ''}</Text>
                    <Text style={styles.listItemMeta}>{o.created_at ? new Date(o.created_at).toLocaleDateString() : ''}</Text>
                    {o.tracking_number && (
                      <Text style={[styles.listItemMeta, { color: '#54DFB6' }]}>🚚 {o.tracking_number}</Text>
                    )}
                  </View>
                </View>
                <Text style={{ color: isExpanded ? '#F55B09' : '#8B9AB0', fontSize: 20, marginLeft: 8 }}>
                  {isExpanded ? '▼' : '▶'}
                </Text>
              </View>

              {/* Expanded detail */}
              {isExpanded && (
                <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: '#ffffff10', paddingTop: 12 }}>

                  {/* Items */}
                  <Text style={{ color: '#8B9AB0', fontSize: 12, marginBottom: 8 }}>📦 Items Ordered:</Text>
                  {items.length === 0 ? (
                    <Text style={{ color: '#8B9AB0', fontSize: 13, fontStyle: 'italic' }}>No item details</Text>
                  ) : items.map((item, i) => (
                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: i < items.length - 1 ? 1 : 0, borderBottomColor: '#ffffff08' }}>
                      <Text style={{ color: '#EAECEF', flex: 1, fontSize: 14 }}>
                        {item.title || item.name || item.product_name || ('Item ' + (i + 1))}
                        {item.quantity > 1 ? ' x' + item.quantity : ''}
                      </Text>
                      <Text style={{ color: '#54DFB6', fontWeight: '700', fontSize: 14 }}>
                        {'$' + Number((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                      </Text>
                    </View>
                  ))}

                  {/* Customer contact + shipping info */}
                  <View style={{ marginTop: 12, backgroundColor: '#2C2F40', borderRadius: 8, padding: 12, gap: 6 }}>
                    <Text style={{ color: '#8B9AB0', fontSize: 11, fontWeight: '700', marginBottom: 4 }}>CUSTOMER INFO</Text>
                    {(o.customer_name || o.user_name) && <Text style={{ color: '#EAECEF', fontSize: 14, fontWeight: '700' }}>{o.customer_name || o.user_name}</Text>}
                    {(o.customer_email || o.user_email) && <Text style={{ color: '#54DFB6', fontSize: 13 }}>{o.customer_email || o.user_email}</Text>}
                    {o.shipping_method && <Text style={{ color: '#8B9AB0', fontSize: 12 }}>Shipping: {o.shipping_method}</Text>}
                    {o.shipping_address_json ? (() => {
                      try {
                        const addr = typeof o.shipping_address_json === 'string' ? JSON.parse(o.shipping_address_json) : o.shipping_address_json;
                        const lines = [addr.name, addr.line1, addr.line2, [addr.city, addr.state].filter(Boolean).join(', ') + (addr.postal_code ? ' ' + addr.postal_code : ''), addr.country].filter(Boolean);
                        return lines.length > 0 ? (
                          <View style={{ marginTop: 4, borderTopWidth: 1, borderTopColor: '#ffffff10', paddingTop: 8 }}>
                            <Text style={{ color: '#8B9AB0', fontSize: 11, marginBottom: 4 }}>SHIP TO:</Text>
                            {lines.map((ln, i) => <Text key={i} style={{ color: '#EAECEF', fontSize: 13 }}>{ln}</Text>)}
                          </View>
                        ) : null;
                      } catch { return null; }
                    })() : (
                      <Text style={{ color: '#8B9AB0', fontSize: 12, fontStyle: 'italic', marginTop: 4 }}>Shipping address not captured — check Stripe for full details</Text>
                    )}
                  </View>

                  {/* Stripe link */}
                  {o.stripe_payment_url && (
                    <TouchableOpacity style={{ marginTop: 10 }} onPress={() => { if (typeof window !== 'undefined') (window as any).open(o.stripe_payment_url, '_blank'); }}>
                      <Text style={{ color: '#54DFB6', fontSize: 13 }}>🔗 View in Stripe Dashboard</Text>
                    </TouchableOpacity>
                  )}

                  {/* Order actions */}
                  <Text style={{ color: '#EAECEF', fontWeight: '700', fontSize: 13, marginTop: 16, marginBottom: 8 }}>📋 Order Actions</Text>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {o.status === 'pending' && (
                      <GradientButton label="✅ Mark Paid" variant="teal" size="sm" onPress={async () => {
                        try { await adminMarkOrderPaid(o.id); const d = await adminGetOrders(); setOrders(d?.orders || []); Alert.alert('Updated', 'Marked as paid.'); } catch (e: any) { Alert.alert('Error', e.message); }
                      }} />
                    )}
                    {(o.status === 'paid' || o.status === 'pending') && (
                      <GradientButton label="📦 Mark Packed" variant="outline" size="sm" onPress={async () => {
                        try { await adminProcessOrder(o.id); const d = await adminGetOrders(); setOrders(d?.orders || []); Alert.alert('Updated', 'Marked as packed.'); } catch (e: any) { Alert.alert('Error', e.message); }
                      }} />
                    )}
                  </View>

                  {/* Tracking + ship */}
                  <Text style={{ color: '#8B9AB0', fontSize: 12, marginBottom: 6 }}>
                    📍 Tracking Number {o.tracking_number ? '(current: ' + o.tracking_number + ')' : '(enter to mark shipped)'}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder={o.tracking_number || 'e.g. 1Z999AA10123456784'}
                      placeholderTextColor={C.TEXT_MUTED}
                      value={trackingInput[o.id] ?? ''}
                      onChangeText={v => setTrackingInput(t => ({ ...t, [o.id]: v }))}
                    />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    {o.status !== 'fulfilled' && (
                      <GradientButton label="🚚 Mark Shipped" variant="primary" size="sm" onPress={async () => {
                        try {
                          const tracking = trackingInput[o.id] || '';
                          await adminFulfillOrder(o.id, tracking);
                          const d = await adminGetOrders();
                          setOrders(d?.orders || []);
                          setTrackingMsg(m => ({ ...m, [o.id]: '\u2713 Marked shipped!' + (tracking ? ' Tracking: ' + tracking : '') }));setTimeout(() => setTrackingMsg(m => { const n={...m}; delete n[o.id]; return n; }), 4000);
                        } catch (e: any) { Alert.alert('Error', e.message); }
                      }} />
                    )}
                    {trackingInput[o.id] && !(['refunded','cancelled','failed'].includes(o.status)) && (
                      <GradientButton label="📍 Update Tracking" variant="outline" size="sm" onPress={async () => {
                        try { await adminUpdateTracking(o.id, trackingInput[o.id]); const d = await adminGetOrders(); setOrders(d?.orders || []); setTrackingMsg(m => ({ ...m, [o.id]: '✓ Tracking updated!' })); setTimeout(() => setTrackingMsg(m => { const n={...m}; delete n[o.id]; return n; }), 4000); } catch (e: any) { setTrackingMsg(m => ({ ...m, [o.id]: 'Error: ' + e.message })); }
                      }} />
                    )}
                  </View>
                  {trackingMsg[o.id] && (
                    <Text style={{ color: trackingMsg[o.id].startsWith('Error') ? '#ef4444' : '#22c55e', fontSize: 12, marginTop: 6, fontWeight: '600' }}>{trackingMsg[o.id]}</Text>
                  )}

                  {o.fulfilled_at && (
                    <Text style={{ color: '#8B9AB0', fontSize: 11, marginTop: 8 }}>
                      Fulfilled: {new Date(o.fulfilled_at).toLocaleString()}
                    </Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {filtered.length === 0 && (
          <Text style={styles.emptyText}>{orders.length === 0 ? 'No orders yet.' : 'No orders match your search.'}</Text>
        )}
      </View>
    );
  };


  const renderTaxonomy = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Taxonomy Management</Text>
      <Text style={{ color: C.TEXT_MUTED, marginBottom: 16, fontSize: 13 }}>
        Manage the dropdown options for challenge categories, feeling types, and movement types.
      </Text>
      {(['challenge_categories', 'feeling_categories', 'movement_categories'] as const).map(key => {
        const labels = { challenge_categories: 'Challenge Categories', feeling_categories: 'Feeling Categories', movement_categories: 'Movement Categories' };
        const newKeys = { challenge_categories: 'challenge', feeling_categories: 'feeling', movement_categories: 'movement' } as const;
        const nk = newKeys[key];
        return (
          <View key={key} style={[styles.formCard, { marginBottom: 20 }]}>
            <Text style={styles.formTitle}>{labels[key]} ({taxonomy[key]?.length || 0})</Text>
            {(taxonomy[key] || []).map((item, idx) => (
              <View key={idx} style={[styles.listItem, { paddingVertical: 8 }]}>
                <Text style={[styles.listItemTitle, { flex: 1 }]}>{item}</Text>
                <TouchableOpacity onPress={() => removeTaxonomyItem(key, idx)}>
                  <Text style={{ color: C.DANGER, fontSize: 18 }}>x</Text>
                </TouchableOpacity>
              </View>
            ))}
            <View style={[styles.rowBetween, { marginTop: 12, gap: 8 }]}>
              <TextInput
                style={[styles.taxInput, { flex: 1 }]}
                placeholder={'Add new ' + key.replace('_categories', '').replace('_', ' ') + '...'}
                placeholderTextColor={C.TEXT_MUTED}
                value={newTaxonomyItem[nk]}
                onChangeText={v => setNewTaxonomyItem(n => ({ ...n, [nk]: v }))}
              />
              <GradientButton
                label="Add"
                variant="primary"
                size="sm"
                loading={savingTaxonomy}
                onPress={() => addTaxonomyItem(key, newTaxonomyItem[nk])}
              />
            </View>
          </View>
        );
      })}
    </View>
  );


  const renderSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>⚙ Site Settings</Text>
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

      <Input
        label="Motivational Quote (shown on home page)"
        value={settings.motivational_quote || ''}
        onChangeText={v => setSettings((s: any) => ({ ...s, motivational_quote: v }))}
        multiline
        numberOfLines={2}
        placeholder="Every photo tells a story..."
      />

      {/* Shipping Settings */}
      <View style={[styles.formCard, { marginTop: 20 }]}>
        <Text style={styles.formTitle}>🚚 Shipping Rates</Text>
        <Text style={{ color: C.TEXT_MUTED, fontSize: 12, marginBottom: 12 }}>
          Rates shown to customers at checkout. Prices in USD cents (e.g. 599 = $5.99). Set Express to 0 to hide it.
        </Text>

        <Text style={styles.fieldGroupLabel}>Standard Shipping</Text>
        <Input label="Display Name" value={settings.shipping_standard_name || 'Standard Shipping'} onChangeText={v => setSettings((s: any) => ({ ...s, shipping_standard_name: v }))} />
        <Input label="Price (cents, e.g. 599 = $5.99)" value={String(settings.shipping_standard_cents ?? '599')} onChangeText={v => setSettings((s: any) => ({ ...s, shipping_standard_cents: v }))} keyboardType="numeric" />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}><Input label="Min days" value={String(settings.shipping_standard_days_min ?? '5')} onChangeText={v => setSettings((s: any) => ({ ...s, shipping_standard_days_min: v }))} keyboardType="numeric" /></View>
          <View style={{ flex: 1 }}><Input label="Max days" value={String(settings.shipping_standard_days_max ?? '10')} onChangeText={v => setSettings((s: any) => ({ ...s, shipping_standard_days_max: v }))} keyboardType="numeric" /></View>
        </View>

        <Text style={[styles.fieldGroupLabel, { marginTop: 12 }]}>Express Shipping (set price to 0 to hide)</Text>
        <Input label="Display Name" value={settings.shipping_express_name || 'Express Shipping'} onChangeText={v => setSettings((s: any) => ({ ...s, shipping_express_name: v }))} />
        <Input label="Price (cents, e.g. 1299 = $12.99)" value={String(settings.shipping_express_cents ?? '1299')} onChangeText={v => setSettings((s: any) => ({ ...s, shipping_express_cents: v }))} keyboardType="numeric" />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}><Input label="Min days" value={String(settings.shipping_express_days_min ?? '2')} onChangeText={v => setSettings((s: any) => ({ ...s, shipping_express_days_min: v }))} keyboardType="numeric" /></View>
          <View style={{ flex: 1 }}><Input label="Max days" value={String(settings.shipping_express_days_max ?? '3')} onChangeText={v => setSettings((s: any) => ({ ...s, shipping_express_days_max: v }))} keyboardType="numeric" /></View>
        </View>

        <Text style={{ color: C.TEXT_MUTED, fontSize: 11, marginTop: 8 }}>
          ℹ Changes take effect on the next checkout. Existing pending orders keep their original rates.
        </Text>
      </View>

      {/* Allowed shipping countries */}
      <View style={[styles.formCard, { marginTop: 16 }]}>
        <Text style={styles.formTitle}>🌍 Shipping Countries</Text>
        <Text style={{ color: C.TEXT_MUTED, fontSize: 12, marginBottom: 8 }}>
          Currently ships to: US, CA, GB, AU, NZ. Contact developer to add more countries.
        </Text>
        <Text style={{ color: C.TEXT_SECONDARY, fontSize: 13 }}>
          🇺 🇸 United States &bull; 🇨 🇦 Canada &bull; 🇬 🇧 United Kingdom &bull; 🇦 🇺 Australia &bull; 🇳 🇿 New Zealand
        </Text>
      </View>

      <GradientButton
        label="Save All Settings"
        onPress={() =>
          adminUpdateSettings(settings)
            .then(() => Alert.alert('Saved', 'Settings updated. Shipping rates will apply on next checkout.'))
            .catch((e: any) => Alert.alert('Error', e.message))
        }
        style={{ marginTop: 16 } as any}
      />
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Admin Panel</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true} persistentScrollbar
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        {(() => {
          const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
          const todaySubmissions = stats.today?.submissions ?? 0;
          const newUsers = stats.today?.logins ?? 0;
          const tabBadges: Record<string,number> = {
            Orders: pendingOrders,
            Submissions: todaySubmissions,
          };
          return TABS.map(tab => {
            const badge = tabBadges[tab] || 0;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab)}
              >
                <View style={{ position: 'relative' }}>
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                  {badge > 0 && (
                    <View style={{ position: 'absolute', top: -6, right: -10, backgroundColor: '#ef4444', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
                      <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>{badge > 99 ? '99+' : badge}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          });
        })()}
      </ScrollView>
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
          {activeTab === 'Taxonomy' && renderTaxonomy()}
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
  highlightBox: {
    backgroundColor: C.TEAL + '15',
    borderWidth: 1, borderColor: C.TEAL + '44',
    borderRadius: borderRadius.lg, padding: 14,
  },
  highlightLabel: { color: C.TEAL, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  highlightHint: { color: C.TEXT_MUTED, fontSize: 12, marginBottom: 8, lineHeight: 16 },
  fieldGroupLabel: { color: C.TEXT, fontSize: 13, fontWeight: '700', marginBottom: 4, marginTop: 8 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: (C as any).INPUT_BG || (C as any).CARD_BG2 || C.CARD_BG,
    borderRadius: borderRadius.lg, borderWidth: 1, borderColor: C.CARD_BORDER,
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10,
  },
  searchInput: { flex: 1, color: C.TEXT, fontSize: 14 },
  miniStatCard: {
    backgroundColor: C.CARD_BG, borderRadius: borderRadius.md,
    padding: 10, alignItems: 'center', minWidth: 60,
    borderWidth: 1, borderColor: C.CARD_BORDER,
  },
  miniStatValue: { fontSize: 20, fontWeight: '800' },
  miniStatLabel: { color: C.TEXT_MUTED, fontSize: 10, marginTop: 2 },
  userAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.ORANGE + '33', alignItems: 'center', justifyContent: 'center',
    marginRight: 10, flexShrink: 0,
  },
  userAvatarText: { color: C.ORANGE, fontWeight: '800', fontSize: 15 },
  detailChip: {
    backgroundColor: (C as any).CARD_BG2 || C.CARD_BG, borderRadius: borderRadius.md,
    padding: 10, alignItems: 'center', minWidth: 70,
    borderWidth: 1, borderColor: C.CARD_BORDER,
  },
  detailChipLabel: { color: C.TEXT_MUTED, fontSize: 10, marginBottom: 2 },
  detailChipValue: { color: C.TEXT, fontWeight: '700', fontSize: 13 },
  detailRow: { color: (C as any).TEXT_SECONDARY || C.TEXT_MUTED, fontSize: 14, marginBottom: 6 },
  detailLabel: { color: C.TEXT_MUTED, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyTitle: { color: C.TEXT_MUTED, fontSize: 14 },
  chipOption: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: borderRadius.pill,
    backgroundColor: (C as any).CARD_BG2 || C.CARD_BG,
    borderWidth: 1, borderColor: C.CARD_BORDER,
    marginRight: 6, marginBottom: 4,
  },
  chipOptionActive: { backgroundColor: C.TEAL + '22' as any, borderColor: C.TEAL },
  chipOptionText: { color: C.TEXT_MUTED, fontSize: 12 },
  chipOptionTextActive: { color: C.TEAL, fontWeight: '700' as const },
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
  challengeAdminCard: {
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    overflow: 'hidden',
    marginBottom: 14,
  },
  challengeAdminImg: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  adminChip: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: borderRadius.pill,
    backgroundColor: C.CARD_BG2,
    borderWidth: 1, borderColor: C.CARD_BORDER,
  },
  adminChipText: { color: C.TEXT_MUTED, fontSize: 11, fontWeight: '600' },
  thumbImage: {
    width: 56, height: 56, borderRadius: borderRadius.sm,
    backgroundColor: (C as any).CARD_BG2 || C.CARD_BG,
  },
  thumbPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  listItemInfo: { flex: 1 },
  listItemTitle: { color: C.TEXT, fontWeight: '600', marginBottom: 2 },
  listItemSub: { color: (C as any).TEXT_SECONDARY || C.TEXT_MUTED, fontSize: 13, marginBottom: 2 },
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
  toggleRow: { flexDirection: 'row', gap: 16, marginTop: 4 },
  toggleItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toggleLabel: { color: C.TEXT_MUTED, fontSize: 12 },
  taxInput: {
    backgroundColor: (C as any).INPUT_BG || (C as any).CARD_BG2 || C.CARD_BG,
    borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: C.CARD_BORDER,
    color: C.TEXT, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
  },
  commentBubble: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.TEAL + '22',
    alignItems: 'center', justifyContent: 'center',
  },
  productIcon: {
    width: 44, height: 44, borderRadius: 8,
    backgroundColor: (C as any).CARD_BG2 || C.CARD_BG,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeTeal: {
    backgroundColor: C.TEAL + '22', borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: C.TEAL,
  },
  badgeOrange: {
    backgroundColor: C.ORANGE + '22', borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: C.ORANGE,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: C.TEXT },
  statusBadge: {
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
})