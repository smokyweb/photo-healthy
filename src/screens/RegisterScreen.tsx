import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Image, useWindowDimensions } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { C } from '../theme';

const SIGNIN_HERO = require('../../assets/theme-fin_02-signin-bg.png');
const ORANGE_GRADIENT = 'linear-gradient(90deg, #F55B09 0%, #FFD000 100%)';
const EYE_ICON =
  'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 512 512%27%3E%3Cpath d=%27M48 256s80-144 208-144 208 144 208 144-80 144-208 144S48 256 48 256z%27 fill=%27none%27 stroke=%27%237B8396%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%2732%27/%3E%3Ccircle cx=%27256%27 cy=%27256%27 r=%2764%27 fill=%27none%27 stroke=%27%237B8396%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%2732%27/%3E%3C/svg%3E")';

const RegisterScreen = ({ navigation }: any) => {
  const { register } = useAuth();
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= 900;
  const panelHeight = isDesktop ? Math.max(height, 780) : undefined;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) { setError('Please fill in all fields'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setError('');
    try {
      await register(name, email, password);
      navigation.navigate('Main');
    } catch (e: any) {
      setError(e.message || 'Registration failed');
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
        <TouchableOpacity
          style={[styles.backHomeBtn, !isDesktop && styles.backHomeBtnMobile]}
          onPress={() => navigation.navigate('Main')}
        >
          <Text style={styles.backHomeText}>‹ Back to Home</Text>
        </TouchableOpacity>

        <View style={[styles.hero, isDesktop && styles.heroDesktop, isDesktop && { height: panelHeight }]}>
          <Image source={SIGNIN_HERO} style={styles.heroImage} resizeMode={isDesktop ? 'contain' : 'cover'} />
        </View>

        <View style={[styles.formWrap, isDesktop && styles.formWrapDesktop]}>
          <Text style={styles.cardTitle}>Create your account</Text>
          <View style={styles.titleAccent} />
          <Text style={styles.cardSubtitle}>Start Your Photo Journey</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.fieldLabel}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter full name"
            placeholderTextColor="#8A91A5"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.fieldLabel}>Email</Text>
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

          <Text style={styles.fieldLabel}>Confirm Password</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Confirm password"
              placeholderTextColor="#8A91A5"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <View style={[styles.eyeIcon, showConfirmPassword && styles.eyeIconActive]} />
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.signUpBtn}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.signInBtn}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.buttonText}>Sign In</Text>
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
    position: 'relative',
    width: '100%',
    maxWidth: 430,
    minHeight: 960,
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
    height: 360,
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
  backHomeBtn: {
    position: 'absolute',
    top: 18,
    left: 16,
    zIndex: 10,
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(84, 223, 182, 0.65)',
    backgroundColor: 'rgba(10, 14, 26, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backHomeBtnMobile: {
    top: 10,
  },
  backHomeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Lexend',
    fontWeight: '800',
    fontStyle: 'normal',
  },
  formWrap: {
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 40,
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
    fontSize: 13,
    fontFamily: 'Lexend',
    fontWeight: '700',
  },
  fieldLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Lexend',
    fontWeight: '700',
    fontStyle: 'normal',
    marginBottom: 10,
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
  passwordWrap: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
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
  buttonRow: {
    flexDirection: 'row',
    gap: 19,
    marginTop: 10,
  },
  signUpBtn: {
    flex: 1,
    height: 52,
    backgroundColor: '#F55B09',
    backgroundImage: ORANGE_GRADIENT,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  } as any,
  signInBtn: {
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
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Lexend',
    fontWeight: '800',
    fontStyle: 'normal',
  },
});

export default RegisterScreen;
