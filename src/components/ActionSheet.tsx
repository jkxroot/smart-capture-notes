import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export interface ActionOption {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
}

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  options: ActionOption[];
}

export const ActionSheet = ({
  visible,
  onClose,
  title,
  options,
}: ActionSheetProps) => {
  const { colors, typography, borderRadius, spacing } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.sheet,
                {
                  backgroundColor: colors.surface,
                  borderTopLeftRadius: borderRadius.lg,
                  borderTopRightRadius: borderRadius.lg,
                  paddingBottom: spacing.xxl,
                },
              ]}
            >
              {title ? (
                <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
                  <Text style={[typography.labelMedium, { color: colors.textSecondary }]}>
                    {title}
                  </Text>
                </View>
              ) : null}

              {options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    onClose();
                    setTimeout(option.onPress, 150);
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  style={[
                    styles.optionRow,
                    { borderBottomColor: colors.borderSubtle },
                  ]}
                >
                  {option.icon ? (
                    <Ionicons
                      name={option.icon}
                      size={20}
                      color={option.destructive ? colors.danger : colors.textPrimary}
                      style={styles.optionIcon}
                    />
                  ) : null}
                  <Text
                    style={[
                      typography.bodyLarge,
                      {
                        color: option.destructive ? colors.danger : colors.textPrimary,
                        fontWeight: option.destructive ? '600' : '400',
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                style={[
                  styles.cancelBtn,
                  {
                    backgroundColor: colors.surfaceMuted,
                    borderRadius: borderRadius.md,
                    marginTop: spacing.md,
                    marginHorizontal: spacing.lg,
                  },
                ]}
              >
                <Text style={[typography.labelLarge, { color: colors.textPrimary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    paddingTop: 8,
  },
  header: {
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionIcon: {
    marginRight: 14,
  },
  cancelBtn: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
