import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export const ConfigErrorScreen: React.FC = () => {
  const { colors, typography, spacing, borderRadius } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.xxl }]}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.errorBackground, borderRadius: borderRadius.pill },
          ]}
        >
          <Ionicons name="warning-outline" size={48} color={colors.error} />
        </View>

        <Text style={[styles.title, typography.h2, { color: colors.textPrimary }]}>
          Supabase Configuration Missing
        </Text>

        <Text style={[styles.description, typography.bodyLarge, { color: colors.textSecondary }]}>
          Smart Capture & Notes requires Supabase API credentials to connect to Auth, Database, and Storage.
        </Text>

        <View
          style={[
            styles.instructionsCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
              borderRadius: borderRadius.lg,
              padding: spacing.lg,
            },
          ]}
        >
          <Text style={[styles.instructionsTitle, typography.labelLarge, { color: colors.textPrimary }]}>
            Setup Instructions:
          </Text>

          <Text style={[styles.step, typography.bodyMedium, { color: colors.textSecondary }]}>
            1. Copy the example file:{'\n'}
            <Text style={styles.code}>cp .env.example .env</Text>
          </Text>

          <Text style={[styles.step, typography.bodyMedium, { color: colors.textSecondary }]}>
            2. Open <Text style={styles.code}>.env</Text> and add your credentials:
          </Text>
          <View style={[styles.codeBox, { backgroundColor: colors.surfaceMuted, borderRadius: borderRadius.sm }]}>
            <Text style={[styles.codeText, { color: colors.textPrimary }]}>
              EXPO_PUBLIC_SUPABASE_URL=https://xyz.supabase.co{'\n'}
              EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJh...
            </Text>
          </View>

          <Text style={[styles.step, typography.bodyMedium, { color: colors.textSecondary }]}>
            3. Run the SQL schema in Supabase SQL Editor:{'\n'}
            <Text style={styles.code}>supabase/schema.sql</Text>
          </Text>

          <Text style={[styles.step, typography.bodyMedium, { color: colors.textSecondary }]}>
            4. Restart the Expo development server:
          </Text>
          <View style={[styles.codeBox, { backgroundColor: colors.surfaceMuted, borderRadius: borderRadius.sm }]}>
            <Text style={[styles.codeText, { color: colors.textPrimary }]}>
              npx expo start -c
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 380,
  },
  instructionsCard: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
  },
  instructionsTitle: {
    marginBottom: 12,
  },
  step: {
    marginBottom: 10,
    lineHeight: 22,
  },
  code: {
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  codeBox: {
    padding: 10,
    marginBottom: 12,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
});
