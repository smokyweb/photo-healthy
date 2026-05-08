import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { C, borderRadius } from '../theme';

const LOGO_IMG = require('../../assets/logo.png');
const ORANGE_GRADIENT = 'linear-gradient(90deg, #F55B09 0%, #FFD000 100%)';

const NAV_LINKS = [
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
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [menuOpen, setMenuOpen] = useState(false);

  const nav = (screen: string, params?: any) => {
    setMenuOpen(false);
    navigation.navigate(screen as never, params as never);
  };

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0].toUpperCase()).slice(0, 2).join('')
    : 'U';

  return (
    <View>
      {/* Main bar */}
      <View style={styles.bar}>
        {/* Logo */}
        <TouchableOpacity onPress={() => nav('Main', { screen: 'HomeTab' })} style={styles.logoWrap}>
          <Image source={LOGO_IMG} style={styles.logo} resizeMode="contain" />
        </TouchableOpacity>

        {/* Desktop nav links */}
        {!isMobile && (
          <View style={styles.navLinks}>
            {NAV_LINKS.map(l => (
              <TouchableOpacity key={l.label} onPress={() => nav(l.screen, l.params)} style={styles.navLinkBtn}>
                <Text style={styles.navLinkText}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Right side */}
        <View style={styles.rightSide}>
          {itemCount > 0 && (
            <TouchableOpacity style={styles.cartBtn} onPress={() => nav('Cart')}>
              <Text style={styles.cartText}>🛒 {itemCount}</Text>
            </TouchableOpacity>
          )}

          {user ? (
            <View style={styles.rightSide}>
              <TouchableOpacity onPress={() => nav('Main', { screen: 'ProfileTab' })}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              </TouchableOpacity>
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
            <View style={styles.authBtns}>
              <TouchableOpacity style={styles.loginBtn} onPress={() => nav('Login')}>
                <Text style={styles.loginText}>Log In</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.signupBtn} onPress={() => nav('Register')}>
                <Text style={styles.signupText}>Sign Up</Text>
              </TouchableOpacity>
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
              <Text style={styles.drawerText}>{l.label}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.drawerDivider} />
          {user && (
            <TouchableOpacity style={styles.drawerItem}
              onPress={() => { setMenuOpen(false); logout(); navigation.reset({ index: 0, routes: [{ name: 'Main' as never }] }); }}>
              <Text style={[styles.drawerText, { color: '#ef4444' }]}>Sign Out</Text>
            </TouchableOpacity>
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
  logoWrap: { flexShrink: 0 },
  logo: { width: 44, height: 44 },
  navLinks: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 16,
  },
  navLinkBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  navLinkText: { color: 'rgba(234,236,239,0.75)', fontSize: 13, fontWeight: '500' },
  rightSide: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cartBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(245,91,9,0.15)', borderWidth: 1, borderColor: 'rgba(245,91,9,0.4)' },
  cartText: { color: '#F55B09', fontSize: 13, fontWeight: '600' },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F55B09', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  menuBtn: { padding: 6, marginLeft: 4 },
  authBtns: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loginBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, borderWidth: 1, borderColor: '#54DFB6' },
  loginText: { color: '#54DFB6', fontSize: 12, fontWeight: '700' },
  signupBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, backgroundColor: '#F55B09', backgroundImage: ORANGE_GRADIENT } as any,
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
  drawerDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 8 },
});
