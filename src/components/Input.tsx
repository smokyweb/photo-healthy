import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { C, borderRadius } from '../theme';

interface Props {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  multiline?: boolean;
  numberOfLines?: number;
  style?: ViewStyle;
  error?: string;
  editable?: boolean;
}

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  multiline,
  numberOfLines,
  style,
  error,
  editable = true,
}: Props) {
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrap,
          focused && styles.inputFocused,
          !!error && styles.inputError,
        ]}
      >
        <TextInput
          style={[styles.input, multiline && { height: (numberOfLines || 3) * 24 }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.TEXT_MUTED}
          secureTextEntry={secureTextEntry && !showPw}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={editable}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPw(v => !v)} style={styles.eyeBtn}>
            <Text style={styles.eyeText}>{showPw ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  label: { color: C.TEXT_SECONDARY, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  inputWrap: {
    backgroundColor: C.INPUT_BG,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: C.CARD_BORDER,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputFocused: { borderColor: C.ORANGE },
  inputError: { borderColor: C.ERROR },
  input: {
    flex: 1,
    color: C.TEXT,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'Inter, sans-serif',
  },
  eyeBtn: { paddingHorizontal: 12 },
  eyeText: { fontSize: 16 },
  errorText: { color: C.ERROR, fontSize: 12, marginTop: 4 },
});
