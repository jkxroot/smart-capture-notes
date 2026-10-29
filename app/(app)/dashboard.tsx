import React, { useState, useEffect, useCallback } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useRecords } from '../../src/context/RecordsContext';
import { recordService } from '../../src/services/recordService';
import { Category, CATEGORIES } from '../../src/types/record';
import { CATEGORY_ICONS } from '../../src/utils/constants';

export default function DashboardScreen() {
  const router = useRouter();
  const { setSelectedCategory } = useRecords();
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();

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

  const fetchStats = useCallback(async (isRefresh: boolean = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const { stats: fetchedStats, total: fetchedTotal } =
      await recordService.getCategoryStats();
    setStats(fetchedStats);
    setTotal(fetchedTotal);

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const navigateToCategory = (category: Category) => {
    setSelectedCategory(category);
    router.replace('/(app)');
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          style={[
            styles.loadingText,
            typography.bodyMedium,
            { color: colors.textSecondary, marginTop: spacing.md },
          ]}
        >
          Analyzing notes...
        </Text>
      </View>
    );
  }

  // Find top category
  let topCategory: Category = 'Personal';
  let topCount = -1;
  CATEGORIES.forEach((cat) => {
    if (stats[cat] > topCount) {
      topCount = stats[cat];
      topCategory = cat;
    }
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { padding: spacing.lg }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchStats(true)}
          tintColor={colors.primary}
        />
      }
    >
      {/* Overview Metric Cards */}
      <View style={styles.metricsRow}>
        {/* Total Records Card */}
        <View
          style={[
            styles.metricCard,
            shadows.sm,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
              borderRadius: borderRadius.lg,
              padding: spacing.lg,
            },
          ]}
        >
          <View
            style={[
              styles.metricIconWrap,
              { backgroundColor: colors.primaryMuted, borderRadius: borderRadius.pill },
            ]}
          >
            <Ionicons name="documents-outline" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.metricNumber, typography.h1, { color: colors.textPrimary }]}>
            {total}
          </Text>
          <Text style={[styles.metricLabel, typography.bodySmall, { color: colors.textSecondary }]}>
            Total Notes
          </Text>
        </View>

        {/* Top Category Card */}
        <View
          style={[
            styles.metricCard,
            shadows.sm,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
              borderRadius: borderRadius.lg,
              padding: spacing.lg,
            },
          ]}
        >
          <View
            style={[
              styles.metricIconWrap,
              {
                backgroundColor:
                  colors.categoryColors[topCategory] || colors.primary,
                borderRadius: borderRadius.pill,
              },
            ]}
          >
            <Ionicons
              name={CATEGORY_ICONS[topCategory] as keyof typeof Ionicons.glyphMap}
              size={24}
              color="#FFFFFF"
            />
          </View>
          <Text style={[styles.metricNumber, typography.h2, { color: colors.textPrimary }]}>
            {total > 0 ? topCategory : 'None'}
          </Text>
          <Text style={[styles.metricLabel, typography.bodySmall, { color: colors.textSecondary }]}>
            Top Category ({topCount > 0 ? topCount : 0})
          </Text>
        </View>
      </View>

      {/* Distribution Chart Section */}
      <View
        style={[
          styles.distributionCard,
          shadows.sm,
          {
            backgroundColor: colors.surface,
            borderColor: colors.cardBorder,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
            marginTop: spacing.md,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, typography.h3, { color: colors.textPrimary }]}>
          Category Distribution
        </Text>
        <Text
          style={[
            styles.sectionSubtitle,
            typography.bodySmall,
            { color: colors.textSecondary, marginBottom: spacing.lg },
          ]}
        >
          Tap any category to filter records on home
        </Text>

        {CATEGORIES.map((category) => {
          const count = stats[category] || 0;
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
          const categoryColor =
            colors.categoryColors[category] || colors.primary;
          const categoryIcon = CATEGORY_ICONS[category] || 'folder-outline';

          return (
            <TouchableOpacity
              key={category}
              onPress={() => navigateToCategory(category)}
              activeOpacity={0.7}
              style={[
                styles.categoryBarRow,
                { borderBottomColor: colors.borderSubtle },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${category}: ${count} notes, ${percentage}%`}
            >
              {/* Category Info Header */}
              <View style={styles.barHeader}>
                <View style={styles.categoryNameWrap}>
                  <View
                    style={[
                      styles.categoryDot,
                      { backgroundColor: categoryColor, borderRadius: borderRadius.pill },
                    ]}
                  >
                    <Ionicons
                      name={categoryIcon as keyof typeof Ionicons.glyphMap}
                      size={12}
                      color="#FFFFFF"
                    />
                  </View>
                  <Text
                    style={[
                      styles.categoryName,
                      typography.labelMedium,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {category}
                  </Text>
                </View>

                <View style={styles.countWrap}>
                  <Text
                    style={[
                      styles.categoryCount,
                      typography.labelMedium,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {count} notes
                  </Text>
                  <Text
                    style={[
                      styles.categoryPercentage,
                      typography.caption,
                      { color: colors.textTertiary, marginLeft: 6 },
                    ]}
                  >
                    ({percentage}%)
                  </Text>
                </View>
              </View>

              {/* Progress Bar (Plain View components) */}
              <View
                style={[
                  styles.barBackground,
                  { backgroundColor: colors.surfaceMuted, borderRadius: borderRadius.pill },
                ]}
              >
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.max(percentage, count > 0 ? 3 : 0)}%`,
                      backgroundColor: categoryColor,
                      borderRadius: borderRadius.pill,
                    },
                  ]}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {},
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    borderWidth: 1,
    alignItems: 'center',
  },
  metricIconWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricNumber: {
    fontWeight: '700',
  },
  metricLabel: {
    marginTop: 2,
    textAlign: 'center',
  },
  distributionCard: {
    borderWidth: 1,
  },
  sectionTitle: {
    marginBottom: 2,
  },
  sectionSubtitle: {},
  categoryBarRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  barHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  categoryName: {
    fontWeight: '600',
  },
  countWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryCount: {
    fontWeight: '600',
  },
  categoryPercentage: {},
  barBackground: {
    height: 8,
    width: '100%',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
  },
});
