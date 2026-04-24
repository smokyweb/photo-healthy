import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { resetPassword } from '../services/api';
import Input from '../components/Input';
import GradientButton from '../components/GradientButton';
import ScreenWrapper from '../components/ScreenWrapper';
import { C, borderRadius } from '../theme';

export default function ResetPasswordScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (e: any) {
      setError(e.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your email and we'll send you a reset link.
        </Text>

        {sent ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>
              ✅ Check your email for a reset link!
            </Text>
          </View>
        ) : (
          <>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
            />
            <GradientButton
              label="Send Reset Link"
              onPress={handleReset}
              loading={loading}
              style={{ marginTop: 8 }}
            />
          </>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 16 },
  back: { marginBottom: 24 },
  backText: { color: C.ORANGE, fontSize: 15 },
  title: { color: C.TEXT, fontSize: 26, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: C.TEXT_SECONDARY, fontSize: 15, marginBottom: 24 },
  errorBox: {
    backgroundColor: C.DANGER + '22',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.DANGER + '55',
  },
  errorText: { color: C.DANGER, fontSize: 14 },
  successBox: {
    backgroundColor: C.SUCCESS + '22',
    borderRadius: borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: C.SUCCESS + '55',
  },
  successText: { color: C.SUCCESS, fontSize: 15, fontWeight: '600' },
});
