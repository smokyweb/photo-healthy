import React, { useEffect, useRef, useState } from 'react';
import {
  Image, Modal, Platform, ScrollView, StyleSheet, Text,
  TouchableOpacity, useWindowDimensions, View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { C, borderRadius } from '../theme';

const HELP_FIGURE = require('../../assets/Pose_2-removebg-preview.png');

type HelpStep = { title: string; body: string };
type HelpContent = { eyebrow: string; title: string; intro: string; steps: HelpStep[] };

const HOME_HELP: HelpContent = {
  eyebrow: 'YOUR 30-SECOND WELCOME',
  title: 'Welcome to Photo Healthy',
  intro: 'You are three simple steps away from turning everyday movement and photography into a healthier, more connected routine.',
  steps: [
    { title: 'Choose your challenge', body: 'Pick a feeling and category, then open a challenge that fits where you are today.' },
    { title: 'Move, notice, and submit', body: 'Complete the activity, capture one or two meaningful photos, and share your reflection.' },
    { title: 'Encourage and grow', body: 'Open community submissions, leave positive comments, and build supportive connections.' },
  ],
};

const HELP_CONTENT: Record<string, HelpContent> = {
  home: HOME_HELP,
  challenges: {
    eyebrow: 'CHALLENGES HELP', title: 'Find your next challenge',
    intro: 'Use the filters to find a challenge that supports how you want to feel and grow.',
    steps: [
      { title: 'Pick your feeling', body: 'Open the Feeling search and choose the emotional experience you want to support.' },
      { title: 'Choose a category', body: 'Use a category pill to narrow the challenge list further.' },
      { title: 'Open and join', body: 'Select a challenge to review the activity, timing, and submission instructions.' },
    ],
  },
  community: {
    eyebrow: 'COMMUNITY HELP', title: 'Connect through encouragement',
    intro: 'The gallery stays focused on photos while each submission holds its complete conversation.',
    steps: [
      { title: 'Explore', body: 'Sort the gallery by recent, popular, or top-rated submissions.' },
      { title: 'Open a photo', body: 'Select a submission to see every photo, reflection, like, and comment.' },
      { title: 'Support someone', body: 'Leave a positive, respectful comment that celebrates progress and builds connection.' },
    ],
  },
  profile: {
    eyebrow: 'PROFILE HELP', title: 'Manage your Photo Healthy journey',
    intro: 'Your profile brings your account, challenge activity, submissions, and progress together.',
    steps: [
      { title: 'Review your activity', body: 'See completed challenges, submitted photos, and wellness progress.' },
      { title: 'Update your profile', body: 'Edit your name, photo, bio, and other account details.' },
      { title: 'Open a submission', body: 'Select any photo to view, replace, reorder, or remove it.' },
    ],
  },
  challenge_detail: {
    eyebrow: 'CHALLENGE HELP', title: 'Understand and complete this challenge',
    intro: 'Everything required for the challenge is collected on this page.',
    steps: [
      { title: 'Read the activity', body: 'Review the description, category, feeling, movement, and timing.' },
      { title: 'Join the challenge', body: 'Commit when you are ready so your personal challenge window can begin.' },
      { title: 'Submit your photos', body: 'Use Submit Photos after completing the activity and reflection.' },
    ],
  },
  submit_photo: {
    eyebrow: 'PHOTO SUBMISSION HELP', title: 'Share your challenge moment',
    intro: 'You can submit up to two photos with a title, reflection, and optional mileage.',
    steps: [
      { title: 'Add and review', body: 'Choose one or two photos. Remove a selection before submitting if it is not right.' },
      { title: 'Describe the moment', body: 'Add a title and reflection about the activity and how it felt.' },
      { title: 'Submit', body: 'Confirm the community guidelines, then upload your completed entry.' },
    ],
  },
  submission: {
    eyebrow: 'SUBMISSION HELP', title: 'View and manage a submission',
    intro: 'A submission contains every photo and the full community conversation.',
    steps: [
      { title: 'Browse all photos', body: 'Use the thumbnails to switch between every photo in the submission.' },
      { title: 'Join the conversation', body: 'Like the submission or read and add encouraging comments.' },
      { title: 'Manage your own photos', body: 'Owners can replace, remove, reorder the Home photo, or delete the submission.' },
    ],
  },
  shop: {
    eyebrow: 'SHOP HELP', title: 'Find and purchase an item',
    intro: 'Use the shop tools to narrow products, review details, and safely reach checkout.',
    steps: [
      { title: 'Filter or search', body: 'Choose a category or price range, or search by product name.' },
      { title: 'Review and add', body: 'Open an item for details, choose any required option, then add it to your cart.' },
      { title: 'Check out', body: 'Review quantities in Cart and continue to secure checkout.' },
    ],
  },
  cart: {
    eyebrow: 'CART HELP', title: 'Review your order',
    intro: 'Make final changes here before continuing to secure checkout.',
    steps: [
      { title: 'Review items', body: 'Confirm products, sizes, quantities, and prices.' },
      { title: 'Resolve access', body: 'If a Pro-only item is blocked, upgrade or remove that item.' },
      { title: 'Proceed to checkout', body: 'Continue when the order is correct, or return to Shop to add more.' },
    ],
  },
  subscription: {
    eyebrow: 'MEMBERSHIP HELP', title: 'Choose your access level',
    intro: 'Compare available membership benefits before changing your plan.',
    steps: [
      { title: 'Review benefits', body: 'See which challenges, submissions, and products are included.' },
      { title: 'Choose a plan', body: 'Select the membership option that fits your goals.' },
      { title: 'Confirm securely', body: 'Complete payment and return to the page where you started.' },
    ],
  },
  gallery: {
    eyebrow: 'MY PHOTOS HELP', title: 'Review your submitted photos',
    intro: 'This page collects your challenge submissions in one place.',
    steps: [
      { title: 'Browse', body: 'Review your submitted challenge moments and progress.' },
      { title: 'Open', body: 'Select a submission to see every included photo and comment.' },
      { title: 'Manage', body: 'Replace, remove, or reorder photos from the submission detail page.' },
    ],
  },
  progress: {
    eyebrow: 'PROGRESS HELP', title: 'Understand your progress',
    intro: 'Use your activity summary to see how consistency builds over time.',
    steps: [
      { title: 'Check totals', body: 'Review submitted photos, challenges, streaks, and tracked miles.' },
      { title: 'Open your work', body: 'Select a challenge or photo for its complete details.' },
      { title: 'Keep moving', body: 'Return to Challenges to choose the next activity.' },
    ],
  },
  orders: {
    eyebrow: 'ORDER HELP', title: 'Track your order',
    intro: 'Order history shows payment, processing, shipping, and tracking updates.',
    steps: [
      { title: 'Find an order', body: 'Open the order you want to review.' },
      { title: 'Check its status', body: 'See whether it is paid, processing, fulfilled, or refunded.' },
      { title: 'Use tracking', body: 'Open the tracking information when a shipment number is available.' },
    ],
  },
  notifications: {
    eyebrow: 'NOTIFICATIONS HELP', title: 'Stay up to date',
    intro: 'Notifications highlight community activity, challenge updates, and order changes.',
    steps: [
      { title: 'Review new activity', body: 'Unread notifications appear first.' },
      { title: 'Open the update', body: 'Select a notification to go to the related photo, challenge, or order.' },
      { title: 'Clear the queue', body: 'Mark items read after reviewing them.' },
    ],
  },
  edit_profile: {
    eyebrow: 'PROFILE HELP', title: 'Update your profile',
    intro: 'Keep your public identity and account details current.',
    steps: [
      { title: 'Edit details', body: 'Update the profile information you want members to see.' },
      { title: 'Review your photo', body: 'Choose a clear profile image that represents you.' },
      { title: 'Save changes', body: 'Confirm your updates before leaving the page.' },
    ],
  },
  partners: {
    eyebrow: 'PARTNERS HELP', title: 'Connect as a Photo Healthy partner',
    intro: 'Review the partnership options and tell the team how you would like to participate.',
    steps: [
      { title: 'Explore opportunities', body: 'Review the available partnership types and benefits.' },
      { title: 'Choose your interests', body: 'Select the options that best match your organization or community.' },
      { title: 'Send your inquiry', body: 'Add your contact details and submit the partnership form.' },
    ],
  },
  contact: {
    eyebrow: 'CONTACT HELP', title: 'Send Photo Healthy a message',
    intro: 'Use the contact form for questions, feedback, account help, or partnership support.',
    steps: [
      { title: 'Add your details', body: 'Enter the name and email address where you can be reached.' },
      { title: 'Explain your question', body: 'Choose the closest topic and include the information needed to help.' },
      { title: 'Submit', body: 'Send the message and watch for a response from the Photo Healthy team.' },
    ],
  },
};

const helpListeners = new Map<string, Set<() => void>>();

export function openPageHelp(context = 'home') {
  helpListeners.get(context)?.forEach(listener => listener());
}

export default function ContextualHelp({ context = 'home' }: { context?: string }) {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const isMobile = width < 640;
  const [open, setOpen] = useState(false);
  const autoChecked = useRef(false);
  const content = HELP_CONTENT[context] || HOME_HELP;
  const homeSeenKey = user?.id ? `ph_home_help_seen_${user.id}_v1` : '';

  useEffect(() => {
    const openHelp = () => setOpen(true);
    const listeners = helpListeners.get(context) || new Set<() => void>();
    listeners.add(openHelp);
    helpListeners.set(context, listeners);
    return () => {
      listeners.delete(openHelp);
      if (listeners.size === 0) helpListeners.delete(context);
    };
  }, [context]);

  useEffect(() => {
    if (!user || context !== 'home' || autoChecked.current) return;
    autoChecked.current = true;
    const hasSeen = homeSeenKey && Platform.OS === 'web' && typeof localStorage !== 'undefined'
      ? localStorage.getItem(homeSeenKey) === '1'
      : false;
    if (!hasSeen) setOpen(true);
  }, [context, homeSeenKey, user?.id]);

  if (!user) return null;

  const close = () => {
    setOpen(false);
    if (context === 'home' && homeSeenKey && Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem(homeSeenKey, '1');
    }
  };

  const openFullGuide = () => {
    close();
    navigation.navigate('HowItWorks' as never);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.helpTab, isMobile && styles.helpTabMobile]}
        onPress={() => setOpen(true)}
        activeOpacity={0.88}
        accessibilityLabel={`Help for ${content.title}`}
      >
        <Text style={styles.helpTabQuestion}>?</Text>
        <Text style={styles.helpTabText}>Help</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.overlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={close} accessibilityLabel="Close help" />
          <View style={[styles.panel, isMobile && styles.panelMobile]}>
            <ScrollView contentContainerStyle={[styles.panelContent, isMobile && styles.panelContentMobile]} showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={styles.closeButton} onPress={close} accessibilityLabel="Close help">
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>

              <View style={[styles.introRow, isMobile && styles.introRowMobile]}>
                <View style={styles.figureWrap}>
                  <Image source={HELP_FIGURE} style={styles.figure} resizeMode="contain" />
                </View>
                <View style={styles.introCopy}>
                  <Text style={styles.eyebrow}>{content.eyebrow}</Text>
                  <Text style={[styles.title, isMobile && styles.titleMobile]}>{content.title}</Text>
                  <Text style={styles.intro}>{content.intro}</Text>
                </View>
              </View>

              <Text style={styles.jumpstartLabel}>YOUR 1–2–3 JUMPSTART</Text>
              <View style={[styles.steps, isMobile && styles.stepsMobile]}>
                {content.steps.map((step, index) => (
                  <View key={step.title} style={styles.stepCard}>
                    <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{index + 1}</Text></View>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepBody}>{step.body}</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.actions, isMobile && styles.actionsMobile]}>
                <TouchableOpacity style={styles.primaryButton} onPress={close} activeOpacity={0.86}>
                  <Text style={styles.primaryButtonText}>{context === 'home' ? 'Start exploring' : 'Got it'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={openFullGuide} activeOpacity={0.82}>
                  <Text style={styles.secondaryButtonText}>Full How It Works</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  helpTab: {
    position: Platform.OS === 'web' ? 'fixed' as any : 'absolute',
    right: 18,
    bottom: 22,
    zIndex: 9000,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: borderRadius.pill,
    paddingHorizontal: 13,
    paddingVertical: 9,
    backgroundColor: C.ORANGE,
    borderWidth: 1,
    borderColor: '#FFD000',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 12,
  },
  helpTabMobile: { bottom: 78, right: 12, paddingHorizontal: 11, paddingVertical: 8 },
  helpTabQuestion: { color: '#FFFFFF', fontSize: 16, lineHeight: 18, fontWeight: '900' },
  helpTabText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5,8,16,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  panel: {
    width: '100%',
    maxWidth: 820,
    maxHeight: '92%' as any,
    borderRadius: borderRadius.xl,
    backgroundColor: C.CARD_BG2,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
    elevation: 24,
  },
  panelMobile: { maxHeight: '94%' as any },
  panelContent: { padding: 26, paddingTop: 30 },
  panelContentMobile: { padding: 18, paddingTop: 48 },
  closeButton: {
    position: 'absolute',
    right: 14,
    top: 12,
    zIndex: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    backgroundColor: C.CARD_BG,
  },
  closeText: { color: C.TEXT, fontSize: 25, lineHeight: 28, fontWeight: '500' },
  introRow: { flexDirection: 'row', alignItems: 'center', gap: 22, marginBottom: 22, paddingRight: 34 },
  introRowMobile: { flexDirection: 'column', paddingRight: 0, gap: 8, textAlign: 'center' as any },
  figureWrap: {
    width: 150,
    height: 135,
    borderRadius: borderRadius.xl,
    backgroundColor: C.TEAL + '0E',
    borderWidth: 1,
    borderColor: C.TEAL + '44',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  figure: { width: 134, height: 124 },
  introCopy: { flex: 1 },
  eyebrow: { color: C.ORANGE, fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginBottom: 5 },
  title: { color: C.TEXT, fontSize: 28, lineHeight: 35, fontWeight: '900', fontFamily: "'Lexend', sans-serif", marginBottom: 7 },
  titleMobile: { fontSize: 24, lineHeight: 30 },
  intro: { color: C.TEXT_SECONDARY, fontSize: 15, lineHeight: 22 },
  jumpstartLabel: { color: C.TEAL, fontSize: 10, fontWeight: '900', letterSpacing: 1.1, marginBottom: 9 },
  steps: { flexDirection: 'row', gap: 10 },
  stepsMobile: { flexDirection: 'column' },
  stepCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    backgroundColor: C.CARD_BG,
    padding: 14,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.ORANGE,
    marginBottom: 9,
  },
  stepNumberText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  stepTitle: { color: C.TEXT, fontSize: 14, fontWeight: '900', marginBottom: 5 },
  stepBody: { color: C.TEXT_SECONDARY, fontSize: 12, lineHeight: 18 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
  actionsMobile: { flexDirection: 'column' },
  primaryButton: {
    borderRadius: borderRadius.pill,
    backgroundColor: C.ORANGE,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  secondaryButton: {
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: C.TEAL + '88',
    backgroundColor: C.TEAL + '10',
    paddingHorizontal: 18,
    paddingVertical: 11,
    alignItems: 'center',
  },
  secondaryButtonText: { color: C.TEAL, fontSize: 13, fontWeight: '900' },
});
