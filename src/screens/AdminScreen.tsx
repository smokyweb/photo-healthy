import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, FlatList, Image, ActivityIndicator, Alert, Platform } from 'react-native';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius, shadows } from '../theme';

type Tab = 'challenges' | 'users' | 'moderate';

const AdminScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('challenges');

  if (!user?.is_admin) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Access Denied</Text>
        <Text style={styles.errorSub}>Admin privileges required</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Panel</Text>
      </View>
      <View style={styles.tabRow}>
        {(['challenges', 'users', 'moderate'] as Tab[]).map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'challenges' ? 'Challenges' : t === 'users' ? 'Users' : 'Moderate'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {tab === 'challenges' && <ChallengesTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'moderate' && <ModerateTab />}
    </View>
  );
};

const ChallengesTab = () => {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: '', description: '', cover_image_url: '', start_date: '', end_date: '', is_active: true });

  const fetchChallenges = async () => {
    try {
      const data = await api.getChallenges();
      setChallenges(data.challenges || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchChallenges(); }, []);

  const handleSave = async () => {
    try {
      if (editing) {
        await api.updateChallenge(editing.id, form);
      } else {
        await api.createChallenge(form);
      }
      setShowForm(false);
      setEditing(null);
      setForm({ title: '', description: '', cover_image_url: '', start_date: '', end_date: '', is_active: true });
      fetchChallenges();
    } catch (e: any) { doAlert('Error', e.message); }
  };

  const handleDelete = async (id: number) => {
    if (!doConfirm('Delete this challenge?')) return;
    try { await api.deleteChallenge(id); fetchChallenges(); } catch {}
  };

  const startEdit = (c: any) => {
    setEditing(c);
    setForm({
      title: c.title, description: c.description || '', cover_image_url: c.cover_image_url || '',
      start_date: c.start_date?.split('T')[0] || '', end_date: c.end_date?.split('T')[0] || '', is_active: c.is_active,
    });
    setShowForm(true);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentInner}>
      <TouchableOpacity style={styles.addBtn} onPress={() => { setEditing(null); setForm({ title: '', description: '', cover_image_url: '', start_date: '', end_date: '', is_active: true }); setShowForm(!showForm); }}>
        <Text style={styles.addBtnText}>{showForm ? 'Cancel' : '+ New Challenge'}</Text>
      </TouchableOpacity>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formLabel}>Title</Text>
          <TextInput style={styles.formInput} value={form.title} onChangeText={v => setForm(p => ({ ...p, title: v }))} placeholder="Challenge title" />
          <Text style={styles.formLabel}>Description</Text>
          <TextInput style={[styles.formInput, { minHeight: 60 }]} value={form.description} onChangeText={v => setForm(p => ({ ...p, description: v }))} multiline placeholder="Description" />
          <Text style={styles.formLabel}>Cover Image URL</Text>
          <TextInput style={styles.formInput} value={form.cover_image_url} onChangeText={v => setForm(p => ({ ...p, cover_image_url: v }))} placeholder="https://..." />
          <Text style={styles.formLabel}>Start Date</Text>
          <TextInput style={styles.formInput} value={form.start_date} onChangeText={v => setForm(p => ({ ...p, start_date: v }))} placeholder="YYYY-MM-DD" />
          <Text style={styles.formLabel}>End Date</Text>
          <TextInput style={styles.formInput} value={form.end_date} onChangeText={v => setForm(p => ({ ...p, end_date: v }))} placeholder="YYYY-MM-DD" />
          <TouchableOpacity style={styles.toggleRow} onPress={() => setForm(p => ({ ...p, is_active: !p.is_active }))}>
            <View style={[styles.checkbox, form.is_active && styles.checkboxChecked]} />
            <Text style={styles.toggleLabel}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>{editing ? 'Update' : 'Create'} Challenge</Text>
          </TouchableOpacity>
        </View>
      )}

      {challenges.map(c => (
        <View key={c.id} style={styles.listItem}>
          <View style={{ flex: 1 }}>
            <Text style={styles.listTitle}>{c.title}</Text>
            <Text style={styles.listSub}>
              {c.is_active ? 'Active' : 'Inactive'} · {new Date(c.start_date).toLocaleDateString()} - {new Date(c.end_date).toLocaleDateString()}
            </Text>
          </View>
          <TouchableOpacity onPress={() => startEdit(c)} style={styles.actionBtn}>
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(c.id)} style={styles.actionBtnDanger}>
            <Text style={styles.actionTextDanger}>Del</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
};

const UsersTab = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try { const data = await api.getUsers(); setUsers(data.users || []); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleAdmin = async (u: any) => {
    try { await api.updateUser(u.id, { is_admin: !u.is_admin }); fetchUsers(); } catch {}
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentInner}>
      <Text style={styles.countText}>{users.length} users</Text>
      {users.map(u => (
        <View key={u.id} style={styles.listItem}>
          <View style={{ flex: 1 }}>
            <Text style={styles.listTitle}>{u.name}</Text>
            <Text style={styles.listSub}>{u.email} · {u.is_admin ? 'Admin' : 'User'} · {u.subscription_status || 'free'}</Text>
          </View>
          <TouchableOpacity onPress={() => toggleAdmin(u)} style={styles.actionBtn}>
            <Text style={styles.actionText}>{u.is_admin ? 'Remove Admin' : 'Make Admin'}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
};

const ModerateTab = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try { const data = await api.getSubmissions(); setSubmissions(data.submissions || []); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDeleteSubmission = async (id: number) => {
    if (!doConfirm('Delete this submission?')) return;
    try { await api.deleteSubmission(id); fetchAll(); } catch {}
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentInner}>
      <Text style={styles.countText}>{submissions.length} submissions</Text>
      {submissions.map(s => (
        <View key={s.id} style={styles.listItem}>
          {s.photo1_url && <Image source={{ uri: s.photo1_url }} style={styles.modThumb} />}
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={styles.listTitle}>{s.title}</Text>
            <Text style={styles.listSub}>by {s.user_name || 'Unknown'} · {s.challenge_title || ''}</Text>
          </View>
          <TouchableOpacity onPress={() => handleDeleteSubmission(s.id)} style={styles.actionBtnDanger}>
            <Text style={styles.actionTextDanger}>Remove</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
};

function doAlert(title: string, msg: string) {
  if (Platform.OS === 'web') { window.alert(`${title}: ${msg}`); } else { Alert.alert(title, msg); }
}

function doConfirm(msg: string): boolean {
  if (Platform.OS === 'web') { return window.confirm(msg); }
  return true;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primaryBg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  errorText: { fontSize: 20, fontWeight: '700', color: colors.error },
  errorSub: { fontSize: 14, color: colors.gray[500], marginTop: spacing.xs },
  header: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.lg },
  headerTitle: { color: colors.white, fontSize: 22, fontWeight: '700' },
  tabRow: { flexDirection: 'row', backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray[200] },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.gray[500] },
  tabTextActive: { color: colors.primary },
  tabContent: { flex: 1 },
  tabContentInner: { padding: spacing.md, maxWidth: 700, width: '100%', alignSelf: 'center' },
  addBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', marginBottom: spacing.md },
  addBtnText: { color: colors.white, fontWeight: '600', fontSize: 15 },
  formCard: { backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.lg, marginBottom: spacing.lg, ...shadows.md },
  formLabel: { fontSize: 13, fontWeight: '600', color: colors.gray[700], marginBottom: 4, marginTop: spacing.sm },
  formInput: { backgroundColor: colors.gray[50], borderWidth: 1, borderColor: colors.gray[200], borderRadius: borderRadius.sm, padding: spacing.sm, fontSize: 14, color: colors.black },
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: colors.gray[300], marginRight: spacing.sm },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  toggleLabel: { fontSize: 14, color: colors.gray[700] },
  saveBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.lg },
  saveBtnText: { color: colors.white, fontWeight: '600' },
  countText: { fontSize: 13, color: colors.gray[500], marginBottom: spacing.sm },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadows.sm },
  listTitle: { fontSize: 15, fontWeight: '600', color: colors.black },
  listSub: { fontSize: 12, color: colors.gray[500], marginTop: 2 },
  actionBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, marginLeft: spacing.xs },
  actionText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  actionBtnDanger: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, marginLeft: spacing.xs },
  actionTextDanger: { color: colors.error, fontSize: 13, fontWeight: '600' },
  modThumb: { width: 50, height: 50, borderRadius: borderRadius.sm, backgroundColor: colors.gray[100] },
});

export default AdminScreen;
