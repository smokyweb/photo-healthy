import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  ScrollView, Alert, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getUserStats, getMyOrders, getSubscriptionStatus } from '../services/api';
import GradientButton from '../components/GradientButton';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import { C, borderRadius } from '../theme';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<any>({});
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const [sData, subData] = await Promise.allSettled([getUserStats(), getSubscriptionStatus()]);
      if (sData.status === 'fulfilled') setStats(sData.value || {});
      if (subData.status === 'fulfilled') setSubscription(subData.value);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.guestContainer}>
        <Text style={styles.guestIcon}>👤</Text>
        <Text style={styles.guestTitle}>Create an Account</Text>
        <Text style={styles.guestBody}>Join the community to track your progress and participate in challenges.</Text>
        <GradientButton label="Sign Up Free" onPress={() => navigation.navigate('Register')} style={{ marginTop: 20 }} />
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 12 }}>
          <Text style={{ color: C.TEXT_MUTED, fontSize: 14 }}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <ScrollView
      style={styles.screen}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.ORANGE} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarLetter}>{user.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        {subscription?.is_pro && (
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>⭐ PRO Member</Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{stats.submission_count || 0}</Text>
          <Text style={styles.statLabel}>Photos</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNum}>{stats.challenge_count || 0}</Text>
          <Text style={styles.statLabel}>Challenges</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNum}>{stats.total_likes || 0}</Text>
          <Text style={styles.statLabel}>Likes</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        {[
          { icon: '✏️', label: 'Edit Profile', screen: 'EditProfile' },
          { icon: '📊', label: 'My Progress', screen: 'MyProgress' },
          { icon: '🛒', label: 'Order History', screen: 'OrderHistory' },
          { icon: '⭐', label: 'Subscription', screen: 'Subscription' },
          ...(user.role === 'admin' ? [{ icon: '🛡️', label: 'Admin Panel', screen: 'Admin' }] : []),
        ].map(item => (
          <TouchableOpacity
            key={item.screen}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={[styles.menuItem, styles.menuDanger]} onPress={handleLogout}>
          <Text style={styles.menuIcon}>🚪</Text>
          <Text style={[styles.menuLabel, { color: C.DANGER }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.BG },
  guestContainer: {
    flex: 1,
    backgroundColor: C.BG,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  guestIcon: { fontSize: 60, marginBottom: 16 },
  guestTitle: { color: C.TEXT, fontSize: 22, fontWeight: '800', marginBottom: 8 },
  guestBody: { color: C.TEXT_SECONDARY, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  header: { alignItems: 'center', paddingTop: 24, paddingBottom: 20 },
  avatarWrap: { marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarFallback: {
    backgroundColor: C.ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: C.WHITE, fontSize: 32, fontWeight: '800' },
  name: { color: C.TEXT, fontSize: 22, fontWeight: '800', marginBottom: 4 },
  email: { color: C.TEXT_MUTED, fontSize: 14, marginBottom: 8 },
  proBadge: {
    backgroundColor: C.ORANGE_MID + '33',
    borderRadius: borderRadius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.ORANGE_MID,
  },
  proBadgeText: { color: C.ORANGE_MID, fontSize: 13, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: C.CARD_BG,
    marginHorizontal: 16,
    borderRadius: borderRadius.lg,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    marginBottom: 20,
  },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { color: C.ORANGE, fontSize: 22, fontWeight: '800' },
  statLabel: { color: C.TEXT_MUTED, fontSize: 12, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: C.DIVIDER },
  menu: { marginHorizontal: 16 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.lg,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  menuDanger: { borderColor: C.DANGER + '44', backgroundColor: C.DANGER + '11' },
  menuIcon: { fontSize: 18, marginRight: 12 },
  menuLabel: { flex: 1, color: C.TEXT, fontSize: 15, fontWeight: '600' },
  menuArrow: { color: C.TEXT_MUTED, fontSize: 16 },
});
