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
const VALUES = [
  {
    color: C.TEAL,
    title: 'Community First',
    desc: "We believe in the power of community. Every member's journey matters and inspires others around them.",
  },
  {
    color: C.ORANGE,
    title: 'Authentic Wellness',
    desc: 'Real progress over perfection. We celebrate honest, everyday wellness moments big and small.',
  },
  {
    color: C.ORANGE_END,
    title: 'Celebrate Progress',
    desc: 'Every step forward is worth celebrating. We cheer each other on at every milestone along the way.',
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function AboutScreen() {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>

      {/* ── 1. Hero ── */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>Our Purpose</Text>
        <Text style={styles.heroDesc}>
          Photo Healthy is a vibrant community where wellness meets visual storytelling. We empower
          individuals to document and share their healthy living journeys through photography,
          building meaningful connections along the way.
        </Text>
        <GradientButton
          label="Join Our Community"
          onPress={() => navigation.navigate('Register' as never)}
          style={styles.heroBtn}
        />
      </View>

      {/* ── 2. Philosophy ── */}
      <View style={styles.philosophySection}>
        <View style={styles.philosophyInner}>
          <Text style={styles.philosophyText}>
            "We believe that health is not just a destination — it's a daily practice. Every meal
            prepared with care, every morning run, every mindful breath is a step toward a better
            you. Our platform exists to celebrate those moments and connect the people who share them."
          </Text>
          <Text style={styles.philosophyText}>
            Photo Healthy was born from a simple idea: that sharing your wellness journey can inspire
            others to begin their own. When we see someone else's healthy breakfast or sunrise yoga
            session, something shifts in us. We're reminded that we're not alone on this path.
          </Text>
          <Text style={styles.philosophyAttrib}>— Photo Healthy Team</Text>
        </View>
      </View>

      {/* ── 3. Our Story ── */}
      <View style={styles.storySection}>
        <View style={[styles.storyRow, isDesktop && styles.storyRowDesktop]}>
          <View style={[styles.storyImage, isDesktop && styles.storyImageDesktop]} />
          <View style={[styles.storyTextCol, isDesktop && styles.storyTextColDesktop]}>
            <Text style={styles.storyTitle}>Our Story</Text>
            <Text style={styles.storyBody}>
              Founded in 2024, Photo Healthy grew from a small group of friends who wanted to hold
              each other accountable for their wellness goals. We started sharing photos of our
              healthy meals and workouts in a private chat — and it worked.
            </Text>
            <Text style={styles.storyBody}>
              The encouragement was real, the accountability was genuine, and the results were
              undeniable. We realized this model could help thousands more people achieve their
              wellness goals if we built a proper platform for it.
            </Text>
            <Text style={styles.storyBody}>
              Today, Photo Healthy is home to a thriving community of health-conscious individuals
              across the globe, all united by the power of visual storytelling and mutual support.
            </Text>
          </View>
        </View>
      </View>

      {/* ── 4. Values ── */}
      <View style={styles.valuesSection}>
        <View style={styles.sectionInner}>
          <Text style={styles.sectionTitle}>Our Values</Text>
          <View style={[styles.valuesGrid, isDesktop && styles.valuesGridDesktop]}>
            {VALUES.map(v => (
              <View key={v.title} style={[styles.valueCard, isDesktop && styles.valueCardDesktop]}>
                <Text style={[styles.valueTitle, { color: v.color }]}>{v.title}</Text>
                <Text style={styles.valueDesc}>{v.desc}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ── 5. CTA Banner ── */}
      <View style={styles.ctaSection}>
        <View style={styles.ctaBanner as any}>
          <Text style={styles.ctaTitle}>Start Your Journey</Text>
          <Text style={styles.ctaSubtitle}>Join thousands of members already thriving</Text>
          <GradientButton
            label="Join Free Today"
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
  screen: { backgroundColor: C.BG },
  content: { paddingBottom: 0 },

  // Hero — full-width dark card
  heroSection: {
    backgroundColor: C.CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: C.CARD_BORDER,
    paddingVertical: SECTION_PAD_V_HERO,
    paddingHorizontal: CONTENT_PAD_H,
    alignItems: 'center',
  },
  heroTitle: {
    color: C.TEXT,
    fontSize: 40,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 16,
    ...(Platform.OS === 'web' ? { fontFamily: "'Lexend', sans-serif" } : {}),
  },
  heroDesc: {
    color: C.TEXT_SECONDARY,
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    maxWidth: 680,
    marginBottom: 28,
  },
  heroBtn: { alignSelf: 'center' },

  // Philosophy — centered narrow block
  philosophySection: {
    paddingVertical: SECTION_PAD_V,
    paddingHorizontal: CONTENT_PAD_H,
  },
  philosophyInner: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  philosophyText: {
    color: C.TEXT_SECONDARY,
    fontSize: 16,
    lineHeight: 28,
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  philosophyAttrib: {
    color: C.TEAL,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },

  // Our Story — 2-col on desktop
  storySection: {
    paddingVertical: SECTION_PAD_V,
    paddingHorizontal: CONTENT_PAD_H,
  },
  storyRow: {
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    width: '100%',
    gap: 24,
  },
  storyRowDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 48,
  },
  storyImage: {
    backgroundColor: C.CARD_BG2,
    borderRadius: CARD_RADIUS,
    height: 400,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  storyImageDesktop: { flex: 1 },
  storyTextCol: {},
  storyTextColDesktop: { flex: 1 },
  storyTitle: {
    color: C.TEXT,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 16,
    ...(Platform.OS === 'web' ? { fontFamily: "'Lexend', sans-serif" } : {}),
  },
  storyBody: {
    color: C.TEXT_SECONDARY,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 12,
  },

  // Values — 3-col grid
  valuesSection: {
    paddingVertical: SECTION_PAD_V,
    paddingHorizontal: CONTENT_PAD_H,
    backgroundColor: C.CARD_BG2,
  },
  sectionInner: {
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
    ...(Platform.OS === 'web' ? { fontFamily: "'Lexend', sans-serif" } : {}),
  },
  valuesGrid: { gap: 24 },
  valuesGridDesktop: { flexDirection: 'row' },
  valueCard: {
    backgroundColor: C.CARD_BG,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    padding: 28,
    alignItems: 'center',
  },
  valueCardDesktop: { flex: 1 },
  valueTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
    ...(Platform.OS === 'web' ? { fontFamily: "'Lexend', sans-serif" } : {}),
  },
  valueDesc: {
    color: C.TEXT_SECONDARY,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },

  // CTA Banner — orange gradient
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
    marginBottom: 4,
  },
  ctaBtn: { marginTop: 20, borderColor: C.WHITE },
});
