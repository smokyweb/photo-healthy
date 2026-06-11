import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getMyNotifications } from '../services/api';
import { C, borderRadius } from '../theme';

const LOGO_IMG = require('../../assets/logo.png');
const ORANGE_GRADIENT = 'linear-gradient(90deg, #F55B09 0%, #FFD000 100%)';

const NAV_LINKS = [
  { label: 'Photo Healthy', screen: 'Main', params: { screen: 'HomeTab' } },
  { label: 'Challenges', screen: 'Main', params: { screen: 'ChallengesTab' } },
  { label: 'Community', screen: 'Main', params: { screen: 'CommunityTab' } },
  { label: 'Shop', screen: 'Shop' },
  { label: 'About', screen: 'About' },
  { label: 'How It Works', screen: 'HowItWorks' },
  { label: 'Partners', screen: 'Partners' },
  { label: 'FAQ', screen: 'FAQ' },
];

export default function TopNavBar() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { width } = useWindowDimensions();
  const isMobile = width < 1100;
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  const nav = (screen: string, params?: any) => {
    setMenuOpen(false);
    navigation.navigate(screen as never, params as never);
  };

  const openNotifications = () => {
    setMenuOpen(false);
    navigation.navigate('Notifications' as never);
  };

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0].toUpperCase()).slice(0, 2).join('')
    : 'U';

  useEffect(() => {
    let active = true;
    if (!user) {
      setNotificationCount(0);
      return;
    }
    getMyNotifications()
      .then((data: any) => {
        if (!active) return;
        const unread = Number(data?.unread || 0);
        setNotificationCount(unread);
      })
      .catch(() => active && setNotificationCount(0));
    return () => { active = false; };
  }, [user?.id, route.name]);

  const isActive = (link: typeof NAV_LINKS[0]) => {
    const currentRouteName = route.name;
    const currentParams = route.params || {};
    
    if (link.screen === 'Main') {
      // For nested screens in Main, check the nested screen param
      return currentRouteName === 'Main' && currentParams.screen === link.params?.screen;
    }
    return currentRouteName === link.screen;
  };

  return (
    <View>
      {/* Main bar */}
      <View style={[styles.bar, isMobile && styles.barMobile]}>
        {/* Logo */}
        <TouchableOpacity onPress={() => nav('Main', { screen: 'HomeTab' })} style={styles.logoWrap}>
          <Image source={LOGO_IMG} style={styles.logo} resizeMode="contain" />
          <Text style={[styles.logoText, isMobile && styles.logoTextMobile]} numberOfLines={1}>Photo Healthy</Text>
        </TouchableOpacity>

        {/* Desktop nav links */}
        {!isMobile && (
          <View style={styles.navLinks}>
            {NAV_LINKS.map(l => (
              <TouchableOpacity key={l.label} onPress={() => nav(l.screen, l.params)} style={styles.navLinkBtn}>
                <Text style={[styles.navLinkText, isActive(l) && styles.navLinkTextActive]}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Right side */}
        <View style={[styles.rightSide, isMobile && styles.rightSideMobile]}>
          {itemCount > 0 && (
            <TouchableOpacity style={styles.cartBtn} onPress={() => nav('Cart')}>
              <Text style={styles.cartText}>🛒 {itemCount}</Text>
            </TouchableOpacity>
          )}

          {user ? (
            <View style={[styles.rightSide, isMobile && styles.rightSideMobile]}>
              <TouchableOpacity
                onPress={openNotifications}
                style={styles.bellBtn}
                accessibilityLabel="Notifications"
              >
                <View style={styles.bellIcon}>
                  <View style={styles.bellTop} />
                  <View style={styles.bellBody} />
                  <View style={styles.bellClapper} />
                </View>
                {notificationCount > 0 && <View style={styles.notificationDot} />}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => nav('Main', { screen: 'ProfileTab' })}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              </TouchableOpacity>
              {!isMobile && (
                <TouchableOpacity
                  style={styles.signOutBtn}
                  onPress={() => { logout(); navigation.reset({ index: 0, routes: [{ name: 'Main' as never }] }); }}
                >
                  <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>
              )}
              {isMobile && (
                <TouchableOpacity
                  onPress={() => setMenuOpen(v => !v)}
                  style={styles.menuBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={{ fontSize: 22, color: '#fff' }}>{menuOpen ? '✕' : '☰'}</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={[styles.authBtns, isMobile && styles.authBtnsMobile]}>
              {!isMobile && (
                <>
                  <TouchableOpacity style={styles.loginBtn} onPress={() => nav('Login')}>
                    <Text style={styles.loginText}>Log In</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.signupBtn} onPress={() => nav('Register')}>
                    <Text style={styles.signupText}>Sign Up</Text>
                  </TouchableOpacity>
                </>
              )}
              {isMobile && (
                <TouchableOpacity
                  onPress={() => setMenuOpen(v => !v)}
                  style={styles.menuBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={{ fontSize: 22, color: '#fff' }}>{menuOpen ? '✕' : '☰'}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Mobile drawer — inline below bar, no position:fixed needed */}
      {isMobile && menuOpen && (
        <View style={styles.drawer}>
          {NAV_LINKS.map(l => (
            <TouchableOpacity key={l.label} style={styles.drawerItem} onPress={() => nav(l.screen, l.params)}>
              <Text style={[styles.drawerText, isActive(l) && styles.drawerTextActive]}>{l.label}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.drawerDivider} />
          {user ? (
            <>
              <TouchableOpacity style={styles.drawerItem} onPress={openNotifications}>
                <View style={styles.drawerBellRow}>
                  <Text style={styles.drawerText}>Notifications</Text>
                  {notificationCount > 0 && <View style={styles.drawerNotificationDot} />}
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.drawerItem} onPress={() => nav('Main', { screen: 'ProfileTab' })}>
                <Text style={styles.drawerText}>Profile</Text>
              </TouchableOpacity>
              {(user.is_admin || user.role === 'admin') && (
                <TouchableOpacity style={styles.drawerItem} onPress={() => nav('Admin')}>
                  <Text style={styles.drawerText}>Admin</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.drawerItem}
                onPress={() => { setMenuOpen(false); logout(); navigation.reset({ index: 0, routes: [{ name: 'Main' as never }] }); }}>
                <Text style={[styles.drawerText, { color: C.DANGER }]}>Sign Out</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.drawerItem} onPress={() => nav('Login')}>
                <Text style={styles.drawerText}>Log In</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.drawerItem} onPress={() => nav('Register')}>
                <Text style={styles.drawerText}>Sign Up</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(10,14,26,0.97)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.12)',
    zIndex: 100,
  },
  barMobile: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  logo: { width: 44, height: 44 },
  logoText: {
    color: C.TEXT,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  logoTextMobile: {
    fontSize: 15,
    maxWidth: 118,
  },
  navLinks: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 10,
  },
  navLinkBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  navLinkText: { color: 'rgba(234,236,239,0.75)', fontSize: 12, fontWeight: '600' },
  navLinkTextActive: { color: '#F55B09', fontWeight: '700' },
  rightSide: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rightSideMobile: { gap: 6, flexShrink: 0 },
  cartBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(245,91,9,0.15)', borderWidth: 1, borderColor: 'rgba(245,91,9,0.4)' },
  cartText: { color: '#F55B09', fontSize: 13, fontWeight: '600' },
  bellBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  bellIcon: {
    width: 18,
    height: 19,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellTop: {
    position: 'absolute',
    top: 1,
    width: 5,
    height: 4,
    borderRadius: 3,
    backgroundColor: '#EAECEF',
  },
  bellBody: {
    position: 'absolute',
    top: 5,
    width: 14,
    height: 11,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    borderWidth: 2,
    borderColor: '#EAECEF',
    borderBottomWidth: 2,
  },
  bellClapper: {
    position: 'absolute',
    bottom: 0,
    width: 6,
    height: 3,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    backgroundColor: '#EAECEF',
  },
  notificationDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: C.ORANGE,
    borderWidth: 2,
    borderColor: 'rgba(10,14,26,0.97)',
  },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F55B09', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  signOutBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: C.DANGER },
  signOutText: { color: C.DANGER, fontSize: 12, fontWeight: '800' },
  menuBtn: { padding: 6, marginLeft: 4 },
  authBtns: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  authBtnsMobile: { gap: 0 },
  loginBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, borderWidth: 1, borderColor: '#54DFB6' },
  loginBtnMobile: { paddingHorizontal: 10, paddingVertical: 7 },
  loginText: { color: '#54DFB6', fontSize: 12, fontWeight: '700' },
  signupBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, backgroundColor: '#F55B09', backgroundImage: ORANGE_GRADIENT } as any,
  signupBtnMobile: { paddingHorizontal: 10, paddingVertical: 7 } as any,
  signupText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  drawer: {
    backgroundColor: 'rgba(10,14,26,0.98)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.15)',
    paddingHorizontal: 24,
    paddingVertical: 8,
    zIndex: 99,
  },
  drawerItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  drawerText: { color: 'rgba(234,236,239,0.9)', fontSize: 16, fontWeight: '500' },
  drawerTextActive: { color: '#F55B09', fontWeight: '700' },
  drawerDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 8 },
  drawerBellRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  drawerNotificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.ORANGE,
  },
});
