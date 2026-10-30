import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRecords } from '../../src/context/RecordsContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useToast } from '../../src/context/ToastContext';
import { useNetwork } from '../../src/context/NetworkContext';
import { useDebounce } from '../../src/hooks/useDebounce';
import { Screen } from '../../src/components/Screen';
import { RecordCard } from '../../src/components/RecordCard';
import { Chip } from '../../src/components/Chip';
import { Input } from '../../src/components/Input';
import { EmptyState } from '../../src/components/EmptyState';
import { Skeleton } from '../../src/components/Skeleton';
import { SortMenu } from '../../src/components/SortMenu';
import { OfflineBanner } from '../../src/components/OfflineBanner';
import { IconButton } from '../../src/components/IconButton';
import { Category, CATEGORIES, SortOption } from '../../src/types/record';
import { APP_CONFIG } from '../../src/utils/constants';

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 700;

  const { colors, typography, spacing, borderRadius } = useTheme();
  const { showToast } = useToast();
  const { isOffline } = useNetwork();

  const {
    records,
    loading,
    refreshing,
    loadingMore,
    error,
    pendingSyncCount,
    selectedCategory,
    sortBy,
    setSelectedCategory,
    setSearchQuery,
    setSortBy,
    refreshRecords,
    loadMore,
    togglePin,
  } = useRecords();

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, APP_CONFIG.SEARCH_DEBOUNCE_MS);
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    setSearchQuery(debouncedSearch);
  }, [debouncedSearch, setSearchQuery]);

  const allCategories: (Category | 'All')[] = ['All', ...CATEGORIES];

  const handleSelectSort = (sort: SortOption) => {
    setSortBy(sort);
    setShowSortMenu(false);
  };

  const handleOpenAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/(app)/add');
  };

  const handleTogglePin = async (id: string) => {
    if (isOffline) {
      showToast('You are offline. Cannot update pin without internet.', 'error');
      return;
    }
    const result = await togglePin(id);
    if (!result.success) {
      showToast(result.error || 'Failed to update pin.', 'error');
    }
  };

  const isFiltering = searchInput.trim().length > 0 || selectedCategory !== 'All';

  return (
    <Screen edges={['top', 'left', 'right']}>
      <OfflineBanner />

      {/* Top Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
        <View style={styles.headerTitleWrap}>
          <Text style={[typography.h1, { color: colors.textPrimary }]}>
            Notes
          </Text>
          <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
            {records.length} {records.length === 1 ? 'note' : 'notes'}
            {pendingSyncCount > 0 ? ` · ${pendingSyncCount} pending sync` : ''}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <IconButton
            name="swap-vertical-outline"
            accessibilityLabel="Sort options"
            onPress={() => setShowSortMenu(true)}
          />
          <IconButton
            name="bar-chart-outline"
            accessibilityLabel="View dashboard"
            onPress={() => router.push('/(app)/dashboard')}
          />
          <IconButton
            name="settings-outline"
            accessibilityLabel="Open settings"
            onPress={() => router.push('/(app)/settings')}
          />
        </View>
      </View>

      {/* Search Input */}
      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.sm }}>
        <Input
          placeholder="Search title or notes..."
          value={searchInput}
          onChangeText={setSearchInput}
          showClear
          onClear={() => setSearchInput('')}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          containerStyle={{ marginBottom: spacing.xs }}
        />
      </View>

      {/* Horizontally scrolling Category Chips */}
      <View style={styles.chipBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.categoryScroll, { paddingHorizontal: spacing.lg }]}
        >
          {allCategories.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              selected={selectedCategory === cat}
              onPress={() => setSelectedCategory(cat)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Main Notes List */}
      <FlatList
        key={isWide ? 'wide-2-cols' : 'single-col'}
        data={records}
        keyExtractor={(item) => item.id}
        numColumns={isWide ? 2 : 1}
        columnWrapperStyle={isWide ? styles.columnWrapper : undefined}
        renderItem={({ item }) => (
          <View style={isWide ? styles.gridItem : undefined}>
            <RecordCard
              record={item}
              isWide={isWide}
              onPress={() => router.push(`/(app)/record/${item.id}`)}
              onTogglePin={() => handleTogglePin(item.id)}
            />
          </View>
        )}
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: spacing.lg, paddingBottom: 100 },
          records.length === 0 && styles.emptyListContent,
        ]}
        refreshing={refreshing}
        onRefresh={refreshRecords}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          loading ? (
            <View style={{ paddingVertical: spacing.md }}>
              <Skeleton height={74} style={{ marginBottom: spacing.md }} />
              <Skeleton height={74} style={{ marginBottom: spacing.md }} />
              <Skeleton height={74} style={{ marginBottom: spacing.md }} />
              <Skeleton height={74} />
            </View>
          ) : error ? (
            <EmptyState
              title="Unable to Load Notes"
              description={error}
              actionLabel="Retry"
              onAction={refreshRecords}
              isError
            />
          ) : isFiltering ? (
            <EmptyState
              icon="search-outline"
              title="No Results"
              description="No notes match your current search or category."
              actionLabel="Reset Search"
              onAction={() => {
                setSearchInput('');
                setSelectedCategory('All');
              }}
            />
          ) : (
            <EmptyState
              icon="document-text-outline"
              title="No Notes Yet"
              description="Capture your first note or photo idea."
              actionLabel="Create Note"
              onAction={handleOpenAdd}
            />
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: spacing.md }}>
              <Skeleton height={60} />
            </View>
          ) : undefined
        }
      />

      {/* Floating Add Note Action Button */}
      <TouchableOpacity
        onPress={handleOpenAdd}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Create new note"
        style={[
          styles.fab,
          {
            backgroundColor: colors.accent,
            borderRadius: borderRadius.pill,
          },
        ]}
      >
        <Ionicons name="add" size={26} color={colors.accentForeground} />
      </TouchableOpacity>

      {/* Sort Menu Modal */}
      <SortMenu
        visible={showSortMenu}
        currentSort={sortBy}
        onSelectSort={handleSelectSort}
        onClose={() => setShowSortMenu(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipBar: {
    marginBottom: 8,
  },
  categoryScroll: {
    paddingVertical: 4,
  },
  listContent: {
    paddingTop: 8,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  columnWrapper: {
    gap: 12,
  },
  gridItem: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    zIndex: 90,
  },
});
