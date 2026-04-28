import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform, useWindowDimensions,
  Modal, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
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
              <TouchableOpacity onPress={() => handleNav('Login')} style={styles.loginBtn}>
                <Text style={styles.loginBtnText}>Log In</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleNav('Register')} style={styles.signupBtn}>
                <Text style={styles.signupBtnText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          // Hamburger for mobile
          <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.hamburger}>
            <View style={styles.hamLine} />
            <View style={styles.hamLine} />
            <View style={styles.hamLine} />
          </TouchableOpacity>
        )}
      </View>

      {/* Mobile menu modal */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <TouchableOpacity style={styles.menuBackdrop} activeOpacity={1} onPress={() => setMenuOpen(false)}>
          <View style={styles.menuPanel}>
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
        </TouchableOpacity>
      </Modal>
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
    paddingVertical: 14,
    zIndex: 100,
  },
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
  menuBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  menuPanel: { position: 'absolute', top: 0, right: 0, bottom: 0, width: 280, backgroundColor: C.CARD_BG, paddingTop: 60 },
  menuItem: { paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.CARD_BORDER },
  menuItemText: { color: C.TEXT, fontSize: 16, fontWeight: '500' },
  menuDivider: { height: 1, backgroundColor: C.CARD_BORDER, marginVertical: 8 },
});
