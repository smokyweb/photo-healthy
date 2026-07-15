import React, { useRef, useState } from 'react';
import {
  Alert,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import AppFooter from '../components/AppFooter';
import { submitPartnerInquiry } from '../services/api';
import { C, borderRadius, brandGradients, fontFamilies } from '../theme';

const HERO_IMAGE = require('../../assets/photo2-mountain-sunset.png');
const CONTACT_IMAGE = require('../../assets/photo7-ocean-sunset.png');
const MAX_WIDTH = 1120;

const PARTNER_BENEFITS = [
  {
    eyebrow: 'REACH',
    title: 'Expand your audience',
    description: 'Put your brand in front of an engaged community actively building healthier routines.',
  },
  {
    eyebrow: 'IMPACT',
    title: 'Inspire real action',
    description: 'Support challenges that turn wellness goals into visible, shareable daily progress.',
  },
  {
    eyebrow: 'VISIBILITY',
    title: 'Create memorable moments',
    description: 'Show up through co-branded challenges, rewards, partner stories, and community updates.',
  },
  {
    eyebrow: 'CONNECTION',
    title: 'Grow with purpose',
    description: 'Build lasting relationships while helping more people feel encouraged on their wellness journey.',
  },
];

const PARTNER_SLOTS = [
  ['CS', 'Challenge sponsor'],
  ['WP', 'Wellness partner'],
  ['RP', 'Rewards partner'],
  ['CP', 'Community partner'],
];

const CAMPAIGN_FEATURES = [
  {
    number: '01',
    title: 'Custom challenges',
    description: 'Shape a campaign around your goals, audience, mission, and products.',
  },
  {
    number: '02',
    title: 'Boost engagement',
    description: 'Invite members to participate, share photos, and encourage one another.',
  },
  {
    number: '03',
    title: 'Track and learn',
    description: 'Review campaign activity and community response to guide future programs.',
  },
];

const CAMPAIGN_FLOW = [
  'We design a challenge together',
  'Members participate and share photos',
  'Rewards and recognition build momentum',
  'Your brand becomes part of a positive story',
];

const TIERS = [
  {
    name: 'Bronze',
    price: '$250',
    summary: 'A simple entry point for local businesses and first-time sponsors.',
    perks: ['One sponsored challenge', 'Campaign logo placement', 'Partner mention in community updates'],
  },
  {
    name: 'Silver',
    price: '$500',
    summary: 'More visibility and engagement for brands ready to grow their reach.',
    perks: ['Up to four sponsored challenges', 'Featured partner spotlight', 'Co-branded community promotion'],
    featured: true,
  },
  {
    name: 'Gold',
    price: '$1,000',
    summary: 'A flagship partnership designed for maximum exposure and impact.',
    perks: ['Custom campaign program', 'Premium partner visibility', 'Priority planning and reporting'],
  },
];

const INTERESTS = ['Bronze', 'Silver', 'Gold', 'Custom partnership'];

function SectionMarker({ number, label, light = false }: { number: string; label: string; light?: boolean }) {
  return (
    <View style={styles.markerRow}>
      <View style={styles.markerCircle}>
        <Text style={styles.markerNumber}>{number}</Text>
      </View>
      <Text style={[styles.markerLabel, light && styles.markerLabelLight]}>{label}</Text>
    </View>
  );
}

function PrimaryButton({ label, onPress, outline = false }: { label: string; onPress: () => void; outline?: boolean }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.86}
      onPress={onPress}
      style={[styles.button, outline ? styles.buttonOutline : styles.buttonPrimary]}
    >
      <Text style={[styles.buttonText, outline && styles.buttonOutlineText]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function PartnersScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;
  const isTablet = width >= 640;
  const scrollRef = useRef<ScrollView>(null);
  const [tiersY, setTiersY] = useState(0);
  const [formY, setFormY] = useState(0);

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [interest, setInterest] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const scrollTo = (y: number) => scrollRef.current?.scrollTo({ y: Math.max(0, y - 24), animated: true });

  const chooseTier = (tierName: string) => {
    setInterest(tierName);
    scrollTo(formY);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !company.trim() || !email.trim()) {
      Alert.alert('Required fields', 'Please enter your name, company, and email address.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      Alert.alert('Check your email', 'Please enter a valid email address.');
      return;
    }

    setSending(true);
    try {
      await submitPartnerInquiry({
        name: name.trim(),
        company: company.trim(),
        email: email.trim(),
        phone: phone.trim(),
        partnership_type: interest || 'other',
        message: message.trim(),
      });
      setSubmitted(true);
      setName('');
      setCompany('');
      setEmail('');
      setPhone('');
      setInterest('');
      setMessage('');
    } catch (error: any) {
      Alert.alert('Unable to send inquiry', error?.message || 'Please try again in a moment.');
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView ref={scrollRef} style={styles.screen} contentContainerStyle={styles.content}>
      <ImageBackground source={HERO_IMAGE} resizeMode="cover" style={styles.heroImage} imageStyle={styles.heroImageAsset}>
        <View style={styles.heroOverlay} />
        <View style={[styles.sectionInner, styles.heroInner, isDesktop && styles.heroInnerDesktop]}>
          <View style={[styles.heroCopy, isDesktop && styles.heroCopyDesktop]}>
            <SectionMarker number="1" label="PARTNERS" light />
            <Text style={[styles.heroTitle, !isDesktop && styles.heroTitleMobile]}>Partner with purpose.</Text>
            <Text style={styles.heroSubtitle}>
              Create wellness challenges that engage your audience, support healthier lives, and place your brand inside moments that matter.
            </Text>
            <View style={styles.heroActions}>
              <PrimaryButton label="Become a partner" onPress={() => scrollTo(formY)} />
              <PrimaryButton label="View sponsorship levels" onPress={() => scrollTo(tiersY)} outline />
            </View>

            <View style={styles.benefitList}>
              {PARTNER_BENEFITS.map((benefit) => (
                <View key={benefit.title} style={styles.benefitRow}>
                  <View style={styles.benefitDot} />
                  <View style={styles.benefitCopy}>
                    <Text style={styles.benefitTitle}>{benefit.title}</Text>
                    <Text style={styles.benefitDescription}>{benefit.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.showcaseCard, isDesktop && styles.showcaseCardDesktop]}>
            <Text style={styles.showcaseEyebrow}>SPONSOR SHOWCASE</Text>
            <Text style={styles.showcaseTitle}>Your brand can lead the next healthy challenge.</Text>
            <Text style={styles.showcaseDescription}>
              Partner logos, featured offers, and sponsored challenge stories will be highlighted here.
            </Text>
            <View style={[styles.sponsorGrid, isTablet && styles.sponsorGridWide]}>
              {PARTNER_SLOTS.map(([initials, label]) => (
                <View key={label} style={[styles.sponsorSlot, isTablet && styles.sponsorSlotWide]}>
                  <View style={styles.sponsorMark}>
                    <Text style={styles.sponsorInitials}>{initials}</Text>
                  </View>
                  <Text style={styles.sponsorLabel}>{label}</Text>
                  <Text style={styles.sponsorPlaceholder}>Your brand here</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.growSection}>
        <View style={styles.sectionInner}>
          <View style={styles.centeredHeading}>
            <SectionMarker number="2" label="CREATE & GROW TOGETHER" />
            <Text style={styles.lightSectionTitle}>Create challenges. Inspire change.</Text>
            <Text style={styles.lightSectionSubtitle}>
              We make it easy to build a meaningful partnership that promotes your brand and supports healthier lives.
            </Text>
          </View>

          <View style={[styles.growLayout, isDesktop && styles.growLayoutDesktop]}>
            <View style={[styles.featureColumn, isDesktop && styles.featureColumnDesktop]}>
              <View style={[styles.featureGrid, isTablet && styles.featureGridWide]}>
                {CAMPAIGN_FEATURES.map((feature) => (
                  <View key={feature.title} style={[styles.featureCard, isTablet && styles.featureCardWide]}>
                    <Text style={styles.featureNumber}>{feature.number}</Text>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.impactStrip}>
                {['Stronger community', 'Healthier habits', 'Greater impact'].map((item, index) => (
                  <View key={item} style={[styles.impactItem, index > 0 && styles.impactItemBorder]}>
                    <View style={[styles.impactDot, index === 1 && styles.impactDotTeal, index === 2 && styles.impactDotOrange]} />
                    <Text style={styles.impactText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.flowCard, isDesktop && styles.flowCardDesktop]}>
              <Text style={styles.flowEyebrow}>HOW IT WORKS</Text>
              <Text style={styles.flowTitle}>From idea to community impact</Text>
              {CAMPAIGN_FLOW.map((step, index) => (
                <View key={step} style={styles.flowStep}>
                  <View style={styles.flowStepRail}>
                    <View style={styles.flowStepCircle}>
                      <Text style={styles.flowStepNumber}>{index + 1}</Text>
                    </View>
                    {index < CAMPAIGN_FLOW.length - 1 && <View style={styles.flowLine} />}
                  </View>
                  <Text style={styles.flowStepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      <View
        style={styles.tiersSection}
        onLayout={(event) => setTiersY(event.nativeEvent.layout.y)}
      >
        <View style={styles.sectionInner}>
          <View style={styles.centeredHeading}>
            <SectionMarker number="3" label="SPONSORSHIP LEVELS" light />
            <Text style={styles.darkSectionTitle}>Choose a partnership that fits your goals.</Text>
            <Text style={styles.darkSectionSubtitle}>
              Start with visibility, grow into co-branded campaigns, or create a custom flagship program.
            </Text>
          </View>

          <View style={[styles.tierGrid, isDesktop && styles.tierGridDesktop]}>
            {TIERS.map((tier) => (
              <View
                key={tier.name}
                style={[
                  styles.tierCard,
                  isDesktop && styles.tierCardDesktop,
                  tier.featured && styles.tierCardFeatured,
                ]}
              >
                {tier.featured && (
                  <View style={styles.featuredBadge}>
                    <Text style={styles.featuredBadgeText}>MOST POPULAR</Text>
                  </View>
                )}
                <Text style={styles.tierName}>{tier.name}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.tierPrice}>{tier.price}</Text>
                  <Text style={styles.tierPeriod}> / month</Text>
                </View>
                <Text style={styles.tierSummary}>{tier.summary}</Text>
                <View style={styles.tierDivider} />
                {tier.perks.map((perk) => (
                  <View key={perk} style={styles.perkRow}>
                    <Text style={styles.perkCheck}>✓</Text>
                    <Text style={styles.perkText}>{perk}</Text>
                  </View>
                ))}
                <PrimaryButton label={`Choose ${tier.name}`} onPress={() => chooseTier(tier.name)} outline={!tier.featured} />
              </View>
            ))}
          </View>
          <Text style={styles.pricingNote}>Sponsorship pricing and included benefits are subject to final confirmation.</Text>
        </View>
      </View>

      <View
        style={styles.contactAnchor}
        onLayout={(event) => setFormY(event.nativeEvent.layout.y)}
      >
        <ImageBackground source={CONTACT_IMAGE} resizeMode="cover" style={styles.contactImage} imageStyle={styles.contactImageAsset}>
          <View style={styles.contactOverlay} />
          <View style={styles.sectionInner}>
            <View style={styles.centeredHeading}>
              <SectionMarker number="4" label="GET STARTED" light />
              <Text style={styles.contactTitle}>Ready to start your partnership journey?</Text>
              <Text style={styles.contactSubtitle}>Tell us a little about your organization and the impact you want to create.</Text>
            </View>

            <View style={[styles.formCard, isDesktop && styles.formCardDesktop]}>
              {submitted ? (
                <View style={styles.successCard}>
                  <View style={styles.successIcon}>
                    <Text style={styles.successIconText}>✓</Text>
                  </View>
                  <Text style={styles.successTitle}>Thank you for reaching out.</Text>
                  <Text style={styles.successText}>Our partnerships team will follow up within 1–2 business days.</Text>
                  <TouchableOpacity onPress={() => setSubmitted(false)} style={styles.sendAnotherButton}>
                    <Text style={styles.sendAnotherText}>Send another inquiry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={[styles.formGrid, isDesktop && styles.formGridDesktop]}>
                    <View style={[styles.formColumn, isDesktop && styles.formColumnDesktop]}>
                      <FormField label="Your name *" value={name} onChangeText={setName} placeholder="Enter your full name" />
                      <FormField label="Company name *" value={company} onChangeText={setCompany} placeholder="Enter your organization" />
                      <FormField label="Email address *" value={email} onChangeText={setEmail} placeholder="you@company.com" keyboardType="email-address" />
                      <FormField label="Phone number" value={phone} onChangeText={setPhone} placeholder="Optional" keyboardType="phone-pad" />
                    </View>

                    <View style={[styles.formColumn, isDesktop && styles.formColumnDesktop]}>
                      <Text style={styles.fieldLabel}>Partnership interest</Text>
                      <View style={styles.interestGrid}>
                        {INTERESTS.map((item) => (
                          <TouchableOpacity
                            key={item}
                            onPress={() => setInterest(item)}
                            style={[styles.interestChip, interest === item && styles.interestChipSelected]}
                          >
                            <Text style={[styles.interestChipText, interest === item && styles.interestChipTextSelected]}>{item}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <Text style={styles.fieldLabel}>How would you like to partner?</Text>
                      <TextInput
                        value={message}
                        onChangeText={setMessage}
                        placeholder="Tell us about your audience, goals, challenge idea, product, or reward offering."
                        placeholderTextColor="#8A93A4"
                        multiline
                        numberOfLines={7}
                        style={[styles.fieldInput, styles.messageInput]}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    accessibilityRole="button"
                    activeOpacity={0.86}
                    disabled={sending}
                    onPress={handleSubmit}
                    style={[styles.submitButton, sending && styles.submitButtonDisabled]}
                  >
                    <Text style={styles.submitButtonText}>{sending ? 'Sending inquiry...' : 'Submit partnership inquiry'}</Text>
                  </TouchableOpacity>
                  <Text style={styles.privacyNote}>Your information will only be used to respond to your partnership inquiry.</Text>
                </>
              )}
            </View>
          </View>
        </ImageBackground>
      </View>

      <AppFooter />
    </ScrollView>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: any;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8A93A4"
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
        style={styles.fieldInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.BG },
  content: { paddingBottom: 0 },
  sectionInner: {
    width: '100%' as any,
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 24,
  },

  heroImage: { minHeight: 760, justifyContent: 'center' },
  heroImageAsset: { opacity: 0.78 },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 10, 22, 0.78)',
    ...(Platform.OS === 'web'
      ? { backgroundImage: 'linear-gradient(90deg, rgba(8,11,25,0.98) 0%, rgba(8,11,25,0.86) 48%, rgba(8,11,25,0.48) 100%)' }
      : {}),
  },
  heroInner: { paddingVertical: 70, gap: 40 },
  heroInnerDesktop: { flexDirection: 'row', alignItems: 'center', gap: 54 },
  heroCopy: { width: '100%' as any },
  heroCopyDesktop: { flex: 1.04 },
  markerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  markerCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.ORANGE,
    ...(Platform.OS === 'web' ? { backgroundImage: brandGradients.primaryCss135 } : {}),
  } as any,
  markerNumber: { color: C.WHITE, fontWeight: '900', fontSize: 13, fontFamily: fontFamilies.heading },
  markerLabel: { color: '#087C5F', fontSize: 12, fontWeight: '900', letterSpacing: 1.2, fontFamily: fontFamilies.heading },
  markerLabelLight: { color: C.ORANGE_END },
  heroTitle: { color: C.WHITE, fontSize: 52, lineHeight: 58, fontWeight: '900', marginBottom: 18, fontFamily: fontFamilies.heading },
  heroTitleMobile: { fontSize: 40, lineHeight: 46 },
  heroSubtitle: { color: '#E6EAF0', fontSize: 18, lineHeight: 29, maxWidth: 650, fontFamily: fontFamilies.body },
  heroActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 28, marginBottom: 34 },
  button: { minHeight: 48, paddingHorizontal: 22, borderRadius: borderRadius.pill, alignItems: 'center', justifyContent: 'center' },
  buttonPrimary: { backgroundColor: C.ORANGE, ...(Platform.OS === 'web' ? { backgroundImage: brandGradients.primaryCss } : {}) } as any,
  buttonOutline: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.42)' },
  buttonText: { color: C.WHITE, fontSize: 14, fontWeight: '900', fontFamily: fontFamilies.heading },
  buttonOutlineText: { color: C.WHITE },
  benefitList: { gap: 17 },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  benefitDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: C.TEAL, marginTop: 7, shadowColor: C.TEAL, shadowOpacity: 0.5, shadowRadius: 8 },
  benefitCopy: { flex: 1 },
  benefitTitle: { color: C.WHITE, fontSize: 16, fontWeight: '800', marginBottom: 3, fontFamily: fontFamilies.heading },
  benefitDescription: { color: '#BFC7D4', fontSize: 14, lineHeight: 21, fontFamily: fontFamilies.body },
  showcaseCard: {
    width: '100%' as any,
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(11, 17, 34, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(84,223,182,0.48)',
    shadowColor: '#000000',
    shadowOpacity: 0.32,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
  },
  showcaseCardDesktop: { flex: 0.96 },
  showcaseEyebrow: { color: C.TEAL, fontSize: 11, fontWeight: '900', letterSpacing: 1.8, marginBottom: 10, fontFamily: fontFamilies.heading },
  showcaseTitle: { color: C.WHITE, fontSize: 24, lineHeight: 31, fontWeight: '900', marginBottom: 10, fontFamily: fontFamilies.heading },
  showcaseDescription: { color: '#BFC7D4', fontSize: 14, lineHeight: 22, marginBottom: 20, fontFamily: fontFamilies.body },
  sponsorGrid: { gap: 10 },
  sponsorGridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  sponsorSlot: { backgroundColor: '#F8FAFC', borderRadius: 14, padding: 16, minHeight: 128 },
  sponsorSlotWide: { width: '48.5%' as any },
  sponsorMark: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#E8EDF5', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  sponsorInitials: { color: '#1D2838', fontSize: 13, fontWeight: '900', fontFamily: fontFamilies.heading },
  sponsorLabel: { color: '#1B2535', fontSize: 14, fontWeight: '800', marginBottom: 3, fontFamily: fontFamilies.heading },
  sponsorPlaceholder: { color: '#737D8D', fontSize: 12, fontFamily: fontFamilies.body },

  growSection: { backgroundColor: '#F4F7FB', paddingVertical: 82 },
  centeredHeading: { alignItems: 'center', maxWidth: 760, alignSelf: 'center', marginBottom: 40 },
  lightSectionTitle: { color: '#101827', fontSize: 38, lineHeight: 46, fontWeight: '900', textAlign: 'center', marginBottom: 12, fontFamily: fontFamilies.heading },
  lightSectionSubtitle: { color: '#566173', fontSize: 16, lineHeight: 25, textAlign: 'center', fontFamily: fontFamilies.body },
  growLayout: { gap: 20 },
  growLayoutDesktop: { flexDirection: 'row', alignItems: 'stretch', gap: 22 },
  featureColumn: { width: '100%' as any },
  featureColumnDesktop: { flex: 1.75 },
  featureGrid: { gap: 14 },
  featureGridWide: { flexDirection: 'row' },
  featureCard: { backgroundColor: C.WHITE, borderRadius: 16, padding: 22, borderWidth: 1, borderColor: '#DDE3EB', shadowColor: '#1A2A3A', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
  featureCardWide: { flex: 1 },
  featureNumber: { color: C.ORANGE, fontSize: 13, fontWeight: '900', letterSpacing: 1, marginBottom: 20, fontFamily: fontFamilies.heading },
  featureTitle: { color: '#142036', fontSize: 18, fontWeight: '900', marginBottom: 10, fontFamily: fontFamilies.heading },
  featureDescription: { color: '#5A6678', fontSize: 14, lineHeight: 22, fontFamily: fontFamilies.body },
  impactStrip: { flexDirection: 'row', backgroundColor: C.WHITE, borderRadius: 16, borderWidth: 1, borderColor: '#DDE3EB', marginTop: 14, paddingVertical: 20 },
  impactItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 10 },
  impactItemBorder: { borderLeftWidth: 1, borderLeftColor: '#DDE3EB' },
  impactDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2C74C9' },
  impactDotTeal: { backgroundColor: '#17A779' },
  impactDotOrange: { backgroundColor: C.ORANGE },
  impactText: { color: '#263247', fontSize: 12, fontWeight: '800', textAlign: 'center', fontFamily: fontFamilies.heading },
  flowCard: { width: '100%' as any, backgroundColor: '#111A2B', borderRadius: 18, padding: 26, shadowColor: '#0A1020', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  flowCardDesktop: { flex: 0.85 },
  flowEyebrow: { color: C.ORANGE_END, fontSize: 11, fontWeight: '900', letterSpacing: 1.6, marginBottom: 9, fontFamily: fontFamilies.heading },
  flowTitle: { color: C.WHITE, fontSize: 22, lineHeight: 29, fontWeight: '900', marginBottom: 24, fontFamily: fontFamilies.heading },
  flowStep: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 58 },
  flowStepRail: { width: 34, alignItems: 'center', marginRight: 13 },
  flowStepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.ORANGE, alignItems: 'center', justifyContent: 'center' },
  flowStepNumber: { color: C.WHITE, fontWeight: '900', fontSize: 13, fontFamily: fontFamilies.heading },
  flowLine: { width: 2, height: 28, backgroundColor: 'rgba(245,91,9,0.35)', marginTop: 3 },
  flowStepText: { flex: 1, color: '#D4DAE3', fontSize: 14, lineHeight: 21, paddingTop: 6, fontFamily: fontFamilies.body },

  tiersSection: { backgroundColor: '#171B2A', paddingVertical: 82 },
  darkSectionTitle: { color: C.WHITE, fontSize: 38, lineHeight: 46, fontWeight: '900', textAlign: 'center', marginBottom: 12, fontFamily: fontFamilies.heading },
  darkSectionSubtitle: { color: C.TEXT_SECONDARY, fontSize: 16, lineHeight: 25, textAlign: 'center', fontFamily: fontFamilies.body },
  tierGrid: { gap: 18 },
  tierGridDesktop: { flexDirection: 'row', alignItems: 'stretch' },
  tierCard: { backgroundColor: C.CARD_BG2, borderRadius: 20, borderWidth: 1, borderColor: C.CARD_BORDER, padding: 26, overflow: 'hidden' },
  tierCardDesktop: { flex: 1 },
  tierCardFeatured: { borderColor: C.ORANGE, borderWidth: 1.5, backgroundColor: '#252A3C' },
  featuredBadge: { alignSelf: 'flex-start', backgroundColor: C.ORANGE, borderRadius: borderRadius.pill, paddingHorizontal: 11, paddingVertical: 5, marginBottom: 17, ...(Platform.OS === 'web' ? { backgroundImage: brandGradients.primaryCss } : {}) } as any,
  featuredBadgeText: { color: C.WHITE, fontSize: 10, fontWeight: '900', letterSpacing: 0.8, fontFamily: fontFamilies.heading },
  tierName: { color: C.WHITE, fontSize: 23, fontWeight: '900', marginBottom: 10, fontFamily: fontFamilies.heading },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 13 },
  tierPrice: { color: C.ORANGE_END, fontSize: 38, lineHeight: 42, fontWeight: '900', fontFamily: fontFamilies.heading },
  tierPeriod: { color: C.TEXT_SECONDARY, fontSize: 13, paddingBottom: 5, fontFamily: fontFamilies.body },
  tierSummary: { color: C.TEXT_SECONDARY, fontSize: 14, lineHeight: 22, minHeight: 66, fontFamily: fontFamilies.body },
  tierDivider: { height: 1, backgroundColor: C.CARD_BORDER, marginVertical: 19 },
  perkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  perkCheck: { color: C.TEAL, fontSize: 15, fontWeight: '900' },
  perkText: { color: '#E4E8EF', fontSize: 14, lineHeight: 21, flex: 1, fontFamily: fontFamilies.body },
  pricingNote: { color: C.TEXT_MUTED, fontSize: 12, textAlign: 'center', marginTop: 20, fontFamily: fontFamilies.body },

  contactAnchor: { backgroundColor: '#121629' },
  contactImage: { paddingVertical: 82 },
  contactImageAsset: { opacity: 0.35 },
  contactOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(12, 10, 40, 0.76)' },
  contactTitle: { color: C.WHITE, fontSize: 38, lineHeight: 46, fontWeight: '900', textAlign: 'center', marginBottom: 10, fontFamily: fontFamilies.heading },
  contactSubtitle: { color: '#D7DCE5', fontSize: 16, lineHeight: 25, textAlign: 'center', fontFamily: fontFamilies.body },
  formCard: { backgroundColor: 'rgba(20,25,42,0.96)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', padding: 22, maxWidth: 920, width: '100%' as any, alignSelf: 'center' },
  formCardDesktop: { padding: 30 },
  formGrid: { gap: 20 },
  formGridDesktop: { flexDirection: 'row', gap: 22 },
  formColumn: { width: '100%' as any },
  formColumnDesktop: { flex: 1 },
  fieldWrap: { marginBottom: 15 },
  fieldLabel: { color: '#F1F4F8', fontSize: 12, fontWeight: '800', marginBottom: 7, fontFamily: fontFamilies.heading },
  fieldInput: { backgroundColor: C.WHITE, borderRadius: 10, borderWidth: 1, borderColor: '#D9DEE7', color: '#172034', fontSize: 14, minHeight: 49, paddingHorizontal: 14, paddingVertical: 12, fontFamily: fontFamilies.body },
  messageInput: { minHeight: 148, textAlignVertical: 'top' as any },
  interestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  interestChip: { borderRadius: borderRadius.pill, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 13, paddingVertical: 9, backgroundColor: 'rgba(255,255,255,0.04)' },
  interestChipSelected: { borderColor: C.ORANGE, backgroundColor: 'rgba(245,91,9,0.16)' },
  interestChipText: { color: '#CFD5DF', fontSize: 12, fontWeight: '700', fontFamily: fontFamilies.body },
  interestChipTextSelected: { color: C.ORANGE_END },
  submitButton: { alignSelf: 'center', minWidth: 280, minHeight: 52, borderRadius: borderRadius.pill, alignItems: 'center', justifyContent: 'center', marginTop: 20, paddingHorizontal: 28, backgroundColor: C.ORANGE, ...(Platform.OS === 'web' ? { backgroundImage: brandGradients.primaryCss } : {}) } as any,
  submitButtonDisabled: { opacity: 0.62 },
  submitButtonText: { color: C.WHITE, fontSize: 15, fontWeight: '900', fontFamily: fontFamilies.heading },
  privacyNote: { color: '#AEB6C4', fontSize: 11, textAlign: 'center', marginTop: 13, fontFamily: fontFamilies.body },
  successCard: { alignItems: 'center', paddingVertical: 42, paddingHorizontal: 20 },
  successIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(84,223,182,0.16)', borderWidth: 1, borderColor: C.TEAL, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successIconText: { color: C.TEAL, fontSize: 28, fontWeight: '900' },
  successTitle: { color: C.WHITE, fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 8, fontFamily: fontFamilies.heading },
  successText: { color: C.TEXT_SECONDARY, fontSize: 15, lineHeight: 23, textAlign: 'center', fontFamily: fontFamilies.body },
  sendAnotherButton: { marginTop: 22, paddingHorizontal: 18, paddingVertical: 11, borderRadius: borderRadius.pill, borderWidth: 1, borderColor: C.TEAL },
  sendAnotherText: { color: C.TEAL, fontSize: 13, fontWeight: '800', fontFamily: fontFamilies.heading },
});
