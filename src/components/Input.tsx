import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
  showClear?: boolean;
  onClear?: () => void;
  showCounterNearLimit?: boolean;
}

export const Input = ({
  label,
  error,
  containerStyle,
  isPassword = false,
  showClear = false,
  onClear,
  showCounterNearLimit = false,
  value = '',
  maxLength,
  multiline,
  ...rest
}: InputProps) => {
  const { colors, typography, borderRadius, spacing } = useTheme();
  const [hidePassword, setHidePassword] = useState(isPassword);
  const [focused, setFocused] = useState(false);

  const length = value.length;
  const isNearLimit = maxLength ? length >= Math.floor(maxLength * 0.8) : false;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={[typography.labelMedium, { color: colors.textSecondary }]}>
            {label}
          </Text>
          {showCounterNearLimit && isNearLimit && maxLength ? (
            <Text
              style={[
                typography.caption,
                { color: length >= maxLength ? colors.danger : colors.textTertiary },
              ]}
            >
              {length}/{maxLength}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : focused ? colors.accent : colors.border,
            borderRadius: borderRadius.md,
            minHeight: multiline ? 100 : 46,
            paddingHorizontal: spacing.md,
          },
        ]}
      >
        <TextInput
          value={value}
          maxLength={maxLength}
          multiline={multiline}
          secureTextEntry={hidePassword}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholderTextColor={colors.textTertiary}
          style={[
            styles.textInput,
            typography.bodyMedium,
            {
              color: colors.textPrimary,
              paddingVertical: multiline ? spacing.md : spacing.sm,
            },
          ]}
          {...rest}
        />

        {showClear && value.length > 0 && onClear ? (
          <TouchableOpacity
            onPress={onClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Clear input"
            style={styles.actionIcon}
          >
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        ) : null}

        {isPassword ? (
          <TouchableOpacity
            onPress={() => setHidePassword(!hidePassword)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={hidePassword ? 'Show password' : 'Hide password'}
            style={styles.actionIcon}
          >
            <Ionicons
              name={hidePassword ? 'eye-outline' : 'eye-off-outline'}
              size={18}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <Text style={[styles.errorText, typography.caption, { color: colors.danger }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  textInput: {
    flex: 1,
  },
  actionIcon: {
    padding: 4,
    marginLeft: 6,
  },
  errorText: {
    marginTop: 5,
    marginLeft: 2,
  },
});
