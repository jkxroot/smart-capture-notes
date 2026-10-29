import { Modal, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Button } from './Button';

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

export const ConfirmDialog = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();

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
            styles.dialog,
            shadows.dialog,
            {
              backgroundColor: colors.surface,
              borderRadius: borderRadius.lg,
              padding: spacing.xl,
              borderColor: colors.border,
            },
          ]}
          accessibilityRole="alert"
          accessibilityLabel={title}
        >
          <Text
            style={[
              typography.h3,
              { color: colors.textPrimary, marginBottom: spacing.xs, textAlign: 'center' },
            ]}
          >
            {title}
          </Text>

          <Text
            style={[
              typography.bodyMedium,
              { color: colors.textSecondary, marginBottom: spacing.xl, textAlign: 'center' },
            ]}
          >
            {message}
          </Text>

          <View style={styles.actions}>
            <Button
              label={cancelLabel}
              onPress={onCancel}
              variant="secondary"
              size="medium"
              disabled={loading}
              style={styles.btn}
            />
            <Button
              label={confirmLabel}
              onPress={onConfirm}
              variant={isDestructive ? 'destructive' : 'primary'}
              size="medium"
              loading={loading}
              style={styles.btn}
            />
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
  dialog: {
    width: '100%',
    maxWidth: 380,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
  },
});
