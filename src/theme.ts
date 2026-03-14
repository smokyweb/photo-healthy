// Design System Colors
export const C = {
  BG: '#0D1117',
  CARD_BG: '#161B2E',
  CARD_BG2: '#1A1E2E',
  ORANGE: '#FF8C00',
  ORANGE_END: '#FFA500',
  TEAL: '#06B6D4',
  TEXT: '#FFFFFF',
  TEXT_SECONDARY: '#94A3B8',
  TEXT_MUTED: 'rgba(255,255,255,0.5)',
  ERROR: '#F56565',
  SUCCESS: '#48BB78',
  CARD_BORDER: 'rgba(255,255,255,0.08)',
  NAV_BG: '#0A0E1A',
  INPUT_BG: '#1E2235',
};

// Legacy exports for screens that still use them
export const colors = {
  primary: C.ORANGE,
  primaryDark: '#E07B00',
  primaryLight: C.ORANGE_END,
  primaryBg: C.BG,
  accent: C.TEAL,
  white: '#FFFFFF',
  black: '#1A202C',
  gray: {
    50: '#F7FAFC',
    100: '#EDF2F7',
    200: '#E2E8F0',
    300: '#CBD5E0',
    400: '#A0AEC0',
    500: '#718096',
    600: '#4A5568',
    700: '#2D3748',
    800: '#1A202C',
  },
  success: '#48BB78',
  error: '#F56565',
  warning: '#ECC94B',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
};
