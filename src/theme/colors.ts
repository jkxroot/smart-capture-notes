export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  border: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentLight: string;
  accentForeground: string;
  danger: string;
  dangerLight: string;
  dangerForeground: string;
  skeleton: string;
  overlay: string;
}

export const lightColors: ThemeColors = {
  background: '#FBFBFA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#F3F2EE',
  border: '#E6E4DF',
  borderSubtle: '#EFECE6',
  textPrimary: '#1A1817',
  textSecondary: '#6B6661',
  textTertiary: '#9E9891',
  accent: '#C25E3E',
  accentLight: '#FDF2EE',
  accentForeground: '#FFFFFF',
  danger: '#C93B3B',
  dangerLight: '#FDF2F2',
  dangerForeground: '#FFFFFF',
  skeleton: '#EAE8E2',
  overlay: 'rgba(26, 24, 23, 0.45)',
};

export const darkColors: ThemeColors = {
  background: '#161514',
  surface: '#201E1C',
  surfaceElevated: '#282624',
  surfaceMuted: '#262421',
  border: '#33302C',
  borderSubtle: '#292723',
  textPrimary: '#F6F4EF',
  textSecondary: '#A39E97',
  textTertiary: '#706B64',
  accent: '#DE7552',
  accentLight: '#33201A',
  accentForeground: '#FFFFFF',
  danger: '#E54D4D',
  dangerLight: '#351C1C',
  dangerForeground: '#FFFFFF',
  skeleton: '#2B2825',
  overlay: 'rgba(0, 0, 0, 0.7)',
};
