import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, useWindowDimensions, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GradientButton from '../components/GradientButton';
import AppFooter from '../components/AppFooter';
import { C, brandGradients, fontFamilies } from '../theme';

// ─── Design Tokens ───────────────────────────────────────────────────────────
const MAX_WIDTH = 1100;
const SECTION_PAD_V = 64;
const SECTION_PAD_V_HERO = 80;
const CONTENT_PAD_H = 24;
const CARD_RADIUS = 16;

// ─── Data ─────────────────────────────────────────────────────────────────────
const STEPS = [
  {
    num: '1',
    color: C.ORANGE,
    title: 'Sign Up & Create Your Profile',
    body1: 'Join for free in seconds. Create your profile and set your wellness goals to get started on the right foot.',
    body2: 'Introduce yourself to the community and let others know what you are working toward. No credit card required.',
  },
  {
    num: '2',
    color: C.TEAL,
    title: 'Join Challenges & Submit Photos',
    body1: 'Browse active challenges across nutrition, fitness, mindfulness, and more to find what motivates you.',
    body2: 'Submit photos to document your journey, inspire others, and stay accountable to your goals every day.',
  },
  {
    num: '3',
    color: C.ORANGE_END,
    title: 'Engage, Grow & Track Progress',
    body1: 'Like and comment on others\'  submissions, receive genuine encouragement, and build real connections.',
    body2: 'Use your personal dashboard to track your wellness journey and celebrate milestones along the way.',
  },
];

const GUIDELINES = [
  {
    color: C.TEAL,
    title: 'Be Kind & Supportive',
    desc: 'Encourage others on their wellness journey. Positive energy helps everyone grow.',
  },
  {
    color: C.ORANGE,
    title: 'Share Authentically',
    desc: 'Real moments over perfection. Your genuine journey is what inspires others most.',
  },
  {
    color: C.ORANGE_END,
    title: 'Respect Privacy',
    desc: "Always get permission before sharing photos that include other people's faces.",
  },
  {
    color: C.TEAL,
    title: 'Stay On Topic',
    desc: 'Keep submissions relevant to the challenge theme to maintain quality for all members.',
  },
  {
    color: C.ORANGE,
    title: 'No Spam or Ads',
    desc: 'Avoid self-promotion or advertising. The community thrives on genuine sharing.',
  },
  {
    color: C.ORANGE_END,
    title: 'Celebrate Progress',
    desc: 'Every step forward counts. Acknowledge and cheer on the progress of your fellow members.',
  },
];

const PRO_BENEFITS = [
  'Unlimited monthly challenge submissions',
  'Access to Pro-only exclusive challenges',
  'Pro badge on your profile',
  'Access to Pro-only shop items',
];

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function HowItWorksScreen() {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>

      {/* ── 1. Hero ── */}
      <View style={styles.heroSection as any}>
        <Text style={styles.heroTitle}>How It Works</Text>
        <Text style={styles.heroSubtitle}>
          Getting healthy has never been easier. Join a community that motivates you every single day.
        </Text>
      </View>

      {/* ── 2. Steps ── */}
      <View style={styles.stepsSection}>
        <View style={styles.stepsInner}>
          {STEPS.map((step, idx) => {
            const flip = isDesktop && idx % 2 !== 0;
            return (
              <View
                key={step.num}
                style={[
                  styles.stepRow,
                  isDesktop && styles.stepRowDesktop,
                  flip && (styles.stepRowReversed as any),
                  idx < STEPS.length - 1 && styles.stepRowSpaced,
                ]}
              >
                {/* Text side */}
                <View style={[styles.stepTextSide, isDesktop && styles.stepHalf]}>
                  <View style={[styles.stepBadge, { backgroundColor: step.color }]}>
                    <Text style={styles.stepBadgeNum}>{step.num}</Text>
                  </View>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepBody}>{step.body1}</Text>
                  <Text style={styles.stepBody}>{step.body2}</Text>
                </View>
                {/* Image side */}
                <View style={[styles.stepImageSide, isDesktop && styles.stepHalf]}>
                  <View style={styles.stepImageCard} />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.proSection}>
        <View style={[styles.proInner, isDesktop && styles.proInnerDesktop]}>
          <View style={styles.proText}>
            <Text style={styles.sectionEyebrow}>Pro Subscription</Text>
            <Text style={[styles.sectionTitle, styles.proTitle]}>Pro Benefits</Text>
            <Text style={styles.proBody}>Text to be provided.</Text>
          </View>
          <View style={styles.proBenefitsGrid}>
            {PRO_BENEFITS.map(item => (
              <View key={item} style={styles.proBenefitCard}>
                <Text style={styles.proCheck}>✓</Text>
                <Text style={styles.proBenefitText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ── 3. Community Guidelines ── */}
      <View style={styles.guidelinesSection}>
        <View style={styles.guidelinesInner}>
          <Text style={styles.sectionTitle}>Community Guidelines</Text>
          <View style={[styles.guidelinesGrid, isDesktop && styles.guidelinesGridDesktop]}>
            {GUIDELINES.map(g => (
              <View key={g.title} style={[styles.guidelineCard, isDesktop && styles.guidelineCardDesktop]}>
                <Text style={[styles.guidelineTitle, { color: g.color }]}>{g.title}</Text>
                <Text style={styles.guidelineDesc}>{g.desc}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ── 4. CTA Banner ── */}
      <View style={styles.ctaSection}>
        <View style={styles.ctaBanner as any}>
          <Text style={styles.ctaTitle}>Ready to Start Your Journey?</Text>
          <Text style={styles.ctaSubtitle}>
            Join thousands of members already living healthier lives
          </Text>
          <GradientButton
            label="Get Started Free"
            onPress={() => navigation.navigate('Register' as never)}
            size="lg"
            style={styles.ctaBtn}
            variant="outline"
          />
        </View>
      </View>

      <AppFooter />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { backgroundColor: 'transparent' },
  content: { paddingBottom: 0 },

  // Hero — gradient full width
  heroSection: {
    paddingVertical: SECTION_PAD_V_HERO,
    paddingHorizontal: CONTENT_PAD_H,
    alignItems: 'center',
    backgroundColor: C.ORANGE,
    ...(Platform.OS === 'web'
      ? { backgroundImage: brandGradients.primaryCss135 }
      : {}),
  },
  heroTitle: {
    color: C.WHITE,
    fontSize: 40,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
    ...(Platform.OS === 'web' ? { fontFamily: fontFamilies.heading } : {}),
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 560,
  },

  // Steps section
  stepsSection: {
    paddingVertical: SECTION_PAD_V,
    paddingHorizontal: CONTENT_PAD_H,
  },
  stepsInner: {
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    width: '100%',
  },
  stepRow: { gap: 24 },
  stepRowDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 48,
  },
  stepRowReversed: { flexDirection: 'row-reverse' },
  stepRowSpaced: { marginBottom: 48 },
  stepHalf: { flex: 1 },
  stepTextSide: {},
  stepImageSide: {},
  stepBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  stepBadgeNum: { color: C.WHITE, fontSize: 20, fontWeight: '900' },
  stepTitle: {
    color: C.TEXT,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
    lineHeight: 30,
    ...(Platform.OS === 'web' ? { fontFamily: fontFamilies.heading } : {}),
  },
  stepBody: {
    color: C.TEXT_SECONDARY,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 8,
  },
  stepImageCard: {
    backgroundColor: C.CARD_BG2,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    height: 280,
  },

  proSection: {
    paddingVertical: SECTION_PAD_V,
    paddingHorizontal: CONTENT_PAD_H,
  },
  proInner: {
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    width: '100%',
    gap: 28,
  },
  proInnerDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proText: {
    flex: 1,
  },
  sectionEyebrow: {
    color: C.TEAL,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  proBody: {
    color: C.TEXT_SECONDARY,
    fontSize: 16,
    lineHeight: 25,
    maxWidth: 520,
  },
  proTitle: {
    textAlign: 'left',
    marginBottom: 14,
  },
  proBenefitsGrid: {
    flex: 1,
    gap: 12,
  },
  proBenefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.CARD_BG,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    padding: 16,
  },
  proCheck: {
    color: C.TEAL,
    fontSize: 18,
    fontWeight: '900',
  },
  proBenefitText: {
    color: C.TEXT,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },

  // Community Guidelines
  guidelinesSection: {
    paddingVertical: SECTION_PAD_V,
    paddingHorizontal: CONTENT_PAD_H,
    backgroundColor: C.CARD_BG2,
  },
  guidelinesInner: {
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    width: '100%',
  },
  sectionTitle: {
    color: C.TEXT,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 32,
    textAlign: 'center',
    ...(Platform.OS === 'web' ? { fontFamily: fontFamilies.heading } : {}),
  },
  guidelinesGrid: { gap: 24 },
  guidelinesGridDesktop: { flexDirection: 'row', flexWrap: 'wrap' },
  guidelineCard: {
    backgroundColor: C.CARD_BG,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    padding: 24,
  },
  guidelineCardDesktop: { width: 'calc(33.333% - 16px)' as any },
  guidelineTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
    ...(Platform.OS === 'web' ? { fontFamily: fontFamilies.heading } : {}),
  },
  guidelineDesc: {
    color: C.TEXT_SECONDARY,
    fontSize: 14,
    lineHeight: 22,
  },

  // CTA Banner — same gradient as hero
  ctaSection: {
    paddingVertical: SECTION_PAD_V,
    paddingHorizontal: CONTENT_PAD_H,
  },
  ctaBanner: {
    borderRadius: CARD_RADIUS,
    paddingVertical: SECTION_PAD_V,
    paddingHorizontal: CONTENT_PAD_H,
    alignItems: 'center',
    backgroundColor: C.ORANGE,
    ...(Platform.OS === 'web'
      ? { backgroundImage: brandGradients.primaryCss135 }
      : {}),
  },
  ctaTitle: {
    color: C.WHITE,
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
    ...(Platform.OS === 'web' ? { fontFamily: fontFamilies.heading } : {}),
  },
  ctaSubtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 4,
  },
  ctaBtn: { marginTop: 20, borderColor: C.WHITE },
});
