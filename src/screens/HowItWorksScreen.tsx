import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, useWindowDimensions, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GradientButton from '../components/GradientButton';
import AppFooter from '../components/AppFooter';
import { C, borderRadius } from '../theme';

const STEPS = [
  {
    num: '1',
    color: C.ORANGE,
    title: 'Sign Up & Create Your Profile',
    desc: 'Join for free in seconds. Create your profile, set your wellness goals, and introduce yourself to the community. No credit card required.',
    imageEmoji: '📱',
  },
  {
    num: '2',
    color: C.TEAL,
    title: 'Join Challenges & Submit Photos',
    desc: 'Browse active challenges across nutrition, fitness, mindfulness, and more. Submit photos to document your journey and inspire others.',
    imageEmoji: '📷',
  },
  {
    num: '3',
    color: '#A78BFA',
    title: 'Engage with the Community & Track Progress',
    desc: "Like and comment on others' submissions, receive encouragement, and use your progress dashboard to track your wellness journey over time.",
    imageEmoji: '📈',
  },
];

const PRO_BENEFITS = [
  'Unlimited monthly challenge submissions',
  'Access to Pro-only exclusive challenges',
  'Download your original unwatermarked photos',
  'Pro badge on your profile',
  'Access to Pro-only shop items',
  'Priority support',
];

const FEATURES = [
  {
    icon: '🏆',
    title: 'Join Challenges',
    desc: 'Browse and join themed wellness challenges across nutrition, fitness, and mindfulness.',
  },
  {
    icon: '📸',
    title: 'Submit Photos',
    desc: 'Capture and share your healthy moments visually with the community.',
  },
  {
    icon: '📊',
    title: 'Engage & Grow',
    desc: 'Connect with community members and track your wellness progress over time.',
  },
];

export default function HowItWorksScreen() {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={styles.heroWrapper}>
        <View style={styles.heroBg as any}>
          <Text style={styles.heroTitle}>How It Works</Text>
          <Text style={styles.heroSubtitle}>
            Getting healthy has never been easier. Join a community that motivates you every single day.
          </Text>
        </View>
      </View>

      {/* Alternating Steps */}
      <View style={styles.stepsSection}>
        {STEPS.map((step, idx) => {
          const flipOnDesktop = isDesktop && idx % 2 !== 0;
          return (
            <View
              key={step.num}
              style={[
                styles.stepRow,
                isDesktop && styles.stepRowDesktop,
                flipOnDesktop && (styles.stepRowReversed as any),
              ]}
            >
              {/* Text side */}
              <View style={[styles.stepTextSide, isDesktop && styles.stepSideDesktop]}>
                <View style={[styles.stepBadge, { backgroundColor: step.color }]}>
                  <Text style={styles.stepBadgeNum}>{step.num}</Text>
                </View>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
              {/* Image side */}
              <View style={[styles.stepImageSide, isDesktop && styles.stepSideDesktop]}>
                <View style={styles.stepImageCard}>
                  <Text style={styles.stepImageEmoji}>{step.imageEmoji}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Pro Benefits */}
      <View style={styles.proSection}>
        <View style={[styles.proInner, isDesktop && styles.proInnerDesktop]}>
          <Text style={styles.proLabel}>⭐ PRO MEMBERSHIP</Text>
          <Text style={styles.proTitle}>Take It to the Next Level</Text>
          <Text style={styles.proSubtitle}>
            Unlock the full Photo Healthy experience with a Pro membership
          </Text>
          <View style={styles.proBenefitsList}>
            {PRO_BENEFITS.map(b => (
              <View key={b} style={styles.proBenefitRow}>
                <Text style={styles.proBenefitCheck}>✓</Text>
                <Text style={styles.proBenefitText}>{b}</Text>
              </View>
            ))}
          </View>
          <GradientButton
            label="Go Pro — $9.99/month"
            onPress={() => navigation.navigate('Subscription' as never)}
            size="lg"
          />
        </View>
      </View>

      {/* 3-Column Feature Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Everything You Need</Text>
        <View style={[styles.featureGrid, isDesktop && styles.featureGridDesktop]}>
          {FEATURES.map(f => (
            <View key={f.title} style={[styles.featureCard, isDesktop && styles.featureCardDesktop]}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA Banner */}
      <View style={styles.ctaWrapper}>
        <View style={styles.ctaBanner}>
          <Text style={styles.ctaTitle}>Ready to Start Your Journey?</Text>
          <Text style={styles.ctaSubtitle}>
            Join thousands of members already living healthier lives
          </Text>
          <GradientButton
            label="Get Started Free →"
            onPress={() => navigation.navigate('Register' as never)}
            size="lg"
            style={styles.ctaBtn}
          />
        </View>
      </View>

      <AppFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: C.BG },
  content: { paddingBottom: 0 },

  heroWrapper: { padding: 24, paddingTop: 32 },
  heroBg: {
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    backgroundColor: C.ORANGE,
    ...(Platform.OS === 'web'
      ? { backgroundImage: 'linear-gradient(135deg, #F55B09 0%, #FFD000 50%, #54DFB6 100%)' }
      : {}),
  },
  heroTitle: {
    color: C.WHITE,
    fontSize: 40,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 560,
  },

  stepsSection: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 16 },
  stepRow: { marginBottom: 40, gap: 20 },
  stepRowDesktop: { flexDirection: 'row', alignItems: 'center' },
  stepRowReversed: { flexDirection: 'row-reverse' },
  stepTextSide: {},
  stepSideDesktop: { flex: 1 },
  stepBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  stepBadgeNum: { color: C.WHITE, fontSize: 20, fontWeight: '900' },
  stepTitle: {
    color: C.TEXT,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
    lineHeight: 30,
  },
  stepDesc: { color: C.TEXT_SECONDARY, fontSize: 15, lineHeight: 24 },
  stepImageSide: {},
  stepImageCard: {
    backgroundColor: C.CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepImageEmoji: { fontSize: 72 },

  proSection: {
    backgroundColor: C.CARD_BG,
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  proInner: {},
  proInnerDesktop: { maxWidth: 700, alignSelf: 'center', width: '100%' },
  proLabel: {
    color: C.ORANGE,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  proTitle: {
    color: C.TEXT,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
  },
  proSubtitle: {
    color: C.TEXT_SECONDARY,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  proBenefitsList: { marginBottom: 28 },
  proBenefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  proBenefitCheck: { color: C.TEAL, fontSize: 15, fontWeight: '800', marginTop: 2 },
  proBenefitText: { color: C.TEXT_SECONDARY, fontSize: 15, flex: 1, lineHeight: 22 },

  section: { paddingHorizontal: 24, paddingVertical: 40 },
  sectionTitle: {
    color: C.TEXT,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 28,
    textAlign: 'center',
  },
  featureGrid: { gap: 16 },
  featureGridDesktop: { flexDirection: 'row' },
  featureCard: {
    backgroundColor: C.CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    padding: 28,
    alignItems: 'center',
  },
  featureCardDesktop: { flex: 1 },
  featureIcon: { fontSize: 44, marginBottom: 14 },
  featureTitle: {
    color: C.TEXT,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDesc: {
    color: C.TEXT_SECONDARY,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },

  ctaWrapper: { paddingHorizontal: 24, paddingBottom: 48 },
  ctaBanner: {
    backgroundColor: C.CARD_BG,
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  ctaTitle: {
    color: C.TEXT,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  ctaSubtitle: {
    color: C.TEXT_SECONDARY,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  ctaBtn: { marginTop: 20 },
});
