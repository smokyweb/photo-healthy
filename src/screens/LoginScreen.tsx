import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Image, useWindowDimensions } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { C } from '../theme';

const SIGNIN_HERO = require('../../assets/theme-fin_02-signin-bg.png');
const EYE_ICON =
  'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 512 512%27%3E%3Cpath d=%27M48 256s80-144 208-144 208 144 208 144-80 144-208 144S48 256 48 256z%27 fill=%27none%27 stroke=%27%237B8396%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%2732%27/%3E%3Ccircle cx=%27256%27 cy=%27256%27 r=%2764%27 fill=%27none%27 stroke=%27%237B8396%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%2732%27/%3E%3C/svg%3E")';

const LoginScreen = ({ navigation }: any) => {
  const { login } = useAuth();
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= 900;
  const panelHeight = isDesktop ? Math.max(height, 720) : undefined;
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}
    >
      <View style={[styles.authPanel, isDesktop && styles.authPanelDesktop, isDesktop && { minHeight: panelHeight }]}>
        <View style={[styles.hero, isDesktop && styles.heroDesktop, isDesktop && { height: panelHeight }]}>
          <Image source={SIGNIN_HERO} style={styles.heroImage} resizeMode={isDesktop ? 'contain' : 'cover'} />
        </View>

        <View style={[styles.formWrap, isDesktop && styles.formWrapDesktop]}>
          <Text style={styles.cardTitle}>Glad you're here</Text>
          <View style={styles.titleAccent} />
          <Text style={styles.cardSubtitle}>Continue Your Journey</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Enter email address"
            placeholderTextColor="#8A91A5"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.fieldLabel}>Password</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Enter password"
              placeholderTextColor="#8A91A5"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}
            >
              <View style={[styles.eyeIcon, showPassword && styles.eyeIconActive]} />
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

      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#161616' },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  scrollContentDesktop: {
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    paddingVertical: 0,
  },
  authPanel: {
    width: '100%',
    maxWidth: 430,
    minHeight: 900,
    backgroundColor: '#202333',
    overflow: 'hidden',
  },
  authPanelDesktop: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignSelf: 'stretch',
  } as any,

  hero: {
    width: '100%',
    height: 430,
    overflow: 'hidden',
    backgroundColor: '#111827',
  },
  heroDesktop: {
    flex: 1,
    width: '50%',
    backgroundColor: '#202333',
  } as any,
  heroImage: {
    width: '100%',
    height: '100%',
  },

  formWrap: {
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  formWrapDesktop: {
    width: '50%',
    minWidth: 0,
    maxWidth: '50%',
    justifyContent: 'center',
    paddingHorizontal: 64,
    paddingTop: 0,
    paddingBottom: 0,
  } as any,
  cardTitle: {
    fontFamily: 'Lexend',
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '800',
    fontStyle: 'normal',
    color: C.TEXT,
    marginBottom: 7,
  },
  titleAccent: {
    width: 15,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#54DFB6',
    marginBottom: 16,
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: 'Lexend',
    color: '#FFFFFF',
    fontWeight: '700',
    fontStyle: 'normal',
    marginBottom: 12,
  },
  error: {
    color: C.ERROR,
    marginBottom: 10,
    fontSize: 11,
    fontWeight: '700',
  },

  input: {
    height: 52,
    backgroundColor: '#3B3E4F',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 11,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: C.TEXT,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#575B6E',
  } as any,
  fieldLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Lexend',
    fontWeight: '700',
    fontStyle: 'normal',
    marginBottom: 10,
  },
  passwordWrap: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  passwordInput: {
    flex: 1,
    marginBottom: 0,
    paddingRight: 46,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeIcon: {
    width: 20,
    height: 20,
    backgroundImage: EYE_ICON,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '20px 20px',
  } as any,
  eyeIconActive: {
    opacity: 0.78,
  },

  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 27,
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  checkbox: {
    width: 14,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#54DFB6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#54DFB6',
  },
  checkMark: { color: '#FFFFFF', fontSize: 10, fontWeight: '900', lineHeight: 12 },
  rememberText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontStyle: 'normal',
  },
  forgotText: {
    color: '#54DFB6',
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontStyle: 'normal',
    textDecorationLine: 'underline',
  },

  buttonRow: { flexDirection: 'row', gap: 19 },
  signInBtn: {
    flex: 1,
    height: 52,
    backgroundColor: '#FF6B00',
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  signInText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Lexend',
    fontWeight: '800',
    fontStyle: 'normal',
  },
  signUpBtn: {
    flex: 1,
    height: 52,
    backgroundColor: '#29B6E0',
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    backgroundImage: 'linear-gradient(95deg, #FFD000 0%, #29B6E0 72%)',
  } as any,
  signUpText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Lexend',
    fontWeight: '800',
    fontStyle: 'normal',
  },

});

export default LoginScreen;
