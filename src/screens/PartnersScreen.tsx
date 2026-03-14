import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../theme';

const PARTNERS = [
  { name: 'HealthyLens Optics', desc: 'Premium camera lenses and accessories for health-conscious photographers.', icon: '🔭' },
  { name: 'NatureFocus', desc: 'Outdoor photography gear and nature conservation initiatives.', icon: '🌿' },
  { name: 'CreativeWell Studio', desc: 'Photography workshops and wellness retreats for creatives.', icon: '🎨' },
  { name: 'PixelFit', desc: 'Digital tools and apps that keep your creative workflow healthy.', icon: '💻' },
  { name: 'Mindful Shots', desc: 'Mindfulness programs designed specifically for photographers.', icon: '🧘' },
  { name: 'EcoFrame', desc: 'Sustainable framing and printing solutions for your best work.', icon: '🖼️' },
];

const PartnersScreen = () => (
  <ScrollView style={styles.container}>
    <View style={styles.hero}>
      <Text style={styles.heroTitle}>Our Partners</Text>
      <Text style={styles.heroSub}>Organizations that share our passion for photography and wellness</Text>
    </View>
    <View style={styles.content}>
      <Text style={styles.intro}>
        We're proud to partner with organizations that share our mission of promoting creativity,
        wellness, and community through photography.
      </Text>
      <View style={styles.grid}>
        {PARTNERS.map((p, i) => (
          <View key={i} style={styles.card}>
            <Text style={styles.cardIcon}>{p.icon}</Text>
            <Text style={styles.cardName}>{p.name}</Text>
            <Text style={styles.cardDesc}>{p.desc}</Text>
          </View>
        ))}
      </View>
      <View style={styles.ctaBox}>
        <Text style={styles.ctaTitle}>Become a Partner</Text>
        <Text style={styles.ctaText}>
          Interested in partnering with Photo Healthy? We'd love to hear from you.
          Contact us at partners@photohealthy.com
        </Text>
      </View>
    </View>
  </ScrollView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  hero: { backgroundColor: colors.primary, paddingVertical: 60, paddingHorizontal: 24, alignItems: 'center' },
  heroTitle: { color: '#FFFFFF', fontSize: 36, fontWeight: '700', textAlign: 'center' },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 18, marginTop: 12, textAlign: 'center' },
  content: { maxWidth: 900, width: '100%', alignSelf: 'center', padding: 24 },
  intro: { fontSize: 16, color: '#4B5563', lineHeight: 26, marginBottom: 32, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 32 },
  card: {
    width: '48%', minWidth: 260, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  cardIcon: { fontSize: 40, marginBottom: 12 },
  cardName: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  cardDesc: { fontSize: 14, color: '#6B7280', lineHeight: 22 },
  ctaBox: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 32, alignItems: 'center',
    borderWidth: 2, borderColor: colors.primary,
  },
  ctaTitle: { fontSize: 22, fontWeight: '700', color: colors.primary, marginBottom: 12 },
  ctaText: { fontSize: 15, color: '#4B5563', textAlign: 'center', lineHeight: 24 },
});

export default PartnersScreen;
