import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, useWindowDimensions, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GradientButton from '../components/GradientButton';
import AppFooter from '../components/AppFooter';
import { C, borderRadius } from '../theme';

const VALUES = [
  {
    icon: '🤝',
    color: C.TEAL,
    title: 'Community First',
    desc: "We believe in the power of community. Every member's journey matters and inspires others around them.",
  },
  {
    icon: '🌱',
    color: C.ORANGE,
    title: 'Authentic Wellness',
    desc: 'Real progress over perfection. We celebrate honest, everyday wellness moments big and small.',
  },
  {
    icon: '🎉',
    color: '#A78BFA',
    title: 'Celebrate Progress',
    desc: 'Every step forward is worth celebrating. We cheer each other on at every milestone along the way.',
  },
];

export default function AboutScreen() {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={styles.heroWrapper}>
        <View style={[styles.heroCard, isDesktop && styles.heroCardDesktop]}>
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
      </View>

      {/* Philosophy */}
      <View style={styles.section}>
        <View style={[styles.philosophyInner, isDesktop && styles.philosophyInnerDesktop]}>
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

      {/* Our Story */}
      <View style={styles.section}>
        <View style={[styles.storyRow, isDesktop && styles.storyRowDesktop]}>
          {/* Image placeholder */}
          <View style={[styles.storyImage, isDesktop && styles.storyImageDesktop]} />
          {/* Text */}
          <View style={[styles.storyText, isDesktop && styles.storyTextDesktop]}>
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

      {/* Values */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Values</Text>
        <View style={[styles.valuesGrid, isDesktop && styles.valuesGridDesktop]}>
          {VALUES.map(v => (
            <View key={v.title} style={[styles.valueCard, isDesktop && styles.valueCardDesktop]}>
              <Text style={styles.valueIcon}>{v.icon}</Text>
              <Text style={[styles.valueTitle, { color: v.color }]}>{v.title}</Text>
              <Text style={styles.valueDesc}>{v.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA Banner */}
      <View style={styles.ctaWrapper}>
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.BG },
  content: { paddingBottom: 0 },

  heroWrapper: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 8 },
  heroCard: {
    backgroundColor: C.CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    padding: 32,
    alignItems: 'center',
  },
  heroCardDesktop: { maxWidth: 800, alignSelf: 'center', width: '100%' },
  heroTitle: {
    color: C.TEXT,
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 16,
  },
  heroDesc: {
    color: C.TEXT_SECONDARY,
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 20,
  },
  heroBtn: { alignSelf: 'center' },

  section: { paddingHorizontal: 24, paddingVertical: 32 },

  philosophyInner: { alignItems: 'center' },
  philosophyInnerDesktop: { maxWidth: 800, alignSelf: 'center', width: '100%' },
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

  storyRow: { gap: 24 },
  storyRowDesktop: { flexDirection: 'row', alignItems: 'flex-start' },
  storyImage: {
    backgroundColor: C.CARD_BG,
    borderRadius: 12,
    height: 350,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  storyImageDesktop: { flex: 1, minWidth: 300 },
  storyText: {},
  storyTextDesktop: { flex: 1 },
  storyTitle: {
    color: C.TEXT,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 16,
  },
  storyBody: {
    color: C.TEXT_SECONDARY,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 12,
  },

  sectionTitle: {
    color: C.TEXT,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 24,
    textAlign: 'center',
  },
  valuesGrid: { gap: 16 },
  valuesGridDesktop: { flexDirection: 'row' },
  valueCard: {
    backgroundColor: C.CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    padding: 24,
    alignItems: 'center',
  },
  valueCardDesktop: { flex: 1 },
  valueIcon: { fontSize: 36, marginBottom: 12 },
  valueTitle: { fontSize: 17, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  valueDesc: {
    color: C.TEXT_SECONDARY,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },

  ctaWrapper: { paddingHorizontal: 24, paddingBottom: 40 },
  ctaBanner: {
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    backgroundColor: C.ORANGE,
    ...(Platform.OS === 'web'
      ? { backgroundImage: 'linear-gradient(135deg, #F55B09 0%, #FFD000 100%)' }
      : {}),
  },
  ctaTitle: {
    color: C.WHITE,
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  ctaSubtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 4,
  },
  ctaBtn: { marginTop: 20, borderColor: C.WHITE },
});
