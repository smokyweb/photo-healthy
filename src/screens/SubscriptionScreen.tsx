import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius, shadows } from '../theme';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/month',
    features: ['Join photo challenges', 'Submit up to 2 photos per challenge', 'Comment on submissions', 'View gallery'],
    color: colors.gray[600],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9.99',
    period: '/month',
    features: ['Everything in Free', 'Unlimited challenge entries', 'Priority photo review', 'Exclusive pro challenges', 'Ad-free experience', 'Early access to new features'],
    color: colors.primary,
    popular: true,
  },
];

const SubscriptionScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(user?.subscription_status === 'active' ? 'pro' : 'free');
  const currentPlan = user?.subscription_status === 'active' ? 'pro' : 'free';

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free') return;
    alert('Stripe integration coming soon! Pro features will be available shortly.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.inner}>
        <Text style={styles.heading}>Choose Your Plan</Text>
        <Text style={styles.subheading}>Upgrade to unlock premium features</Text>

        {plans.map(plan => (
          <TouchableOpacity
            key={plan.id}
            style={[styles.planCard, selectedPlan === plan.id && styles.planCardSelected, plan.popular && styles.planCardPopular]}
            onPress={() => setSelectedPlan(plan.id)}
          >
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>Most Popular</Text>
              </View>
            )}
            <View style={styles.planHeader}>
              <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
              <View style={styles.priceRow}>
                <Text style={[styles.planPrice, { color: plan.color }]}>{plan.price}</Text>
                <Text style={styles.planPeriod}>{plan.period}</Text>
              </View>
            </View>
            {plan.features.map((feature, i) => (
              <View key={i} style={styles.featureRow}>
                <Text style={styles.checkmark}>✓</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
            {currentPlan === plan.id ? (
              <View style={styles.currentBadge}>
                <Text style={styles.currentText}>Current Plan</Text>
              </View>
            ) : plan.id !== 'free' ? (
              <TouchableOpacity style={[styles.selectBtn, { backgroundColor: plan.color }]} onPress={() => handleSubscribe(plan.id)}>
                <Text style={styles.selectBtnText}>Upgrade to {plan.name}</Text>
              </TouchableOpacity>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primaryBg },
  content: { padding: spacing.lg },
  inner: { maxWidth: 500, width: '100%', alignSelf: 'center' },
  heading: { fontSize: 24, fontWeight: '700', color: colors.black, textAlign: 'center' },
  subheading: { fontSize: 15, color: colors.gray[500], textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.xl },
  planCard: {
    backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg,
    marginBottom: spacing.lg, borderWidth: 2, borderColor: colors.gray[200], ...shadows.sm,
  },
  planCardSelected: { borderColor: colors.primary },
  planCardPopular: { borderColor: colors.primary },
  popularBadge: { backgroundColor: colors.primary, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: borderRadius.full, marginBottom: spacing.sm },
  popularText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  planHeader: { marginBottom: spacing.md },
  planName: { fontSize: 20, fontWeight: '700' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.xs },
  planPrice: { fontSize: 32, fontWeight: '800' },
  planPeriod: { fontSize: 14, color: colors.gray[500], marginLeft: 4 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  checkmark: { color: colors.success, fontSize: 16, fontWeight: '700', marginRight: spacing.sm },
  featureText: { fontSize: 14, color: colors.gray[600] },
  currentBadge: {
    backgroundColor: colors.gray[100], borderRadius: borderRadius.md,
    padding: spacing.sm, alignItems: 'center', marginTop: spacing.md,
  },
  currentText: { color: colors.gray[600], fontWeight: '600' },
  selectBtn: { borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.md },
  selectBtnText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});

export default SubscriptionScreen;
