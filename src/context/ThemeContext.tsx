import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, ThemeColors } from '../theme/colors';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { typography } from '../theme/typography';

interface ThemeContextValue {
  isDark: boolean;
  colors: ThemeColors;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  typography: typeof typography;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const isDark = systemColorScheme === 'dark';

  const value = useMemo<ThemeContextValue>(() => {
    return {
      isDark,
      colors: isDark ? darkColors : lightColors,
      spacing,
      borderRadius,
      shadows,
      typography,
    };
  }, [isDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      isDark: false,
      colors: lightColors,
      spacing,
      borderRadius,
      shadows,
      typography,
    };
  }
  return context;
};
