import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetwork } from '../context/NetworkContext';
import { useTheme } from '../context/ThemeContext';

export const OfflineBanner = () => {
  const { isOffline } = useNetwork();
  const { colors, typography, spacing } = useTheme();

  if (!isOffline) return null;

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: colors.surfaceMuted,
          borderBottomColor: colors.border,
          paddingVertical: spacing.xs + 2,
        },
      ]}
      accessibilityRole="alert"
      accessibilityLabel="Offline banner"
    >
      <Ionicons
        name="cloud-offline-outline"
        size={14}
        color={colors.textSecondary}
        style={styles.icon}
      />
      <Text style={[typography.caption, { color: colors.textSecondary }]}>
        You are offline
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    width: '100%',
  },
  icon: {
    marginRight: 6,
  },
});
