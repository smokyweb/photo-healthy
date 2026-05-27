import { validateForm, sanitize } from '../utils/validation';
﻿import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  ScrollView, Alert, Platform, useWindowDimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createSubmission, uploadPhoto, getChallenge, getUserStats, enterChallenge } from '../services/api';
import Input from '../components/Input';
import GradientButton from '../components/GradientButton';
import AppFooter from '../components/AppFooter';
import { C, borderRadius } from '../theme';
import { normalizeChallengeCategory, normalizeFeelingCategory, normalizeMovementCategory } from '../constants/taxonomy';

const SUBMIT_LOGO = require('../../assets/Pose_2-removebg-preview.png');

const MAX_PHOTOS = 2;

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
  const [challenge, setChallenge] = useState<any>(null);
  const [totalMiles, setTotalMiles] = useState<number>(0);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
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

  React.useEffect(() => {
    if (!challengeId) return;
    Promise.all([
      getChallenge(challengeId).catch(() => null),
      getUserStats().catch(() => null),
    ]).then(([challengeData, statsData]) => {
      setChallenge(challengeData?.challenge || challengeData || null);
      setTotalMiles(Number(statsData?.totalMiles || 0));
    });
  }, [challengeId]);

  const handleSubmit = async () => {
    if (photos.length === 0) { setError('Please select at least one photo.'); return; }
    const submitErr = validateForm([
      { value: title, rules: { required: true, maxLength: 150, label: 'Title' } },
    ]);
    if (submitErr) { setError(submitErr); return; }
    if (description.length > 1000) { setError('Description must be under 1000 characters.'); return; }
    if (miles && !/^\d*\.?\d+$/.test(miles)) { setError('Miles must be a number.'); return; }
    if (!agreed) { setError('Please agree to the community guidelines.'); return; }
    setError('');
    setLoading(true);
    try {
      if (challengeId) {
        await enterChallenge(challengeId).catch((err: any) => {
          if (!String(err?.message || '').toLowerCase().includes('duplicate')) throw err;
        });
      }
      // Upload all photos
      const uploadedUrls: string[] = [];
      for (let i = 0; i < photos.length; i += 1) {
        const p = photos[i];
        const result = await uploadPhoto(p.file);
        const uploadedUrl = result.url || (result as any).photo_url || (result as any).image_url;
        if (!uploadedUrl) {
          throw new Error(`Photo ${i + 1} did not finish uploading. Please try again.`);
        }
        uploadedUrls.push(uploadedUrl);
      }
      // Build submission payload with photo1_url through photo4_url
      const payload: any = {
        challenge_id: challengeId,
        title: sanitize(title, 150),
        description: sanitize(description, 1000),
        miles_walked: miles ? parseFloat(miles) : undefined,
        miles: miles ? parseFloat(miles) : undefined,
        photo_urls: uploadedUrls,
      };
      uploadedUrls.forEach((url, i) => {
        payload[`photo${i + 1}_url`] = url;
      });
      // Fallback: also set image_url to first photo for backwards compat
      if (uploadedUrls[0]) payload.image_url = uploadedUrls[0];

      await createSubmission(payload);
      // Show success and navigate to challenge detail
      setSuccess(true);
      setTimeout(() => {
        if (challengeId) {
          navigation.replace('ChallengeDetail' as never, { challengeId, id: challengeId } as never);
        } else {
          navigation.goBack();
        }
      }, 3500);
    } catch (e: any) {
      setError(e.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const photoSlots = Array(MAX_PHOTOS).fill(null).map((_, i) => photos[i] || null);
  const normalizedCategory = normalizeChallengeCategory(challenge?.category);
  const normalizedMovement = normalizeMovementCategory(challenge?.movement_category || challenge?.movement_tag);
  const normalizedFeeling = normalizeFeelingCategory(challenge?.feeling_category || challenge?.feeling_tag || challenge?.mood_tag);
  const categoryValue = normalizedCategory === '-' ? 'Category' : normalizedCategory;
  const movementValue = normalizedMovement === '-' ? 'Movement' : normalizedMovement;
  const feelingValue = normalizedFeeling === '-' ? 'Feeling' : normalizedFeeling;
  const enteredMiles = miles && /^\d*\.?\d+$/.test(miles) ? parseFloat(miles) : 0;
  const projectedMiles = Math.round((totalMiles + enteredMiles) * 10) / 10;
  const reflectionPrompt = `Share your thoughts on how you felt doing the ${movementValue} activity and how you were moved by the ${feelingValue} experience of the challenge.`;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logoImageWrapper}>
          <Image source={SUBMIT_LOGO} style={styles.logoImage} />
        </View>
        <Text style={styles.logoTitle}>Submit Photos</Text>
      </View>

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
      {success && (
        <View style={{ position: 'absolute' as any, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,14,26,0.92)', zIndex: 9999, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <View style={{ backgroundColor: '#16a34a', borderRadius: 24, padding: 40, alignItems: 'center', width: '100%', maxWidth: 360, shadowColor: '#16a34a', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 20 }}>
            <Text style={{ fontSize: 64, marginBottom: 16 }}>✅</Text>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 22, textAlign: 'center', marginBottom: 8 }}>Photo Submitted!</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, textAlign: 'center', lineHeight: 22 }}>Your photo has been shared with the community. Taking you to the challenge...</Text>
          </View>
        </View>
      )}
          <Text style={styles.heading}>Submit Photos</Text>
          <View style={{ width: 60 }} />
        </View>

        <Text style={styles.subtitle}>Share your healthy moment with the community</Text>

        {challenge ? (
          <TouchableOpacity
            style={styles.challengeContext}
            activeOpacity={0.82}
            onPress={() => navigation.navigate('ChallengeDetail' as never, { challengeId, id: challengeId } as never)}
          >
            <Text style={styles.contextLabel}>Submitting to</Text>
            <Text style={styles.contextTitle}>{challenge.title || 'Current Challenge'}</Text>
            <View style={styles.contextTags}>
              {[
                { label: 'Category', value: categoryValue },
                { label: 'Feeling', value: feelingValue },
                { label: 'Movement', value: movementValue },
              ].map(tag => (
                <View key={tag.label} style={styles.contextTag}>
                  <Text style={styles.contextTagLabel}>{tag.label}</Text>
                  <Text style={styles.contextTagValue}>{tag.value}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.backToContest}>Back to contest</Text>
          </TouchableOpacity>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Photo Grid */}
        <Text style={styles.sectionLabel}>
          Photo {photos.length === 0 ? '(required)' : photos.length === 1 ? '1 added \u2014 add a 2nd? (optional)' : '2 photos added'}
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
                  <Image source={{ uri: photo.preview }} style={styles.photoImg} resizeMode="contain" />
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removePhoto(i)}
                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                  >
                    <Text style={styles.removeBtnText}>âœ•</Text>
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
            placeholder={reflectionPrompt}
            multiline
            numberOfLines={4}
            autoCapitalize="sentences"
          />
          <Text style={styles.promptText}>{reflectionPrompt}</Text>
          <Input
            label="Miles for this challenge"
            value={miles}
            onChangeText={setMiles}
            placeholder="e.g. 3.2"
            keyboardType="decimal-pad"
          />
          <Text style={styles.totalMilesText}>Total miles tracked: {projectedMiles}</Text>
        </View>

        {/* Guidelines Checkbox */}
        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => setAgreed(v => !v)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Text style={styles.checkmark}>{'\u2713'}</Text>}
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
          {error ? (
            <View style={styles.submitErrorBox}>
              <Text style={styles.submitErrorText}>{error}</Text>
            </View>
          ) : null}
          <GradientButton
            label={loading ? 'Uploading...' : `Submit ${photos.length > 1 ? photos.length + ' Photos' : 'Photo'}`}
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
          />
        </View>

        <View style={{ height: 40 }} />
      </View>

      <AppFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: 'transparent' },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  logoImageWrapper: {
    width: 250,
    height: 170,
    overflow: 'hidden',
    marginBottom: 12,
  },
  logoImage: {
    width: 250,
    height: 200,
    marginTop: 0,
  },
  logoTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: C.TEXT,
    fontFamily: "'Lexend', sans-serif",
  },
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
  challengeContext: {
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    padding: 14,
    marginBottom: 16,
  },
  contextLabel: {
    color: C.TEXT_MUTED,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  contextTitle: {
    color: C.TEXT,
    fontSize: 17,
    fontWeight: '800',
    fontFamily: "'Lexend', sans-serif",
    marginBottom: 10,
  },
  contextTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  contextTag: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    minWidth: 120,
  },
  contextTagLabel: {
    color: C.TEXT_MUTED,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  contextTagValue: {
    color: C.TEAL,
    fontSize: 13,
    fontWeight: '800',
  },
  backToContest: {
    color: C.ORANGE,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
  },

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
  promptText: {
    color: C.TEXT_MUTED,
    fontSize: 12,
    lineHeight: 18,
    marginTop: -6,
    marginBottom: 12,
  },
  totalMilesText: {
    color: C.TEAL,
    fontSize: 13,
    fontWeight: '800',
    marginTop: -6,
    marginBottom: 12,
  },

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
  checkmark: { color: '#fff', fontSize: 16, fontWeight: '900', lineHeight: 18 },
  checkLabel: { flex: 1, color: C.TEXT_SECONDARY, fontSize: 13, lineHeight: 20 },
  checkLink: { color: C.ORANGE, textDecorationLine: 'underline' },

  submitWrap: {
    marginTop: 4,
    paddingBottom: 16,
  },
  submitErrorBox: {
    backgroundColor: '#ef444422',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ef444455',
  },
  submitErrorText: {
    color: '#fecaca',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});
