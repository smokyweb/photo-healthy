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
  adminGetDiscountCodes, createDiscountCode, updateDiscountCode, deleteDiscountCode,
  getChallenges, createChallenge, updateChallenge, deleteChallenge,
  deleteSubmission, deleteComment, updateComment, getComments, getSubmissions,
  adminGetOrders, adminMarkOrderPaid, adminProcessOrder, adminFulfillOrder, adminUpdateTracking, deleteUser, updateUser, adminSuspendUser,
  adminGetTaxonomy, adminUpdateTaxonomy,
  adminGetActivity, adminGetUserSubmissions, adminGetUserComments, adminGetUserOrders, adminCreateUser, adminResetPassword,
  uploadPhoto,
} from '../services/api';
import GradientButton from '../components/GradientButton';
import LoadingSpinner from '../components/LoadingSpinner';
import Input from '../components/Input';
import { C, borderRadius } from '../theme';
import { DEFAULT_TAXONOMY } from '../constants/taxonomy';

const TABS = ['Dashboard', 'Challenges', 'Users', 'Feed', 'Products', 'Discounts', 'Orders', 'Settings', 'Taxonomy'];

export default function AdminScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const isAdmin = !!(user?.is_admin || user?.role === 'admin');
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
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', password: '', subscription_status: 'free', pro_days: '' });
  const [createUserMsg, setCreateUserMsg] = useState('');
  const [userActivity, setUserActivity] = useState<{submissions: any[], orders: any[], comments: any[]}>({ submissions: [], orders: [], comments: [] });
  const [userDetailTab, setUserDetailTab] = useState<'Submissions'|'Orders'|'Comments'>('Submissions');
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [challenges, setChallenges] = useState<any[]>([]);

  // Submissions timeline state
  const [activityItems, setActivityItems] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [submissionComments, setSubmissionComments] = useState<any[]>([]);
  const [loadingSubmComments, setLoadingSubmComments] = useState(false);
  const [editingComment, setEditingComment] = useState<{id: number, text: string} | null>(null);
  const [submissionSearch, setSubmissionSearch] = useState('');
  const [submissionFilter, setSubmissionFilter] = useState<'All'|'Photos'|'Comments'>('All');
  const [feedLoadError, setFeedLoadError] = useState('');

  const [products, setProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productSort, setProductSort] = useState<'name'|'price'|'type'>('name');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productEditForm, setProductEditForm] = useState<any>({});
  const [discountCodes, setDiscountCodes] = useState<any[]>([]);
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<any>(null);
  const [discountForm, setDiscountForm] = useState({
    code: '', kind: 'coupon', discount_type: 'amount', value: '',
    min_subtotal: '', max_uses: '', starts_at: '', expires_at: '', is_active: true,
  });

  const [orders, setOrders] = useState<any[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<string>('Active');
  const [orderSort, setOrderSort] = useState<'newest'|'oldest'|'customer'|'amount_high'|'amount_low'>('newest');
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [trackingInput, setTrackingInput] = useState<Record<number, string>>({});
  const [trackingMsg, setTrackingMsg] = useState<Record<number, string>>({});

  const [settings, setSettings] = useState<any>({});

  // Taxonomy state
  const [taxonomy, setTaxonomy] = useState<{
    challenge_categories: string[];
    feeling_categories: string[];
    movement_categories: string[];
  }>(DEFAULT_TAXONOMY);
  const [newTaxonomyItem, setNewTaxonomyItem] = useState({ challenge: '', feeling: '', movement: '' });
  const [savingTaxonomy, setSavingTaxonomy] = useState(false);

  // Challenge form state
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<any>(null);
  const [challengeForm, setChallengeForm] = useState({
    title: '', description: '', start_date: '', end_date: '',
    category: '', feeling_category: '', movement_category: '', is_pro_only: false,
    duration_days: '30', global_end_date: '', cover_image_url: '', partner_url: '',
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

  const loadTab = async (tab: string) => {
    if (!isAdmin) return;
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
          setTaxonomy(DEFAULT_TAXONOMY);
          break;
        }
        case 'Users': {
          const data = await adminGetUsers();
          setUsers(data?.users || data || []);
          break;
        }
        case 'Feed': {
          setFeedLoadError('');
          try {
            const data = await adminGetActivity().catch(() => ({ items: [] }));
            let items = Array.isArray(data?.items) ? data.items : [];
            if (items.length === 0) {
              const subData = await getSubmissions({ limit: '200' });
              const submissions = Array.isArray(subData)
                ? subData
                : Array.isArray(subData?.submissions)
                  ? subData.submissions
                  : [];
              const commentGroups = await Promise.all(
                submissions.slice(0, 120).map((sub: any) =>
                  getComments(sub.id).catch(() => ({ comments: [] }))
                )
              );
              const fallbackComments = commentGroups.flatMap((group: any, index: number) => {
                const sub = submissions[index];
                const comments = Array.isArray(group)
                  ? group
                  : Array.isArray(group?.comments)
                    ? group.comments
                    : [];
                return comments.map((comment: any) => ({
                  ...comment,
                  type: 'comment',
                  title: comment.text || comment.content || '',
                  image_url: sub.photo1_url || sub.image_url || sub.photo_url,
                  photo1_url: sub.photo1_url || sub.image_url || sub.photo_url,
                  photo2_url: sub.photo2_url,
                  created_at: comment.created_at,
                  user_name: comment.user_name || comment.name,
                  challenge_title: sub.challenge_title,
                  challenge_id: sub.challenge_id,
                  submission_id: sub.id,
                  submission_title: sub.title,
                }));
              });
              items = [
                ...submissions.map((sub: any) => ({
                  ...sub,
                  type: 'submission',
                  image_url: sub.photo1_url || sub.image_url || sub.photo_url,
                  photo1_url: sub.photo1_url || sub.image_url || sub.photo_url,
                  user_name: sub.user_name || sub.name,
                })),
                ...fallbackComments,
              ].sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
            }
            setActivityItems(items);
          } catch (feedErr: any) {
            setFeedLoadError(feedErr.message || 'Could not load moderation feed');
            setActivityItems([]);
          }
          break;
        }
        case 'Products': {
          const data = await adminGetProducts();
          setProducts(data?.products || data || []);
          break;
        }
        case 'Discounts': {
          const data = await adminGetDiscountCodes();
          setDiscountCodes(data?.discount_codes || data || []);
          break;
        }
        case 'Orders': {
          const data = await adminGetOrders({ sort: orderSort });
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
          setTaxonomy(DEFAULT_TAXONOMY);
          break;
        }
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    if (isAdmin) loadTab(activeTab);
  }, [activeTab, isAdmin]);

  useEffect(() => {
    if (isAdmin && activeTab === 'Orders') loadTab('Orders');
  }, [orderSort, isAdmin]);

  // Load user detail data when selectedUser changes
  useEffect(() => {
    if (!isAdmin || !selectedUser) return;
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
  }, [selectedUser?.id, isAdmin]);

  // Admin access check
  if (!isAdmin) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center', flex: 1 }]}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🔒</Text>
        <Text style={{ color: C.TEXT_MUTED, marginBottom: 24 }}>Admin access required.</Text>
        <GradientButton label="Go Back" onPress={() => navigation.goBack()} variant="outline" />
      </View>
    );
  }


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
            { label: 'Feed', value: stats.today?.submissions ?? 0, icon: '📷', tab: 'Feed' as const },
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
        partner_url: ch.partner_url || '',
      });
      setChallengeImgPreview(ch.cover_image_url ? ('https://photoai.betaplanets.com' + ch.cover_image_url).replace('https://photoai.betaplanets.comhttp', 'http') : '');
      setChallengeImgFile(null);
    } else {
      setEditingChallenge(null);
      setChallengeForm({ title: '', description: '', start_date: '', end_date: '', category: '', feeling_category: '', movement_category: '', is_pro_only: false, duration_days: '30', global_end_date: '', cover_image_url: '', partner_url: '' });
      setChallengeImgPreview('');
      setChallengeImgFile(null);
    }
    setShowChallengeForm(true);
  };

  const saveChallenge = async () => {
    if (!challengeForm.title?.trim()) {
      setProductSaveMsg('Error: Challenge title is required');
      return;
    }
    const singleValue = (value?: string) => (value || '').split(',')[0].trim();
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
        cover_image_url: imageUrl || null,
        category: singleValue(challengeForm.category),
        feeling_category: singleValue(challengeForm.feeling_category),
        movement_category: singleValue(challengeForm.movement_category),
        duration_days: parseInt(challengeForm.duration_days) || 30,
        global_end_date: challengeForm.global_end_date || null,
        start_date: challengeForm.start_date || null,
        end_date: challengeForm.end_date || null,
        partner_url: challengeForm.partner_url || null,
      };
      if (editingChallenge) {
        await updateChallenge(editingChallenge.id, payload);
        setChallenges(cs => cs.map(c => c.id === editingChallenge.id ? { ...c, ...payload } : c));
        setEditingChallenge(null);
        setProductSaveMsg('Challenge updated!');
      } else {
        const created = await createChallenge(payload);
        setChallenges(cs => [...cs, created?.challenge || created]);
        setProductSaveMsg('Challenge created!');
      }
      setShowChallengeForm(false);
      setChallengeForm({ title: '', description: '', duration_days: '30', start_date: '', end_date: '', global_end_date: '', cover_image_url: '', partner_url: '', feeling_category: '', movement_category: '', is_pro_only: false, is_active: true });
      setTimeout(() => setProductSaveMsg(''), 3000);
    } catch (e: any) {
      setUploadingImg(false);
      setProductSaveMsg('Error: ' + (e.message || 'Failed to save challenge'));
    }
  };

  const handleDeleteChallenge = (id: number, title: string) => {
    const message = 'Delete "' + title + '" and all entries for it? This cannot be undone.';
    const confirmed = typeof window !== 'undefined' && window.confirm
      ? window.confirm(message)
      : true;
    if (!confirmed) return;
    const runDelete = async () => {
      try {
        await deleteChallenge(id);
        setChallenges(cs => cs.filter(c => c.id !== id));
      } catch (e: any) {
        Alert.alert('Error', e.message || 'Failed to delete challenge');
      }
    };
    runDelete();
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
          <Input
            label="Description"
            value={challengeForm.description}
            onChangeText={v => setChallengeForm(f => ({ ...f, description: v }))}
            multiline
            numberOfLines={6}
            maxLength={2000}
          />
          <Input
            label="Partner Link"
            value={challengeForm.partner_url}
            onChangeText={v => setChallengeForm(f => ({ ...f, partner_url: v }))}
            placeholder="https://partner-site.com/challenge"
            autoCapitalize="none"
          />
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
            <View style={styles.challengePreviewWrap}>
              <Image source={{ uri: challengeImgPreview }} style={styles.challengePreviewImg} resizeMode="cover" />
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
          <Input label="" value={challengeForm.category} onChangeText={v => setChallengeForm(f => ({ ...f, category: v }))} placeholder="Select a category above" />
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
          <Input label="" value={challengeForm.feeling_category} onChangeText={v => setChallengeForm(f => ({ ...f, feeling_category: v }))} placeholder="Select a feeling above" />
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
          <Input label="" value={challengeForm.movement_category} onChangeText={v => setChallengeForm(f => ({ ...f, movement_category: v }))} placeholder="Select a movement above" />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Pro Only</Text>
            <Switch value={challengeForm.is_pro_only} onValueChange={v => setChallengeForm(f => ({ ...f, is_pro_only: v }))} trackColor={{ true: C.ORANGE }} />
          </View>
                      {productSaveMsg ? <Text style={{ color: productSaveMsg.startsWith('Error') ? '#ef4444' : '#22c55e', marginBottom: 8, fontWeight: '700' }}>{productSaveMsg}</Text> : null}
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
          <View key={ch.id} style={styles.challengeAdminCard}>
            {/* Cover image thumbnail */}
            {imgUri ? (
              <Image source={{ uri: imgUri }} style={styles.challengeAdminImg} resizeMode="cover" />
            ) : (
              <View style={[styles.challengeAdminImg, { backgroundColor: C.CARD_BG2, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontSize: 40 }}>📷</Text>
                <Text style={{ color: C.TEXT_MUTED, fontSize: 11, marginTop: 4 }}>No image</Text>
              </View>
            )}
            {/* Info beside image */}
            <View style={styles.challengeAdminInfo}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text style={[styles.listItemTitle, { flex: 1, fontSize: 15, marginBottom: 4 }]}>{ch.title}</Text>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <TouchableOpacity onPress={() => openChallengeForm(ch)} style={[styles.iconBtn, styles.challengeEditBtn]}>
                    <Text style={[styles.editIcon, styles.challengeEditText]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteChallenge(ch.id, ch.title)} style={[styles.iconBtn, styles.challengeDeleteBtn]}>
                    <Text style={[styles.deleteIcon, styles.challengeDeleteText]}>Delete</Text>
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
                {ch.partner_url ? (
                  <View style={[styles.adminChip, { borderColor: C.TEAL }]}><Text style={[styles.adminChipText, { color: C.TEAL }]}>Partner Link</Text></View>
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
    if (typeof window !== 'undefined' && !window.confirm('Delete ' + name + '? This cannot be undone.')) return;
    (async () => {
      try {
        await deleteUser(id);
        setUsers(us => us.filter(u => u.id !== id));
        if (selectedUser?.id === id) setSelectedUser(null);
        Alert.alert('Deleted', name + ' has been deleted.');
      } catch (e: any) { Alert.alert('Error', e.message); }
    })();
  };

  const handlePromoteAdmin = (id: number, name: string) => {
    if (typeof window !== 'undefined' && !window.confirm('Promote ' + name + ' to admin?')) return;
    (async () => {
      try {
        await updateUser(id, { role: 'admin', is_admin: 1 });
        const updated = { ...selectedUser, role: 'admin', is_admin: 1 };
        setUsers(us => us.map(u => u.id === id ? { ...u, role: 'admin', is_admin: 1 } : u));
        if (selectedUser?.id === id) setSelectedUser(updated);
        Alert.alert('Promoted', name + ' is now an admin.');
      } catch (e: any) { Alert.alert('Error', e.message); }
    })();
  };

  const handleSuspendUser = (u: any) => {
    const nextSuspended = !u.is_suspended;
    const action = nextSuspended ? 'Block' : 'Unblock';
    const reason = nextSuspended ? 'Blocked by admin' : '';
    if (typeof window !== 'undefined' && !window.confirm(action + ' ' + u.name + '?')) return;
    (async () => {
      try {
        await adminSuspendUser(u.id, nextSuspended, reason);
        const updated = { ...u, is_suspended: nextSuspended, suspended_reason: reason || null };
        setUsers(us => us.map(usr => usr.id === u.id ? updated : usr));
        setSelectedUser(updated);
        Alert.alert('Updated', u.name + (nextSuspended ? ' is blocked.' : ' is unblocked.'));
      } catch (e: any) {
        Alert.alert('Error', e.message);
      }
    })();
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
            <View style={styles.detailChip}><Text style={styles.detailChipLabel}>Status</Text><Text style={[styles.detailChipValue, { color: u.is_suspended ? C.DANGER : C.TEAL }]}>{u.is_suspended ? 'Blocked' : 'Active'}</Text></View>
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
              {editingUserForm.subscription_status === 'active' && (
                <Input label="Pro Duration (days to add/extend, e.g. 30)" value={editingUserForm.pro_days || ''}
                  onChangeText={v => setEditingUserForm((f: any) => ({ ...f, pro_days: v }))}
                  keyboardType="numeric" placeholder="30 (leave blank to keep current)" />
              )}
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
            {!u.is_admin && <GradientButton label={u.is_suspended ? 'Unblock User' : 'Block User'} variant={u.is_suspended ? 'outline' : 'danger'} size="sm" onPress={() => handleSuspendUser(u)} />}
            <GradientButton label="🗑 Delete" variant="danger" size="sm" onPress={() => handleDeleteUser(u.id, u.name)} />
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
                setActiveTab('Feed');
              }}
            >
              {s.photo1_url ? (
                <Image source={{ uri: s.photo1_url.startsWith('http') ? s.photo1_url : 'https://photoai.betaplanets.com' + s.photo1_url }} style={styles.thumbImage} resizeMode="contain" />
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
            <TouchableOpacity
              key={o.id}
              style={styles.listItem}
              activeOpacity={0.8}
              onPress={async () => {
                const d = await adminGetOrders({ sort: orderSort });
                setOrders(d?.orders || []);
                setExpandedOrders(new Set([o.id]));
                setSelectedUser(null);
                setActiveTab('Orders');
              }}
            >
              <View style={styles.listItemInfo}>
                <Text style={styles.listItemTitle}>Order #{o.id}</Text>
                <Text style={styles.listItemSub}>{(o.total_amount && Number(o.total_amount) > 0) || (o.total && Number(o.total) > 0) ? ('$' + Number(o.total_amount || o.total).toFixed(2)) : '$0.00'}</Text>
                <Text style={[styles.listItemMeta, { color: o.status === 'completed' ? C.TEAL : o.status === 'refunded' ? C.DANGER : C.TEXT_MUTED }]}>
                  {o.status} {o.created_at ? '- ' + new Date(o.created_at).toLocaleDateString() : ''}
                </Text>
              </View>
              <Text style={{ color: C.TEXT_MUTED, fontSize: 16 }}>›</Text>
            </TouchableOpacity>
          ))
        ) : (
          userActivity.comments.map((c: any) => (
            <View key={c.id} style={[styles.listItem, { flexDirection: 'column', alignItems: 'stretch' }]}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={{ flexDirection: 'row', alignItems: 'center' }}
                onPress={() => {
                  if (!c.submission_id) return;
                  setSelectedSubmission({
                    id: c.submission_id,
                    title: c.submission_title || 'Submission',
                    image_url: c.submission_photo || null,
                  });
                  loadSubmissionComments(c.submission_id);
                  setSelectedUser(null);
                  setActiveTab('Feed');
                }}
              >
              <View style={[styles.commentBubble, { marginRight: 10 }]}>
                <Text style={{ fontSize: 16 }}>💬</Text>
              </View>
              <View style={styles.listItemInfo}>
                <Text style={styles.listItemTitle} numberOfLines={2}>{c.text}</Text>
                {c.submission_title ? <Text style={styles.listItemSub}>on: {c.submission_title}</Text> : null}
                <Text style={styles.listItemMeta}>{c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}</Text>
              </View>
              <Text style={{ color: C.TEXT_MUTED, fontSize: 16 }}>›</Text>
              </TouchableOpacity>
              {editingComment?.id === c.id ? (
                <View style={{ marginTop: 10 }}>
                  <TextInput
                    style={[styles.input, { marginBottom: 8 }]}
                    value={editingComment.text}
                    onChangeText={v => setEditingComment(e => e ? { ...e, text: v } : null)}
                    multiline
                    autoFocus
                  />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <GradientButton
                      label="Save"
                      variant="primary"
                      size="sm"
                      style={{ flex: 1 } as any}
                      onPress={async () => {
                        await handleSaveCommentEdit(c.id, editingComment.text);
                        setUserActivity(prev => ({
                          ...prev,
                          comments: prev.comments.map(cm => cm.id === c.id ? { ...cm, text: editingComment.text } : cm),
                        }));
                      }}
                    />
                    <GradientButton label="Cancel" variant="outline" size="sm" style={{ flex: 1 } as any} onPress={() => setEditingComment(null)} />
                  </View>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                  <GradientButton label="Edit" variant="outline" size="sm" onPress={() => setEditingComment({ id: c.id, text: c.text || '' })} />
                  <GradientButton
                    label="Delete"
                    variant="danger"
                    size="sm"
                    onPress={async () => {
                      await handleDeleteSubmissionComment(c.id);
                      setUserActivity(prev => ({ ...prev, comments: prev.comments.filter(cm => cm.id !== c.id) }));
                    }}
                  />
                </View>
              )}
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
        {/* Create User form */}
        <View style={{ marginBottom: 14 }}>
          <GradientButton label={showCreateUserForm ? '✕ Cancel' : '+ Add User'} variant={showCreateUserForm ? 'outline' : 'teal'} size="sm"
            onPress={() => { setShowCreateUserForm(v => !v); setCreateUserMsg(''); setNewUserForm({ name: '', email: '', password: '' }); }} style={{ alignSelf: 'flex-start' } as any} />
          {showCreateUserForm && (
            <View style={[styles.formCard, { marginTop: 12 }]}>
              <Text style={styles.formTitle}>Add New User</Text>
              <Input label="Full Name *" value={newUserForm.name} onChangeText={v => setNewUserForm(f => ({ ...f, name: v }))} />
              <Input label="Email Address *" value={newUserForm.email} onChangeText={v => setNewUserForm(f => ({ ...f, email: v }))} keyboardType="email-address" />
              <Input label="Temporary Password *" value={newUserForm.password} onChangeText={v => setNewUserForm(f => ({ ...f, password: v }))} secureTextEntry />
              <Text style={{ color: C.TEXT_MUTED, fontSize: 12, marginTop: 8, marginBottom: 4 }}>Membership Level</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                {['free', 'active'].map(st => (
                  <TouchableOpacity key={st} style={[styles.chipOption, newUserForm.subscription_status === st && styles.chipOptionActive]}
                    onPress={() => setNewUserForm(f => ({ ...f, subscription_status: st }))}>
                    <Text style={[styles.chipOptionText, newUserForm.subscription_status === st && styles.chipOptionTextActive]}>{st === 'active' ? 'Pro Member' : 'Free'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {newUserForm.subscription_status === 'active' && (
                <Input label="Pro Duration (days, e.g. 30 or 365)" value={newUserForm.pro_days}
                  onChangeText={v => setNewUserForm(f => ({ ...f, pro_days: v }))}
                  keyboardType="numeric" placeholder="30" />
              )}
              {createUserMsg ? <Text style={{ color: createUserMsg.startsWith('Error') ? '#ef4444' : '#22c55e', marginTop: 8, fontWeight: '700' }}>{createUserMsg}</Text> : null}
              <GradientButton label="Create User" variant="primary" style={{ marginTop: 12 } as any}
                onPress={async () => {
                  if (!newUserForm.name.trim() || !newUserForm.email.trim() || !newUserForm.password.trim()) { setCreateUserMsg('Error: All fields required'); return; }
                  try {
                    const created = await adminCreateUser(newUserForm);
                    // If Pro was selected, grant pro membership
                    if (newUserForm.subscription_status === 'active' && created?.id) {
                      const days = parseInt(newUserForm.pro_days) || 30;
                      await fetch('/admin-api-proxy.php?path=/api/admin/users/' + created.id + '/grant-pro&method=POST', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (localStorage.getItem('ph_token') || '') },
                        body: JSON.stringify({ days, note: 'Admin assigned at creation' })
                      }).catch(() => {});
                    }
                    const d = await adminGetUsers();
                    setUsers(d?.users || d || []);
                    setNewUserForm({ name: '', email: '', password: '', subscription_status: 'free', pro_days: '' });
                    setShowCreateUserForm(false);
                    setCreateUserMsg('User created successfully!');
                    setTimeout(() => setCreateUserMsg(''), 3000);
                  } catch (e: any) { setCreateUserMsg('Error: ' + (e.message || 'Failed to create user')); }
                }} />
            </View>
          )}
        </View>
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
      const data = await getComments(submissionId);
      setSubmissionComments(data.comments || data || []);
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
    } catch (e: any) { console.error('Delete comment failed:', e.message); }
  };

  const handleSaveCommentEdit = async (commentId: number, newText: string) => {
    if (!newText.trim()) return;
    try {
      await updateComment(commentId, newText);
      setSubmissionComments(cs => cs.map(c => c.id === commentId ? { ...c, text: newText } : c));
      setEditingComment(null);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not update comment.');
    }
  };

  const handleDeleteActivityItem = async (item: any) => {
    const label = item.type === 'comment' ? 'comment' : 'submission';
    if (!window.confirm('Delete this ' + label + '? This cannot be undone.')) return;
    try {
      if (item.type === 'comment') {
        await deleteComment(item.id);
      } else {
        await deleteSubmission(item.id);
      }
      setActivityItems(items => items.filter(i => !(i.id === item.id && i.type === item.type)));
    } catch (e: any) { console.error('Delete failed:', e.message); }
  };

  const downloadAdminPhoto = async (url: string, filename: string) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    }
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
          <TouchableOpacity onPress={() => { setSelectedSubmission(null); setSelectedPhotoIndex(0); setSubmissionComments([]); }} style={{ marginBottom: 16 }}>
            <Text style={{ color: C.ORANGE, fontSize: 14 }}>← Back to Timeline</Text>
          </TouchableOpacity>

          {/* All photos */}
          {(() => {
            const photoUrls = [
              sub.image_url || sub.photo1_url,
              sub.photo2_url,
              sub.photo3_url,
              sub.photo4_url,
            ]
              .filter(Boolean)
              .map((u: string) => u.startsWith('http') ? u : 'https://photoai.betaplanets.com' + u)
              .filter((url: string, index: number, arr: string[]) => arr.indexOf(url) === index);
            if (photoUrls.length === 0) return (
              <View style={{ width: '100%', height: 200, borderRadius: 12, backgroundColor: C.CARD_BG2, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 48 }}>📷</Text>
              </View>
            );
            const activeIndex = Math.min(selectedPhotoIndex, photoUrls.length - 1);
            const activePhotoUrl = photoUrls[activeIndex];
            const goToPhoto = (nextIndex: number) => {
              const wrapped = (nextIndex + photoUrls.length) % photoUrls.length;
              setSelectedPhotoIndex(wrapped);
            };
            return (
              <View style={{ marginBottom: 12 }}>
                <View style={{ position: 'relative', marginBottom: 10 }}>
                  <Image source={{ uri: activePhotoUrl }} style={{ width: '100%', height: 380, borderRadius: 12, backgroundColor: C.CARD_BG2, objectFit: 'contain' } as any} resizeMode="contain" />
                  {photoUrls.length > 1 ? (
                    <>
                      <TouchableOpacity
                        onPress={() => goToPhoto(activeIndex - 1)}
                        style={[styles.photoNavBtn, { left: 10 }]}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.photoNavBtnText}>‹</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => goToPhoto(activeIndex + 1)}
                        style={[styles.photoNavBtn, { right: 10 }]}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.photoNavBtnText}>›</Text>
                      </TouchableOpacity>
                    </>
                  ) : null}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                  <Text style={{ color: C.TEXT_MUTED, fontSize: 12, fontWeight: '700' }}>
                    Photo {activeIndex + 1} of {photoUrls.length}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {photoUrls.length > 1 ? (
                      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                        {photoUrls.map((uri: string, index: number) => (
                          <TouchableOpacity
                            key={uri}
                            style={[styles.photoDotBtn, activeIndex === index && styles.photoDotBtnActive]}
                            onPress={() => setSelectedPhotoIndex(index)}
                          >
                            <Text style={[styles.photoDotText, activeIndex === index && styles.photoDotTextActive]}>{index + 1}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : null}
                    <TouchableOpacity
                      style={styles.photoDownloadIconBtn}
                      onPress={() => downloadAdminPhoto(activePhotoUrl, 'submission-' + sub.id + '-photo-' + (activeIndex + 1) + '.jpg')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.photoDownloadIconText}>↓</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity
                  style={{ backgroundColor: '#ef444415', borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#ef444440' }}
                  onPress={() => { if (window.confirm('Delete this submission and all its photos?')) { handleDeleteActivityItem({ ...sub, type: 'submission' }); setSelectedSubmission(null); } }}
                >
                  <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '700' }}>Delete Submission</Text>
                </TouchableOpacity>
                <Text style={{ color: C.TEXT_MUTED, fontSize: 11, marginTop: 4, textAlign: 'center' }}>
                  {photoUrls.length} photo{photoUrls.length !== 1 ? 's' : ''}
                </Text>
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
        <Text style={styles.sectionTitle}>Feed ({filtered.length})</Text>
        <Text style={[styles.listItemSub, { marginBottom: 12 }]}>
          Review photo submissions and comments here. Open a photo to edit/delete comments, or use Users to block an account.
        </Text>
        {feedLoadError ? (
          <Text style={{ color: C.DANGER, fontSize: 12, fontWeight: '700', marginBottom: 12 }}>
            Feed load error: {feedLoadError}
          </Text>
        ) : null}

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
                setSelectedPhotoIndex(0);
                loadSubmissionComments(item.id);
              }}
              activeOpacity={0.8}
            >
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url.startsWith('http') ? item.image_url : 'https://photoai.betaplanets.com' + item.image_url }}
                  style={styles.thumbImage}
                  resizeMode="contain"
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
            <TouchableOpacity key={'c-' + item.id} style={styles.submissionItem}
              onPress={() => {
                // Find the submission this comment belongs to and open it
                if (item.submission_id) {
                  const sub = activityItems.find(a => a.type !== 'comment' && a.id === item.submission_id);
                  setSelectedPhotoIndex(0);
                  if (sub) { setSelectedSubmission(sub); loadSubmissionComments(sub.id); }
                  else { setSelectedSubmission({ id: item.submission_id, title: item.submission_title || 'Submission', image_url: null }); loadSubmissionComments(item.submission_id); }
                }
              }}
            >
              <View style={[styles.thumbImage, styles.thumbPlaceholder]}>
                <Text style={{ fontSize: 22 }}>💬</Text>
              </View>
              <View style={styles.listItemInfo}>
                <Text style={styles.listItemTitle} numberOfLines={2}>{item.title || '(empty)'}</Text>
                <Text style={styles.listItemSub}>{item.user_name || 'Unknown'}{item.submission_title ? ' on: ' + item.submission_title : ''}</Text>
                <Text style={styles.listItemMeta}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</Text>
              </View>
              <View style={{ gap: 4 }}>
                <Text style={{ color: C.TEXT_MUTED, fontSize: 16 }}>›</Text>
                <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); handleDeleteActivityItem(item); }} style={styles.iconBtn}>
                  <Text style={styles.deleteIcon}>🗑</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )
        ))}
        {filtered.length === 0 && <Text style={styles.emptyText}>No content found.</Text>}
      </View>
    );
  };

  const productTitle = (product: any) => product?.title || product?.name || '';
  const productPriceText = (price: any) => {
    if (price === null || price === undefined || price === '') return '';
    const parsed = Number(price);
    return Number.isFinite(parsed) ? String(parsed) : '';
  };
  const parseProductPrice = (price: any) => {
    const cleaned = String(price ?? '').replace(/[$,]/g, '').trim();
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  };

  const handleCreateProduct = async (data: any) => {
    try {
      const galleryArr = Array.isArray(data.gallery_images) ? data.gallery_images : [];
      const price = parseProductPrice(data.price);
      if (price === null) {
        setProductSaveMsg('Error: Please enter a valid product price.');
        return;
      }
      await createProduct({
        title: data.name || data.title || '',
        description: data.description || null,
        price,
        emoji: data.emoji || null,
        image_url: data.image_url || null,
        gallery_images: galleryArr.length > 0 ? JSON.stringify(galleryArr) : null,
        is_pro_only: data.is_pro_only ? 1 : 0,
        featured: data.featured ? 1 : 0,
        sizes: data.sizes || null,
        is_active: 1,
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

  const handleSaveProductEdit = async () => {
    if (!editingProduct) return;
    try {
      const price = parseProductPrice(productEditForm.price);
      const payload: any = {
        title: productEditForm.name || productEditForm.title || productTitle(editingProduct),
        description: productEditForm.description || null,
        emoji: productEditForm.emoji || null,
        image_url: productEditForm.image_url || null,
        sizes: productEditForm.sizes || null,
        is_pro_only: productEditForm.is_pro_only ? 1 : 0,
        featured: productEditForm.featured ? 1 : 0,
      };
      if (price !== null) payload.price = price;
      await updateProduct(editingProduct.id, payload);
      const refreshed = await adminGetProducts();
      setProducts(refreshed?.products || refreshed || []);
      setEditingProduct(null);
      setProductEditForm({});
      setProductSaveMsg('Product updated successfully!');
      setTimeout(() => setProductSaveMsg(''), 3000);
    } catch (e: any) {
      setProductSaveMsg('Error: ' + (e.message || 'Failed to update product'));
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
      return productTitle(p).toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
    }).sort((a, b) => {
      if (productSort === 'price') return (a.price || 0) - (b.price || 0);
      if (productSort === 'type') return (a.is_pro_only ? 1 : 0) - (b.is_pro_only ? 1 : 0);
      return productTitle(a).localeCompare(productTitle(b));
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
            <Input label="Price *" value={productPriceText(productEditForm.price)} onChangeText={v => setProductEditForm((f: any) => ({ ...f, price: v }))} keyboardType="numeric" />
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
                <Text style={styles.listItemTitle}>{productTitle(p)}</Text>
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
                onPress={() => { setEditingProduct(p); setProductEditForm({ name: productTitle(p), description: p.description || '', price: productPriceText(p.price), is_pro_only: !!p.is_pro_only, featured: !!p.featured, emoji: p.emoji || '', image_url: p.image_url || '', sizes: p.sizes || '' }); }}
                style={styles.iconBtn}
              >
                <Text style={styles.editIcon}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteProduct(p.id, productTitle(p))} style={styles.iconBtn}>
                <Text style={styles.deleteIcon}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {filtered.length === 0 && <Text style={styles.emptyText}>No products found.</Text>}
      </View>
    );
  };

  const resetDiscountForm = () => {
    setDiscountForm({
      code: '', kind: 'coupon', discount_type: 'amount', value: '',
      min_subtotal: '', max_uses: '', starts_at: '', expires_at: '', is_active: true,
    });
    setEditingDiscount(null);
  };

  const refreshDiscountCodes = async () => {
    const data = await adminGetDiscountCodes();
    setDiscountCodes(data?.discount_codes || data || []);
  };

  const startEditDiscount = (code: any) => {
    setEditingDiscount(code);
    setShowDiscountForm(true);
    setDiscountForm({
      code: code.code || '',
      kind: code.kind || 'coupon',
      discount_type: code.discount_type || 'amount',
      value: String(code.value ?? ''),
      min_subtotal: code.min_subtotal == null ? '' : String(code.min_subtotal),
      max_uses: code.max_uses == null ? '' : String(code.max_uses),
      starts_at: code.starts_at ? String(code.starts_at).slice(0, 10) : '',
      expires_at: code.expires_at ? String(code.expires_at).slice(0, 10) : '',
      is_active: code.is_active === 1 || code.is_active === true,
    });
  };

  const saveDiscountCode = async () => {
    try {
      const payload = {
        ...discountForm,
        code: discountForm.code.trim().toUpperCase(),
        value: discountForm.value.trim(),
        min_subtotal: discountForm.min_subtotal.trim(),
        max_uses: discountForm.max_uses.trim(),
        starts_at: discountForm.starts_at.trim(),
        expires_at: discountForm.expires_at.trim(),
      };
      if (editingDiscount) await updateDiscountCode(editingDiscount.id, payload);
      else await createDiscountCode(payload);
      await refreshDiscountCodes();
      resetDiscountForm();
      setShowDiscountForm(false);
      Alert.alert('Saved', 'Discount code updated.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const removeDiscountCode = async (code: any) => {
    if (!window.confirm('Delete code "' + code.code + '"?')) return;
    try {
      await deleteDiscountCode(code.id);
      await refreshDiscountCodes();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const renderDiscounts = () => (
    <View style={styles.section}>
      <View style={styles.rowBetween}>
        <View>
          <Text style={styles.sectionTitle}>Coupons and Gift Codes ({discountCodes.length})</Text>
          <Text style={styles.listItemMeta}>Cart coupon and gift fields now use these admin-managed codes at checkout.</Text>
        </View>
        <GradientButton
          label={showDiscountForm ? 'Close' : '+ New'}
          onPress={() => { if (showDiscountForm) resetDiscountForm(); setShowDiscountForm(v => !v); }}
          variant="primary"
          size="sm"
        />
      </View>

      {showDiscountForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{editingDiscount ? 'Edit Code' : 'New Code'}</Text>
          <Input label="Code *" value={discountForm.code} onChangeText={v => setDiscountForm(f => ({ ...f, code: v.toUpperCase() }))} placeholder="SUMMER20" />

          <Text style={styles.fieldGroupLabel}>Type</Text>
          <View style={styles.segmentRow}>
            {(['coupon', 'gift'] as const).map(kind => (
              <TouchableOpacity key={kind} style={[styles.segmentBtn, discountForm.kind === kind && styles.segmentBtnActive]} onPress={() => setDiscountForm(f => ({ ...f, kind }))}>
                <Text style={[styles.segmentText, discountForm.kind === kind && styles.segmentTextActive]}>{kind === 'coupon' ? 'Coupon' : 'Gift code'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldGroupLabel}>Discount</Text>
          <View style={styles.segmentRow}>
            {(['amount', 'percent'] as const).map(type => (
              <TouchableOpacity key={type} style={[styles.segmentBtn, discountForm.discount_type === type && styles.segmentBtnActive]} onPress={() => setDiscountForm(f => ({ ...f, discount_type: type }))}>
                <Text style={[styles.segmentText, discountForm.discount_type === type && styles.segmentTextActive]}>{type === 'amount' ? 'Dollar amount' : 'Percent'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input label={discountForm.discount_type === 'amount' ? 'Value in dollars *' : 'Percent off *'} value={discountForm.value} onChangeText={v => setDiscountForm(f => ({ ...f, value: v }))} keyboardType="numeric" placeholder={discountForm.discount_type === 'amount' ? '10.00' : '20'} />
          <Input label="Minimum subtotal (optional)" value={discountForm.min_subtotal} onChangeText={v => setDiscountForm(f => ({ ...f, min_subtotal: v }))} keyboardType="numeric" placeholder="50.00" />
          <Input label="Usage limit (optional)" value={discountForm.max_uses} onChangeText={v => setDiscountForm(f => ({ ...f, max_uses: v }))} keyboardType="numeric" placeholder="100" />
          <Input label="Starts date (optional)" value={discountForm.starts_at} onChangeText={v => setDiscountForm(f => ({ ...f, starts_at: v }))} placeholder="YYYY-MM-DD" />
          <Input label="Expires date (optional)" value={discountForm.expires_at} onChangeText={v => setDiscountForm(f => ({ ...f, expires_at: v }))} placeholder="YYYY-MM-DD" />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Active</Text>
            <Switch value={discountForm.is_active} onValueChange={v => setDiscountForm(f => ({ ...f, is_active: v }))} trackColor={{ true: C.TEAL }} />
          </View>
          <View style={styles.formBtns}>
            <GradientButton label={editingDiscount ? 'Save' : 'Create'} onPress={saveDiscountCode} variant="primary" style={{ flex: 1, marginRight: 8 }} />
            <GradientButton label="Cancel" onPress={() => { resetDiscountForm(); setShowDiscountForm(false); }} variant="outline" style={{ flex: 1 }} />
          </View>
        </View>
      )}

      {discountCodes.map(code => {
        const active = code.is_active === 1 || code.is_active === true;
        const valueLabel = code.discount_type === 'percent'
          ? `${Number(code.value || 0).toFixed(0)}% off`
          : `$${Number(code.value || 0).toFixed(2)} off`;
        return (
          <View key={code.id} style={[styles.listItem, !active && { opacity: 0.58 }]}>
            <View style={styles.listItemInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={styles.listItemTitle}>{code.code}</Text>
                <View style={code.kind === 'gift' ? styles.badgeTeal : styles.badgeOrange}><Text style={styles.badgeText}>{code.kind === 'gift' ? 'Gift' : 'Coupon'}</Text></View>
                {!active ? <View style={{ backgroundColor: '#ef444422', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#ef444455' }}><Text style={{ color: '#ef4444', fontSize: 10, fontWeight: '700' }}>OFF</Text></View> : null}
              </View>
              <Text style={[styles.listItemSub, { color: C.TEAL, fontWeight: '700' }]}>{valueLabel}</Text>
              <Text style={styles.listItemMeta}>
                Used {code.used_count || 0}{code.max_uses ? ` of ${code.max_uses}` : ''}{code.min_subtotal ? ` - Min $${Number(code.min_subtotal).toFixed(2)}` : ''}{code.expires_at ? ` - Expires ${String(code.expires_at).slice(0, 10)}` : ''}
              </Text>
            </View>
            <View style={{ gap: 4 }}>
              <TouchableOpacity onPress={() => startEditDiscount(code)} style={styles.iconBtn}>
                <Text style={styles.editIcon}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeDiscountCode(code)} style={styles.iconBtn}>
                <Text style={styles.deleteIcon}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
      {discountCodes.length === 0 && <Text style={styles.emptyText}>No discount codes yet.</Text>}
    </View>
  );


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
    const SORT_LABELS = {
      newest: 'Newest',
      oldest: 'Oldest',
      customer: 'Customer',
      amount_high: 'Amount high',
      amount_low: 'Amount low',
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
    const sorted = [...filtered].sort((a, b) => {
      if (orderSort === 'oldest') return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      if (orderSort === 'customer') return String(a.customer_name || a.user_name || a.customer_email || '').localeCompare(String(b.customer_name || b.user_name || b.customer_email || ''));
      if (orderSort === 'amount_high') return Number(b.total_amount || b.total || 0) - Number(a.total_amount || a.total || 0);
      if (orderSort === 'amount_low') return Number(a.total_amount || a.total || 0) - Number(b.total_amount || b.total || 0);
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    // Count by status
    const counts = {};
    orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚚 Orders ({sorted.length})</Text>

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

        <Text style={{ color: C.TEXT_MUTED, fontSize: 12, marginBottom: 8 }}>Sort orders</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={true} persistentScrollbar style={{ marginBottom: 12 }}>
          {(Object.keys(SORT_LABELS) as Array<keyof typeof SORT_LABELS>).map(sortKey => (
            <TouchableOpacity
              key={sortKey}
              style={[styles.chipOption, orderSort === sortKey && styles.chipOptionActive, { marginRight: 6 }]}
              onPress={() => setOrderSort(sortKey)}
            >
              <Text style={[styles.chipOptionText, orderSort === sortKey && styles.chipOptionTextActive]}>
                {SORT_LABELS[sortKey]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Order list */}
        {sorted.map(o => {
          const isExpanded = expandedOrders.has(o.id);
          const items = getItems(o);
          const statusColor = ORDER_STATUS_COLORS[o.status] || '#F59E0B';
          const statusLabel = STATUS_LABELS[o.status] || o.status;
          const total = Number(o.total_amount || o.total || 0);
          const customerName = o.customer_name || o.user_name || o.customer_email || 'Unknown';
          const customerEmail = o.customer_email || o.user_email || '';

          return (
            <View
              key={o.id}
              style={[styles.listItem, { flexDirection: 'column', alignItems: 'stretch' }]}
            >
              {/* Order header - tap to expand/collapse */}
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => toggleOrderExpand(o.id)} activeOpacity={0.8}>
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
              </TouchableOpacity>

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
                    {o.stripe_session_id && <Text style={{ color: '#8B9AB0', fontSize: 11, marginTop: 4 }}>Stripe Session: {o.stripe_session_id}</Text>}
                    {o.stripe_payment_intent && <Text style={{ color: '#8B9AB0', fontSize: 11 }}>Payment ID: {o.stripe_payment_intent}</Text>}
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
                    <TouchableOpacity style={{ marginTop: 10 }} onPress={() => { if (typeof window !== 'undefined') {
                        const url = o.stripe_payment_url || ('https://dashboard.stripe.com/test/payments/' + (o.stripe_payment_intent || ('cs_' + o.stripe_session_id?.split('cs_')[1])));
                        (window as any).open(url, '_blank');
                      } }}>
                      <Text style={{ color: '#54DFB6', fontSize: 13 }}>🔗 View in Stripe Dashboard</Text>
                    </TouchableOpacity>
                  )}

                  {/* Order actions */}
                  <Text style={{ color: '#EAECEF', fontWeight: '700', fontSize: 13, marginTop: 16, marginBottom: 8 }}>📋 Order Actions</Text>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {o.status === 'pending' && (
                      <GradientButton label="✅ Mark Paid" variant="teal" size="sm" onPress={async () => {
                        try { await adminMarkOrderPaid(o.id); const d = await adminGetOrders({ sort: orderSort }); setOrders(d?.orders || []); Alert.alert('Updated', 'Marked as paid.'); } catch (e: any) { Alert.alert('Error', e.message); }
                      }} />
                    )}
                    {(o.status === 'paid' || o.status === 'pending') && (
                      <GradientButton label="📦 Mark Packed" variant="outline" size="sm" onPress={async () => {
                        try { await adminProcessOrder(o.id); const d = await adminGetOrders({ sort: orderSort }); setOrders(d?.orders || []); Alert.alert('Updated', 'Marked as packed.'); } catch (e: any) { Alert.alert('Error', e.message); }
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
                          const d = await adminGetOrders({ sort: orderSort });
                          setOrders(d?.orders || []);
                          setTrackingMsg(m => ({ ...m, [o.id]: '\u2713 Marked shipped!' + (tracking ? ' Tracking: ' + tracking : '') }));setTimeout(() => setTrackingMsg(m => { const n={...m}; delete n[o.id]; return n; }), 4000);
                        } catch (e: any) { setTrackingMsg(m => ({ ...m, [o.id]: 'Error: ' + (e.message || 'Failed') })); }
                      }} />
                    )}
                    {trackingInput[o.id] && !(['refunded','cancelled','failed'].includes(o.status)) && (
                      <GradientButton label="📍 Update Tracking" variant="outline" size="sm" onPress={async () => {
                        try { await adminUpdateTracking(o.id, trackingInput[o.id]); const d = await adminGetOrders({ sort: orderSort }); setOrders(d?.orders || []); setTrackingMsg(m => ({ ...m, [o.id]: '✓ Tracking updated!' })); setTimeout(() => setTrackingMsg(m => { const n={...m}; delete n[o.id]; return n; }), 4000); } catch (e: any) { setTrackingMsg(m => ({ ...m, [o.id]: 'Error: ' + e.message })); }
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
            </View>
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
        label="Max Free Submissions Per Month"
        value={String(settings.max_free_submissions ?? 50)}
        onChangeText={v => setSettings((s: any) => ({ ...s, max_free_submissions: parseInt(v) || 50 }))}
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
          const loadedOrderQueue = orders.filter(o => ['pending', 'paid', 'processed', 'processing'].includes(o.status)).length;
          const pendingOrders = loadedOrderQueue || Number(stats.orders?.active || stats.orders?.pending || 0);
          const todaySubmissions = stats.today?.submissions ?? 0;
          const newUsers = stats.today?.logins ?? 0;
          const tabBadges: Record<string,number> = {
            Orders: pendingOrders,
            Feed: todaySubmissions,
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
          {activeTab === 'Feed' && renderSubmissions()}
          {activeTab === 'Products' && renderProducts()}
          {activeTab === 'Discounts' && renderDiscounts()}
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
  screen: { flex: 1, backgroundColor: 'transparent' },
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
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  segmentBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: borderRadius.pill,
    backgroundColor: (C as any).CARD_BG2 || C.CARD_BG,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  segmentBtnActive: {
    backgroundColor: C.ORANGE + '22',
    borderColor: C.ORANGE,
  },
  segmentText: { color: C.TEXT_MUTED, fontSize: 13, fontWeight: '700' },
  segmentTextActive: { color: C.TEXT, fontWeight: '800' },
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
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  challengeAdminImg: {
    width: 176,
    minHeight: 128,
    flexShrink: 0,
  },
  challengeAdminInfo: {
    flex: 1,
    padding: 12,
    minWidth: 0,
  },
  challengePreviewWrap: {
    marginBottom: 12,
    alignSelf: 'flex-start',
    width: '100%',
    maxWidth: 340,
  },
  challengePreviewImg: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    backgroundColor: C.CARD_BG2,
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
  photoNavBtn: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -22 }],
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,14,26,0.82)',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  photoNavBtnText: { color: C.TEXT, fontSize: 30, lineHeight: 32, fontWeight: '800' },
  photoDotBtn: {
    minWidth: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.CARD_BG2,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  photoDotBtnActive: { backgroundColor: C.TEAL + '22', borderColor: C.TEAL },
  photoDotText: { color: C.TEXT_MUTED, fontSize: 12, fontWeight: '700' },
  photoDotTextActive: { color: C.TEAL },
  photoDownloadIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.TEAL + '22',
    borderWidth: 1,
    borderColor: C.TEAL,
  },
  photoDownloadIconText: { color: C.TEAL, fontSize: 20, lineHeight: 22, fontWeight: '900' },
  thumbPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  listItemInfo: { flex: 1 },
  listItemTitle: { color: C.TEXT, fontWeight: '600', marginBottom: 2 },
  listItemSub: { color: (C as any).TEXT_SECONDARY || C.TEXT_MUTED, fontSize: 13, marginBottom: 2 },
  listItemMeta: { color: C.TEXT_MUTED, fontSize: 11 },
  actionBtns: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  iconBtn: { padding: 6 },
  editIcon: { fontSize: 16 },
  deleteIcon: { fontSize: 16 },
  challengeEditBtn: {
    borderWidth: 1,
    borderColor: C.TEAL,
    backgroundColor: C.TEAL + '18',
    borderRadius: borderRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  challengeDeleteBtn: {
    borderWidth: 1,
    borderColor: C.ORANGE,
    backgroundColor: C.ORANGE + '18',
    borderRadius: borderRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  challengeEditText: { color: C.TEAL, fontSize: 12, fontWeight: '800' },
  challengeDeleteText: { color: C.ORANGE, fontSize: 12, fontWeight: '800' },
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
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
  },

})
