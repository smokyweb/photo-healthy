import React from 'react';
import { Image, StyleSheet, View, StyleProp, ViewStyle } from 'react-native';

const FIGURE = require('../../assets/Pose_6-removebg-preview.png');

type WatermarkSize = 'tiny' | 'small' | 'medium' | 'large';

type Props = {
  size?: WatermarkSize;
  style?: StyleProp<ViewStyle>;
};

export default function PhotoWatermark({ size = 'medium', style }: Props) {
  return (
    <View pointerEvents="none" style={[styles.wrap, sizeStyles[size], style]}>
      <Image source={FIGURE} style={styles.figure} resizeMode="contain" />
    </View>
  );
}

const sizeStyles = StyleSheet.create({
  tiny: { width: 34, height: 24, right: 5, bottom: 5 },
  small: { width: 48, height: 34, right: 7, bottom: 7 },
  medium: { width: 72, height: 50, right: 10, bottom: 10 },
  large: { width: 118, height: 82, right: 16, bottom: 16 },
});

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    overflow: 'hidden',
    opacity: 0.68,
    zIndex: 5,
  },
  figure: {
    width: '100%',
    aspectRatio: 263 / 211,
  },
});
