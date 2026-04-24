import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { C, borderRadius } from '../theme';

const FAQS = [
  { q: 'Is PhotoHealthy free to use?', a: 'Yes! Basic membership is completely free. You can browse challenges, submit photos, and engage with the community. Pro membership unlocks additional features.' },
  { q: 'How many photos can I submit?', a: 'Free members can submit up to 3 photos per challenge. Pro members enjoy unlimited submissions.' },
  { q: 'What types of photos are allowed?', a: 'Photos should relate to healthy living — meals, fitness activities, mindfulness practices, nature, and wellness routines. Please keep all content appropriate and positive.' },
  { q: 'How does the Pro subscription work?', a: 'Pro is a monthly subscription ($9/month or $79/year) that unlocks unlimited submissions, exclusive challenges, Pro-only shop items, and more. You can cancel anytime.' },
  { q: 'Can I delete my account?', a: 'Yes, you can contact us through the Contact page to request account deletion. All your data will be permanently removed.' },
  { q: 'How do challenges work?', a: 'Challenges are themed photo contests (e.g., "Healthy Breakfast", "Morning Run"). Browse active challenges, submit a photo, and engage with other participants.' },
  { q: 'How do I report inappropriate content?', a: "Tap the flag icon 🚩 on any submission or comment to report it. Our moderation team reviews all reports." },
  { q: 'What payment methods do you accept?', a: 'We accept all major credit and debit cards via Stripe. We do not store your payment information.' },
];

export default function FAQScreen() {
  const navigation = useNavigation<any>();
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>FAQ</Text>
        <Text style={styles.subtitle}>Frequently asked questions</Text>

        {FAQS.map((faq, i) => (
          <TouchableOpacity
            key={i}
            style={styles.item}
            onPress={() => setExpanded(expanded === i ? null : i)}
            activeOpacity={0.8}
          >
            <View style={styles.questionRow}>
              <Text style={styles.question}>{faq.q}</Text>
              <Text style={styles.chevron}>{expanded === i ? '▲' : '▼'}</Text>
            </View>
            {expanded === i && (
              <Text style={styles.answer}>{faq.a}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.BG },
  container: { padding: 20 },
  back: { marginBottom: 20 },
  backText: { color: C.ORANGE, fontSize: 15 },
  title: { color: C.TEXT, fontSize: 28, fontWeight: '900', marginBottom: 6 },
  subtitle: { color: C.TEXT_SECONDARY, fontSize: 15, marginBottom: 24 },
  item: {
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.lg,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  questionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  question: { flex: 1, color: C.TEXT, fontSize: 15, fontWeight: '600', lineHeight: 22 },
  chevron: { color: C.TEXT_MUTED, fontSize: 12, marginTop: 2 },
  answer: { color: C.TEXT_SECONDARY, fontSize: 14, lineHeight: 22, marginTop: 10 },
});
