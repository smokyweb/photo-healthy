import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { submitPartnerInquiry } from '../services/api';
import Input from '../components/Input';
import GradientButton from '../components/GradientButton';
import AppFooter from '../components/AppFooter';
import { C, borderRadius } from '../theme';

const TIERS = [
  {
    name: 'Bronze Partner',
    price: '$500/month',
    color: '#CD7F32',
    perks: [
      'Logo in app footer',
      'Newsletter mention (once/quarter)',
      '1 sponsored challenge/year',
    ],
  },
  {
    name: 'Silver Partner',
    price: '$1,500/month',
    color: '#C0C0C0',
    perks: [
      'Featured logo on homepage',
      'Monthly newsletter feature',
      '4 sponsored challenges/year',
      'Co-branded push notifications',
    ],
  },
  {
    name: 'Gold Partner',
    price: '$3,500/month',
    color: '#FFD700',
    perks: [
      'Premium app placement',
      'Weekly newsletter exclusives',
      'Unlimited sponsored challenges',
      'Co-branded content creation',
      'Analytics & reporting dashboard',
      'Dedicated partner success manager',
    ],
  },
];

export default function PartnersScreen() {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [tier, setTier] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !company.trim()) {
      Alert.alert('Error', 'Please fill in your name, company, and email.');
      return;
    }
    setSending(true);
    try {
      await submitPartnerInquiry({ name: name.trim(), company: company.trim(), email: email.trim(), tier, message: message.trim() });
      Alert.alert('Thank You!', "We'll be in touch within 1–2 business days.");
      setName(''); setCompany(''); setEmail(''); setTier(''); setMessage('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setSending(false);
  };

  return (
    <ScrollView style={styles.screen}>
      {/* Hero */}
      <View style={styles.hero}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.heroTitle}>Partner With Us</Text>
        <Text style={styles.heroSubtitle}>
          Reach thousands of health-conscious individuals actively working on their wellness goals.
        </Text>
      </View>

      {/* Tiers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sponsorship Tiers</Text>
        {TIERS.map(t => (
          <View key={t.name} style={[styles.tierCard, { borderColor: t.color + '88' }]}>
            <View style={[styles.tierHeader, { backgroundColor: t.color + '22' }]}>
              <Text style={[styles.tierName, { color: t.color }]}>{t.name}</Text>
              <Text style={[styles.tierPrice, { color: t.color }]}>{t.price}</Text>
            </View>
            {t.perks.map(p => (
              <Text key={p} style={styles.perk}>✓ {p}</Text>
            ))}
          </View>
        ))}
      </View>

      {/* Inquiry Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Get in Touch</Text>
        <Input label="Your Name *" value={name} onChangeText={setName} autoCapitalize="words" />
        <Input label="Company *" value={company} onChangeText={setCompany} autoCapitalize="words" />
        <Input label="Email *" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <Input label="Interested Tier (optional)" value={tier} onChangeText={setTier} placeholder="e.g. Gold Partner" />
        <Input
          label="Message"
          value={message}
          onChangeText={setMessage}
          placeholder="Tell us about your company and goals..."
          multiline
          numberOfLines={4}
          autoCapitalize="sentences"
        />
        <GradientButton label="Send Inquiry" onPress={handleSubmit} loading={sending} />
      </View>

      <AppFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0D1117' },
  hero: {
    backgroundColor: '#0D1117',
    padding: 24,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  back: { marginBottom: 16 },
  backText: { color: C.ORANGE, fontSize: 15 },
  heroTitle: { color: C.WHITE, fontSize: 32, fontWeight: '900', marginBottom: 8 },
  heroSubtitle: { color: '#8B9AAB', fontSize: 15, lineHeight: 22 },
  section: { padding: 20 },
  sectionTitle: { color: C.WHITE, fontSize: 22, fontWeight: '800', marginBottom: 16 },
  tierCard: {
    backgroundColor: '#161B22',
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    marginBottom: 14,
    overflow: 'hidden',
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  tierName: { fontSize: 16, fontWeight: '800' },
  tierPrice: { fontSize: 15, fontWeight: '700' },
  perk: { color: '#8B9AAB', fontSize: 14, paddingHorizontal: 14, paddingVertical: 5, lineHeight: 20 },
});
