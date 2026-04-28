import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { subscribe, getSubscriptionStatus, cancelSubscription } from '../services/api';
import GradientButton from '../components/GradientButton';
import LoadingSpinner from '../components/LoadingSpinner';
import { C, borderRadius } from '../theme';
import AppFooter from '../components/AppFooter';

const FEATURES = [
  '✅ Submit unlimited photos',
  '✅ Access exclusive Pro challenges',
  '✅ Shop Pro-only products',
  '✅ Priority community feed placement',
  '✅ Advanced progress analytics',
  '✅ Remove watermarks from your photos',
  '✅ Cancel anytime',
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
      .then(data => setSubscription(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleSubscribe = async () => {
    if (!user) { navigation.navigate('Login'); return; }
    setSubscribing(true);
    try {
      const data = await subscribe({ plan: 'pro' });
      if (data.url) {
        window.location.href = data.url;
      } else {
        Alert.alert('Success', 'Welcome to Pro!');
        navigation.goBack();
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Subscription failed.');
    }
    setSubscribing(false);
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel? You\'ll keep Pro access until the end of your billing period.',
      [
        { text: 'Keep Pro' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            await cancelSubscription();
            setSubscription((s: any) => ({ ...s, cancel_at_period_end: true }));
            Alert.alert('Cancelled', 'Your subscription will end at the billing period end.');
          },
        },
      ]
    );
  };

  if (loading) return <LoadingSpinner fullScreen />;

  const isPro = subscription?.is_pro || subscription?.status === 'active';

  return (
    <ScrollView style={styles.screen}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {isPro ? (
        <View style={styles.container}>
          <Text style={styles.proIcon}>⭐</Text>
          <Text style={styles.title}>You're a Pro Member!</Text>
          <Text style={styles.subtitle}>
            Your subscription is {subscription?.cancel_at_period_end ? 'cancelling at period end' : 'active'}.
          </Text>
          {subscription?.current_period_end && (
            <Text style={styles.periodText}>
              {subscription.cancel_at_period_end ? 'Access ends' : 'Next billing date'}:{' '}
              {new Date(subscription.current_period_end).toLocaleDateString()}
            </Text>
          )}
          {!subscription?.cancel_at_period_end && (
            <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel Subscription</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.container}>
          <Text style={styles.badge}>🚀 GO PRO</Text>
          <Text style={styles.title}>Unlock Everything</Text>
          <Text style={styles.subtitle}>Take your healthy journey to the next level</Text>

          {/* Pricing Card */}
          <View style={styles.pricingCard}>
            <Text style={styles.planName}>Pro Plan</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>$9</Text>
              <Text style={styles.priceUnit}>/month</Text>
            </View>
            <Text style={styles.priceAnnual}>or $79/year — save 27%</Text>

            <View style={styles.featureList}>
              {FEATURES.map(f => (
                <Text key={f} style={styles.feature}>{f}</Text>
              ))}
            </View>

            <GradientButton
              label="Get Pro Now"
              onPress={handleSubscribe}
              loading={subscribing}
              style={styles.ctaBtn}
            />
            <Text style={styles.guarantee}>30-day money-back guarantee</Text>
          </View>
        </View>
      )}

      <View style={{ height: 40 }} />
          <AppFooter />
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.BG },
  back: { padding: 16 },
  backText: { color: C.ORANGE, fontSize: 15 },
  container: { alignItems: 'center', padding: 20 },
  proIcon: { fontSize: 64, marginBottom: 12 },
  badge: {
    backgroundColor: C.ORANGE + '22',
    color: C.ORANGE,
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: borderRadius.pill,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.ORANGE,
  },
  title: { color: C.TEXT, fontSize: 28, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  subtitle: { color: C.TEXT_SECONDARY, fontSize: 15, textAlign: 'center', marginBottom: 24 },
  periodText: { color: C.TEXT_MUTED, fontSize: 14, marginBottom: 24 },
  cancelBtn: { marginTop: 24 },
  cancelText: { color: C.DANGER, fontSize: 14 },
  pricingCard: {
    width: '100%',
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.xl,
    padding: 24,
    borderWidth: 2,
    borderColor: C.ORANGE,
    alignItems: 'center',
  },
  planName: { color: C.TEXT, fontSize: 18, fontWeight: '700', marginBottom: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 4 },
  price: { color: C.ORANGE, fontSize: 52, fontWeight: '900', lineHeight: 60 },
  priceUnit: { color: C.TEXT_MUTED, fontSize: 18, marginBottom: 8 },
  priceAnnual: { color: C.TEAL, fontSize: 13, marginBottom: 20 },
  featureList: { alignSelf: 'stretch', marginBottom: 24 },
  feature: { color: C.TEXT_SECONDARY, fontSize: 14, marginBottom: 8, lineHeight: 20 },
  ctaBtn: { width: '100%', height: 52 },
  guarantee: { color: C.TEXT_MUTED, fontSize: 12, marginTop: 12 },
});
