import React, { useEffect, useState } from 'react';
import { Linking, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { completeResetPassword, resetPassword, validateResetPasswordToken } from '../services/api';
import Input from '../components/Input';
import GradientButton from '../components/GradientButton';
import ScreenWrapper from '../components/ScreenWrapper';
import AppFooter from '../components/AppFooter';
import { C, borderRadius } from '../theme';

export default function ResetPasswordScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const routeToken = route.params?.token;
  const urlToken = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('token')
    : null;
  const [ignoreToken, setIgnoreToken] = useState(false);
  const token = ignoreToken ? '' : String(routeToken || urlToken || '').trim();

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(!!token);
  const [tokenValid, setTokenValid] = useState(!token);
  const [resetUser, setResetUser] = useState<any>(null);
  const [sent, setSent] = useState(false);
  const [changed, setChanged] = useState(false);
  const [error, setError] = useState('');
  const [resetUrl, setResetUrl] = useState('');

  useEffect(() => {
    let active = true;
    if (!token) {
      setValidating(false);
      setTokenValid(true);
      setResetUser(null);
      return;
    }

    setValidating(true);
    setError('');
    validateResetPasswordToken(token)
      .then((data: any) => {
        if (!active) return;
        setTokenValid(true);
        setResetUser(data);
      })
      .catch((e: any) => {
        if (!active) return;
        setTokenValid(false);
        setError(e.message || 'This reset link is invalid or expired.');
      })
      .finally(() => {
        if (active) setValidating(false);
      });

    return () => { active = false; };
  }, [token]);

  const handleReset = async () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setError('');
    setResetUrl('');
    setLoading(true);
    try {
      const result: any = await resetPassword(email.trim());
      if (result?.reset_url) setResetUrl(result.reset_url);
      setSent(true);
    } catch (e: any) {
      setError(e.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await completeResetPassword(token, newPassword);
      setChanged(true);
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setError(e.message || 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (navigation.canGoBack?.()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('Login');
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <TouchableOpacity onPress={goBack} style={styles.back}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{token ? 'Create New Password' : 'Reset Password'}</Text>
        <Text style={styles.subtitle}>
          {token
            ? resetUser?.email
              ? `Enter a new password for ${resetUser.email}.`
              : 'Enter your new password.'
            : "Enter your email and we'll send you a reset link."}
        </Text>

        {validating ? (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Checking reset link...</Text>
          </View>
        ) : changed ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>Password updated. You can sign in now.</Text>
            <GradientButton
              label="Go to Sign In"
              onPress={() => navigation.navigate('Login')}
              style={{ marginTop: 14 }}
            />
          </View>
        ) : sent ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>
              {resetUrl ? 'Email delivery is not configured locally. Use this reset link to continue testing.' : 'Check your email for a reset link.'}
            </Text>
            {resetUrl ? (
              <TouchableOpacity
                style={styles.devLinkBox}
                onPress={() => Linking.openURL(resetUrl)}
                activeOpacity={0.82}
              >
                <Text style={styles.devLinkText}>{resetUrl}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : token && !tokenValid ? (
          <>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            <GradientButton
              label="Request a New Link"
              onPress={() => {
                setIgnoreToken(true);
                setError('');
                if (typeof window !== 'undefined') {
                  window.history.replaceState(null, '', '/reset-password');
                }
              }}
              style={{ marginTop: 8 }}
            />
          </>
        ) : token ? (
          <>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            <Input
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              secureTextEntry
            />
            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              secureTextEntry
            />
            <GradientButton
              label="Update Password"
              onPress={handleSetNewPassword}
              loading={loading}
              style={{ marginTop: 8 }}
            />
          </>
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
      <AppFooter />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 16, flex: 1 },
  back: { marginBottom: 24 },
  backText: { color: C.ORANGE, fontSize: 15, fontWeight: '700' },
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
  devLinkBox: {
    marginTop: 12,
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    padding: 12,
  },
  devLinkText: { color: C.TEAL, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  infoBox: {
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  infoText: { color: C.TEXT_SECONDARY, fontSize: 15, fontWeight: '600' },
});
