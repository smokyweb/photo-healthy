import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const NAV_LINKS = [
  { label: 'Home', route: 'Home' },
  { label: 'Challenges', route: 'Challenges' },
  { label: 'How It Works', route: 'HowItWorks' },
  { label: 'About', route: 'About' },
  { label: 'Partners', route: 'Partners' },
  { label: 'FAQ', route: 'FAQ' },
  { label: 'Shop', route: 'Shop' },
];

const TopNavBar = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { user, logout } = useAuth();
  const { width } = useWindowDimensions();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const isMobile = width < 768;

  const currentRoute = route.name;

  const navigateTo = (routeName: string) => {
    setMenuOpen(false);
    setProfileOpen(false);
    navigation.navigate(routeName);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => navigateTo('Home')} style={styles.logoWrap}>
          <Text style={styles.logoIcon}>📸</Text>
          <Text style={styles.logoText}>Photo Healthy</Text>
        </TouchableOpacity>

        {!isMobile && (
          <View style={styles.links}>
            {NAV_LINKS.map(link => (
              <TouchableOpacity key={link.route} onPress={() => navigateTo(link.route)} style={styles.linkWrap}>
                <Text style={[styles.link, currentRoute === link.route && styles.linkActive]}>
                  {link.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.rightSection}>
          {!isMobile && !user && (
            <>
              <TouchableOpacity style={styles.loginBtn} onPress={() => navigateTo('Login')}>
                <Text style={styles.loginBtnText}>Log In</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.signupBtn} onPress={() => navigateTo('Register')}>
                <Text style={styles.signupBtnText}>Sign Up</Text>
              </TouchableOpacity>
            </>
          )}
          {!isMobile && user && (
            <View>
              <TouchableOpacity style={styles.avatarBtn} onPress={() => setProfileOpen(!profileOpen)}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarLetter}>{(user.name || 'U')[0].toUpperCase()}</Text>
                </View>
              </TouchableOpacity>
              {profileOpen && (
                <View style={styles.dropdown}>
                  <TouchableOpacity style={styles.dropdownItem} onPress={() => navigateTo('Profile')}>
                    <Text style={styles.dropdownText}>Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dropdownItem} onPress={() => navigateTo('Subscription')}>
                    <Text style={styles.dropdownText}>Subscription</Text>
                  </TouchableOpacity>
                  {user.is_admin && (
                    <TouchableOpacity style={styles.dropdownItem} onPress={() => navigateTo('Admin')}>
                      <Text style={styles.dropdownText}>Admin Panel</Text>
                    </TouchableOpacity>
                  )}
                  <View style={styles.dropdownDivider} />
                  <TouchableOpacity style={styles.dropdownItem} onPress={() => { logout(); setProfileOpen(false); }}>
                    <Text style={[styles.dropdownText, { color: '#EF4444' }]}>Sign Out</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          {isMobile && (
            <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)} style={styles.hamburger}>
              <Text style={styles.hamburgerIcon}>{menuOpen ? '✕' : '☰'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isMobile && menuOpen && (
        <View style={styles.mobileMenu}>
          {NAV_LINKS.map(link => (
            <TouchableOpacity key={link.route} onPress={() => navigateTo(link.route)} style={styles.mobileLink}>
              <Text style={[styles.mobileLinkText, currentRoute === link.route && styles.mobileLinkActive]}>
                {link.label}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={styles.mobileDivider} />
          {user ? (
            <>
              <TouchableOpacity onPress={() => navigateTo('Profile')} style={styles.mobileLink}>
                <Text style={styles.mobileLinkText}>Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigateTo('Subscription')} style={styles.mobileLink}>
                <Text style={styles.mobileLinkText}>Subscription</Text>
              </TouchableOpacity>
              {user.is_admin && (
                <TouchableOpacity onPress={() => navigateTo('Admin')} style={styles.mobileLink}>
                  <Text style={styles.mobileLinkText}>Admin Panel</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => { logout(); setMenuOpen(false); }} style={styles.mobileLink}>
                <Text style={[styles.mobileLinkText, { color: '#FCA5A5' }]}>Sign Out</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={() => navigateTo('Login')} style={styles.mobileLink}>
                <Text style={styles.mobileLinkText}>Log In</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigateTo('Register')} style={styles.mobileLink}>
                <Text style={[styles.mobileLinkText, { color: '#A78BFA' }]}>Sign Up</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { backgroundColor: colors.primary, zIndex: 100 },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  logoWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: { fontSize: 24 },
  logoText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  links: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  linkWrap: { paddingHorizontal: 10, paddingVertical: 6 },
  link: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
  linkActive: { color: '#FFFFFF', fontWeight: '700' },
  rightSection: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loginBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
  },
  loginBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
  signupBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 6, backgroundColor: '#FFFFFF',
  },
  signupBtnText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  avatarBtn: { padding: 4 },
  avatarCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarLetter: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  dropdown: {
    position: 'absolute', top: 44, right: 0,
    backgroundColor: '#FFFFFF', borderRadius: 8,
    paddingVertical: 4, minWidth: 180,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 10 },
  dropdownText: { fontSize: 14, color: '#1F2937' },
  dropdownDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 4 },
  hamburger: { padding: 8 },
  hamburgerIcon: { color: '#FFFFFF', fontSize: 24 },
  mobileMenu: {
    backgroundColor: colors.primaryDark,
    paddingVertical: 8, paddingHorizontal: 20,
  },
  mobileLink: { paddingVertical: 12 },
  mobileLinkText: { color: 'rgba(255,255,255,0.9)', fontSize: 16 },
  mobileLinkActive: { color: '#FFFFFF', fontWeight: '700' },
  mobileDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 8 },
});

export default TopNavBar;
