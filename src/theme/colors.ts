export const palette = {
  // Brand colors
  primary: '#2563EB',      // Modern deep blue
  primaryLight: '#3B82F6',
  primaryDark: '#1D4ED8',
  primaryMuted: '#DBEAFE',

  // Secondary & Accents
  accent: '#06B6D4',       // Vibrant cyan
  accentDark: '#0891B2',

  // Category specific accent colors (consistent for chips and badges)
  categoryPersonal: '#8B5CF6', // Purple
  categoryWork: '#3B82F6',     // Blue
  categoryIdeas: '#F59E0B',    // Amber / Yellow
  categoryReceipts: '#10B981', // Emerald / Green
  categoryTravel: '#EC4899',   // Pink
  categoryOther: '#6B7280',    // Gray

  // Neutrals - Light
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  black: '#000000',

  // Semantic
  success: '#10B981',
  successLight: '#D1FAE5',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
};

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  card: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  border: string;
  borderSubtle: string;
  primary: string;
  primaryForeground: string;
  primaryMuted: string;
  accent: string;
  error: string;
  errorBackground: string;
  success: string;
  successBackground: string;
  warning: string;
  warningBackground: string;
  skeleton: string;
  overlay: string;
  categoryColors: {
    Personal: string;
    Work: string;
    Ideas: string;
    Receipts: string;
    Travel: string;
    Other: string;
  };
}

export const lightColors: ThemeColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  card: '#FFFFFF',
  cardBorder: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',
  border: '#CBD5E1',
  borderSubtle: '#E2E8F0',
  primary: '#2563EB',
  primaryForeground: '#FFFFFF',
  primaryMuted: '#EFF6FF',
  accent: '#0284C7',
  error: '#DC2626',
  errorBackground: '#FEF2F2',
  success: '#16A34A',
  successBackground: '#F0FDF4',
  warning: '#D97706',
  warningBackground: '#FFFBEB',
  skeleton: '#E2E8F0',
  overlay: 'rgba(15, 23, 42, 0.45)',
  categoryColors: {
    Personal: '#8B5CF6',
    Work: '#2563EB',
    Ideas: '#D97706',
    Receipts: '#059669',
    Travel: '#DB2777',
    Other: '#64748B',
  },
};

export const darkColors: ThemeColors = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceElevated: '#334155',
  surfaceMuted: '#1E293B',
  card: '#1E293B',
  cardBorder: '#334155',
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textTertiary: '#64748B',
  textInverse: '#0F172A',
  border: '#334155',
  borderSubtle: '#1E293B',
  primary: '#3B82F6',
  primaryForeground: '#FFFFFF',
  primaryMuted: '#1E3A8A',
  accent: '#38BDF8',
  error: '#F87171',
  errorBackground: '#450A0A',
  success: '#4ADE80',
  successBackground: '#052E16',
  warning: '#FBBF24',
  warningBackground: '#451A03',
  skeleton: '#334155',
  overlay: 'rgba(0, 0, 0, 0.7)',
  categoryColors: {
    Personal: '#A78BFA',
    Work: '#60A5FA',
    Ideas: '#FBBF24',
    Receipts: '#34D399',
    Travel: '#F472B6',
    Other: '#94A3B8',
  },
};
