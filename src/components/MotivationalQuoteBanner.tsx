import React from 'react';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useMotivationalQuotes } from '../context/MotivationalQuoteContext';
import { C, brandGradients, fontFamilies } from '../theme';

export default function MotivationalQuoteBanner() {
  const { quote } = useMotivationalQuotes();
  const { width } = useWindowDimensions();
  const isMobile = width < 640;

  return (
    <View style={[styles.banner, isMobile && styles.bannerMobile]} accessibilityRole="text">
      <View style={styles.accent} />
      <Text style={[styles.mark, isMobile && styles.markMobile]}>“</Text>
      <View style={styles.copy}>
        <Text style={[styles.quote, isMobile && styles.quoteMobile]} numberOfLines={isMobile ? 2 : 1}>
          {quote.quote}
        </Text>
        {quote.author ? <Text style={styles.author}>— {quote.author}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    minHeight: 48,
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(30,34,50,0.98)',
    borderBottomWidth: 1,
    borderBottomColor: C.CARD_BORDER,
    position: 'relative',
  },
  bannerMobile: { minHeight: 54, paddingHorizontal: 14, paddingVertical: 8, gap: 7 },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: C.ORANGE,
    ...(Platform.OS === 'web' ? { backgroundImage: brandGradients.primaryCss135 } : {}),
  } as any,
  mark: { color: C.ORANGE_END, fontSize: 24, lineHeight: 24, fontWeight: '900', fontFamily: fontFamilies.heading },
  markMobile: { fontSize: 20, lineHeight: 20 },
  copy: { maxWidth: 980, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 8 },
  quote: { color: C.TEXT, fontSize: 14, lineHeight: 20, fontWeight: '700', textAlign: 'center', fontFamily: fontFamilies.body },
  quoteMobile: { fontSize: 12, lineHeight: 17, flex: 1, textAlign: 'left' },
  author: { color: C.TEAL, fontSize: 12, lineHeight: 18, fontWeight: '700', fontFamily: fontFamilies.body },
});
