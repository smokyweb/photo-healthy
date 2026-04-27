import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { updateProfile, changePassword } from '../services/api';
import Input from '../components/Input';
import GradientButton from '../components/GradientButton';
import { C } from '../theme';

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), bio: bio.trim() });
      await refreshUser();
      Alert.alert('Saved', 'Profile updated successfully!');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      Alert.alert('Error', 'Please fill in all password fields.');
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    if (newPw.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    setChangingPw(true);
    try {
      await changePassword(currentPw, newPw);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      Alert.alert('Success', 'Password changed!');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setChangingPw(false);
  };

  return (
    <ScrollView style={styles.screen} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Edit Profile</Text>

        <Input label="Name" value={name} onChangeText={setName} autoCapitalize="words" />
        <Input
          label="Bio"
          value={bio}
          onChangeText={setBio}
          placeholder="Tell the community about yourself..."
          multiline
          numberOfLines={3}
          autoCapitalize="sentences"
        />

        <GradientButton label="Save Changes" onPress={handleSave} loading={saving} style={{ marginBottom: 32 }} />

        <Text style={styles.sectionTitle}>Change Password</Text>
        <Input label="Current Password" value={currentPw} onChangeText={setCurrentPw} secureTextEntry />
        <Input label="New Password" value={newPw} onChangeText={setNewPw} secureTextEntry />
        <Input label="Confirm New Password" value={confirmPw} onChangeText={setConfirmPw} secureTextEntry />

        <GradientButton label="Change Password" onPress={handleChangePassword} loading={changingPw} variant="outline" />

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.BG },
  container: { padding: 20 },
  back: { marginBottom: 20 },
  backText: { color: C.ORANGE, fontSize: 15 },
  title: { color: C.TEXT, fontSize: 24, fontWeight: '800', marginBottom: 20 },
  sectionTitle: { color: C.TEXT, fontSize: 18, fontWeight: '700', marginBottom: 12 },
});
