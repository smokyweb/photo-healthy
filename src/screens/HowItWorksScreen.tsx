import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme';

const STEPS = [
  { num: '1', icon: '🔍', title: 'Browse Challenges', desc: 'Explore our active photo challenges and find one that inspires you. Each challenge has a unique theme and timeframe.' },
  { num: '2', icon: '📸', title: 'Capture & Submit', desc: 'Take your best shot and submit it to the challenge. Add a title and description to tell the story behind your photo.' },
  { num: '3', icon: '💬', title: 'Engage & Connect', desc: 'View submissions from other photographers, leave comments, and be part of a supportive creative community.' },
];

const HowItWorksScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>How It Works</Text>
        <Text style={styles.heroSub}>Three simple steps to start your photo challenge journey</Text>
      </View>
      <View style={styles.content}>
        {STEPS.map((step, i) => (
          <View key={i} style={styles.stepCard}>
            <View style={styles.stepNumWrap}>
              <Text style={styles.stepNum}>{step.num}</Text>
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepIcon}>{step.icon}</Text>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDesc}>{step.desc}</Text>
            </View>
          </View>
        ))}

        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to Get Started?</Text>
          <Text style={styles.ctaText}>
            Join our community today and start participating in creative photo challenges.
          </Text>
          <View style={styles.ctaButtons}>
            <TouchableOpacity style={styles.ctaPrimary} onPress={() => navigation.navigate('Register')}>
              <Text style={styles.ctaPrimaryText}>Join Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctaSecondary} onPress={() => navigation.navigate('Challenges')}>
              <Text style={styles.ctaSecondaryText}>Browse Challenges</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  hero: { backgroundColor: colors.primary, paddingVertical: 60, paddingHorizontal: 24, alignItems: 'center' },
  heroTitle: { color: '#FFFFFF', fontSize: 36, fontWeight: '700', textAlign: 'center' },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 18, marginTop: 12, textAlign: 'center' },
  content: { maxWidth: 700, width: '100%', alignSelf: 'center', padding: 24 },
  stepCard: {
    flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12,
    padding: 24, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  stepNumWrap: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: 20,
  },
  stepNum: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  stepBody: { flex: 1 },
  stepIcon: { fontSize: 32, marginBottom: 8 },
  stepTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  stepDesc: { fontSize: 15, color: '#6B7280', lineHeight: 24 },
  ctaSection: {
    backgroundColor: colors.primary, borderRadius: 16, padding: 40, marginTop: 20, alignItems: 'center',
  },
  ctaTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  ctaText: { color: 'rgba(255,255,255,0.85)', fontSize: 16, textAlign: 'center', marginBottom: 24, maxWidth: 400 },
  ctaButtons: { flexDirection: 'row', gap: 12 },
  ctaPrimary: { backgroundColor: '#FFFFFF', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 8 },
  ctaPrimaryText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  ctaSecondary: { borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 8 },
  ctaSecondaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

export default HowItWorksScreen;
