import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const { colors, typography, spacing, borderRadius } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <View
          style={[
            styles.dialogContainer,
            {
              backgroundColor: colors.surface,
              borderRadius: borderRadius.lg,
              padding: spacing.xl,
              borderColor: colors.cardBorder,
              borderWidth: 1,
            },
          ]}
          accessibilityRole="alertdialog"
          accessibilityLabel={title}
        >
          {isDestructive && (
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: colors.errorBackground,
                  borderRadius: borderRadius.pill,
                },
              ]}
            >
              <Ionicons name="trash-outline" size={24} color={colors.error} />
            </View>
          )}

          <Text
            style={[
              styles.title,
              typography.h3,
              { color: colors.textPrimary, marginBottom: spacing.xs },
            ]}
          >
            {title}
          </Text>

          <Text
            style={[
              styles.message,
              typography.bodyMedium,
              { color: colors.textSecondary, marginBottom: spacing.xl },
            ]}
          >
            {message}
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onCancel}
              disabled={loading}
              style={[
                styles.btn,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderRadius: borderRadius.md,
                  marginRight: spacing.md,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
            >
              <Text
                style={[
                  styles.btnText,
                  typography.labelLarge,
                  { color: colors.textPrimary },
                ]}
              >
                {cancelLabel}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              style={[
                styles.btn,
                {
                  backgroundColor: isDestructive ? colors.error : colors.primary,
                  borderRadius: borderRadius.md,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.btnText,
                    typography.labelLarge,
                    { color: '#FFFFFF' },
                  ]}
                >
                  {confirmLabel}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  iconWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
  },
  btn: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  btnText: {
    fontWeight: '600',
  },
});
