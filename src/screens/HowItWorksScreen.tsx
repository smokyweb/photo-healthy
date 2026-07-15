import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, useWindowDimensions, Platform, Image,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getPublicSettings } from '../services/api';
import GradientButton from '../components/GradientButton';
import AppFooter from '../components/AppFooter';
import { C, brandGradients, fontFamilies } from '../theme';
import { fullUrl } from '../config/api';
import { DEFAULT_HOW_IT_WORKS_CONTENT, normalizeHowItWorksContent } from '../content/howItWorks';

// ─── Design Tokens ───────────────────────────────────────────────────────────
const MAX_WIDTH = 1100;
const SECTION_PAD_V = 64;
const SECTION_PAD_V_HERO = 80;
const CONTENT_PAD_H = 24;
const CARD_RADIUS = 16;

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

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function HowItWorksScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [pageContent, setPageContent] = useState(DEFAULT_HOW_IT_WORKS_CONTENT);

  useFocusEffect(useCallback(() => {
    let active = true;
    getPublicSettings()
      .then((data: any) => {
        if (active) setPageContent(normalizeHowItWorksContent(data?.settings?.how_it_works_content));
      })
      .catch(() => {});
    return () => { active = false; };
  }, []));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>

      {/* ── 1. Hero ── */}
      <View style={[styles.heroSection, !isDesktop && styles.heroSectionMobile] as any}>
        <Text style={styles.heroTitle}>{pageContent.hero_title}</Text>
        <Text style={styles.heroSubtitle}>
          {pageContent.hero_subtitle}
        </Text>
      </View>

      {/* ── 2. Steps ── */}
      <View style={[styles.stepsSection, !isDesktop && styles.sectionMobile]}>
        <View style={styles.stepsInner}>
          {pageContent.steps.map((step, idx) => {
            const flip = isDesktop && idx % 2 !== 0;
            const stepColor = [C.ORANGE, C.TEAL, C.ORANGE_END][idx % 3];
            const imageUri = fullUrl(step.image_url);
            return (
              <View
                key={step.id}
                style={[
                  styles.stepRow,
                  isDesktop && styles.stepRowDesktop,
                  flip && (styles.stepRowReversed as any),
                  idx < pageContent.steps.length - 1 && styles.stepRowSpaced,
                ]}
              >
                {/* Text side */}
                <View style={[styles.stepTextSide, isDesktop && styles.stepHalf]}>
                  <View style={[styles.stepBadge, { backgroundColor: stepColor }]}>
                    <Text style={styles.stepBadgeNum}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  {step.body ? <Text style={styles.stepBody}>{step.body}</Text> : null}
                </View>
                {imageUri ? (
                  <View style={[styles.stepImageSide, isDesktop && styles.stepHalf]}>
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.stepImageCard}
                      resizeMode="cover"
                      accessibilityLabel={step.image_alt || step.title}
                    />
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </View>

      <View style={[styles.proSection, !isDesktop && styles.sectionMobile]}>
        <View style={[styles.proInner, isDesktop && styles.proInnerDesktop]}>
          <View style={styles.proText}>
            <Text style={styles.sectionEyebrow}>Pro Subscription</Text>
            <Text style={[styles.sectionTitle, styles.proTitle]}>{pageContent.pro_title}</Text>
            <Text style={styles.proBody}>{pageContent.pro_body}</Text>
          </View>
          <View style={styles.proBenefitsGrid}>
            {pageContent.pro_benefits.map(item => (
              <View key={item} style={styles.proBenefitCard}>
                <Text style={styles.proCheck}>✓</Text>
                <Text style={styles.proBenefitText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ── 3. Community Guidelines ── */}
      <View style={[styles.guidelinesSection, !isDesktop && styles.sectionMobile]}>
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
      <View style={[styles.ctaSection, !isDesktop && styles.sectionMobile]}>
        <View style={[styles.ctaBanner, !isDesktop && styles.ctaBannerMobile] as any}>
          <Text style={styles.ctaTitle}>{pageContent.cta_title}</Text>
          <Text style={styles.ctaSubtitle}>
            {pageContent.cta_subtitle}
          </Text>
          <GradientButton
            label={user ? 'Explore Challenges' : 'Get Started Free'}
            onPress={() => user
              ? navigation.navigate('Main' as never, { screen: 'ChallengesTab' } as never)
              : navigation.navigate('Register' as never)}
            size="lg"
            style={[styles.ctaBtn, !isDesktop && styles.ctaBtnMobile]}
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
  heroSectionMobile: {
    paddingVertical: 44,
    paddingHorizontal: 18,
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
  sectionMobile: {
    paddingVertical: 34,
    paddingHorizontal: 18,
  },
  stepsInner: {
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    width: '100%',
  },
  stepRow: { gap: 18 },
  stepRowDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 48,
  },
  stepRowReversed: { flexDirection: 'row-reverse' },
  stepRowSpaced: { marginBottom: 34 },
  stepHalf: { flex: 1 },
  stepTextSide: {
    minWidth: 0,
  },
  stepImageSide: { width: '100%' },
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
    width: '100%',
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
  ctaBannerMobile: {
    paddingVertical: 32,
    paddingHorizontal: 18,
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
  ctaBtnMobile: {
    width: '100%' as any,
    maxWidth: 320,
    alignSelf: 'center',
  },
});
