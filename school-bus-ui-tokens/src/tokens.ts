export const colorTokens = {
  light: {
    background: '#F8FAFC',
    foreground: '#0F172A',
    card: '#FFFFFF',
    primary: '#2563EB',
    secondary: '#7C3AED',
    success: '#16A34A',
    danger: '#DC2626',
    muted: '#64748B',
    border: '#E2E8F0',
  },
  dark: {
    background: '#020617',
    foreground: '#E2E8F0',
    card: '#0F172A',
    primary: '#60A5FA',
    secondary: '#A78BFA',
    success: '#4ADE80',
    danger: '#F87171',
    muted: '#94A3B8',
    border: '#1E293B',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
} as const;

export const typography = {
  display: 32,
  h1: 26,
  h2: 22,
  h3: 18,
  body: 16,
  bodySm: 14,
  caption: 12,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const motion = {
  quick: 180,
  normal: 280,
  slow: 420,
} as const;
