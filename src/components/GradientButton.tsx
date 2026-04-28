import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator, Platform } from 'react-native';
import { C, borderRadius } from '../theme';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle | any;
  textStyle?: TextStyle | any;
  variant?: 'primary' | 'secondary' | 'teal' | 'outline' | 'outline-teal' | 'danger';
  pill?: boolean; // fully rounded (default true for primary)
  size?: 'sm' | 'md' | 'lg';
}

// Gradient configurations
const GRADIENTS = {
  primary: 'linear-gradient(90deg, #F55B09, #FFD000)',   // orange → yellow
  secondary: 'linear-gradient(90deg, #FFD000, #29B6E0)', // yellow → cyan
  teal: 'linear-gradient(90deg, #54DFB6, #29B6E0)',      // teal → cyan
  danger: 'none',
  outline: 'none',
  'outline-teal': 'none',
};

const BG_COLORS = {
  primary: '#F55B09',
  secondary: '#FFD000',
  teal: '#54DFB6',
  danger: C.DANGER,
  outline: 'transparent',
  'outline-teal': 'transparent',
};

export default function GradientButton({
  label,
  onPress,
  loading,
  disabled,
  style,
  textStyle,
  variant = 'primary',
  pill = true,
  size = 'md',
}: Props) {
  const isOutline = variant === 'outline' || variant === 'outline-teal';
  const gradient = GRADIENTS[variant];
  const bgColor = BG_COLORS[variant];

  const heights = { sm: 38, md: 48, lg: 56 };
  const fontSizes = { sm: 13, md: 15, lg: 17 };

  const btnStyle: any = {
    backgroundColor: bgColor,
    height: heights[size],
    borderRadius: pill ? 999 : borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: size === 'sm' ? 16 : size === 'lg' ? 36 : 24,
    opacity: (disabled || loading) ? 0.6 : 1,
    // Gradient via CSS backgroundImage (React Native Web only)
    ...(Platform.OS === 'web' && gradient !== 'none' ? { backgroundImage: gradient } : {}),
    // Outline styles
    ...(variant === 'outline' ? { borderWidth: 1.5, borderColor: C.ORANGE } : {}),
    ...(variant === 'outline-teal' ? { borderWidth: 1.5, borderColor: C.TEAL } : {}),
  };

  const labelColor =
    variant === 'outline' ? C.ORANGE :
    variant === 'outline-teal' ? C.TEAL :
    variant === 'secondary' ? '#1A1A2E' : // dark text on light gradient
    '#FFFFFF';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[btnStyle, style]}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} size="small" />
      ) : (
        <Text style={[
          styles.text,
          { fontSize: fontSizes[size], color: labelColor },
          textStyle,
        ]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  text: {
    fontWeight: '800',
    fontFamily: "'Lexend', sans-serif",
    letterSpacing: 0.2,
  } as any,
});
