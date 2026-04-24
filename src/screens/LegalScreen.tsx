import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { C, borderRadius } from '../theme';

const TABS = ['Terms', 'Privacy', 'Guidelines'];

export default function LegalScreen() {
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState('Terms');

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Legal</Text>

        {/* Tabs */}
        <View style={styles.tabs}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'Terms' && (
          <View>
            <Text style={styles.heading}>Terms of Service</Text>
            <Text style={styles.updated}>Last updated: January 2026</Text>
            <Text style={styles.body}>
              {`By using PhotoHealthy, you agree to these Terms of Service. Please read them carefully.\n\n`}
              {`USE OF SERVICE\nYou must be 13 years or older to use PhotoHealthy. You are responsible for maintaining the security of your account credentials.\n\n`}
              {`CONTENT\nYou retain ownership of photos you upload. By submitting content, you grant PhotoHealthy a non-exclusive license to display and promote your content within the platform.\n\n`}
              {`PROHIBITED CONTENT\nYou may not submit content that is illegal, harmful, threatening, abusive, harassing, defamatory, obscene, or otherwise objectionable.\n\n`}
              {`TERMINATION\nWe reserve the right to terminate accounts that violate these terms.\n\n`}
              {`DISCLAIMER\nPhotoHealthy is provided "as is" without warranties of any kind. We are not responsible for user-generated content.`}
            </Text>
          </View>
        )}

        {tab === 'Privacy' && (
          <View>
            <Text style={styles.heading}>Privacy Policy</Text>
            <Text style={styles.updated}>Last updated: January 2026</Text>
            <Text style={styles.body}>
              {`INFORMATION WE COLLECT\nWe collect your name, email address, and photos you voluntarily submit. We use cookies and similar technologies to maintain your session.\n\n`}
              {`HOW WE USE YOUR DATA\nYour data is used to provide the PhotoHealthy service, personalize your experience, and communicate important updates.\n\n`}
              {`SHARING\nWe do not sell your personal data. We may share data with service providers (hosting, payments) necessary to operate the platform.\n\n`}
              {`COOKIES\nWe use essential cookies for authentication and session management.\n\n`}
              {`YOUR RIGHTS\nYou may request deletion of your account and data by contacting us.\n\n`}
              {`CONTACT\nFor privacy questions, use our Contact page.`}
            </Text>
          </View>
        )}

        {tab === 'Guidelines' && (
          <View>
            <Text style={styles.heading}>Community Guidelines</Text>
            <Text style={styles.updated}>Last updated: January 2026</Text>
            <Text style={styles.body}>
              {`BE RESPECTFUL\nTreat all community members with kindness and respect. Harassment, bullying, and hate speech are not tolerated.\n\n`}
              {`HEALTHY CONTENT ONLY\nSubmissions must be relevant to healthy living. No spam, unrelated advertising, or misleading content.\n\n`}
              {`ORIGINAL PHOTOS\nOnly submit photos you have taken or have the rights to use.\n\n`}
              {`NO EXPLICIT CONTENT\nNo nudity, graphic violence, or adult content of any kind.\n\n`}
              {`HONEST REPRESENTATION\nDo not misrepresent your progress or achievements.\n\n`}
              {`REPORTING\nIf you see content that violates these guidelines, please report it using the flag icon.`}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.BG },
  container: { padding: 20 },
  back: { marginBottom: 20 },
  backText: { color: C.ORANGE, fontSize: 15 },
  title: { color: C.TEXT, fontSize: 26, fontWeight: '900', marginBottom: 16 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tabBtn: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: borderRadius.pill,
    backgroundColor: C.CARD_BG,
    borderWidth: 1, borderColor: C.CARD_BORDER,
  },
  tabBtnActive: { backgroundColor: C.ORANGE, borderColor: C.ORANGE },
  tabText: { color: C.TEXT_MUTED, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: C.WHITE },
  heading: { color: C.TEXT, fontSize: 20, fontWeight: '700', marginBottom: 4 },
  updated: { color: C.TEXT_MUTED, fontSize: 12, marginBottom: 16 },
  body: { color: C.TEXT_SECONDARY, fontSize: 14, lineHeight: 22 },
});
