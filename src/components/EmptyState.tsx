import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  isError?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  isError = false,
}) => {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const defaultIcon: keyof typeof Ionicons.glyphMap = isError
    ? 'cloud-offline-outline'
    : 'document-text-outline';

  const displayIcon = icon || defaultIcon;

  return (
    <View style={[styles.container, { padding: spacing.xxl }]}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: isError ? colors.errorBackground : colors.surfaceMuted,
            borderRadius: borderRadius.pill,
          },
        ]}
      >
        <Ionicons
          name={displayIcon}
          size={42}
          color={isError ? colors.error : colors.textTertiary}
        />
      </View>

      <Text
        style={[
          styles.title,
          typography.h3,
          { color: colors.textPrimary, marginBottom: spacing.xs },
        ]}
      >
        {title}
      </Text>

      {description ? (
        <Text
          style={[
            styles.description,
            typography.bodyMedium,
            { color: colors.textSecondary, marginBottom: spacing.lg },
          ]}
        >
          {description}
        </Text>
      ) : null}

      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          style={[
            styles.actionBtn,
            {
              backgroundColor: isError ? colors.error : colors.primary,
              borderRadius: borderRadius.md,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
            },
          ]}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text
            style={[
              styles.actionBtnText,
              typography.labelLarge,
              { color: colors.primaryForeground },
            ]}
          >
            {actionLabel}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 260,
  },
  iconContainer: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    maxWidth: 320,
  },
  actionBtn: {
    marginTop: 8,
  },
  actionBtnText: {
    fontWeight: '600',
  },
});
