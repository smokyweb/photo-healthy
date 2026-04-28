import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  TextInput, useWindowDimensions, Linking, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { submitContact } from '../services/api';
import GradientButton from '../components/GradientButton';
import AppFooter from '../components/AppFooter';
import { C, borderRadius } from '../theme';

export default function ContactScreen() {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const openLink = (url: string) => {
    if (Platform.OS === 'web') { window.open(url, '_blank'); }
    else { Linking.openURL(url); }
  };

  const handleSend = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('Missing Fields', 'Please fill in your name, email, and message.');
      return;
    }
    setSending(true);
    try {
      await submitContact({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      setSent(true);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to send message. Please try again.');
    }
    setSending(false);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Contact Us</Text>
      </View>

      {/* Success Banner */}
      {sent && (
        <View style={styles.successBanner}>
          <Text style={styles.successTitle}>âœ“ Message Sent!</Text>
          <Text style={styles.successSubtext}>
            We'll get back to you within 1â€“2 business days.
          </Text>
        </View>
      )}

      {/* 2-Column Layout */}
      <View style={[styles.twoCol, isDesktop && styles.twoColDesktop]}>
        {/* Left: Form */}
        <View style={[styles.formCol, isDesktop && styles.formColDesktop]}>
          <Text style={styles.colTitle}>Send Us a Message</Text>

          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your full name"
            placeholderTextColor={C.TEXT_MUTED}
            autoCapitalize="words"
            editable={!sent}
          />

          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            placeholderTextColor={C.TEXT_MUTED}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!sent}
          />

          <Text style={styles.label}>Subject</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="What's this about?"
            placeholderTextColor={C.TEXT_MUTED}
            autoCapitalize="sentences"
            editable={!sent}
          />

          <Text style={styles.label}>Message *</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={message}
            onChangeText={setMessage}
            placeholder="How can we help you?"
            placeholderTextColor={C.TEXT_MUTED}
            multiline
            numberOfLines={6}
            autoCapitalize="sentences"
            textAlignVertical="top"
            editable={!sent}
          />

          <GradientButton
            label="Send Message"
            onPress={handleSend}
            loading={sending}
            disabled={sent}
            style={styles.sendBtn}
          />
        </View>

        {/* Right: Info Panel */}
        <View style={[styles.infoCol, isDesktop && styles.infoColDesktop]}>
          {/* Get in Touch Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Get in Touch</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>ðŸ“§</Text>
              <Text style={styles.infoText}>support@photohealthy.com</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>â°</Text>
              <Text style={styles.infoText}>Monâ€“Fri, 9amâ€“5pm EST</Text>
            </View>
            <Text style={styles.infoNote}>
              We typically respond within 1â€“2 business days.
            </Text>
          </View>

          {/* Join Our Community Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Join Our Community</Text>
            <Text style={styles.infoNote}>
              Follow us on social media for tips, inspiration, and community updates.
            </Text>
            <View style={styles.socialRow}>
              <GradientButton
                label="Facebook"
                onPress={() => openLink('https://facebook.com/photohealthy')}
                variant="outline"
                size="sm"
                style={styles.socialBtn}
              />
              <GradientButton
                label="Instagram"
                onPress={() => openLink('https://instagram.com/photohealthy')}
                variant="teal"
                size="sm"
                style={styles.socialBtn}
              />
            </View>
          </View>
        </View>
      </View>

      <AppFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: C.BG },
  content: { paddingBottom: 0 },

  pageHeader: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 28,
  },
  pageTitle: { color: C.TEXT, fontSize: 36, fontWeight: '900' },

  successBanner: {
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: '#022B1F',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.TEAL,
    padding: 18,
  },
  successTitle: { color: C.TEAL, fontSize: 18, fontWeight: '800', marginBottom: 4 },
  successSubtext: { color: C.TEXT_SECONDARY, fontSize: 14, lineHeight: 20 },

  twoCol: { paddingHorizontal: 24, paddingBottom: 48, gap: 24 },
  twoColDesktop: { flexDirection: 'row', alignItems: 'flex-start' },
  formCol: {},
  formColDesktop: { flex: 2 },
  infoCol: {},
  infoColDesktop: { flex: 1 },

  colTitle: {
    color: C.TEXT,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  label: {
    color: C.TEXT_SECONDARY,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 7,
  },
  input: {
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    color: C.TEXT,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  textarea: {
    height: 140,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  sendBtn: { marginTop: 4 },

  infoCard: {
    backgroundColor: C.CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    padding: 20,
    marginBottom: 16,
  },
  infoCardTitle: {
    color: C.TEXT,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  infoIcon: { fontSize: 16 },
  infoText: { color: C.TEXT_SECONDARY, fontSize: 14 },
  infoNote: {
    color: C.TEXT_MUTED,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
    marginBottom: 14,
  },
  socialRow: { flexDirection: 'row', gap: 10 },
  socialBtn: { flex: 1 },
});
