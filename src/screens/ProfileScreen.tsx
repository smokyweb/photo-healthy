import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { C } from '../theme';

const ProfileScreen = ({ navigation }: any) => {
  const { user, logout, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [stats, setStats] = useState({ submissions: 0, followers: 0, following: 0 });
  const fileInputRef = useRef<any>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await api.getSubmissions();
        const mySubmissions = (data.submissions || []).filter((s: any) => s.user_id === user?.id);
        setStats({ submissions: mySubmissions.length, followers: 42, following: 5 });
      } catch {}
    };
    loadStats();
  }, [user?.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateProfile({ name });
      await refreshUser();
      setEditing(false);
    } catch {} finally { setSaving(false); }
  };

  const handlePickPhoto = () => {
    setUploadError(null);
    if (Platform.OS === 'web') {
      // Create a hidden file input and trigger it
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
          const url = await api.uploadPhoto(file);
          await api.updateProfile({ avatar_url: url });
          await refreshUser();
        } catch (err: any) {
          setUploadError(err?.message || 'Upload failed. Please try again.');
        } finally {
          setUploading(false);
        }
      };
      input.click();
    }
  };

  const initials = (user?.name || 'U').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  const isPremium = user?.subscription_status === 'active';

  return (
    <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Profile</Text>
      </View>

      {/* User info card */}
      <View style={s.userCard}>
        {/* Avatar with upload button */}
        <TouchableOpacity
          style={s.avatarWrap}
          onPress={handlePickPhoto}
          disabled={uploading}
          activeOpacity={0.8}
        >
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={s.avatar} />
          ) : (
            <View style={s.avatarPlaceholder}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
          )}
          {/* Camera overlay */}
          <View style={s.cameraOverlay}>
            {uploading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={s.cameraIcon}>📷</Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Upload status */}
        {uploading && (
          <View style={s.uploadingBanner}>
            <ActivityIndicator color={C.ORANGE} size="small" />
            <Text style={s.uploadingText}>Uploading photo...</Text>
          </View>
        )}
        {uploadError && (
          <View style={s.errorBanner}>
            <Text style={s.errorText}>⚠️ {uploadError}</Text>
          </View>
        )}

        <Text style={s.changePhotoHint}>Tap photo to change</Text>

        {editing ? (
          <View style={s.editRow}>
            <TextInput style={s.editInput} value={name} onChangeText={setName} placeholderTextColor={C.TEXT_SECONDARY} />
            <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnText}>Save</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setEditing(false); setName(user?.name || ''); }}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={s.userName}>{user?.name || 'User'}</Text>
            <Text style={s.userHandle}>@{(user?.name || 'user').toLowerCase().replace(/\s+/g, '_')}</Text>
            <View style={s.contactInfo}>
              <Text style={s.contactItem}>📧 {user?.email}</Text>
              <Text style={s.contactItem}>📍 Location not set</Text>
            </View>
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Text style={s.editLink}>Edit Profile</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Stats row */}
      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statIcon}>👥</Text>
          <Text style={s.statNum}>{stats.followers}</Text>
          <Text style={s.statLabel}>Followers</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statIcon}>➡️</Text>
          <Text style={s.statNum}>{stats.following}</Text>
          <Text style={s.statLabel}>Following</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statIcon}>📷</Text>
          <Text style={s.statNum}>{stats.submissions}</Text>
          <Text style={s.statLabel}>Photos</Text>
        </View>
      </View>

      {/* More Info section */}
      <View style={s.menuSection}>
        <Text style={s.menuHeader}>More Info</Text>

        <TouchableOpacity style={s.menuItem}>
          <Text style={s.menuIcon}>👤</Text>
          <Text style={s.menuText}>Basic Info</Text>
          <Text style={s.menuChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate('Gallery')}>
          <Text style={s.menuIcon}>🖼️</Text>
          <Text style={s.menuText}>My Gallery</Text>
          <View style={s.menuBadge}>
            <Text style={s.menuBadgeText}>{stats.submissions}</Text>
          </View>
          <Text style={s.menuChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.menuItem}>
          <Text style={s.menuIcon}>📈</Text>
          <Text style={s.menuText}>My Progress</Text>
          <Text style={s.menuChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate('Subscription')}>
          <Text style={s.menuIcon}>⭐</Text>
          <Text style={s.menuText}>My Subscription</Text>
          {isPremium && (
            <View style={s.premiumBadge}>
              <Text style={s.premiumBadgeText}>Premium</Text>
            </View>
          )}
          <Text style={s.menuChevron}>›</Text>
        </TouchableOpacity>

        {user?.is_admin && (
          <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate('Admin')}>
            <Text style={s.menuIcon}>⚙️</Text>
            <Text style={s.menuText}>Admin Panel</Text>
            <Text style={s.menuChevron}>›</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[s.menuItem, s.logoutItem]} onPress={logout}>
          <Text style={s.menuIcon}>🚪</Text>
          <Text style={[s.menuText, { color: '#F56565' }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={s.footer}>
        <View style={s.footerColumns}>
          <View style={s.footerCol}>
            <Text style={s.footerColTitle}>Company</Text>
            <Text style={s.footerLink}>About Us</Text>
            <Text style={s.footerLink}>FAQ</Text>
            <Text style={s.footerLink}>Blog</Text>
            <Text style={s.footerLink}>Contact</Text>
            <Text style={s.footerLink}>Partners</Text>
          </View>
          <View style={s.footerCol}>
            <Text style={s.footerColTitle}>Legal</Text>
            <Text style={s.footerLink}>Privacy Policy</Text>
            <Text style={s.footerLink}>Terms of Service</Text>
            <Text style={s.footerLink}>Cookie Policy</Text>
            <Text style={s.footerLink}>GDPR</Text>
          </View>
        </View>

        <View style={s.socialRow}>
          <TouchableOpacity style={s.socialBtn}>
            <Text style={s.socialIcon}>📘</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.socialBtn}>
            <Text style={s.socialIcon}>📷</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.copyright}>© 2025 Photo Healthy. All rights reserved.</Text>

        {/* Cache clear — useful when app updates aren't loading */}
        <TouchableOpacity
          style={s.clearCacheBtn}
          onPress={async () => {
            if (typeof window !== 'undefined') {
              // 1. Stop & unregister all service workers
              if ('serviceWorker' in navigator) {
                const registrations = await (navigator as any).serviceWorker.getRegistrations();
                await Promise.all(registrations.map((reg: any) => reg.unregister()));
              }
              // 2. Clear all caches
              if ('caches' in window) {
                const names: string[] = await (window as any).caches.keys();
                await Promise.all(names.map((n: string) => (window as any).caches.delete(n)));
              }
              // 3. Reload — fresh page load re-registers the service worker automatically
              window.location.href = window.location.origin + '/?v=' + Date.now();
            }
          }}
        >
          <Text style={s.clearCacheText}>🔄 Clear Cache & Reload</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.BG },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  headerTitle: { color: C.TEXT, fontSize: 22, fontWeight: '700' },

  // User card
  userCard: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  avatarWrap: { marginBottom: 8, position: 'relative' },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: C.ORANGE,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.CARD_BG,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: C.ORANGE,
  },
  avatarText: { color: C.TEXT, fontSize: 28, fontWeight: '700' },

  // Camera overlay
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: C.BG,
  },
  cameraIcon: { fontSize: 13 },

  changePhotoHint: {
    color: C.TEXT_SECONDARY,
    fontSize: 11,
    marginBottom: 10,
    opacity: 0.7,
  },

  // Upload feedback
  uploadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.CARD_BG,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.ORANGE,
  },
  uploadingText: { color: C.ORANGE, fontSize: 13, fontWeight: '500' },
  errorBanner: {
    backgroundColor: 'rgba(245,101,101,0.12)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F56565',
  },
  errorText: { color: '#F56565', fontSize: 13 },

  userName: { color: C.TEXT, fontSize: 22, fontWeight: '700' },
  userHandle: { color: C.TEAL, fontSize: 14, marginTop: 2 },
  contactInfo: { marginTop: 12, gap: 4, alignItems: 'center' },
  contactItem: { color: C.TEXT_SECONDARY, fontSize: 13 },
  editLink: {
    color: C.TEAL,
    fontSize: 13,
    marginTop: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  editInput: {
    backgroundColor: C.INPUT_BG,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 16,
    minWidth: 150,
    color: C.TEXT,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  saveBtn: {
    backgroundColor: C.ORANGE,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveBtnText: { color: '#fff', fontWeight: '600' },
  cancelText: { color: C.TEXT_SECONDARY, fontSize: 14 },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.CARD_BG,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  statIcon: { fontSize: 20, marginBottom: 6 },
  statNum: { color: C.TEXT, fontSize: 20, fontWeight: '700' },
  statLabel: { color: C.TEXT_SECONDARY, fontSize: 12, marginTop: 2 },

  // Menu
  menuSection: { paddingHorizontal: 20, marginBottom: 32 },
  menuHeader: {
    color: C.TEXT,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.CARD_BG,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  menuIcon: { fontSize: 20, marginRight: 12 },
  menuText: { flex: 1, color: C.TEXT, fontSize: 15, fontWeight: '500' },
  menuChevron: { color: C.TEXT_SECONDARY, fontSize: 22 },
  menuBadge: {
    backgroundColor: C.TEAL,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  menuBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  premiumBadge: {
    backgroundColor: C.ORANGE,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  premiumBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  logoutItem: { marginTop: 8 },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: C.CARD_BORDER,
  },
  footerColumns: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 24,
  },
  footerCol: { flex: 1 },
  footerColTitle: {
    color: C.TEXT,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  footerLink: {
    color: C.TEXT_SECONDARY,
    fontSize: 13,
    marginBottom: 8,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    justifyContent: 'center',
  },
  socialBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.CARD_BG,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  socialIcon: { fontSize: 18 },
  copyright: {
    color: C.TEXT_SECONDARY,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
    opacity: 0.6,
  },
  clearCacheBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 8,
  },
  clearCacheText: {
    color: C.TEXT_SECONDARY,
    fontSize: 12,
    opacity: 0.5,
  },
});

export default ProfileScreen;
