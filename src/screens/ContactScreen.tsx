import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { submitContact } from '../services/api';
import Input from '../components/Input';
import GradientButton from '../components/GradientButton';
import { C, borderRadius } from '../theme';
import AppFooter from '../components/AppFooter';

export default function ContactScreen() {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in name, email, and message.');
      return;
    }
    setSending(true);
    try {
      await submitContact({ name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() });
      setSent(true);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setSending(false);
  };

  return (
    <ScrollView style={styles.screen} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Contact Us</Text>
        <Text style={styles.subtitle}>We'd love to hear from you!</Text>

        {sent ? (
          <View style={styles.successBox}>
            <Text style={styles.successTitle}>✅ Message Sent!</Text>
            <Text style={styles.successBody}>We'll get back to you within 1–2 business days.</Text>
          </View>
        ) : (
          <>
            <Input label="Name *" value={name} onChangeText={setName} autoCapitalize="words" />
            <Input label="Email *" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <Input label="Subject" value={subject} onChangeText={setSubject} autoCapitalize="sentences" />
            <Input
              label="Message *"
              value={message}
              onChangeText={setMessage}
              placeholder="How can we help?"
              multiline
              numberOfLines={5}
              autoCapitalize="sentences"
            />
            <GradientButton label="Send Message" onPress={handleSend} loading={sending} />
          </>
        )}
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
  title: { color: C.TEXT, fontSize: 26, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: C.TEXT_SECONDARY, fontSize: 15, marginBottom: 24 },
  successBox: {
    backgroundColor: C.SUCCESS + '22',
    borderRadius: borderRadius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: C.SUCCESS + '55',
  },
  successTitle: { color: C.SUCCESS, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  successBody: { color: C.TEXT_SECONDARY, fontSize: 14 },
});
