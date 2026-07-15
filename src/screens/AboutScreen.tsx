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
import { DEFAULT_ABOUT_PAGE_CONTENT, normalizeAboutPageContent } from '../content/aboutPage';

// ─── Design Tokens ───────────────────────────────────────────────────────────
const MAX_WIDTH = 1100;
const SECTION_PAD_V = 64;
const SECTION_PAD_V_HERO = 80;
const CONTENT_PAD_H = 24;
const CARD_RADIUS = 16;
const ABOUT_PURPOSE_IMAGE = require('../../assets/Pose_4-removebg-preview.png');
const ABOUT_STORY_IMAGE = require('../../assets/81152a899d49bff0e41109a7a1650ccf6ad5953d.png');

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
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [pageContent, setPageContent] = useState(DEFAULT_ABOUT_PAGE_CONTENT);

  useFocusEffect(useCallback(() => {
    let active = true;
    getPublicSettings()
      .then((data: any) => {
        if (active) setPageContent(normalizeAboutPageContent(data?.settings?.about_page_content));
      })
      .catch(() => {});
    return () => { active = false; };
  }, []));

  const heroImageUri = fullUrl(pageContent.hero_image_url);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>

      {/* ── 1. Hero ── */}
      <View style={styles.heroSection}>
        <View style={[styles.purposeImageContainer, heroImageUri && styles.purposeImageContainerCustom]}>
          <Image
            source={heroImageUri ? { uri: heroImageUri } : ABOUT_PURPOSE_IMAGE}
            style={[styles.purposeImage, heroImageUri && styles.purposeImageCustom]}
            resizeMode={heroImageUri ? 'cover' : 'center'}
            accessibilityLabel={pageContent.hero_image_alt}
          />
        </View>
        <Text style={styles.heroTitle}>{pageContent.hero_title}</Text>
        <Text style={styles.heroDesc}>
          {pageContent.hero_body}
        </Text>
        <GradientButton
          label={user ? 'Visit the Community' : 'Join Our Community'}
          onPress={() => user
            ? navigation.navigate('Main' as never, { screen: 'CommunityTab' } as never)
            : navigation.navigate('Register' as never)}
          style={styles.heroBtn}
        />
      </View>

      {pageContent.sections.map((section, index) => {
        const customImageUri = fullUrl(section.image_url);
        const sectionImage = customImageUri
          ? { uri: customImageUri }
          : section.id === 'our-story' ? ABOUT_STORY_IMAGE : null;
        const reverse = isDesktop && index % 2 !== 0;
        return (
          <View key={section.id} style={[styles.storySection, index % 2 === 0 && styles.contentSectionAlt]}>
            <View style={[
              styles.storyRow,
              isDesktop && styles.storyRowDesktop,
              reverse && styles.storyRowReversed,
              !sectionImage && styles.storyRowTextOnly,
            ]}>
              {sectionImage ? (
                <Image
                  source={sectionImage}
                  style={[styles.storyImage, isDesktop && styles.storyImageDesktop]}
                  resizeMode="cover"
                  accessibilityLabel={section.image_alt || section.title}
                />
              ) : null}
              <View style={[styles.storyTextCol, isDesktop && sectionImage && styles.storyTextColDesktop, !sectionImage && styles.storyTextOnly]}>
                <Text style={[styles.storyTitle, !sectionImage && styles.storyTitleCentered]}>{section.title}</Text>
                {section.body ? <Text style={[styles.storyBody, !sectionImage && styles.storyBodyCentered]}>{section.body}</Text> : null}
              </View>
            </View>
          </View>
        );
      })}

      {/* ── 4. Values ── */}
      {/*
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
      */}

      {/* ── 5. CTA Banner ── */}
      <View style={styles.ctaSection}>
        <View style={styles.ctaBanner as any}>
          <Text style={styles.ctaTitle}>{pageContent.cta_title}</Text>
          <Text style={styles.ctaSubtitle}>
            {pageContent.cta_subtitle}
          </Text>
          <GradientButton
            label={user ? 'Explore the Community' : 'Sign Up Now'}
            onPress={() => user
              ? navigation.navigate('Main' as never, { screen: 'CommunityTab' } as never)
              : navigation.navigate('Register' as never)}
            size="lg"
            style={styles.ctaBtn}
            textStyle={styles.ctaBtnText}
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

  // Hero — full-width dark card
  heroSection: {
    backgroundColor: 'transparent',
    paddingVertical: SECTION_PAD_V_HERO,
    paddingHorizontal: CONTENT_PAD_H,
    alignItems: 'center',
  },
  purposeImageContainer: {
    width: '60%',
    height: 135,
    marginBottom: 34,
    overflow: 'hidden',
  },
  purposeImageContainerCustom: {
    width: '100%',
    maxWidth: 760,
    height: 300,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  purposeImage: {
    width: '100%',
    height: 180,
  },
  purposeImageCustom: { height: '100%' },
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
  contentSectionAlt: { backgroundColor: 'rgba(46,49,69,0.34)' },
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
  storyRowReversed: { flexDirection: 'row-reverse' },
  storyRowTextOnly: { maxWidth: 820 },
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
  storyTextOnly: { width: '100%' },
  storyTitle: {
    color: C.TEXT,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 16,
    ...(Platform.OS === 'web' ? { fontFamily: "'Lexend', sans-serif" } : {}),
  },
  storyTitleCentered: { textAlign: 'center' },
  storyBody: {
    color: C.TEXT_SECONDARY,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 12,
  },
  storyBodyCentered: { textAlign: 'center', fontSize: 16, lineHeight: 28 },

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
    paddingHorizontal: 0,
  },
  ctaBanner: {
    borderRadius: 0,
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
  ctaBtn: {
    marginTop: 20,
    backgroundColor: C.WHITE,
    borderColor: C.WHITE,
  },
  ctaBtnText: {
    color: '#000000',
  },
});
