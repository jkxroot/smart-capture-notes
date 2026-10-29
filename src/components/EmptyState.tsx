import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  isError?: boolean;
}

export const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  isError = false,
}: EmptyStateProps) => {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const defaultIcon: keyof typeof Ionicons.glyphMap = isError
    ? 'cloud-offline-outline'
    : 'document-text-outline';

  return (
    <View style={[styles.container, { padding: spacing.xxl }]}>
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: isError ? colors.dangerLight : colors.surfaceMuted,
            borderRadius: borderRadius.pill,
          },
        ]}
      >
        <Ionicons
          name={icon || defaultIcon}
          size={36}
          color={isError ? colors.danger : colors.textTertiary}
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
        <Button
          label={actionLabel}
          onPress={onAction}
          variant={isError ? 'secondary' : 'primary'}
          size="medium"
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
    width: '100%',
  },
  iconBox: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    maxWidth: 300,
  },
});
