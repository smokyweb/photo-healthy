export const C = {
  BG: '#202333',
  CARD_BG: '#3B3E4F',
  CARD_BG2: '#2E3145',
  NAV_BG: '#202333',
  INPUT_BG: '#3B3E4F',
  BLACK: '#202333',
  DARK: '#3B3E4F',
  MED_DARK: '#4C5763',
  MED: '#6F7D8B',
  MED_LIGHT: '#C0C7D1',
  LIGHT: '#EAECEF',
  ULTRA_LIGHT: '#F0F5FC',
  WHITE: '#FFFFFF',
  TEXT: '#FFFFFF',
  TEXT_SECONDARY: '#C0C7D1',
  TEXT_MUTED: '#6F7D8B',
  TEXT_DISABLED: '#4C5763',
  ORANGE: '#F55B09',
  ORANGE_MID: '#FFA400',
  ORANGE_END: '#FFD000',
  TEAL: '#54DFB6',
  TEAL_DARK: '#29B6E0',
  DANGER: '#E20E32',
  WARNING: '#FFA400',
  SUCCESS: '#54DFB6',
  ERROR: '#E20E32',
  CARD_BORDER: 'rgba(255,255,255,0.08)',
  DIVIDER: 'rgba(255,255,255,0.06)',
  OVERLAY: 'rgba(0,0,0,0.6)',
};

export const gradients = {
  primary: ['#F55B09', '#FFD000'] as [string, string],
  secondary: ['#FFD000', '#29B6E0'] as [string, string],
};

export const borderRadius = { sm: 6, md: 8, lg: 12, xl: 16, pill: 999 };

export const colors = {
  primary: C.ORANGE,
  accent: C.TEAL,
  white: '#FFFFFF',
  black: C.BLACK,
  primaryBg: C.BG,
  success: C.SUCCESS,
  error: C.ERROR,
  warning: C.WARNING,
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const fonts = {
  displayXL: {
    fontFamily: "'Lexend', sans-serif",
    fontWeight: '800' as const,
    fontSize: 40,
    lineHeight: 48,
  },
  headingLG: {
    fontFamily: "'Lexend', sans-serif",
    fontWeight: '700' as const,
    fontSize: 20,
    lineHeight: 28,
  },
  bodyLG: {
    fontFamily: "'Inter', sans-serif",
    fontWeight: '500' as const,
    fontSize: 16,
    lineHeight: 24,
  },
};
