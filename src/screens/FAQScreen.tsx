import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme';

const FAQS = [
  { q: 'What is Photo Healthy?', a: 'Photo Healthy is a community-driven platform where photographers participate in creative challenges, share their work, and connect with others who are passionate about photography and wellness.' },
  { q: 'How do I participate in a challenge?', a: 'Simply browse our active challenges, create a free account, and submit your photo! Each challenge has a theme and deadline. You can submit one photo per challenge.' },
  { q: 'Is it free to join?', a: 'Yes! Creating an account and participating in challenges is completely free. We also offer a Pro subscription with additional features like priority placement and early access to new challenges.' },
  { q: 'What kind of photos can I submit?', a: 'Photos should relate to the challenge theme. We accept JPG and PNG files up to 10MB. All submissions should be your own original work and follow our community guidelines.' },
  { q: 'Can I view challenges without an account?', a: 'Absolutely! You can browse all challenges and view photo submissions without logging in. You only need an account to submit photos and leave comments.' },
  { q: 'How are winners selected?', a: 'Challenge winners are selected based on community engagement, creativity, and adherence to the theme. Our team reviews all submissions to ensure fair competition.' },
  { q: 'How do I contact support?', a: 'You can reach our support team at support@photohealthy.com. We typically respond within 24 hours on business days.' },
  { q: 'Can I delete my account?', a: 'Yes, you can request account deletion by contacting our support team. Please note that this action is permanent and all your submissions will be removed.' },
];

const FAQItem = ({ faq }: { faq: { q: string; a: string } }) => {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity style={styles.faqCard} onPress={() => setOpen(!open)} activeOpacity={0.7}>
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{faq.q}</Text>
        <Text style={styles.faqToggle}>{open ? '−' : '+'}</Text>
      </View>
      {open && <Text style={styles.faqAnswer}>{faq.a}</Text>}
    </TouchableOpacity>
  );
};

const FAQScreen = () => (
  <ScrollView style={styles.container}>
    <View style={styles.hero}>
      <Text style={styles.heroTitle}>Frequently Asked Questions</Text>
      <Text style={styles.heroSub}>Everything you need to know about Photo Healthy</Text>
    </View>
    <View style={styles.content}>
      {FAQS.map((faq, i) => <FAQItem key={i} faq={faq} />)}
    </View>
  </ScrollView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  hero: { backgroundColor: colors.primary, paddingVertical: 60, paddingHorizontal: 24, alignItems: 'center' },
  heroTitle: { color: '#FFFFFF', fontSize: 36, fontWeight: '700', textAlign: 'center' },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 18, marginTop: 12, textAlign: 'center' },
  content: { maxWidth: 700, width: '100%', alignSelf: 'center', padding: 24 },
  faqCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { fontSize: 16, fontWeight: '600', color: '#1F2937', flex: 1, marginRight: 12 },
  faqToggle: { fontSize: 24, color: colors.primary, fontWeight: '700', width: 28, textAlign: 'center' },
  faqAnswer: { fontSize: 15, color: '#6B7280', lineHeight: 24, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
});

export default FAQScreen;
