import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';

const CITY_BG = require('../../assets/city-bg.png');

export default function AppBackground() {
  return (
    <ImageBackground
      source={CITY_BG}
      resizeMode="cover"
      style={StyleSheet.absoluteFill}
      imageStyle={styles.image}
      pointerEvents="none"
    >
      <View style={styles.tint} />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  image: {
    opacity: 0.62,
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12, 14, 24, 0.58)',
  },
});
