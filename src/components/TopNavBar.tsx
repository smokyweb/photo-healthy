import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform, useWindowDimensions,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { C, borderRadius } from '../theme';

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
  const nav = useNavigation<any>();
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [menuOpen, setMenuOpen] = useState(false);

  if (Platform.OS !== 'web') return null;

  const handleNav = (screen: string, params?: any) => {
    setMenuOpen(false);
    nav.navigate(screen as any, params);
  };

  return (
    <View style={styles.bar}>
      {/* Logo */}
      <TouchableOpacity onPress={() => handleNav('Main', { screen: 'HomeTab' })} style={styles.logoWrap}>
        <Text style={styles.logoText}>Photo Healthy</Text>
      </TouchableOpacity>

      {isDesktop ? (
        // Desktop nav
        <View style={styles.desktopLinks}>
          {NAV_LINKS.map(l => (
            <TouchableOpacity key={l.label} onPress={() => handleNav(l.screen, l.params)}>
              <Text style={styles.navLink}>{l.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {/* Right actions */}
      <View style={styles.rightActions}>
        {isDesktop ? (
          user ? (
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              {user.is_admin && (
                <TouchableOpacity onPress={() => handleNav('Admin')} style={styles.adminBtn}>
                  <Text style={styles.adminBtnText}>Admin</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => handleNav('Main', { screen: 'ProfileTab' })} style={styles.profileBtn}>
                <Text style={styles.profileBtnText}>{(user.name || 'U')[0].toUpperCase()}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => handleNav('Cart')} style={{ position: 'relative', marginRight: 8, padding: 6 }}>
                <Text style={{ fontSize: 20 }}>🛒</Text>
              <Text style={{ color: C.TEXT, fontSize: 12, fontWeight: '700', marginTop: 2 }}>Cart</Text>
                {itemCount > 0 && (
                  <View style={{ position: 'absolute', top: 0, right: 0, backgroundColor: '#F55B09', borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>{itemCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleNav('Login')} style={styles.loginBtn}>
                <Text style={styles.loginBtnText}>Log In</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleNav('Register')} style={styles.signupBtn}>
                <Text style={styles.signupBtnText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          // Mobile: cart icon + hamburger
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity onPress={() => handleNav('Cart')} style={{ position: 'relative', padding: 6 }}>
              <Text style={{ fontSize: 20 }}>🛒</Text>
            <Text style={{ color: C.TEXT, fontSize: 11, fontWeight: '700' }}>Cart</Text>
              {itemCount > 0 && (
                <View style={{ position: 'absolute', top: 2, right: 2, backgroundColor: '#F55B09', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 }}>
                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>{itemCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.hamburger}>
              <View style={styles.hamLine} />
              <View style={styles.hamLine} />
              <View style={styles.hamLine} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Mobile drawer overlay */}
      {menuOpen && (
        <View style={styles.menuBackdrop} pointerEvents="box-none">
          <TouchableOpacity style={styles.backdropTap} activeOpacity={1} onPress={() => setMenuOpen(false)} />
          <View style={styles.menuPanel}>
            <TouchableOpacity style={styles.menuClose} onPress={() => setMenuOpen(false)}>
              <Text style={{ color: C.TEXT, fontSize: 22, fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
            <ScrollView>
              {NAV_LINKS.map(l => (
                <TouchableOpacity key={l.label} style={styles.menuItem} onPress={() => handleNav(l.screen, l.params)}>
                  <Text style={styles.menuItemText}>{l.label}</Text>
                </TouchableOpacity>
              ))}
              <View style={styles.menuDivider} />
              {user ? (
                <>
                  <TouchableOpacity style={styles.menuItem} onPress={() => handleNav('Main', { screen: 'ProfileTab' })}>
                    <Text style={styles.menuItemText}>Profile</Text>
                  </TouchableOpacity>
                  {user.is_admin && (
                    <TouchableOpacity style={styles.menuItem} onPress={() => handleNav('Admin')}>
                      <Text style={styles.menuItemText}>Admin Panel</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.menuItem} onPress={() => { logout(); setMenuOpen(false); }}>
                    <Text style={[styles.menuItemText, { color: C.DANGER }]}>Log Out</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity style={styles.menuItem} onPress={() => handleNav('Login')}>
                    <Text style={styles.menuItemText}>Log In</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.menuItem, { backgroundColor: C.ORANGE + '22' }]} onPress={() => handleNav('Register')}>
                    <Text style={[styles.menuItemText, { color: C.ORANGE, fontWeight: '700' }]}>Sign Up Free</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.BG,
    borderBottomWidth: 1,
    borderBottomColor: C.CARD_BORDER,
    paddingHorizontal: 20,
    paddingVertical: 12,
    // Respect iOS notch/status bar
    paddingTop: Platform.OS === 'web' ? 12 : 44,
    zIndex: 50,
    // Do NOT use position:fixed - let it flow naturally with the page
  } as any,
  logoWrap: { marginRight: 24 },
  logoText: { color: C.TEXT, fontSize: 18, fontWeight: '800', fontFamily: "'Lexend', sans-serif" } as any,
  desktopLinks: { flex: 1, flexDirection: 'row', gap: 20, alignItems: 'center' },
  navLink: { color: C.TEXT_SECONDARY, fontSize: 14, fontWeight: '500', fontFamily: "'Inter', sans-serif" } as any,
  rightActions: { marginLeft: 'auto' as any },
  loginBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: borderRadius.pill, borderWidth: 1, borderColor: C.CARD_BORDER },
  loginBtnText: { color: C.TEXT, fontSize: 14, fontWeight: '600' },
  signupBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: borderRadius.pill, backgroundColor: C.ORANGE, backgroundImage: 'linear-gradient(90deg,#F55B09,#FFD000)' } as any,
  signupBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  profileBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.ORANGE, justifyContent: 'center', alignItems: 'center' },
  profileBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  adminBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.pill, backgroundColor: C.TEAL + '22', borderWidth: 1, borderColor: C.TEAL + '55' },
  adminBtnText: { color: C.TEAL, fontSize: 13, fontWeight: '700' },
  hamburger: { padding: 8, gap: 5, justifyContent: 'center' },
  hamLine: { width: 22, height: 2, backgroundColor: C.TEXT, borderRadius: 2 },
  menuBackdrop: { position: 'fixed' as any, top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: 'transparent' },
  backdropTap: { position: 'absolute' as any, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)' },
  menuPanel: { position: 'absolute' as any, top: 0, right: 0, bottom: 0, width: 280, backgroundColor: C.CARD_BG, paddingTop: 50, zIndex: 10001, shadowColor: '#000', shadowOffset: { width: -4, height: 0 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 20 },
  menuClose: { paddingHorizontal: 20, paddingVertical: 14, alignItems: 'flex-end' },
  menuItem: { paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.CARD_BORDER },
  menuItemText: { color: C.TEXT, fontSize: 16, fontWeight: '500' },
  menuDivider: { height: 1, backgroundColor: C.CARD_BORDER, marginVertical: 8 },
});
