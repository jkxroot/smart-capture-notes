import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: 'small' | 'medium';
}

export const Chip = ({
  label,
  selected = false,
  onPress,
  icon,
  size = 'medium',
}: ChipProps) => {
  const { colors, typography, borderRadius, spacing } = useTheme();

  const handlePress = () => {
    if (!onPress) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  const isSmall = size === 'small';

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={!onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Filter: ${label}`}
      style={[
        styles.chip,
        {
          borderRadius: borderRadius.pill,
          paddingHorizontal: isSmall ? spacing.sm : spacing.md,
          paddingVertical: isSmall ? 4 : 7,
          backgroundColor: selected ? colors.accent : colors.surface,
          borderColor: selected ? colors.accent : colors.border,
          borderWidth: StyleSheet.hairlineWidth,
        },
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={isSmall ? 13 : 15}
          color={selected ? colors.accentForeground : colors.textSecondary}
          style={styles.icon}
        />
      ) : null}
      <Text
        style={[
          isSmall ? typography.labelSmall : typography.labelMedium,
          {
            color: selected ? colors.accentForeground : colors.textPrimary,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  icon: {
    marginRight: 5,
  },
});
