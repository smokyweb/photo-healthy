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
    /* Allow React Navigation screens to scroll naturally in the browser */
    #root > div, [data-testid="rnw-root"] { height: auto !important; min-height: 100vh; }
    /* RN Web stack card containers */
    .css-view-175oi2r { overflow: visible !important; }
    /* Make the top-level app container fill viewport but not clip */
    html, body { height: auto !important; min-height: 100%; overflow-x: hidden; }
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
    backgroundColor: C.BG,
    ...(Platform.OS === 'web' ? {
      minHeight: '100vh' as any,
    } : { flex: 1 }),
  },
  content: {
    ...(Platform.OS === 'web' ? {
      flex: 'unset' as any,
    } : { flex: 1 }),
  },
});
