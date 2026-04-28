/**
 * ScreenWithNav — wraps any screen with TopNavBar on web.
 * Use this for all outer stack screens (ChallengeDetail, Shop, etc.)
 */
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import TopNavBar from './TopNavBar';
import { C } from '../theme';

interface Props {
  children: React.ReactNode;
}

export default function ScreenWithNav({ children }: Props) {
  return (
    <View style={s.root}>
      {Platform.OS === 'web' && <TopNavBar />}
      <View style={s.content}>
        {children}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.BG,
    // On web, allow content to grow and let browser scroll
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as any, display: 'flex' as any, flexDirection: 'column' as any } : {}),
  },
  content: {
    flex: 1,
    // On web, allow the content area to grow naturally
    ...(Platform.OS === 'web' ? { flexGrow: 1 as any } : {}),
  },
});
