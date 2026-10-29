import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '../types/record';
import { useTheme } from '../context/ThemeContext';
import { CATEGORY_ICONS } from '../utils/constants';

interface CategoryChipProps {
  category: Category | 'All';
  selected?: boolean;
  onPress?: () => void;
  showIcon?: boolean;
  size?: 'small' | 'medium';
}

export const CategoryChip: React.FC<CategoryChipProps> = ({
  category,
  selected = false,
  onPress,
  showIcon = true,
  size = 'medium',
}) => {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const isAll = category === 'All';
  const categoryColor = isAll
    ? colors.primary
    : colors.categoryColors[category as Category] || colors.primary;

  const iconName = isAll
    ? 'apps-outline'
    : CATEGORY_ICONS[category as Category] || 'folder-outline';

  const isSmall = size === 'small';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Filter category: ${category}`}
      style={[
        styles.chip,
        {
          borderRadius: borderRadius.pill,
          paddingHorizontal: isSmall ? spacing.sm : spacing.md,
          paddingVertical: isSmall ? spacing.xs : spacing.sm,
          backgroundColor: selected
            ? categoryColor
            : colors.surfaceMuted,
          borderColor: selected ? categoryColor : colors.borderSubtle,
          borderWidth: 1,
        },
      ]}
    >
      {showIcon && (
        <Ionicons
          name={iconName as keyof typeof Ionicons.glyphMap}
          size={isSmall ? 13 : 16}
          color={selected ? '#FFFFFF' : colors.textSecondary}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          isSmall ? typography.labelSmall : typography.labelMedium,
          {
            color: selected ? '#FFFFFF' : colors.textSecondary,
            fontWeight: selected ? '700' : '500',
          },
        ]}
      >
        {category}
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
    marginRight: 6,
  },
});
