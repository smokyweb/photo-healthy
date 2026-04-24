import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { C, borderRadius } from '../theme';

interface Props {
  children: ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'dark';
}

export default function Card({ children, style, variant = 'default' }: Props) {
  return (
    <View
      style={[
        styles.card,
        variant === 'dark' && { backgroundColor: C.CARD_BG2 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    padding: 16,
  },
});
