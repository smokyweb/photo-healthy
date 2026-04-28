import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AppFooter from '../components/AppFooter';
import { C, borderRadius } from '../theme';

const FAQS = [
  {
    q: 'Is Photo Healthy free to use?',
    a: 'Yes! Creating an account and participating in challenges is completely free with a generous monthly usage included. Pro membership unlocks additional features like unlimited submissions and exclusive challenges.',
  },
  {
    q: 'How many photos can I submit?',
    a: 'Free members can submit a generous number of photos per challenge each month. Pro members enjoy unlimited submissions with no restrictions.',
  },
  {
    q: 'What types of photos are allowed?',
    a: 'Photos should relate to healthy living — meals, fitness activities, mindfulness practices, nature, and wellness routines. Please keep all content appropriate and positive.',
  },
  {
    q: 'How does the Pro subscription work?',
    a: 'Pro is a monthly subscription ($9.99/month) that unlocks unlimited submissions, exclusive Pro-only challenges, Pro-only shop items, and more. You can cancel anytime.',
  },
  {
    q: 'Can I delete my account?',
    a: 'Yes, you can contact us through the Contact page to request account deletion. All your data will be permanently removed within 30 days.',
  },
  {
    q: 'How do challenges work?',
    a: "Challenges are themed photo contests (e.g., \"Healthy Breakfast\", \"Morning Run\"). Browse active challenges, submit a photo, and engage with other participants. Challenges have start and end dates.",
  },
  {
    q: 'How do I report inappropriate content?',
    a: "Tap the flag icon 🚩 on any submission or comment to report it. Our moderation team reviews all reports promptly.",
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit and debit cards via Stripe. We do not store your payment information — all transactions are handled securely by Stripe.',
  },
];

export default function FAQScreen() {
  const navigation = useNavigation<any>();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return FAQS;
    const q = searchQuery.toLowerCase();
    return FAQS.filter(f =>
      f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>FAQ</Text>
        <Text style={styles.pageSubtitle}>Frequently asked questions</Text>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search questions..."
            placeholderTextColor={C.TEXT_MUTED}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* FAQ Items */}
      <View style={styles.faqList}>
        {filteredFaqs.length === 0 ? (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>No results for "{searchQuery}"</Text>
          </View>
        ) : (
          filteredFaqs.map((faq, i) => {
            const originalIdx = FAQS.indexOf(faq);
            const isOpen = expanded === originalIdx;
            return (
              <TouchableOpacity
                key={originalIdx}
                style={styles.item}
                onPress={() => setExpanded(isOpen ? null : originalIdx)}
                activeOpacity={0.8}
              >
                <View style={styles.questionRow}>
                  <Text style={styles.question}>{faq.q}</Text>
                  <Text style={styles.chevron}>{isOpen ? '▲' : '▼'}</Text>
                </View>
                {isOpen && (
                  <Text style={styles.answer}>{faq.a}</Text>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* Contact link */}
      <View style={styles.contactRow}>
        <Text style={styles.contactText}>Still have questions? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Contact' as never)}>
          <Text style={styles.contactLink}>Contact us →</Text>
        </TouchableOpacity>
      </View>

      <AppFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.BG },
  content: { paddingBottom: 0 },

  pageHeader: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 8,
  },
  pageTitle: { color: C.TEXT, fontSize: 36, fontWeight: '900', marginBottom: 6 },
  pageSubtitle: { color: C.TEXT_SECONDARY, fontSize: 16, marginBottom: 20 },

  searchWrapper: { marginBottom: 8 },
  searchInput: {
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    color: C.TEXT,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  faqList: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 },
  item: {
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  questionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  question: {
    flex: 1,
    color: C.TEXT,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  chevron: { color: C.TEXT_MUTED, fontSize: 12, marginTop: 4 },
  answer: {
    color: C.TEXT_SECONDARY,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
  },

  noResults: { alignItems: 'center', paddingVertical: 32 },
  noResultsText: { color: C.TEXT_MUTED, fontSize: 15 },

  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
  },
  contactText: { color: C.TEXT_SECONDARY, fontSize: 15 },
  contactLink: { color: C.ORANGE, fontSize: 15, fontWeight: '700' },
});
