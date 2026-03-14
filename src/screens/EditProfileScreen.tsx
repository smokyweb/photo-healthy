import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { C } from '../theme';

interface Field {
  key: string;
  label: string;
  icon: string;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: string;
  maxLength?: number;
  hint?: string;
}

const FIELDS: Field[] = [
  {
    key: 'name',
    label: 'Display Name',
    icon: '👤',
    placeholder: 'Your full name',
    maxLength: 60,
  },
  {
    key: 'bio',
    label: 'Bio',
    icon: '📝',
    placeholder: 'Tell the community about yourself…',
    multiline: true,
    maxLength: 300,
    hint: 'Up to 300 characters',
  },
  {
    key: 'location',
    label: 'Location',
    icon: '📍',
    placeholder: 'City, Country',
    maxLength: 80,
  },
  {
    key: 'website',
    label: 'Website',
    icon: '🌐',
    placeholder: 'https://yoursite.com',
    keyboardType: 'url',
    maxLength: 200,
  },
  {
    key: 'phone',
    label: 'Phone',
    icon: '📞',
    placeholder: '+1 (555) 000-0000',
    keyboardType: 'phone-pad',
    maxLength: 30,
    hint: 'Only visible to you',
  },
];

const EditProfileScreen = ({ navigation }: any) => {
  const { user, refreshUser } = useAuth();

  const [values, setValues] = useState<Record<string, string>>({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    phone: user?.phone || '',
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: string, val: string) => {
    setSaved(false);
    setError(null);
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    if (!values.name.trim()) {
      setError('Display name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.updateProfile({
        name: values.name.trim(),
        bio: values.bio.trim() || null,
        location: values.location.trim() || null,
        website: values.website.trim() || null,
        phone: values.phone.trim() || null,
      } as any);
      await refreshUser();
      setSaved(true);
      setTimeout(() => navigation.goBack(), 900);
    } catch (err: any) {
      setError(err?.message || 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backArrow}>‹</Text>
          <Text style={s.backText}>Profile</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Basic Info</Text>
        <TouchableOpacity
          style={[s.saveBtn, saving && s.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={s.saveBtnText}>{saved ? '✓ Saved' : 'Save'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info banner */}
        <View style={s.infoBanner}>
          <Text style={s.infoBannerText}>
            🌟 Fill in your profile to connect with the Photo Healthy community.
          </Text>
        </View>

        {/* Email (read-only) */}
        <View style={s.fieldGroup}>
          <View style={s.fieldHeader}>
            <Text style={s.fieldIcon}>📧</Text>
            <Text style={s.fieldLabel}>Email</Text>
          </View>
          <View style={s.fieldInputWrap}>
            <TextInput
              style={[s.fieldInput, s.fieldInputReadOnly]}
              value={user?.email || ''}
              editable={false}
              selectTextOnFocus={false}
            />
            <Text style={s.fieldHint}>Email cannot be changed.</Text>
          </View>
        </View>

        {/* Editable fields */}
        {FIELDS.map((f) => (
          <View key={f.key} style={s.fieldGroup}>
            <View style={s.fieldHeader}>
              <Text style={s.fieldIcon}>{f.icon}</Text>
              <Text style={s.fieldLabel}>{f.label}</Text>
            </View>
            <View style={s.fieldInputWrap}>
              <TextInput
                style={[s.fieldInput, f.multiline && s.fieldInputMulti]}
                value={values[f.key]}
                onChangeText={(v) => set(f.key, v)}
                placeholder={f.placeholder}
                placeholderTextColor={C.TEXT_SECONDARY}
                multiline={f.multiline}
                numberOfLines={f.multiline ? 4 : 1}
                maxLength={f.maxLength}
                keyboardType={(f.keyboardType as any) || 'default'}
                autoCapitalize={f.key === 'website' ? 'none' : 'words'}
                autoCorrect={!f.multiline ? false : true}
              />
              {f.hint && <Text style={s.fieldHint}>{f.hint}</Text>}
              {f.maxLength && f.multiline && (
                <Text style={s.charCount}>
                  {(values[f.key] || '').length} / {f.maxLength}
                </Text>
              )}
            </View>
          </View>
        ))}

        {/* Error */}
        {error && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {/* Success */}
        {saved && (
          <View style={s.successBox}>
            <Text style={s.successText}>✅ Profile saved!</Text>
          </View>
        )}

        {/* Save button at bottom too */}
        <TouchableOpacity
          style={[s.bigSaveBtn, saving && s.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.bigSaveBtnText}>{saved ? '✓ Profile Saved!' : 'Save Profile'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.BG },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.CARD_BORDER,
    backgroundColor: C.BG,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 60,
  },
  backArrow: {
    color: C.TEAL,
    fontSize: 28,
    lineHeight: 28,
    marginRight: 2,
  },
  backText: {
    color: C.TEAL,
    fontSize: 15,
    fontWeight: '500',
  },
  headerTitle: {
    flex: 1,
    color: C.TEXT,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  saveBtn: {
    backgroundColor: C.ORANGE,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  scroll: { flex: 1 },

  // Info banner
  infoBanner: {
    margin: 16,
    backgroundColor: 'rgba(0,188,212,0.08)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,188,212,0.2)',
  },
  infoBannerText: {
    color: C.TEAL,
    fontSize: 13,
    lineHeight: 20,
  },

  // Field groups
  fieldGroup: {
    marginHorizontal: 16,
    marginBottom: 18,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldIcon: { fontSize: 16, marginRight: 8 },
  fieldLabel: {
    color: C.TEXT,
    fontSize: 14,
    fontWeight: '600',
  },
  fieldInputWrap: {},
  fieldInput: {
    backgroundColor: C.CARD_BG,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: C.TEXT,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  fieldInputReadOnly: {
    opacity: 0.5,
  },
  fieldInputMulti: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  fieldHint: {
    color: C.TEXT_SECONDARY,
    fontSize: 11,
    marginTop: 5,
    marginLeft: 4,
    opacity: 0.7,
  },
  charCount: {
    color: C.TEXT_SECONDARY,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
    opacity: 0.6,
  },

  // Error / Success
  errorBox: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(245,101,101,0.1)',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F56565',
  },
  errorText: { color: '#F56565', fontSize: 14 },
  successBox: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(72,187,120,0.1)',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#48BB78',
  },
  successText: { color: '#48BB78', fontSize: 14, fontWeight: '600' },

  // Big save button
  bigSaveBtn: {
    margin: 16,
    backgroundColor: C.ORANGE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  bigSaveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default EditProfileScreen;
