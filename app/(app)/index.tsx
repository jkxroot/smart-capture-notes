import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useRecords } from '../../src/context/RecordsContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useDebounce } from '../../src/hooks/useDebounce';
import { RecordCard } from '../../src/components/RecordCard';
import { CategoryChip } from '../../src/components/CategoryChip';
import { SearchBar } from '../../src/components/SearchBar';
import { EmptyState } from '../../src/components/EmptyState';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';
import { Category, CATEGORIES } from '../../src/types/record';
import { APP_CONFIG } from '../../src/utils/constants';

export default function HomeScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();

  const {
    records,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    error,
    selectedCategory,
    setSelectedCategory,
    setSearchQuery,
    refreshRecords,
    loadMore,
  } = useRecords();

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, APP_CONFIG.SEARCH_DEBOUNCE_MS);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Sync debounced search with context
  useEffect(() => {
    setSearchQuery(debouncedSearch);
  }, [debouncedSearch, setSearchQuery]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
    setShowSignOutDialog(false);
  };

  const allCategories: (Category | 'All')[] = ['All', ...CATEGORIES];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Top App Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.appTitle, typography.h2, { color: colors.textPrimary }]}>
            Smart Notes
          </Text>
          <Text
            style={[styles.userEmail, typography.caption, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {user?.email || 'Logged In'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {/* Dashboard Icon */}
          <TouchableOpacity
            onPress={() => router.push('/(app)/dashboard')}
            style={[
              styles.iconBtn,
              { backgroundColor: colors.surfaceMuted, borderRadius: borderRadius.pill },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Open category dashboard"
          >
            <Ionicons name="pie-chart-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* Profile / Sign Out Icon */}
          <TouchableOpacity
            onPress={() => setShowSignOutDialog(true)}
            style={[
              styles.iconBtn,
              { backgroundColor: colors.surfaceMuted, borderRadius: borderRadius.pill },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Sign out or profile options"
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and Category Filter Section */}
      <View style={[styles.filterContainer, { paddingHorizontal: spacing.md, paddingTop: spacing.md }]}>
        <SearchBar
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Search by title or notes..."
          loading={loading && searchInput.length > 0}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.categoryScroll, { paddingVertical: spacing.md }]}
        >
          {allCategories.map((cat) => (
            <CategoryChip
              key={cat}
              category={cat}
              selected={selectedCategory === cat}
              onPress={() => setSelectedCategory(cat)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Main Records List */}
      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RecordCard
            record={item}
            onPress={() => router.push(`/(app)/record/${item.id}`)}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: spacing.md, paddingBottom: 100 },
          records.length === 0 && styles.emptyListContent,
        ]}
        refreshing={refreshing}
        onRefresh={refreshRecords}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text
                style={[
                  styles.loadingText,
                  typography.bodyMedium,
                  { color: colors.textSecondary, marginTop: spacing.md },
                ]}
              >
                Loading notes...
              </Text>
            </View>
          ) : error ? (
            <EmptyState
              title="Connection Problem"
              description={error}
              actionLabel="Retry"
              onAction={refreshRecords}
              isError
            />
          ) : (
            <EmptyState
              title="No notes found"
              description={
                searchInput || selectedCategory !== 'All'
                  ? 'No notes match your current search or category filter.'
                  : 'Start capturing your thoughts, receipts, and ideas with photos.'
              }
              actionLabel={
                searchInput || selectedCategory !== 'All'
                  ? 'Reset Filters'
                  : 'Capture Note'
              }
              onAction={
                searchInput || selectedCategory !== 'All'
                  ? () => {
                      setSearchInput('');
                      setSelectedCategory('All');
                    }
                  : () => router.push('/(app)/add')
              }
            />
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text
                style={[
                  styles.footerText,
                  typography.caption,
                  { color: colors.textTertiary, marginLeft: 8 },
                ]}
              >
                Loading more...
              </Text>
            </View>
          ) : undefined
        }
      />

      {/* Floating Action Button (FAB) to Add Note */}
      <TouchableOpacity
        style={[
          styles.fab,
          shadows.lg,
          {
            backgroundColor: colors.primary,
            borderRadius: borderRadius.pill,
          },
        ]}
        onPress={() => router.push('/(app)/add')}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Create new note"
      >
        <Ionicons name="add" size={30} color={colors.primaryForeground} />
      </TouchableOpacity>

      {/* Sign Out Confirmation Dialog */}
      <ConfirmDialog
        visible={showSignOutDialog}
        title="Sign Out"
        message={`Are you sure you want to sign out from ${user?.email || 'your account'}?`}
        confirmLabel="Sign Out"
        isDestructive
        loading={signingOut}
        onConfirm={handleSignOut}
        onCancel={() => setShowSignOutDialog(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  appTitle: {
    letterSpacing: -0.5,
  },
  userEmail: {
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {},
  categoryScroll: {
    paddingRight: 16,
  },
  listContent: {
    paddingTop: 8,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  loadingText: {},
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  footerText: {},
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 90,
  },
});
