export const colors = {
  bg: '#FFFFFF',
  surface: '#F5F5F7',
  text: '#0F0F10',
  muted: '#6E6E73',
  primary: '#000000',
  accent: '#1FBA5C',
  warn: '#F2A100',
  danger: '#E0383E',
  border: '#E5E5EA',
};

export const spacing = (n) => n * 8;

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700', color: colors.text },
  h2: { fontSize: 22, fontWeight: '700', color: colors.text },
  h3: { fontSize: 18, fontWeight: '600', color: colors.text },
  body: { fontSize: 16, color: colors.text },
  caption: { fontSize: 13, color: colors.muted },
};
