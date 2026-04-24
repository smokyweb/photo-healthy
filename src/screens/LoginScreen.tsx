import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Image, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import GradientButton from '../components/GradientButton';
import { C, borderRadius, fonts, spacing } from '../theme';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (e: any) {
      setError(e.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Hero */}
        <View style={styles.hero}>
          <Image
            source={{ uri: '/assets/cityscape.jpg' }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          <View style={styles.logoWrap}>
            <Text style={styles.logoText}>📸 PhotoHealthy</Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.heading}>Glad you're here</Text>
          <Text style={styles.subheading}>Sign in to your account</Text>

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
            autoCapitalize="none"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secureTextEntry
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('ResetPassword')}
            style={styles.forgotWrap}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <GradientButton
            label="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={styles.signInBtn}
          />

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          <GradientButton
            label="Create Account"
            onPress={() => navigation.navigate('Register')}
            variant="outline"
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('Main')}
            style={styles.guestWrap}
          >
            <Text style={styles.guestText}>Continue as guest</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.BG },
  scroll: { flexGrow: 1 },
  hero: { height: 260, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(32,35,51,0.55)',
  },
  logoWrap: {
    position: 'absolute',
    bottom: 20,
    left: 24,
  },
  logoText: {
    color: C.WHITE,
    fontSize: 22,
    fontWeight: '800',
    fontFamily: "'Lexend', sans-serif",
  },
  form: {
    flex: 1,
    backgroundColor: C.BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 24,
  },
  heading: {
    ...fonts.displayXL,
    color: C.TEXT,
    fontSize: 28,
    marginBottom: 6,
  },
  subheading: {
    color: C.TEXT_SECONDARY,
    fontSize: 15,
    marginBottom: 24,
  },
  errorBox: {
    backgroundColor: C.DANGER + '22',
    borderRadius: borderRadius.md,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.DANGER + '55',
  },
  errorText: { color: C.DANGER, fontSize: 14 },
  forgotWrap: { alignItems: 'flex-end', marginBottom: 20 },
  forgotText: { color: C.ORANGE, fontSize: 13 },
  signInBtn: { marginBottom: 20 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  divider: { flex: 1, height: 1, backgroundColor: C.DIVIDER },
  dividerText: { color: C.TEXT_MUTED, fontSize: 13 },
  guestWrap: { alignItems: 'center', marginTop: 16 },
  guestText: { color: C.TEXT_MUTED, fontSize: 13 },
});
