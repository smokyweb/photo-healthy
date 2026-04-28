import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AppFooter from '../components/AppFooter';
import { C, borderRadius } from '../theme';

type Tab = 'terms' | 'privacy' | 'guidelines';

const TABS: { id: Tab; label: string }[] = [
  { id: 'terms', label: 'Terms of Service' },
  { id: 'privacy', label: 'Privacy Policy' },
  { id: 'guidelines', label: 'Community Guidelines' },
];

export default function LegalScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // Support deep-linking to a specific section via route.params.section
  const initialSection = route.params?.section as Tab | undefined;
  const [tab, setTab] = useState<Tab>(
    initialSection && TABS.find(t => t.id === initialSection) ? initialSection : 'terms'
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Legal</Text>
      </View>

      {/* Tab Row */}
      <View style={styles.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tabBtn, tab === t.id && styles.tabBtnActive]}
            onPress={() => setTab(t.id)}
          >
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {tab === 'terms' && (
          <View>
            <Text style={styles.heading}>Terms of Service</Text>
            <Text style={styles.updated}>Last updated: January 2026</Text>
            <Text style={styles.body}>
              By using Photo Healthy, you agree to these Terms of Service. Please read them carefully.
            </Text>
            <Text style={styles.subheading}>Use of Service</Text>
            <Text style={styles.body}>
              You must be 13 years or older to use Photo Healthy. You are responsible for maintaining
              the security of your account credentials and for all activity that occurs under your account.
            </Text>
            <Text style={styles.subheading}>Content</Text>
            <Text style={styles.body}>
              You retain ownership of photos you upload. By submitting content, you grant Photo Healthy
              a non-exclusive, royalty-free license to display and promote your content within the
              platform and in marketing materials.
            </Text>
            <Text style={styles.subheading}>Prohibited Content</Text>
            <Text style={styles.body}>
              You may not submit content that is illegal, harmful, threatening, abusive, harassing,
              defamatory, obscene, or otherwise objectionable. Violations may result in content removal
              and account termination.
            </Text>
            <Text style={styles.subheading}>Termination</Text>
            <Text style={styles.body}>
              We reserve the right to suspend or terminate accounts that violate these terms at our
              sole discretion, with or without notice.
            </Text>
            <Text style={styles.subheading}>Disclaimer</Text>
            <Text style={styles.body}>
              Photo Healthy is provided "as is" without warranties of any kind. We are not responsible
              for user-generated content or any damages arising from use of the platform.
            </Text>
          </View>
        )}

        {tab === 'privacy' && (
          <View>
            <Text style={styles.heading}>Privacy Policy</Text>
            <Text style={styles.updated}>Last updated: January 2026</Text>
            <Text style={styles.body}>
              Your privacy matters to us. This policy explains how we collect, use, and protect
              your personal information.
            </Text>
            <Text style={styles.subheading}>Information We Collect</Text>
            <Text style={styles.body}>
              We collect your name, email address, and photos you voluntarily submit. We also collect
              usage data (pages visited, features used) to improve our service. We use cookies and
              similar technologies to maintain your session.
            </Text>
            <Text style={styles.subheading}>How We Use Your Data</Text>
            <Text style={styles.body}>
              Your data is used to provide the Photo Healthy service, personalize your experience,
              send important updates, and improve our platform. We do not use your data for
              advertising to third parties.
            </Text>
            <Text style={styles.subheading}>Sharing</Text>
            <Text style={styles.body}>
              We do not sell your personal data. We may share data with trusted service providers
              (hosting, payments) strictly necessary to operate the platform, under confidentiality
              agreements.
            </Text>
            <Text style={styles.subheading}>Cookies</Text>
            <Text style={styles.body}>
              We use essential cookies for authentication and session management. No third-party
              advertising cookies are used.
            </Text>
            <Text style={styles.subheading}>Your Rights</Text>
            <Text style={styles.body}>
              You may request a copy of, correction to, or deletion of your account and personal
              data at any time by contacting us through the Contact page.
            </Text>
          </View>
        )}

        {tab === 'guidelines' && (
          <View>
            <Text style={styles.heading}>Community Guidelines</Text>
            <Text style={styles.updated}>Last updated: January 2026</Text>
            <Text style={styles.body}>
              Our community thrives when everyone feels safe, respected, and inspired. Please read
              and follow these guidelines to help keep Photo Healthy a positive space.
            </Text>
            <Text style={styles.subheading}>Be Respectful</Text>
            <Text style={styles.body}>
              Treat all community members with kindness and respect. Harassment, bullying, hate
              speech, and personal attacks are not tolerated and will result in account action.
            </Text>
            <Text style={styles.subheading}>Healthy Content Only</Text>
            <Text style={styles.body}>
              Submissions must be relevant to healthy living. No spam, unrelated advertising,
              or misleading content. Keep it authentic to your wellness journey.
            </Text>
            <Text style={styles.subheading}>Original Photos</Text>
            <Text style={styles.body}>
              Only submit photos you have taken yourself or have explicit rights to use. Do not
              submit copyrighted images without permission.
            </Text>
            <Text style={styles.subheading}>No Explicit Content</Text>
            <Text style={styles.body}>
              No nudity, graphic violence, or adult content of any kind. Keep all imagery
              appropriate for a general wellness audience.
            </Text>
            <Text style={styles.subheading}>Honest Representation</Text>
            <Text style={styles.body}>
              Do not misrepresent your progress or achievements. Authenticity is at the heart of
              our community values.
            </Text>
            <Text style={styles.subheading}>Reporting</Text>
            <Text style={styles.body}>
              If you see content that violates these guidelines, please report it using the flag
              icon ðŸš© on any submission or comment. Our moderation team reviews all reports.
            </Text>
          </View>
        )}
      </View>

      <AppFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: C.BG },
  content: { paddingBottom: 0 },

  pageHeader: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  pageTitle: { color: C.TEXT, fontSize: 36, fontWeight: '900' },

  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  tabBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: borderRadius.pill,
    backgroundColor: C.CARD_BG,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  tabBtnActive: {
    backgroundColor: C.ORANGE,
    borderColor: C.ORANGE,
  },
  tabText: { color: C.TEXT_MUTED, fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: C.WHITE },

  tabContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 48,
  },
  heading: {
    color: C.TEXT,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  updated: {
    color: C.TEXT_MUTED,
    fontSize: 12,
    marginBottom: 20,
  },
  subheading: {
    color: C.TEXT,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
  body: {
    color: C.TEXT_SECONDARY,
    fontSize: 15,
    lineHeight: 24,
  },
});
