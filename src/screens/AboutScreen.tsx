import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GradientButton from '../components/GradientButton';
import { C, borderRadius } from '../theme';

export default function AboutScreen() {
  const navigation = useNavigation<any>();

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.emoji}>📸</Text>
        <Text style={styles.title}>About PhotoHealthy</Text>
        <Text style={styles.tagline}>Capture your healthy journey, one photo at a time.</Text>

        <Text style={styles.body}>
          PhotoHealthy is a community platform where health-conscious individuals document their
          wellness journey through photography. Whether it's a healthy meal, a morning run, a
          meditation session, or a nature hike — every photo tells a story.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Our Mission</Text>
          <Text style={styles.cardBody}>
            To inspire and motivate people to live healthier lives by creating a supportive visual
            community around wellness, nutrition, fitness, and mindfulness.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Our Community</Text>
          <Text style={styles.cardBody}>
            Thousands of members actively participating in challenges, sharing their progress, and
            supporting each other on the path to better health.
          </Text>
        </View>

        <GradientButton
          label="Join the Community"
          onPress={() => navigation.navigate('Register')}
          style={{ marginTop: 24 }}
        />

        <View style={styles.links}>
          {[
            { label: 'How It Works', screen: 'HowItWorks' },
            { label: 'FAQ', screen: 'FAQ' },
            { label: 'Contact Us', screen: 'Contact' },
            { label: 'Legal / Privacy', screen: 'Legal' },
            { label: 'Partners', screen: 'Partners' },
          ].map(l => (
            <TouchableOpacity key={l.screen} onPress={() => navigation.navigate(l.screen)} style={styles.link}>
              <Text style={styles.linkText}>{l.label} →</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.BG },
  container: { padding: 20 },
  back: { marginBottom: 20 },
  backText: { color: C.ORANGE, fontSize: 15 },
  emoji: { fontSize: 56, marginBottom: 12 },
  title: { color: C.TEXT, fontSize: 30, fontWeight: '900', marginBottom: 8 },
  tagline: { color: C.ORANGE, fontSize: 16, fontWeight: '600', marginBottom: 20 },
  body: { color: C.TEXT_SECONDARY, fontSize: 15, lineHeight: 24, marginBottom: 20 },
  card: {
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  cardTitle: { color: C.TEXT, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  cardBody: { color: C.TEXT_SECONDARY, fontSize: 14, lineHeight: 21 },
  links: { marginTop: 24 },
  link: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.DIVIDER },
  linkText: { color: C.ORANGE, fontSize: 15 },
});
