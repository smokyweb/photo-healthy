import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import {
  getSubscriptionStatus,
  subscribe,
  cancelSubscription,
  getSubscriptionPortal,
} from '../services/api';
import GradientButton from '../components/GradientButton';
import LoadingSpinner from '../components/LoadingSpinner';
import AppFooter from '../components/AppFooter';
import { C, borderRadius } from '../theme';

const BENEFITS = [
  'Unlimited monthly challenge submissions',
  'Access to Pro-only exclusive challenges',
  'Download your original unwatermarked photos',
  'Pro badge on your profile',
  'Access to Pro-only shop items',
  'Priority support',
];

export default function SubscriptionScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getSubscriptionStatus()
      .then(d => setSubscription(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleSubscribe = async () => {
    if (!user) { navigation.navigate('Login' as never); return; }
    setSubscribing(true);
    try {
      const data = await subscribe({ plan: 'pro' });
      if (data?.url) {
        (window as any).location.href = data.url;
      } else {
        Alert.alert('Success', 'Welcome to Pro!');
        navigation.goBack();
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Subscription failed. Please try again.');
    }
    setSubscribing(false);
  };

  const handleManageBilling = async () => {
    try {
      const data = await getSubscriptionPortal();
      if (data?.url) { (window as any).location.href = data.url; }
    } catch (e: any) {
      Alert.alert('Error', 'Could not open billing portal. Please try again.');
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Subscription',
      "Are you sure you want to cancel? You'll keep Pro access until the end of your billing period.",
      [
        { text: 'Keep Pro' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelSubscription();
              setSubscription((s: any) => ({ ...s, cancel_at_period_end: true }));
              Alert.alert('Cancelled', 'Your subscription will end at the billing period end.');
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to cancel subscription.');
            }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingSpinner fullScreen />;

  const isPro = subscription?.is_pro || subscription?.status === 'active' || user?.is_pro;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Go Pro</Text>
        <Text style={styles.pageSubtitle}>
          Unlock the full Photo Healthy experience with a Pro membership
        </Text>
      </View>

      {isPro ? (
        /* ── Pro Member State ── */
        <View style={styles.centered}>
          <View style={styles.proBanner}>
            <Text style={styles.proBannerText}>✓ You're a Pro Member!</Text>
            {subscription?.cancel_at_period_end && (
              <Text style={styles.proBannerSub}>
                Your subscription is set to cancel at period end.
              </Text>
            )}
            {subscription?.current_period_end && (
              <Text style={styles.proBannerSub}>
                {subscription.cancel_at_period_end ? 'Access ends: ' : 'Next billing: '}
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </Text>
            )}
          </View>

          <View style={styles.proActionsRow}>
            <GradientButton
              label="Manage Billing"
              onPress={handleManageBilling}
              variant="teal"
              style={styles.actionBtn}
            />
            {!subscription?.cancel_at_period_end && (
              <GradientButton
                label="Cancel Subscription"
                onPress={handleCancel}
                variant="danger"
                style={styles.actionBtn}
              />
            )}
          </View>
        </View>
      ) : (
        /* ── Pricing Card ── */
        <View style={styles.centered}>
          <View style={styles.pricingCard}>
            <Text style={styles.cardTitle}>Photo Healthy Pro</Text>

            <View style={styles.priceRow}>
              <Text style={styles.priceMain}>$9.99</Text>
              <Text style={styles.priceUnit}>/month</Text>
            </View>
            <Text style={styles.cancelAnytime}>Cancel anytime</Text>

            <View style={styles.divider} />

            <View style={styles.benefitsList}>
              {BENEFITS.map(b => (
                <View key={b} style={styles.benefitRow}>
                  <Text style={styles.checkmark}>✓</Text>
                  <Text style={styles.benefitText}>{b}</Text>
                </View>
              ))}
            </View>

            <GradientButton
              label="Upgrade to Pro"
              onPress={handleSubscribe}
              loading={subscribing}
              size="lg"
              style={styles.upgradeBtn}
            />

            <TouchableOpacity onPress={handleManageBilling} style={styles.manageBillingRow}>
              <Text style={styles.manageBillingLink}>Already subscribed? Manage billing</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <AppFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.BG },
  content: { paddingBottom: 0 },

  pageHeader: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 36,
    alignItems: 'center',
  },
  pageTitle: {
    color: C.TEXT,
    fontSize: 42,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },
  pageSubtitle: {
    color: C.TEXT_SECONDARY,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 480,
  },

  centered: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    alignItems: 'center',
  },

  // Pro member state
  proBanner: {
    backgroundColor: '#022B1F',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.TEAL,
    paddingVertical: 20,
    paddingHorizontal: 28,
    marginBottom: 24,
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
  },
  proBannerText: {
    color: C.TEAL,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  proBannerSub: {
    color: C.TEXT_SECONDARY,
    fontSize: 14,
    marginTop: 2,
  },
  proActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    maxWidth: 480,
    flexWrap: 'wrap',
  },
  actionBtn: { flex: 1, minWidth: 140 },

  // Pricing card
  pricingCard: {
    backgroundColor: C.CARD_BG,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: C.ORANGE,
    padding: 32,
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
  },
  cardTitle: {
    color: C.TEXT,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
  },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 6 },
  priceMain: {
    color: C.ORANGE,
    fontSize: 60,
    fontWeight: '900',
    lineHeight: 68,
  },
  priceUnit: { color: C.TEXT_MUTED, fontSize: 20, marginBottom: 12 },
  cancelAnytime: {
    color: C.TEXT_MUTED,
    fontSize: 13,
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: C.CARD_BORDER,
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  benefitsList: { alignSelf: 'stretch', marginBottom: 28 },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  checkmark: { color: C.TEAL, fontSize: 16, fontWeight: '800', marginTop: 2 },
  benefitText: {
    color: C.TEXT_SECONDARY,
    fontSize: 15,
    flex: 1,
    lineHeight: 22,
  },
  upgradeBtn: { width: '100%' },
  manageBillingRow: { marginTop: 18 },
  manageBillingLink: {
    color: C.TEAL,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
