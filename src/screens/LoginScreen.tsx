import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { C } from '../theme';

// Star field background
const StarField = React.memo(() => {
  const stars = useMemo(() => {
    const s = [];
    for (let i = 0; i < 60; i++) {
      s.push({
        left: `${Math.random() * 100}%`,
        top: Math.random() * 800,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.4 + 0.05,
      });
    }
    return s;
  }, []);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map((star, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: star.left as any,
            top: star.top,
            width: star.size,
            height: star.size,
            borderRadius: star.size,
            backgroundColor: '#FFFFFF',
            opacity: star.opacity,
          }}
        />
      ))}
    </View>
  );
});

const LoginScreen = ({ navigation }: any) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigation.navigate('Main');
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <StarField />

      {/* Hero section */}
      <View style={styles.heroSection}>
        <Image source={require('../../assets/photo4-portrait.png')} style={styles.heroBgImage} resizeMode="cover" />
        <View style={styles.glowOrb} pointerEvents="none" />
        <Image source={require('../../assets/logo.png')} style={{ width: 100, height: 100, zIndex: 1 }} resizeMode="contain" />
        <Text style={styles.heroTitle}>photo healthy</Text>
        <Text style={styles.heroSubtext}>Capture · Share · Thrive</Text>
      </View>

      {/* Login card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Glad you're here</Text>
        <Text style={styles.cardSubtitle}>Continue Your Journey</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Enter email address"
          placeholderTextColor={C.TEXT_SECONDARY}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <View style={styles.passwordWrap}>
          <TextInput
            style={[styles.input, { marginBottom: 0, flex: 1, paddingRight: 44 }]}
            placeholder="Password"
            placeholderTextColor={C.TEXT_SECONDARY}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.optionsRow}>
          <TouchableOpacity
            style={styles.rememberRow}
            onPress={() => setRememberMe(!rememberMe)}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && <Text style={styles.checkMark}>✓</Text>}
            </View>
            <Text style={styles.rememberText}>Remember Me</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.forgotText}>Get New Password</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signInText}>Sign In</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.signUpBtn}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.signUpText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Brand footer */}
      <Image source={require('../../assets/logo.png')} style={{ width: 32, height: 32, marginTop: 32, opacity: 0.5 }} resizeMode="contain" />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.BG },
  scrollContent: { flexGrow: 1, alignItems: 'center', paddingBottom: 40 },

  // Hero
  heroSection: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    overflow: 'hidden',
  },
  heroBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.15,
    borderRadius: 0,
  } as any,
  glowOrb: {
    position: 'absolute',
    top: -40,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255,140,0,0.08)',
  },
  heroEmoji: { fontSize: 80, marginBottom: 16 },
  heroTitle: {
    fontSize: 38,
    fontWeight: '800',
    color: C.TEXT,
    letterSpacing: 1,
  },
  heroSubtext: {
    fontSize: 14,
    color: C.TEXT_SECONDARY,
    marginTop: 8,
    letterSpacing: 2,
  },

  // Card
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: C.CARD_BG,
    borderRadius: 20,
    padding: 28,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: C.TEXT,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 15,
    color: C.TEXT_SECONDARY,
    marginBottom: 24,
  },
  error: {
    color: C.ERROR,
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },

  // Inputs
  input: {
    backgroundColor: C.INPUT_BG,
    borderRadius: 12,
    padding: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: C.TEXT,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  } as any,
  passwordWrap: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  eyeIcon: { fontSize: 18 },

  // Options row
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: C.TEXT_SECONDARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: C.ORANGE,
    borderColor: C.ORANGE,
  },
  checkMark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  rememberText: { color: C.TEXT_SECONDARY, fontSize: 13 },
  forgotText: { color: C.TEAL, fontSize: 13, fontWeight: '600' },

  // Buttons
  buttonRow: { flexDirection: 'row', gap: 12 },
  signInBtn: {
    flex: 1,
    backgroundColor: C.ORANGE,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signInText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  signUpBtn: {
    flex: 1,
    backgroundColor: C.TEAL,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signUpText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  // Brand
  brandText: {
    color: C.TEXT_SECONDARY,
    fontSize: 12,
    marginTop: 32,
    letterSpacing: 2,
    opacity: 0.5,
  },
});

export default LoginScreen;
