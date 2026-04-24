import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { C, borderRadius, fonts } from '../theme';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
}

export default function GradientButton({ label, onPress, loading, disabled, style, textStyle, variant = 'primary' }: Props) {
  const bg =
    variant === 'secondary' ? C.CARD_BG :
    variant === 'outline' ? 'transparent' :
    variant === 'danger' ? C.DANGER :
    C.ORANGE;

  const border = variant === 'outline' ? { borderWidth: 1.5, borderColor: C.ORANGE } : {};

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.btn,
        { backgroundColor: bg, opacity: disabled || loading ? 0.6 : 1 },
        border,
        style,
      ]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text style={[styles.text, variant === 'outline' && { color: C.ORANGE }, textStyle]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  text: {
    ...fonts.bodyLG,
    color: C.WHITE,
    fontWeight: '700',
  },
});
