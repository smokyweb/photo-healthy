import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius } from '../theme';

const RegisterScreen = ({ navigation }: any) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) { setError('Please fill in all fields'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setError('');
    try {
      await register(name, email, password);
    } catch (e: any) {
      setError(e.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        <View style={styles.logoArea}>
          <Text style={styles.logoIcon}>📸</Text>
          <Text style={styles.logoText}>Join Photo Healthy</Text>
          <Text style={styles.subtitle}>Create your account</Text>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TextInput
          style={styles.input} placeholder="Full Name" placeholderTextColor={colors.gray[400]}
          value={name} onChangeText={setName}
        />
        <TextInput
          style={styles.input} placeholder="Email" placeholderTextColor={colors.gray[400]}
          value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"
        />
        <TextInput
          style={styles.input} placeholder="Password" placeholderTextColor={colors.gray[400]}
          value={password} onChangeText={setPassword} secureTextEntry
        />
        <TextInput
          style={styles.input} placeholder="Confirm Password" placeholderTextColor={colors.gray[400]}
          value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry
        />
        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkBtn}>
          <Text style={styles.linkText}>Already have an account? <Text style={styles.linkBold}>Sign In</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primaryBg, justifyContent: 'center' },
  inner: { maxWidth: 400, width: '100%', alignSelf: 'center', padding: spacing.lg },
  logoArea: { alignItems: 'center', marginBottom: spacing.xl },
  logoIcon: { fontSize: 56, marginBottom: spacing.sm },
  logoText: { fontSize: 28, fontWeight: '700', color: colors.primary },
  subtitle: { fontSize: 15, color: colors.gray[500], marginTop: spacing.xs },
  input: {
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[200],
    borderRadius: borderRadius.md, padding: spacing.md, fontSize: 16,
    marginBottom: spacing.md, color: colors.black, outlineStyle: 'none',
  } as any,
  button: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.sm,
  },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  error: { color: colors.error, textAlign: 'center', marginBottom: spacing.md, fontSize: 14 },
  linkBtn: { marginTop: spacing.lg, alignItems: 'center' },
  linkText: { color: colors.gray[500], fontSize: 14 },
  linkBold: { color: colors.primary, fontWeight: '600' },
});

export default RegisterScreen;
