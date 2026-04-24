import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { C } from '../theme';

interface Props {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ message, fullScreen }: Props) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={C.ORANGE} />
      {message && <Text style={styles.text}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: C.BG,
  },
  text: {
    color: C.TEXT_SECONDARY,
    marginTop: 12,
    fontSize: 14,
  },
});
