import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { C } from '../theme';

const PAGE_MAX_WIDTH = 1120;
const ORANGE_GRADIENT = 'linear-gradient(90deg, #F55B09 0%, #FFD000 100%)';
const ORANGE_GRADIENT_135 = 'linear-gradient(135deg, #F55B09 0%, #FFD000 100%)';
const orangeGradientText = {
  backgroundImage: ORANGE_GRADIENT,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
} as any;

const ionIcon = (name: string, color: string) => {
  const stroke = `stroke="${color}" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"`;
  const svg = (() => {
    switch (name) {
      case 'instagram':
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect ${stroke} x="80" y="80" width="352" height="352" rx="96" ry="96" fill="none"/><circle ${stroke} cx="256" cy="256" r="80" fill="none"/><circle cx="348" cy="164" r="20" fill="${color}"/></svg>`;
      case 'facebook':
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="${color}" d="M480 257.35C480 133.46 379.76 33.22 255.87 33.22S32 133.46 32 257.35c0 111.95 81.95 204.78 189 221.65V322.12h-57V257.35h57V208c0-56.21 33.45-87.28 84.61-87.28 24.5 0 50.15 4.37 50.15 4.37v55.13h-28.26c-27.84 0-36.5 17.28-36.5 35v42.12h62.12l-9.92 64.77H291V479c107.05-16.87 189-109.7 189-221.65z"/></svg>`;
      default:
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><circle cx="256" cy="256" r="160" fill="${color}"/></svg>`;
    }
  })();
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};

const IconGlyph = ({ name, color, size = 20 }: { name: string; color: string; size?: number }) => (
  <View
    style={{
      width: size,
      height: size,
      backgroundImage: ionIcon(name, color),
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: `${size}px ${size}px`,
    } as any}
  />
);

const FOOTER_ROUTES: Record<string, string> = {
  'About Us': 'About', 'FAQ': 'FAQ', 'Shop': 'Shop', 'Contact': 'Contact',
  'Partners': 'Partners', 'Privacy Policy': 'Legal', 'Terms of Service': 'Legal',
  'Community Guidelines': 'Legal', 'How It Works': 'HowItWorks',
  'Gallery': 'Gallery', 'Sign Up': 'Register', 'Log In': 'Login',
};

const COMPANY_LINKS = ['About Us', 'FAQ', 'Shop', 'Partners', 'Contact'];
const LEGAL_LINKS = ['Privacy Policy', 'Terms of Service', 'Community Guidelines'];

export default function AppFooter() {
  const nav = useNavigation<any>();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const FooterLink = ({ label }: { label: string }) => (
    <Pressable
      accessibilityRole="link"
      onPress={() => { const r = FOOTER_ROUTES[label]; if (r) nav.navigate(r as never); }}
      style={({ hovered }: any) => [
        styles.linkTouch,
        hovered && styles.linkTouchHovered,
      ]}
    >
      {({ hovered }: any) => (
        <Text style={[styles.link, hovered && styles.linkHovered]}>{label}</Text>
      )}
    </Pressable>
  );

  const SocialLink = ({ name, label }: { name: string; label: string }) => (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={() => {}}
      style={({ hovered }: any) => [
        styles.socialLink,
        hovered && styles.socialLinkHovered,
      ]}
    >
      {({ hovered }: any) => (
        <IconGlyph name={name} color={hovered ? '#FFFFFF' : C.TEXT_SECONDARY} size={20} />
      )}
    </Pressable>
  );

  return (
    <View style={styles.footer}>
      <View style={[styles.grid, isMobile && styles.gridMobile]}>
        {/* Brand */}
        <View style={[styles.brand, isMobile && styles.brandMobile]}>
          <Text style={styles.brandTitle}>Photo Healthy</Text>
          <Text style={styles.brandCopy}>
            Empowering and encouraging you to grow, connect, share in your wellness community.
          </Text>
        </View>

        {/* Company */}
        <View style={[styles.col, isMobile && styles.colMobile]}>
          <Text style={styles.colTitle}>Company</Text>
          {COMPANY_LINKS.map(item => <FooterLink key={item} label={item} />)}
        </View>

        {/* Legal */}
        <View style={[styles.col, isMobile && styles.colMobile]}>
          <Text style={styles.colTitle}>Legal</Text>
          {LEGAL_LINKS.map(item => <FooterLink key={item} label={item} />)}
        </View>

        {/* Connect */}
        <View style={[styles.col, isMobile && styles.colMobile]}>
          <Text style={styles.colTitle}>Connect</Text>
          <View style={styles.socialRow}>
            <SocialLink name="instagram" label="Instagram" />
            <SocialLink name="facebook" label="Facebook" />
          </View>
        </View>
      </View>

      <View style={styles.rule} />
      <Text style={styles.copy}>{'\u00A9'} 2026 Photo Healthy. All rights reserved.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: C.NAV_BG,
    paddingHorizontal: 36,
    paddingTop: 42,
    paddingBottom: 28,
  },
  grid: {
    flexDirection: 'row',
    gap: 42,
    maxWidth: PAGE_MAX_WIDTH,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'flex-start',
  },
  gridMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 24,
  },
  brand: {
    flex: 1.45,
    maxWidth: 270,
  },
  brandMobile: {
    flex: 0,
    maxWidth: '100%' as any,
    width: '100%' as any,
    minHeight: 92,
  },
  brandTitle: {
    color: C.TEXT,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    marginBottom: 14,
  },
  brandCopy: {
    color: C.TEXT_SECONDARY,
    fontSize: 12,
    lineHeight: 20,
  },
  col: {
    flex: 1,
    minWidth: 110,
  },
  colMobile: {
    flex: 0,
    width: '100%' as any,
    minWidth: 0,
    minHeight: 150,
  },
  colTitle: {
    color: C.TEXT,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 14,
  },
  link: {
    color: C.TEXT_SECONDARY,
    fontSize: 11,
    lineHeight: 18,
  },
  linkTouch: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    marginBottom: 3,
    cursor: 'pointer',
  } as any,
  linkTouchHovered: {
    transform: [{ translateX: 2 }],
  },
  linkHovered: {
    ...orangeGradientText,
    textShadowColor: 'rgba(255, 208, 0, 0.32)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  socialLink: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  } as any,
  socialLinkHovered: {
    backgroundColor: C.ORANGE,
    backgroundImage: ORANGE_GRADIENT_135,
    boxShadow: '0 0 14px rgba(255, 208, 0, 0.35)',
    transform: [{ translateY: -1 }],
  } as any,
  rule: {
    maxWidth: PAGE_MAX_WIDTH,
    width: '100%',
    alignSelf: 'center',
    height: 1,
    backgroundColor: C.CARD_BORDER,
    marginTop: 30,
    marginBottom: 22,
  },
  copy: {
    color: C.TEXT_MUTED,
    fontSize: 11,
    textAlign: 'center',
  },
});
