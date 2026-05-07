import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { C } from '../theme';

export default function AppFooter() {
  const nav = useNavigation<any>();
  const openLink = (url: string) => {
    if (Platform.OS === 'web') { window.open(url, '_blank'); }
    else { Linking.openURL(url); }
  };

  return (
    <View style={styles.footer}>
      <View style={styles.cols}>
        <View style={styles.col}>
          <Text style={styles.brand}>Photo Healthy</Text>
          <Text style={styles.tagline}>Capture, Share, Thrive</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.colTitle}>Company</Text>
          {[
            { label: 'About Us', screen: 'About' },
            { label: 'How It Works', screen: 'HowItWorks' },
            { label: 'FAQ', screen: 'FAQ' },
            { label: 'Partners', screen: 'Partners' },
          ].map(l => (
            <TouchableOpacity key={l.label} onPress={() => nav.navigate(l.screen as any)}>
              <Text style={styles.link}>{l.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.col}>
          <Text style={styles.colTitle}>Legal</Text>
          {[
            { label: 'Privacy Policy', screen: 'Legal', params: { section: 'privacy' } },
            { label: 'Terms of Service', screen: 'Legal', params: { section: 'terms' } },
            { label: 'Community Guidelines', screen: 'Legal', params: { section: 'guidelines' } },
          ].map(l => (
            <TouchableOpacity key={l.label} onPress={() => nav.navigate(l.screen as any, l.params)}>
              <Text style={styles.link}>{l.label}</Text>
            </TouchableOpacity>
          ))}

        </View>
        <View style={styles.col}>
          <Text style={styles.colTitle}>Connect</Text>
          <TouchableOpacity onPress={() => openLink('https://facebook.com/photohealthy')}>
            <Text style={styles.link}>Facebook</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openLink('https://instagram.com/photohealthy')}>
            <Text style={styles.link}>Instagram</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.bottom}>
        <Text style={styles.copy}>© {new Date().getFullYear()} Photo Healthy. All rights reserved.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { backgroundColor: '#161b22', borderTopWidth: 1, borderTopColor: C.CARD_BORDER, paddingTop: 40, paddingBottom: 24 },
  cols: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 24, marginBottom: 32 },
  col: { minWidth: 140, flex: 1 },
  brand: { color: C.TEXT, fontSize: 17, fontWeight: '800', marginBottom: 4 },
  tagline: { color: C.TEXT_MUTED, fontSize: 12 },
  colTitle: { color: C.TEXT, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  link: { color: C.TEXT_SECONDARY, fontSize: 13, marginBottom: 8, lineHeight: 20 },
  bottom: { borderTopWidth: 1, borderTopColor: C.CARD_BORDER, paddingTop: 20, paddingHorizontal: 24 },
  copy: { color: C.TEXT_MUTED, fontSize: 12 },
});
