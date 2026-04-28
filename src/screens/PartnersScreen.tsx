import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  TextInput, useWindowDimensions,
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
          <Text style={styles.backText}>â† Back</Text>
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



      {/* ── NEW LAYOUT FROM PDF ── */}
      <NewPartnerSections />

      <AppFooter />
    </ScrollView>
  );
}

function NewPartnerSections() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [n2name, setN2name] = useState('');
  const [n2company, setN2company] = useState('');
  const [n2email, setN2email] = useState('');
  const [n2budget, setN2budget] = useState('');
  const [n2goals, setN2goals] = useState('');
  const [n2sending, setN2sending] = useState(false);
  const [n2sent, setN2sent] = useState(false);

  const handleN2Submit = async () => {
    if (!n2name.trim() || !n2email.trim() || !n2company.trim()) {
      Alert.alert('Required', 'Please fill in name, company, and email.');
      return;
    }
    setN2sending(true);
    try {
      await submitPartnerInquiry({
        name: n2name.trim(), company: n2company.trim(),
        email: n2email.trim(), tier: n2budget.trim(),
        message: n2goals.trim(),
      });
      setN2sent(true);
    } catch (e: any) { Alert.alert('Error', e.message); }
    setN2sending(false);
  };

  const FLOW_STEPS = [
    'Sponsored challenge launches',
    'Users move + capture photos',
    'Community shares progress',
    'Partner gains high-visibility brand moments',
  ];

  const NEW_TIERS = [
    {
      name: 'Bronze',
      price: '$500–$2,500',
      popular: false,
      perks: [
        'Featured challenge placement',
        'Logo visibility inside campaign section',
        'Partner mention in community updates',
        'Ideal for local businesses and early sponsors',
      ],
    },
    {
      name: 'Silver',
      price: '$2,500–$10,000',
      popular: true,
      perks: [
        'Co-branded campaign',
        'Challenge naming rights',
        'Dedicated partner spotlight section',
        'Higher visibility across partner materials',
      ],
    },
    {
      name: 'Gold',
      price: '$10,000+',
      popular: false,
      perks: [
        'Exclusive flagship campaign',
        'Premium homepage visibility',
        'Custom branded challenge experience',
        'Priority strategic planning session',
      ],
    },
  ];

  return (
    <View style={n2s.wrapper}>
      {/* Divider */}
      <View style={n2s.divider}>
        <View style={n2s.dividerLine} />
        <Text style={n2s.dividerLabel}>NEW PARTNERSHIP PROGRAMS</Text>
        <View style={n2s.dividerLine} />
      </View>

      {/* ── HERO SECTION ── */}
      <View style={[n2s.heroSection, isDesktop && { flexDirection: 'row', gap: 40 }]}>
        {/* Left: Text */}
        <View style={[n2s.heroLeft, isDesktop && { flex: 55 }]}>
          <View style={n2s.heroBadge}>
            <Text style={n2s.heroBadgeText}>Partnership Opportunities for PhotoHealthy</Text>
          </View>
          <Text style={n2s.heroHeading}>Build a movement your brand can be proud to stand beside.</Text>
          <Text style={n2s.heroDesc}>
            PhotoHealthy turns movement into meaning through challenges, photos, rewards, and a positive wellness community. Partner with us to reach engaged users through campaigns that inspire action.
          </Text>
          <View style={[n2s.heroButtons, { flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginBottom: 24 }]}>
            <TouchableOpacity style={n2s.btnPrimary}>
              <Text style={n2s.btnPrimaryText}>Become a Partner</Text>
            </TouchableOpacity>
            <TouchableOpacity style={n2s.btnOutline}>
              <Text style={n2s.btnOutlineText}>View Sponsorship Tiers</Text>
            </TouchableOpacity>
          </View>
          <View style={[n2s.featureCols, isDesktop && { flexDirection: 'row', gap: 10 }]}>
            {[['Wellness + Photos', 'Unique category blend'], ['Global PWA Model', 'Mobile-first reach'], ['Community Campaigns', 'Brand storytelling at scale']].map(([title, sub]) => (
              <View key={title} style={n2s.featureItem}>
                <Text style={n2s.featureTitle}>{title}</Text>
                <Text style={n2s.featureSub}>{sub}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Right: Campaign Flow Card */}
        <View style={[n2s.flowCard, isDesktop && { flex: 45 }]}>
          <Text style={n2s.flowPreview}>PREVIEW</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Text style={n2s.flowTitle}>Partner Campaign Flow</Text>
            <View style={n2s.liveBadge}><Text style={n2s.liveBadgeText}>Live PWA</Text></View>
          </View>
          {FLOW_STEPS.map((step, i) => (
            <View key={i} style={n2s.flowStep}>
              <View style={n2s.flowStepLeft}>
                <View style={n2s.stepCircle}><Text style={n2s.stepNum}>{i + 1}</Text></View>
                {i < FLOW_STEPS.length - 1 && <View style={n2s.stepLine} />}
              </View>
              <Text style={n2s.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── SPONSORSHIP TIERS ── */}
      <View style={n2s.tiersSection}>
        <Text style={n2s.sectionLabel}>SPONSORSHIP TIERS</Text>
        <Text style={n2s.tiersHeading}>Flexible packages built to convert partners into long-term allies.</Text>
        <Text style={n2s.tiersDesc}>Start with visibility, grow into co-branded campaigns, and scale into exclusive flagship partnerships.</Text>
        <View style={[n2s.tiersGrid, isDesktop && { flexDirection: 'row', gap: 16 }]}>
          {NEW_TIERS.map(tier => (
            <View key={tier.name} style={[n2s.tierCard, isDesktop && { flex: 1 }, tier.popular && n2s.tierCardPopular]}>
              {tier.popular && (
                <View style={n2s.popularBadge}><Text style={n2s.popularBadgeText}>MOST POPULAR</Text></View>
              )}
              <Text style={n2s.tierName}>{tier.name}</Text>
              <Text style={n2s.tierPrice}>{tier.price}</Text>
              {tier.perks.map(p => (
                <View key={p} style={n2s.perkRow}>
                  <View style={n2s.perkDot} />
                  <Text style={n2s.perkText}>{p}</Text>
                </View>
              ))}
              <TouchableOpacity style={tier.popular ? n2s.tierBtnPrimary : n2s.tierBtnText}>
                <Text style={tier.popular ? n2s.tierBtnPrimaryText : n2s.tierBtnTextStyle}>Request Partnership Details</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      {/* ── CONTACT FORM ── */}
      <View style={[n2s.contactSection, isDesktop && { flexDirection: 'row', gap: 40 }]}>
        {/* Left */}
        <View style={[n2s.contactLeft, isDesktop && { flex: 40 }]}>
          <Text style={n2s.sectionLabel}>BECOME A PARTNER</Text>
          <Text style={n2s.contactHeading}>Let's design a campaign that gets people moving and gives your brand meaningful visibility.</Text>
          <Text style={n2s.contactDesc}>Tell us about your brand, goals, and ideal sponsorship level. We'll follow up with campaign ideas, pricing, and next steps.</Text>
        </View>
        {/* Right: Form */}
        <View style={[n2s.formCard, isDesktop && { flex: 60 }]}>
          {n2sent ? (
            <View style={n2s.successBox}>
              <Text style={n2s.successText}>✓ Thank you! We'll be in touch within 1–2 business days.</Text>
            </View>
          ) : (
            <>
              {[['Name', n2name, setN2name, 'Enter name', false], ['Company', n2company, setN2company, 'Enter company', false], ['Email', n2email, setN2email, 'Enter email', false], ['Budget Range', n2budget, setN2budget, 'Enter budget range', false]].map(([label, val, setter, ph]: any) => (
                <View key={label} style={n2s.fieldWrap}>
                  <Text style={n2s.fieldLabel}>{label}</Text>
                  <TextInput
                    style={n2s.fieldInput}
                    value={val}
                    onChangeText={setter}
                    placeholder={ph}
                    placeholderTextColor="#8B949E"
                  />
                </View>
              ))}
              <View style={n2s.fieldWrap}>
                <Text style={n2s.fieldLabel}>Campaign Goals</Text>
                <TextInput
                  style={[n2s.fieldInput, n2s.fieldTextarea]}
                  value={n2goals}
                  onChangeText={setN2goals}
                  placeholder="Tell us what kind of audience, experience, or campaign you want to create."
                  placeholderTextColor="#8B949E"
                  multiline
                  numberOfLines={5}
                />
              </View>
              <TouchableOpacity
                style={n2s.submitBtn}
                onPress={handleN2Submit}
                disabled={n2sending}
                activeOpacity={0.85}
              >
                <Text style={n2s.submitBtnText}>{n2sending ? 'Sending…' : 'Request Partnership Call'}</Text>
              </TouchableOpacity>
              <Text style={n2s.formNote}>We typically follow up within 1–2 business days with campaign ideas and pricing.</Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#0D1117' },
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

// ---- NEW SECTIONS STYLES ----
const n2s = StyleSheet.create({
  wrapper: { backgroundColor: '#0D1117' },

  divider: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 32, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerLabel: { color: '#F55B09', fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' as any },

  // Hero
  heroSection: { padding: 32, paddingTop: 0 },
  heroLeft: {},
  heroBadge: { alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: borderRadius.pill, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 20 },
  heroBadgeText: { color: '#8B949E', fontSize: 12 },
  heroHeading: { color: '#fff', fontSize: 32, fontWeight: '900', lineHeight: 40, marginBottom: 16, fontFamily: "'Lexend', sans-serif" },
  heroDesc: { color: '#8B949E', fontSize: 15, lineHeight: 24, marginBottom: 24 },
  heroButtons: {},
  btnPrimary: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: borderRadius.pill, backgroundImage: 'linear-gradient(90deg, #F55B09, #2DD4BF)' as any, backgroundColor: '#F55B09' },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnOutline: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: borderRadius.pill, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  btnOutlineText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  featureCols: {},
  featureItem: { flex: 1, backgroundColor: '#161B22', borderRadius: borderRadius.lg, padding: 14, marginBottom: 8 },
  featureTitle: { color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 3 },
  featureSub: { color: '#8B949E', fontSize: 12 },

  // Flow card
  flowCard: { backgroundColor: '#161B22', borderRadius: borderRadius.xl, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginTop: 16 },
  flowPreview: { color: '#8B949E', fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  flowTitle: { color: '#fff', fontSize: 18, fontWeight: '800', fontFamily: "'Lexend', sans-serif" },
  liveBadge: { backgroundColor: 'rgba(45,212,191,0.15)', borderWidth: 1, borderColor: '#2DD4BF', borderRadius: borderRadius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  liveBadgeText: { color: '#2DD4BF', fontSize: 11, fontWeight: '700' },
  flowStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 4 },
  flowStepLeft: { alignItems: 'center', width: 32 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F55B09', backgroundImage: 'linear-gradient(135deg, #F55B09, #FFD000)' as any, justifyContent: 'center', alignItems: 'center' },
  stepNum: { color: '#fff', fontWeight: '800', fontSize: 14 },
  stepLine: { width: 2, height: 28, backgroundColor: '#F55B09', marginTop: 2, opacity: 0.4 },
  stepText: { color: '#cbd5e1', fontSize: 14, flex: 1, paddingTop: 6, lineHeight: 20 },

  // Tiers
  tiersSection: { padding: 32, paddingTop: 0 },
  sectionLabel: { color: '#F55B09', fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' as any, marginBottom: 12 },
  tiersHeading: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 10, fontFamily: "'Lexend', sans-serif" },
  tiersDesc: { color: '#8B949E', fontSize: 14, lineHeight: 22, marginBottom: 24 },
  tiersGrid: {},
  tierCard: { backgroundColor: '#161B22', borderRadius: borderRadius.xl, padding: 24, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  tierCardPopular: { borderColor: '#F55B09', borderWidth: 1.5 },
  popularBadge: { alignSelf: 'flex-start', backgroundImage: 'linear-gradient(90deg,#F55B09,#FFD000)' as any, backgroundColor: '#F55B09', borderRadius: borderRadius.pill, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 12 },
  popularBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  tierName: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 4, fontFamily: "'Lexend', sans-serif" },
  tierPrice: { color: '#8B949E', fontSize: 15, marginBottom: 16 },
  perkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  perkDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#F55B09', marginTop: 6 },
  perkText: { color: '#cbd5e1', fontSize: 14, flex: 1, lineHeight: 20 },
  tierBtnPrimary: { marginTop: 16, paddingVertical: 12, borderRadius: borderRadius.pill, backgroundImage: 'linear-gradient(90deg,#F55B09,#2DD4BF)' as any, backgroundColor: '#F55B09', alignItems: 'center' },
  tierBtnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  tierBtnText: { marginTop: 16, paddingVertical: 8, alignItems: 'center' },
  tierBtnTextStyle: { color: '#fff', fontSize: 14, textDecorationLine: 'underline' as any },

  // Contact
  contactSection: { padding: 32, paddingTop: 0, paddingBottom: 40 },
  contactLeft: { marginBottom: 24 },
  contactHeading: { color: '#fff', fontSize: 24, fontWeight: '800', lineHeight: 32, marginBottom: 12, fontFamily: "'Lexend', sans-serif" },
  contactDesc: { color: '#8B949E', fontSize: 14, lineHeight: 22 },
  formCard: { backgroundColor: '#161B22', borderRadius: borderRadius.xl, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  fieldWrap: { marginBottom: 16 },
  fieldLabel: { color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 6 },
  fieldInput: { backgroundColor: '#1C2128', borderRadius: borderRadius.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, paddingHorizontal: 14, paddingVertical: 10 },
  fieldTextarea: { height: 110, textAlignVertical: 'top' as any, paddingTop: 10 },
  submitBtn: { marginTop: 8, paddingVertical: 14, borderRadius: borderRadius.pill, backgroundImage: 'linear-gradient(90deg,#F55B09,#2DD4BF)' as any, backgroundColor: '#F55B09', alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  formNote: { color: '#8B949E', fontSize: 12, textAlign: 'center' as any, marginTop: 12 },
  successBox: { backgroundColor: 'rgba(45,212,191,0.1)', borderWidth: 1, borderColor: '#2DD4BF', borderRadius: borderRadius.lg, padding: 20, alignItems: 'center' },
  successText: { color: '#2DD4BF', fontSize: 16, fontWeight: '700', textAlign: 'center' as any },
});
