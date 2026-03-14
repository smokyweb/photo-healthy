import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { api } from '../services/api';
import { colors, spacing, borderRadius } from '../theme';

const SubmitPhotoScreen = ({ route, navigation }: any) => {
  const { challengeId } = route.params;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photo1, setPhoto1] = useState<any>(null);
  const [photo2, setPhoto2] = useState<any>(null);
  const [photo1Preview, setPhoto1Preview] = useState('');
  const [photo2Preview, setPhoto2Preview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInput1 = useRef<any>(null);
  const fileInput2 = useRef<any>(null);

  const handleFilePick = (setter: any, previewSetter: any) => (e: any) => {
    const file = e.target?.files?.[0];
    if (file) {
      setter(file);
      const reader = new FileReader();
      reader.onload = (ev) => previewSetter(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!title) { setError('Please enter a title'); return; }
    if (!photo1) { setError('Please select at least one photo'); return; }
    setLoading(true);
    setError('');
    try {
      const photo1_url = await api.uploadPhoto(photo1);
      let photo2_url = null;
      if (photo2) photo2_url = await api.uploadPhoto(photo2);
      await api.createSubmission({ challenge_id: challengeId, title, description, photo1_url, photo2_url });
      navigation.goBack();
    } catch (e: any) {
      setError(e.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const renderPhotoPicker = (photo: any, preview: string, inputRef: any, setter: any, previewSetter: any, label: string) => (
    <View style={styles.pickerContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.photoPicker, preview ? styles.photoPickerFilled : null]}
        onPress={() => inputRef.current?.click()}
      >
        {preview ? (
          <Image source={{ uri: preview }} style={styles.previewImage} />
        ) : (
          <View style={styles.pickerPlaceholder}>
            <Text style={styles.pickerIcon}>📷</Text>
            <Text style={styles.pickerText}>Tap to select photo</Text>
          </View>
        )}
      </TouchableOpacity>
      {Platform.OS === 'web' && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFilePick(setter, previewSetter)}
        />
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.inner}>
        <Text style={styles.heading}>Submit Your Photo</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input} placeholder="Give your photo a title"
          placeholderTextColor={colors.gray[400]} value={title} onChangeText={setTitle}
        />
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]} placeholder="Describe your photo..."
          placeholderTextColor={colors.gray[400]} value={description} onChangeText={setDescription}
          multiline numberOfLines={3}
        />
        {renderPhotoPicker(photo1, photo1Preview, fileInput1, setPhoto1, setPhoto1Preview, 'Photo 1 *')}
        {renderPhotoPicker(photo2, photo2Preview, fileInput2, setPhoto2, setPhoto2Preview, 'Photo 2 (optional)')}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Entry</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primaryBg },
  content: { padding: spacing.lg },
  inner: { maxWidth: 500, width: '100%', alignSelf: 'center' },
  heading: { fontSize: 24, fontWeight: '700', color: colors.black, marginBottom: spacing.lg },
  label: { fontSize: 14, fontWeight: '600', color: colors.gray[700], marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[200],
    borderRadius: borderRadius.md, padding: spacing.md, fontSize: 16,
    marginBottom: spacing.md, color: colors.black,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  pickerContainer: { marginBottom: spacing.md },
  photoPicker: {
    height: 200, backgroundColor: colors.white, borderRadius: borderRadius.md,
    borderWidth: 2, borderColor: colors.gray[200], borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  photoPickerFilled: { borderStyle: 'solid', borderColor: colors.primary },
  pickerPlaceholder: { alignItems: 'center' },
  pickerIcon: { fontSize: 36, marginBottom: spacing.sm },
  pickerText: { color: colors.gray[400], fontSize: 14 },
  previewImage: { width: '100%', height: '100%' },
  submitBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.md,
  },
  submitText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  error: { color: colors.error, textAlign: 'center', marginBottom: spacing.md },
});

export default SubmitPhotoScreen;
