import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useRecords } from '../../src/context/RecordsContext';
import { recordService } from '../../src/services/recordService';
import { Screen } from '../../src/components/Screen';
import { IconButton } from '../../src/components/IconButton';
import { Card } from '../../src/components/Card';
import { Category, CATEGORIES } from '../../src/types/record';

export default function DashboardScreen() {
  const router = useRouter();
  const { setSelectedCategory } = useRecords();
  const { colors, typography, spacing, borderRadius } = useTheme();

  const [stats, setStats] = useState<Record<Category, number>>({
    Personal: 0,
    Work: 0,
    Ideas: 0,
    Receipts: 0,
    Travel: 0,
    Other: 0,
  });
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (isRefresh: boolean = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const {
      stats: fetchedStats,
      total: fetchedTotal,
      error: fetchError,
    } = await recordService.getCategoryStats();

    setStats(fetchedStats);
    setTotal(fetchedTotal);
    setError(fetchError);

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category);
    router.replace('/(app)');
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={[styles.topBar, { borderBottomColor: colors.borderSubtle, paddingHorizontal: spacing.md }]}>
        <IconButton
          name="chevron-back"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
        />

        <Text style={[typography.h3, { color: colors.textPrimary }]}>
          Dashboard
        </Text>

        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchStats(true)}
            tintColor={colors.accent}
          />
        }
      >
        {/* Total Notes Card */}
        <Card style={styles.totalCard}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            Total Notes
          </Text>
          <Text style={[styles.totalNumber, typography.h1, { color: colors.textPrimary, marginTop: 4 }]}>
            {total}
          </Text>
        </Card>

        {/* Category Breakdown Header */}
        <Text style={[styles.sectionTitle, typography.labelLarge, { color: colors.textPrimary }]}>
          Notes by Category
        </Text>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="small" color={colors.accent} />
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={[typography.bodyMedium, { color: colors.danger, textAlign: 'center' }]}>
              {error}
            </Text>
            <TouchableOpacity
              onPress={() => fetchStats(false)}
              style={[
                styles.retryBtn,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderRadius: borderRadius.md,
                  marginTop: 12,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Retry loading dashboard"
            >
              <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.barsContainer}>
            {CATEGORIES.map((category) => {
              const count = stats[category] || 0;
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

              return (
                <TouchableOpacity
                  key={category}
                  onPress={() => handleSelectCategory(category)}
                  activeOpacity={0.7}
                  style={[
                    styles.barRow,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderRadius: borderRadius.md,
                      padding: spacing.md,
                      marginBottom: spacing.sm,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${category}: ${count} notes (${percentage}%)`}
                >
                  <View style={styles.barLabelRow}>
                    <Text style={[typography.labelMedium, { color: colors.textPrimary }]}>
                      {category}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>
                      {count} ({percentage}%)
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.progressTrack,
                      {
                        backgroundColor: colors.surfaceMuted,
                        borderRadius: borderRadius.pill,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.max(percentage, count > 0 ? 3 : 0)}%`,
                          backgroundColor: colors.accent,
                          borderRadius: borderRadius.pill,
                        },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  content: {
    paddingBottom: 40,
  },
  totalCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 24,
  },
  totalNumber: {
    fontSize: 40,
    lineHeight: 46,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  centerContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barsContainer: {
    width: '100%',
  },
  barRow: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTrack: {
    height: 6,
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});
