import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface LoadingOverlayProps {
  message?: string;
  transparent?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Loading...',
  transparent = false,
}) => {
  const { colors, typography, spacing, borderRadius } = useTheme();

  return (
    <View
      style={[
        styles.container,
        transparent
          ? { backgroundColor: colors.overlay }
          : { backgroundColor: colors.background },
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel={message}
    >
      <View
        style={[
          styles.contentCard,
          {
            backgroundColor: colors.surface,
            borderRadius: borderRadius.lg,
            padding: spacing.xl,
            borderColor: colors.cardBorder,
            borderWidth: 1,
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        {message ? (
          <Text
            style={[
              styles.messageText,
              typography.bodyMedium,
              { color: colors.textPrimary, marginTop: spacing.md },
            ]}
          >
            {message}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  contentCard: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  messageText: {
    textAlign: 'center',
    fontWeight: '500',
  },
});
