import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  ScrollView, Alert, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createSubmission, uploadPhoto } from '../services/api';
import Input from '../components/Input';
import GradientButton from '../components/GradientButton';
import { C, borderRadius } from '../theme';
import AppFooter from '../components/AppFooter';

export default function SubmitPhotoScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { challengeId } = route.params || {};

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [miles, setMiles] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pickImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        setImageFile(file);
        setPreviewUrl(URL.createObjectURL(file));
      }
    };
    input.click();
  };

  const handleSubmit = async () => {
    if (!imageFile) { setError('Please select a photo.'); return; }
    if (!title.trim()) { setError('Please add a title.'); return; }
    if (!agreed) { setError('Please agree to the community guidelines.'); return; }
    setError('');
    setLoading(true);
    try {
      const uploaded = await uploadPhoto(imageFile);
      await createSubmission({
        challenge_id: challengeId,
        image_url: uploaded.url,
        title: title.trim(),
        description: description.trim(),
        miles: miles ? parseFloat(miles) : undefined,
      });
      Alert.alert('Success', 'Your photo has been submitted!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      setError(e.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screen} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Cancel</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Submit a Photo</Text>
        <Text style={styles.subtitle}>Share your healthy moment with the community</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Photo Picker */}
        <TouchableOpacity style={styles.photoPicker} onPress={pickImage}>
          {previewUrl ? (
            <Image source={{ uri: previewUrl }} style={styles.preview} />
          ) : (
            <View style={styles.pickerInner}>
              <Text style={styles.pickerIcon}>📷</Text>
              <Text style={styles.pickerText}>Tap to select a photo</Text>
              <Text style={styles.pickerHint}>JPG, PNG up to 10MB</Text>
            </View>
          )}
        </TouchableOpacity>

        {previewUrl && (
          <TouchableOpacity onPress={pickImage} style={styles.changePhoto}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        )}

        <Input
          label="Title *"
          value={title}
          onChangeText={setTitle}
          placeholder="Give your photo a title"
          autoCapitalize="sentences"
        />
        <Input
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Tell us about this moment..."
          multiline
          numberOfLines={4}
          autoCapitalize="sentences"
        />
        <Input
          label="Miles / Distance (optional)"
          value={miles}
          onChangeText={setMiles}
          placeholder="e.g. 3.2"
          keyboardType="decimal-pad"
        />

        {/* Guidelines Checkbox */}
        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => setAgreed(v => !v)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkLabel}>
            I agree to the{' '}
            <Text style={styles.checkLink} onPress={() => navigation.navigate('Legal')}>
              community guidelines
            </Text>
            {' '}and this photo complies with them.
          </Text>
        </TouchableOpacity>

        <GradientButton
          label="Submit Photo"
          onPress={handleSubmit}
          loading={loading}
          disabled={!imageFile || !title.trim() || !agreed}
          style={{ marginTop: 8 }}
        />

        <View style={{ height: 32 }} />
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
  title: { color: C.TEXT, fontSize: 24, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: C.TEXT_SECONDARY, fontSize: 14, marginBottom: 20 },
  errorBox: {
    backgroundColor: C.DANGER + '22',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.DANGER + '55',
  },
  errorText: { color: C.DANGER, fontSize: 14 },
  photoPicker: {
    width: '100%',
    aspectRatio: 1.5,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: C.CARD_BG,
    borderWidth: 2,
    borderColor: C.CARD_BORDER,
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  preview: { width: '100%', height: '100%' },
  pickerInner: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  pickerIcon: { fontSize: 48 },
  pickerText: { color: C.TEXT_SECONDARY, fontSize: 16, fontWeight: '600' },
  pickerHint: { color: C.TEXT_MUTED, fontSize: 12 },
  changePhoto: { alignItems: 'center', marginBottom: 16 },
  changePhotoText: { color: C.ORANGE, fontSize: 14 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20, gap: 12 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: C.MED,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: C.ORANGE, borderColor: C.ORANGE },
  checkmark: { color: C.WHITE, fontSize: 13, fontWeight: '800' },
  checkLabel: { flex: 1, color: C.TEXT_SECONDARY, fontSize: 13, lineHeight: 20 },
  checkLink: { color: C.ORANGE },
});
