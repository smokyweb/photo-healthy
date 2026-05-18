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
import { C, borderRadius, brandGradients, fontFamilies } from '../theme';
import { Image } from 'react-native';

const PARTNER_LOGO = require('../../assets/Pose_8-removebg-preview.png');
const GET_IN_TOUCH_IMAGE = require('../../assets/get_in_touch.jpg');
const PLAN_IMAGE = require('../../assets/what-is-an-action-plan.png');
const LAUNCH_IMAGE = require('../../assets/launch.jpg');

function ProcessStep({ number, title, subtext, imagePosition, imageSource }: { number: number; title: string; subtext: string; imagePosition: 'left' | 'right'; imageSource: any }) {
  const { height } = useWindowDimensions();
  const imageHeight = height * 0.25;

  return (
    <View style={ps.container}>
      <View style={[ps.content, imagePosition === 'right' ? { flexDirection: 'row' } : { flexDirection: 'row-reverse' }]}>
        <View style={ps.textContent}>
          <View style={ps.numberRow}>
            <View style={ps.numberCircle}>
              <Text style={ps.numberText}>{number}</Text>
            </View>
            <Text style={ps.title}>{title}</Text>
          </View>
          <Text style={ps.subtext}>{subtext}</Text>
        </View>
        <Image source={imageSource} style={[ps.imagePlaceholder, { height: imageHeight }]} resizeMode="contain" />
      </View>
    </View>
  );
}

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
      {/* Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logoImageWrapper}>
          <Image source={PARTNER_LOGO} style={styles.logoImage} />
        </View>
        <Text style={styles.logoTitle}>Partners</Text>
      </View>

      {/* Partnership Process Sections */}
      <View style={styles.processSection}>
        <ProcessStep
          number={1}
          title="Get in touch"
          subtext="Reach out to our partnerships team to discuss opportunities. We'll learn about your organization and explore how we can work together to make a meaningful impact."
          imagePosition="right"
          imageSource={GET_IN_TOUCH_IMAGE}
        />
        <ProcessStep
          number={2}
          title="Create a plan"
          subtext="We'll collaborate to design a partnership that aligns with both our missions. Whether it's content, resources, or community engagement, we'll find the right fit for success."
          imagePosition="left"
          imageSource={PLAN_IMAGE}
        />
        <ProcessStep
          number={3}
          title="Launch together"
          subtext="Once everything is set, we'll launch your partnership and start supporting our community together. We'll track results and adjust as needed for optimal outcomes."
          imagePosition="right"
          imageSource={LAUNCH_IMAGE}
        />
      </View>



      {/* Contact Form */}
      <View style={styles.section}>
         {/* Hero */}
      <View>
        <Text style={styles.heroTitle}>Partner With Us</Text>
        <Text style={styles.heroSubtitle}>
          Reach thousands of health-conscious individuals actively working on their wellness goals.
        </Text>
      </View>
        <View style={styles.formContainer}>
          <Input
            placeholder="Your Name"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
          <Input
            placeholder="Company"
            value={company}
            onChangeText={setCompany}
            style={styles.input}
          />
          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            style={styles.input}
          />
          <Input
            placeholder="Tier (optional)"
            value={tier}
            onChangeText={setTier}
            style={styles.input}
          />
          <Input
            placeholder="Message"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            style={styles.input}
          />
          <GradientButton
            label={sending ? 'Sending...' : 'Submit'}
            variant="primary"
            size="md"
            onPress={handleSubmit}
            disabled={sending}
          />
        </View>
      </View>

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
                    placeholderTextColor={C.TEXT_MUTED}
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
                  placeholderTextColor={C.TEXT_MUTED}
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
  screen: {
    flex: 1,
    backgroundColor: C.BG,
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: C.ORANGE,
  },
  logoImageWrapper: {
    width: 250,
    height: 170,
    overflow: 'hidden',
    marginBottom: 12,
  },
  logoImage: {
    width: 250,
    height: 200,
    marginTop: 0,
  },
  logoTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: C.TEXT,
    fontFamily: fontFamilies.heading,
  },
  hero: {
    backgroundColor: C.BG,
    padding: 24,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.CARD_BORDER,
  },
  back: { marginBottom: 16 },
  backText: { color: C.ORANGE, fontSize: 15 },
  heroTitle: { color: C.WHITE, fontSize: 32, fontWeight: '900', marginBottom: 8, fontFamily: fontFamilies.heading },
  heroSubtitle: { color: C.TEXT_SECONDARY, fontSize: 15, lineHeight: 22, fontFamily: fontFamilies.body },
  section: { padding: 24 },
  sectionTitle: { color: C.WHITE, fontSize: 24, fontWeight: '800', marginBottom: 20, fontFamily: fontFamilies.heading },
  formContainer: {
    width: '50%',
    alignSelf: 'flex-end',
  },
  input: {
    marginBottom: 16,
    backgroundColor: C.CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  tierCard: {
    backgroundColor: C.CARD_BG,
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
  tierName: { fontSize: 16, fontWeight: '800', fontFamily: fontFamilies.heading },
  tierPrice: { fontSize: 15, fontWeight: '700', fontFamily: fontFamilies.heading },
  perk: { color: C.TEXT_SECONDARY, fontSize: 14, paddingHorizontal: 14, paddingVertical: 5, lineHeight: 20, fontFamily: fontFamilies.body },
  processSection: {
    paddingVertical: 24,
  },
});

const ps = StyleSheet.create({
  container: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  textContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  numberCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  numberText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: C.TEXT,
  },
  subtext: {
    fontSize: 16,
    color: C.TEXT_SECONDARY,
    lineHeight: 24,
  },
  imagePlaceholder: {
    flex: 1,
    borderRadius: 30,
    overflow: 'hidden',
  },
});

// ---- NEW SECTIONS STYLES ----
const n2s = StyleSheet.create({
  wrapper: { backgroundColor: C.BG },

  divider: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 32, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.CARD_BORDER },
  dividerLabel: { color: '#F55B09', fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' as any },

  // Hero
  heroSection: { padding: 32, paddingTop: 0 },
  heroLeft: {},
  heroBadge: { alignSelf: 'flex-start', borderWidth: 1, borderColor: C.CARD_BORDER, borderRadius: borderRadius.pill, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 20 },
  heroBadgeText: { color: C.TEXT_SECONDARY, fontSize: 12, fontFamily: fontFamilies.body },
  heroHeading: { color: C.TEXT, fontSize: 32, fontWeight: '900', lineHeight: 40, marginBottom: 16, fontFamily: fontFamilies.heading },
  heroDesc: { color: C.TEXT_SECONDARY, fontSize: 15, lineHeight: 24, marginBottom: 24, fontFamily: fontFamilies.body },
  heroButtons: {},
  btnPrimary: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: borderRadius.pill, backgroundImage: brandGradients.primaryCss, backgroundColor: C.ORANGE } as any,
  btnPrimaryText: { color: C.WHITE, fontWeight: '800', fontSize: 14, fontFamily: fontFamilies.heading },
  btnOutline: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: borderRadius.pill, borderWidth: 1, borderColor: C.CARD_BORDER },
  btnOutlineText: { color: C.TEXT, fontWeight: '700', fontSize: 14, fontFamily: fontFamilies.heading },
  featureCols: {},
  featureItem: { flex: 1, backgroundColor: C.CARD_BG, borderRadius: borderRadius.lg, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: C.CARD_BORDER },
  featureTitle: { color: C.TEXT, fontSize: 13, fontWeight: '700', marginBottom: 3, fontFamily: fontFamilies.heading },
  featureSub: { color: C.TEXT_SECONDARY, fontSize: 12, fontFamily: fontFamilies.body },

  // Flow card
  flowCard: { backgroundColor: C.CARD_BG, borderRadius: borderRadius.xl, padding: 24, borderWidth: 1, borderColor: C.CARD_BORDER, marginTop: 16 },
  flowPreview: { color: C.TEXT_SECONDARY, fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 8, fontFamily: fontFamilies.heading },
  flowTitle: { color: C.TEXT, fontSize: 18, fontWeight: '800', fontFamily: fontFamilies.heading },
  liveBadge: { backgroundColor: C.TEAL + '22', borderWidth: 1, borderColor: C.TEAL + '66', borderRadius: borderRadius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  liveBadgeText: { color: C.TEAL, fontSize: 11, fontWeight: '700', fontFamily: fontFamilies.heading },
  flowStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 4 },
  flowStepLeft: { alignItems: 'center', width: 32 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F55B09', backgroundImage: 'linear-gradient(135deg, #F55B09, #FFD000)' as any, justifyContent: 'center', alignItems: 'center' },
  stepNum: { color: '#fff', fontWeight: '800', fontSize: 14 },
  stepLine: { width: 2, height: 28, backgroundColor: C.ORANGE, marginTop: 2, opacity: 0.4 },
  stepText: { color: C.TEXT_SECONDARY, fontSize: 14, flex: 1, paddingTop: 6, lineHeight: 20, fontFamily: fontFamilies.body },

  // Tiers
  tiersSection: { padding: 32, paddingTop: 0 },
  sectionLabel: { color: '#F55B09', fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' as any, marginBottom: 12 },
  tiersHeading: { color: C.TEXT, fontSize: 28, fontWeight: '800', marginBottom: 10, fontFamily: fontFamilies.heading },
  tiersDesc: { color: C.TEXT_SECONDARY, fontSize: 14, lineHeight: 22, marginBottom: 24, fontFamily: fontFamilies.body },
  tiersGrid: {},
  tierCard: { backgroundColor: C.CARD_BG, borderRadius: borderRadius.xl, padding: 24, marginBottom: 14, borderWidth: 1, borderColor: C.CARD_BORDER },
  tierCardPopular: { borderColor: C.ORANGE, borderWidth: 1.5 },
  popularBadge: { alignSelf: 'flex-start', backgroundImage: brandGradients.primaryCss, backgroundColor: C.ORANGE, borderRadius: borderRadius.pill, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 12 } as any,
  popularBadgeText: { color: C.WHITE, fontSize: 10, fontWeight: '800', letterSpacing: 0, fontFamily: fontFamilies.heading },
  tierName: { color: C.TEXT, fontSize: 22, fontWeight: '800', marginBottom: 4, fontFamily: fontFamilies.heading },
  tierPrice: { color: C.TEXT_SECONDARY, fontSize: 15, marginBottom: 16, fontFamily: fontFamilies.body },
  perkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  perkDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#F55B09', marginTop: 6 },
  perkText: { color: C.TEXT_SECONDARY, fontSize: 14, flex: 1, lineHeight: 20, fontFamily: fontFamilies.body },
  tierBtnPrimary: { marginTop: 16, paddingVertical: 12, borderRadius: borderRadius.pill, backgroundImage: brandGradients.primaryCss, backgroundColor: C.ORANGE, alignItems: 'center' } as any,
  tierBtnPrimaryText: { color: C.WHITE, fontWeight: '800', fontSize: 14, fontFamily: fontFamilies.heading },
  tierBtnText: { marginTop: 16, paddingVertical: 8, alignItems: 'center' },
  tierBtnTextStyle: { color: '#fff', fontSize: 14, textDecorationLine: 'underline' as any },

  // Contact
  contactSection: { padding: 32, paddingTop: 0, paddingBottom: 40 },
  contactLeft: { marginBottom: 24 },
  contactHeading: { color: C.TEXT, fontSize: 24, fontWeight: '800', lineHeight: 32, marginBottom: 12, fontFamily: fontFamilies.heading },
  contactDesc: { color: C.TEXT_SECONDARY, fontSize: 14, lineHeight: 22, fontFamily: fontFamilies.body },
  formCard: { backgroundColor: C.CARD_BG, borderRadius: borderRadius.xl, padding: 24, borderWidth: 1, borderColor: C.CARD_BORDER },
  fieldWrap: { marginBottom: 16 },
  fieldLabel: { color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 6 },
  fieldInput: { backgroundColor: C.INPUT_BG, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: C.CARD_BORDER, color: C.TEXT, fontSize: 14, paddingHorizontal: 14, paddingVertical: 10, fontFamily: fontFamilies.body },
  fieldTextarea: { height: 110, textAlignVertical: 'top' as any, paddingTop: 10 },
  submitBtn: { marginTop: 8, paddingVertical: 14, borderRadius: borderRadius.pill, backgroundImage: brandGradients.primaryCss, backgroundColor: C.ORANGE, alignItems: 'center' } as any,
  submitBtnText: { color: C.WHITE, fontWeight: '800', fontSize: 16, fontFamily: fontFamilies.heading },
  formNote: { color: C.TEXT_SECONDARY, fontSize: 12, textAlign: 'center' as any, marginTop: 12, fontFamily: fontFamilies.body },
  successBox: { backgroundColor: C.TEAL + '1A', borderWidth: 1, borderColor: C.TEAL + '66', borderRadius: borderRadius.lg, padding: 20, alignItems: 'center' },
  successText: { color: C.TEAL, fontSize: 16, fontWeight: '700', textAlign: 'center' as any, fontFamily: fontFamilies.heading },
});
