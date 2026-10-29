import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useNetwork } from '../../src/context/NetworkContext';
import { Screen } from '../../src/components/Screen';
import { Card } from '../../src/components/Card';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';
import { OfflineBanner } from '../../src/components/OfflineBanner';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { colors, typography, spacing, isDark } = useTheme();
  const { isOffline } = useNetwork();

  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
    setConfirmSignOut(false);
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <OfflineBanner />
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        <View style={styles.header}>
          <Text style={[typography.h1, { color: colors.textPrimary }]}>
            Settings
          </Text>
        </View>

        {/* Account Section */}
        <Text style={[styles.sectionLabel, typography.labelMedium, { color: colors.textSecondary }]}>
          Account
        </Text>
        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="mail-outline" size={18} color={colors.textSecondary} style={styles.icon} />
              <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>
                Email
              </Text>
            </View>
            <Text style={[typography.bodyMedium, { color: colors.textSecondary }]} numberOfLines={1}>
              {user?.email || 'Not available'}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons
                name={isOffline ? 'cloud-offline-outline' : 'cloud-done-outline'}
                size={18}
                color={isOffline ? colors.danger : colors.textSecondary}
                style={styles.icon}
              />
              <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>
                Network Status
              </Text>
            </View>
            <Text
              style={[
                typography.bodyMedium,
                { color: isOffline ? colors.danger : colors.textSecondary },
              ]}
            >
              {isOffline ? 'Offline' : 'Connected'}
            </Text>
          </View>
        </Card>

        {/* Appearance Section */}
        <Text style={[styles.sectionLabel, typography.labelMedium, { color: colors.textSecondary }]}>
          Appearance
        </Text>
        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons
                name={isDark ? 'moon-outline' : 'sunny-outline'}
                size={18}
                color={colors.textSecondary}
                style={styles.icon}
              />
              <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>
                Theme
              </Text>
            </View>
            <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
              {isDark ? 'Dark (System)' : 'Light (System)'}
            </Text>
          </View>
        </Card>

        {/* Danger / Sign Out */}
        <Text style={[styles.sectionLabel, typography.labelMedium, { color: colors.textSecondary }]}>
          Session
        </Text>
        <Card
          onPress={() => setConfirmSignOut(true)}
          style={[styles.card, styles.signOutCard]}
          accessibilityLabel="Sign out of your account"
        >
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="log-out-outline" size={18} color={colors.danger} style={styles.icon} />
              <Text style={[typography.labelLarge, { color: colors.danger }]}>
                Sign Out
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </View>
        </Card>
      </ScrollView>

      <ConfirmDialog
        visible={confirmSignOut}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmLabel="Sign Out"
        isDestructive
        loading={signingOut}
        onConfirm={handleSignOut}
        onCancel={() => setConfirmSignOut(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  sectionLabel: {
    marginBottom: 8,
    marginTop: 12,
  },
  card: {
    marginBottom: 10,
    paddingVertical: 14,
  },
  signOutCard: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 10,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
});
