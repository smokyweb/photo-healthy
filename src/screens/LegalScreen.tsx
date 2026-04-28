import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AppFooter from '../components/AppFooter';
import { C, borderRadius } from '../theme';
import { LEGAL_CONTENT } from '../content/legal';

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
            <Text style={styles.heading}>{LEGAL_CONTENT.terms.title}</Text>
            <Text style={styles.updated}>Last updated: {LEGAL_CONTENT.terms.lastUpdated}</Text>
            {LEGAL_CONTENT.terms.sections.map((s, i) => (
              <View key={i}>
                <Text style={styles.subheading}>{s.heading}</Text>
                <Text style={styles.body}>{s.body}</Text>
              </View>
            ))}
          </View>
        )}

        {tab === 'privacy' && (
          <View>
            <Text style={styles.heading}>{LEGAL_CONTENT.privacy.title}</Text>
            <Text style={styles.updated}>Last updated: {LEGAL_CONTENT.privacy.lastUpdated}</Text>
            {LEGAL_CONTENT.privacy.sections.map((s, i) => (
              <View key={i}>
                <Text style={styles.subheading}>{s.heading}</Text>
                <Text style={styles.body}>{s.body}</Text>
              </View>
            ))}
          </View>
        )}

        {tab === 'guidelines' && (
          <View>
            <Text style={styles.heading}>{LEGAL_CONTENT.guidelines.title}</Text>
            <Text style={styles.updated}>Last updated: {LEGAL_CONTENT.guidelines.lastUpdated}</Text>
            {LEGAL_CONTENT.guidelines.sections.map((s, i) => (
              <View key={i}>
                <Text style={styles.subheading}>{s.heading}</Text>
                <Text style={styles.body}>{s.body}</Text>
              </View>
            ))}
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
