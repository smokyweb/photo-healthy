import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GradientButton from '../components/GradientButton';
import { C, borderRadius } from '../theme';
import AppFooter from '../components/AppFooter';

const STEPS = [
  { num: '1', icon: '📝', title: 'Create an Account', body: 'Sign up for free in seconds. Just your name, email, and password.' },
  { num: '2', icon: '🏆', title: 'Browse Challenges', body: 'Explore active challenges across nutrition, fitness, mindfulness, and more.' },
  { num: '3', icon: '📷', title: 'Submit a Photo', body: 'Capture your healthy moment and submit it to the challenge with a short description.' },
  { num: '4', icon: '❤️', title: 'Get Community Support', body: 'Receive likes and comments from fellow members. Give encouragement back!' },
  { num: '5', icon: '⭐', title: 'Go Pro (Optional)', body: 'Unlock Pro features for unlimited submissions, exclusive challenges, and more.' },
];

export default function HowItWorksScreen() {
  const navigation = useNavigation<any>();

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>How It Works</Text>
        <Text style={styles.subtitle}>Getting started is easy</Text>

        {STEPS.map(step => (
          <View key={step.num} style={styles.step}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNum}>{step.num}</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepIcon}>{step.icon}</Text>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepBody}>{step.body}</Text>
            </View>
          </View>
        ))}

        <GradientButton
          label="Get Started"
          onPress={() => navigation.navigate('Register')}
          style={{ marginTop: 24 }}
        />
      </View>
          <AppFooter />
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.BG },
  container: { padding: 20 },
  back: { marginBottom: 20 },
  backText: { color: C.ORANGE, fontSize: 15 },
  title: { color: C.TEXT, fontSize: 28, fontWeight: '900', marginBottom: 6 },
  subtitle: { color: C.TEXT_SECONDARY, fontSize: 15, marginBottom: 28 },
  step: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNum: { color: C.WHITE, fontWeight: '800', fontSize: 14 },
  stepContent: { flex: 1 },
  stepIcon: { fontSize: 22, marginBottom: 4 },
  stepTitle: { color: C.TEXT, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  stepBody: { color: C.TEXT_SECONDARY, fontSize: 14, lineHeight: 20 },
});
