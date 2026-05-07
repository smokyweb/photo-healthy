import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { C, borderRadius } from '../theme';

const FOOTER_ROUTES: Record<string, string> = {
  'About Us': 'About', 'FAQ': 'FAQ', 'Shop': 'Shop', 'Contact': 'Contact',
  'Partners': 'Partners', 'Privacy Policy': 'Legal', 'Terms of Service': 'Legal',
  'Cookie Policy': 'Legal', 'GDPR': 'Legal', 'How It Works': 'HowItWorks',
  'Gallery': 'Gallery', 'Sign Up': 'Register', 'Log In': 'Login',
};

const COMPANY_LINKS = ['About Us', 'FAQ', 'Shop', 'Contact', 'Partners'];
const LEGAL_LINKS = ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'];

export default function AppFooter() {
  const nav = useNavigation<any>();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const FooterLink = ({ label }: { label: string }) => (
    <TouchableOpacity onPress={() => { const r = FOOTER_ROUTES[label]; if (r) nav.navigate(r as never); }}>
      <Text style={styles.link}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.footer}>
      <View style={[styles.grid, isMobile && styles.gridMobile]}>
        {/* Brand */}
        <View style={[styles.brand, isMobile && styles.brandMobile]}>
          <Text style={styles.brandTitle}>Photo Healthy</Text>
          <Text style={styles.brandCopy}>
            Empowering and encouraging you to grow, connect, share in your wellness community.
          </Text>
        </View>

        {/* Company */}
        <View style={[styles.col, isMobile && styles.colMobile]}>
          <Text style={styles.colTitle}>Company</Text>
          {COMPANY_LINKS.map(item => <FooterLink key={item} label={item} />)}
        </View>

        {/* Legal */}
        <View style={[styles.col, isMobile && styles.colMobile]}>
          <Text style={styles.colTitle}>Legal</Text>
          {LEGAL_LINKS.map(item => <FooterLink key={item} label={item} />)}
        </View>

        {/* Connect */}
        <View style={[styles.col, isMobile && styles.colMobile]}>
          <Text style={styles.colTitle}>Connect</Text>
          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.link}>Instagram</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.link}>Facebook</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.rule} />
      <Text style={styles.copy}>{'©'} {new Date().getFullYear()} Photo Healthy. All rights reserved.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: C.NAV_BG,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148,163,184,0.15)',
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 32,
    marginTop: 40,
  },
  grid: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 36,
    flexWrap: 'wrap',
  },
  gridMobile: {
    flexDirection: 'column',
    gap: 24,
  },
  brand: {
    flex: 2,
    minWidth: 200,
  },
  brandMobile: {
    flex: 0,
  },
  brandTitle: {
    color: '#EAECEF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  brandCopy: {
    color: 'rgba(234,236,239,0.55)',
    fontSize: 13,
    lineHeight: 20,
    maxWidth: 280,
  },
  col: {
    flex: 1,
    minWidth: 120,
    gap: 10,
  },
  colMobile: {
    flex: 0,
    gap: 8,
  },
  colTitle: {
    color: '#EAECEF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  link: {
    color: 'rgba(234,236,239,0.6)',
    fontSize: 13,
    lineHeight: 22,
  },
  rule: {
    height: 1,
    backgroundColor: 'rgba(148,163,184,0.15)',
    marginBottom: 20,
  },
  copy: {
    color: 'rgba(234,236,239,0.35)',
    fontSize: 12,
    textAlign: 'center',
  },
});
