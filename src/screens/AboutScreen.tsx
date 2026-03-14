import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../theme';

const AboutScreen = () => (
  <ScrollView style={styles.container}>
    <View style={styles.hero}>
      <Text style={styles.heroTitle}>About Photo Healthy</Text>
      <Text style={styles.heroSub}>Building a creative community through photography</Text>
    </View>
    <View style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.heading}>Our Mission</Text>
        <Text style={styles.text}>
          Photo Healthy is a vibrant community where photographers of all skill levels come together
          to participate in creative challenges, share their work, and grow their craft. We believe
          photography is a powerful form of self-expression that promotes mindfulness and well-being.
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.heading}>What We Do</Text>
        <Text style={styles.text}>
          We host regular photo challenges with unique themes that inspire creativity and push
          boundaries. Each challenge is an opportunity to see the world through a new lens, connect
          with fellow photographers, and build a portfolio of meaningful work.
        </Text>
      </View>
      <View style={styles.cardRow}>
        <View style={styles.card}>
          <Text style={styles.cardIcon}>📸</Text>
          <Text style={styles.cardTitle}>Creative Challenges</Text>
          <Text style={styles.cardText}>Weekly and monthly themes to inspire your photography journey.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardIcon}>🤝</Text>
          <Text style={styles.cardTitle}>Community</Text>
          <Text style={styles.cardText}>Connect with photographers who share your passion for the craft.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardIcon}>🌱</Text>
          <Text style={styles.cardTitle}>Growth</Text>
          <Text style={styles.cardText}>Improve your skills with feedback and inspiration from the community.</Text>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.heading}>Our Story</Text>
        <Text style={styles.text}>
          Founded in 2026, Photo Healthy started as a small group of photography enthusiasts who
          wanted to create a supportive space for creative exploration. Today, we've grown into a
          thriving community of photographers from around the world, united by a love of capturing
          life's beautiful moments.
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
  section: { marginBottom: 32 },
  heading: { fontSize: 24, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  text: { fontSize: 16, color: '#4B5563', lineHeight: 26 },
  cardRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 32 },
  card: {
    flex: 1, minWidth: 240, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  cardIcon: { fontSize: 36, marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  cardText: { fontSize: 14, color: '#6B7280', lineHeight: 22 },
});

export default AboutScreen;
