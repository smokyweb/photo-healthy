import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  ScrollView, Alert, Platform, useWindowDimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createSubmission, uploadPhoto } from '../services/api';
import Input from '../components/Input';
import GradientButton from '../components/GradientButton';
import AppFooter from '../components/AppFooter';
import { C, borderRadius } from '../theme';

const MAX_PHOTOS = 4;

export default function SubmitPhotoScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { challengeId } = route.params || {};
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [miles, setMiles] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Use a hidden file input rendered in the DOM for iOS compatibility
  const fileInputRef = useRef<any>(null);

  const triggerPicker = () => {
    if (Platform.OS === 'web' && fileInputRef.current) {
      fileInputRef.current.value = '';  // reset so same file can be re-selected
      fileInputRef.current.click();
    }
  };

  const onFilesSelected = (e: any) => {
    const files: File[] = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = MAX_PHOTOS - photos.length;
    const toAdd = files.slice(0, remaining);
    const newPhotos = toAdd.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos(prev => [...prev, ...newPhotos]);
    setError('');
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (photos.length === 0) { setError('Please select at least one photo.'); return; }
    if (!title.trim()) { setError('Please add a title.'); return; }
    if (!agreed) { setError('Please agree to the community guidelines.'); return; }
    setError('');
    setLoading(true);
    try {
      // Upload all photos
      const uploadedUrls: string[] = [];
      for (const p of photos) {
        const result = await uploadPhoto(p.file);
        uploadedUrls.push(result.url || result.photo_url || result.image_url);
      }
      // Build submission payload with photo1_url through photo4_url
      const payload: any = {
        challenge_id: challengeId,
        title: title.trim(),
        description: description.trim(),
        miles: miles ? parseFloat(miles) : undefined,
      };
      uploadedUrls.forEach((url, i) => {
        payload[`photo${i + 1}_url`] = url;
      });
      // Fallback: also set image_url to first photo for backwards compat
      if (uploadedUrls[0]) payload.image_url = uploadedUrls[0];

      await createSubmission(payload);
      Alert.alert(
        '✅ Submitted!',
        'Your photo has been shared with the community.',
        [{ text: 'View Challenges', onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      setError(e.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const photoSlots = Array(MAX_PHOTOS).fill(null).map((_, i) => photos[i] || null);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Hidden file input - rendered in DOM for iOS Safari compatibility */}
      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' } as any}
          onChange={onFilesSelected}
        />
      )}

      <View style={[styles.container, isDesktop && styles.containerDesktop]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.heading}>Submit Photos</Text>
          <View style={{ width: 60 }} />
        </View>

        <Text style={styles.subtitle}>Share your healthy moment with the community</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Photo Grid */}
        <Text style={styles.sectionLabel}>
          Photos ({photos.length}/{MAX_PHOTOS}) — tap + to add
        </Text>
        <View style={styles.photoGrid}>
          {photoSlots.map((photo, i) => (
            <TouchableOpacity
              key={i}
              style={styles.photoSlot}
              onPress={photo ? undefined : triggerPicker}
              activeOpacity={photo ? 1 : 0.7}
            >
              {photo ? (
                <View style={{ flex: 1 }}>
                  <Image source={{ uri: photo.preview }} style={styles.photoImg} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removePhoto(i)}
                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                  >
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.emptySlot}>
                  <Text style={styles.plusIcon}>+</Text>
                  <Text style={styles.slotLabel}>{i === 0 ? 'Add Photo' : 'Optional'}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {photos.length < MAX_PHOTOS && (
          <TouchableOpacity onPress={triggerPicker} style={styles.addMoreBtn}>
            <Text style={styles.addMoreText}>+ Add {photos.length === 0 ? 'Photos' : 'More Photos'}</Text>
          </TouchableOpacity>
        )}

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Title *"
            value={title}
            onChangeText={setTitle}
            placeholder="Give your submission a title"
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
        </View>

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
            <Text
              style={styles.checkLink}
              onPress={() => navigation.navigate('Legal' as never, { section: 'guidelines' } as never)}
            >
              community guidelines
            </Text>
            {' '}and this photo complies with them.
          </Text>
        </TouchableOpacity>

        {/* Submit Button - always visible, not hidden under scroll */}
        <View style={styles.submitWrap}>
          <GradientButton
            label={loading ? 'Uploading...' : `Submit ${photos.length > 1 ? photos.length + ' Photos' : 'Photo'}`}
            onPress={handleSubmit}
            loading={loading}
            disabled={photos.length === 0 || !title.trim() || !agreed || loading}
          />
        </View>

        <View style={{ height: 40 }} />
      </View>

      <AppFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: C.BG },
  container: { padding: 20, maxWidth: 640, width: '100%' },
  containerDesktop: { alignSelf: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backText: { color: C.ORANGE, fontSize: 15, fontWeight: '600', width: 60 },
  heading: { color: C.TEXT, fontSize: 20, fontWeight: '800', fontFamily: "'Lexend', sans-serif" },
  subtitle: { color: C.TEXT_SECONDARY, fontSize: 14, marginBottom: 20, textAlign: 'center' },

  errorBox: {
    backgroundColor: '#ef444422',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ef444455',
  },
  errorText: { color: '#ef4444', fontSize: 14 },

  sectionLabel: { color: C.TEXT_MUTED, fontSize: 13, fontWeight: '600', marginBottom: 10 },

  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  photoSlot: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: C.CARD_BG,
    borderWidth: 2,
    borderColor: C.CARD_BORDER,
    borderStyle: 'dashed',
  },
  photoImg: { width: '100%', height: '100%' },
  emptySlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  plusIcon: { color: C.TEXT_MUTED, fontSize: 32, fontWeight: '300' },
  slotLabel: { color: C.TEXT_MUTED, fontSize: 12 },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: { color: '#fff', fontSize: 13, fontWeight: '700', lineHeight: 16 },

  addMoreBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: C.ORANGE + '66',
    borderStyle: 'dashed',
  },
  addMoreText: { color: C.ORANGE, fontSize: 14, fontWeight: '600' },

  form: { marginBottom: 8 },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.TEXT_MUTED,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: C.ORANGE, borderColor: C.ORANGE },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '800' },
  checkLabel: { flex: 1, color: C.TEXT_SECONDARY, fontSize: 13, lineHeight: 20 },
  checkLink: { color: C.ORANGE, textDecorationLine: 'underline' },

  submitWrap: {
    marginTop: 4,
    paddingBottom: 16,
  },
});
