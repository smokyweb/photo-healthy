/**
 * ScreenWithNav — wraps any screen with TopNavBar on web.
 * Use this for all outer stack screens (ChallengeDetail, Shop, etc.)
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import TopNavBar from './TopNavBar';
import { C } from '../theme';

interface Props {
  children: React.ReactNode;
}

// Inject global CSS once to fix React Navigation's overflow:hidden on web
let cssInjected = false;
function injectScrollFix() {
  if (cssInjected || Platform.OS !== 'web' || typeof document === 'undefined') return;
  cssInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    /* ===== iOS SCROLL FIX for React Native Web ===== */
    /* Enable momentum scrolling on all scrollable containers */
    * { -webkit-overflow-scrolling: touch; }
    /* Ensure RN ScrollView renders correctly on iOS Safari */
    [role="scrollbar"] { display: none; }
    /* The actual scroll container RN Web creates */
    .css-scrollbars-h { overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; }
    .css-scrollbars-v { overflow-y: auto !important; -webkit-overflow-scrolling: touch !important; }
    /* Prevent tap delay on touch devices */
    a, button, [role="button"] { touch-action: manipulation; }
    /* Safe area insets for iPhone notch/home indicator */
    body { padding-bottom: env(safe-area-inset-bottom, 0px); }
  `;
  document.head.appendChild(style);
}

export default function ScreenWithNav({ children }: Props) {
  useEffect(() => { injectScrollFix(); }, []);

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
  },
  content: {
    flex: 1,
  },
});
