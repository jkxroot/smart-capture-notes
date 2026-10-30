import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  RecordItem,
  CreateRecordInput,
  UpdateRecordInput,
  Category,
  SortOption,
} from '../types/record';
import { recordService } from '../services/recordService';
import { storageService } from '../services/storageService';
import { localDb } from '../services/localDb';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useNetwork } from './NetworkContext';
import { generateUUID } from '../utils/uuid';
import { APP_CONFIG } from '../utils/constants';
import { isAuthSessionError, isAbortError } from '../utils/errors';
import { getRecordImagePaths, normalizeLocalImageUris } from '../utils/images';

interface RecordsContextValue {
  records: RecordItem[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  pendingSyncCount: number;
  searchQuery: string;
  selectedCategory: Category | 'All';
  sortBy: SortOption;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: Category | 'All') => void;
  setSortBy: (sort: SortOption) => void;
  refreshRecords: () => Promise<void>;
  loadMore: () => Promise<void>;
  flushOutbox: () => Promise<void>;
  createRecord: (
    input: CreateRecordInput,
    localImageUris?: string | string[] | null
  ) => Promise<{ success: boolean; error?: string; record?: RecordItem }>;
  updateRecord: (
    id: string,
    input: UpdateRecordInput,
    localImageUris?: string | string[] | null,
    removeExistingImages?: boolean,
    retainedRemotePaths?: string[] | null
  ) => Promise<{ success: boolean; error?: string; record?: RecordItem }>;
  togglePin: (id: string) => Promise<{ success: boolean; error?: string }>;
  deleteRecord: (id: string) => Promise<{ success: boolean; error?: string }>;
  getRecordById: (id: string) => Promise<RecordItem | null>;
  clearRecords: () => void;
}

const RecordsContext = createContext<RecordsContextValue | null>(null);

const OFFLINE_MUTATION_MSG =
  'Saved offline. Will sync when you are back online.';

export const RecordsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isSigningOut, handleSessionExpired } = useAuth();
  const { showToast } = useToast();
  const { isOffline } = useNetwork();

  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const offsetRef = useRef<number>(0);
  const activeRequestIdRef = useRef<number>(0);
  const flushingRef = useRef(false);

  const refreshPendingCount = useCallback(async () => {
    try {
      setPendingSyncCount(await localDb.outboxCount());
    } catch {
      setPendingSyncCount(0);
    }
  }, []);

  const clearRecords = useCallback(() => {
    activeRequestIdRef.current += 1;
    setRecords([]);
    setError(null);
    setLoading(false);
    setRefreshing(false);
    setLoadingMore(false);
    setHasMore(false);
    offsetRef.current = 0;
  }, []);

  const handlePossibleAuthError = useCallback(
    (err: string | null) => {
      if (!err || isSigningOut) return false;
      if (isAuthSessionError(err)) {
        clearRecords();
        handleSessionExpired();
        showToast('Session expired, please sign in again', 'info');
        return true;
      }
      return false;
    },
    [isSigningOut, clearRecords, handleSessionExpired, showToast]
  );

  const cacheRecordsForUser = useCallback(
    async (items: RecordItem[]) => {
      if (!user) return;
      try {
        await localDb.replaceCachedRecords(
          user.id,
          items.map((item) => JSON.stringify({ ...item, sync_status: item.sync_status ?? 'synced' }))
        );
      } catch {
        // Cache is best-effort
      }
    },
    [user]
  );

  const loadCachedRecords = useCallback(async () => {
    if (!user) return [];
    try {
      const rows = await localDb.getCachedRecords(user.id);
      return rows.map((row) => JSON.parse(row) as RecordItem);
    } catch {
      return [];
    }
  }, [user]);

  const fetchRecords = useCallback(
    async (isRefresh: boolean = false) => {
      if (!user || isSigningOut) {
        clearRecords();
        return;
      }

      const requestId = ++activeRequestIdRef.current;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      offsetRef.current = 0;

      if (isOffline) {
        const cached = await loadCachedRecords();
        if (requestId !== activeRequestIdRef.current) return;
        setRecords(cached);
        setHasMore(false);
        setLoading(false);
        setRefreshing(false);
        await refreshPendingCount();
        return;
      }

      const { data, count, error: fetchErr } = await recordService.getRecords({
        category: selectedCategory,
        searchQuery,
        sortBy,
        limit: APP_CONFIG.PAGE_SIZE,
        offset: 0,
      });

      if (requestId !== activeRequestIdRef.current || !user || isSigningOut) {
        return;
      }

      if (fetchErr) {
        if (!handlePossibleAuthError(fetchErr) && !isAbortError(fetchErr)) {
          const cached = await loadCachedRecords();
          if (cached.length > 0) {
            setRecords(cached);
            setError(null);
            showToast('Showing offline cache. ' + fetchErr, 'info');
          } else {
            setError(fetchErr);
            showToast(fetchErr, 'error');
          }
        }
      } else {
        const synced = data.map((item) => ({ ...item, sync_status: 'synced' as const }));
        setRecords(synced);
        offsetRef.current = synced.length;
        setHasMore(count !== null ? synced.length < count : synced.length === APP_CONFIG.PAGE_SIZE);
        await cacheRecordsForUser(synced);
      }

      setLoading(false);
      setRefreshing(false);
      await refreshPendingCount();
    },
    [
      user,
      isSigningOut,
      isOffline,
      selectedCategory,
      searchQuery,
      sortBy,
      clearRecords,
      handlePossibleAuthError,
      showToast,
      loadCachedRecords,
      cacheRecordsForUser,
      refreshPendingCount,
    ]
  );

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading || refreshing || !user || isSigningOut || isOffline) {
      return;
    }

    const requestId = activeRequestIdRef.current;
    setLoadingMore(true);
    const currentOffset = offsetRef.current;

    const { data, count, error: fetchErr } = await recordService.getRecords({
      category: selectedCategory,
      searchQuery,
      sortBy,
      limit: APP_CONFIG.PAGE_SIZE,
      offset: currentOffset,
    });

    if (requestId !== activeRequestIdRef.current || !user || isSigningOut) {
      setLoadingMore(false);
      return;
    }

    if (fetchErr) {
      if (!handlePossibleAuthError(fetchErr) && !isAbortError(fetchErr)) {
        showToast(fetchErr, 'error');
      }
    } else {
      setRecords((prev) => {
        const existingIds = new Set(prev.map((r) => r.id));
        const uniqueIncoming = data
          .filter((item) => !existingIds.has(item.id))
          .map((item) => ({ ...item, sync_status: 'synced' as const }));
        return [...prev, ...uniqueIncoming];
      });
      offsetRef.current = currentOffset + data.length;
      setHasMore(
        count !== null
          ? currentOffset + data.length < count
          : data.length === APP_CONFIG.PAGE_SIZE
      );
    }

    setLoadingMore(false);
  }, [
    loadingMore,
    hasMore,
    loading,
    refreshing,
    user,
    isSigningOut,
    isOffline,
    selectedCategory,
    searchQuery,
    sortBy,
    handlePossibleAuthError,
    showToast,
  ]);

  const refreshRecords = useCallback(async () => {
    await fetchRecords(true);
  }, [fetchRecords]);

  const flushOutbox = useCallback(async () => {
    if (!user || isOffline || flushingRef.current) return;
    flushingRef.current = true;
    try {
      const queue = await localDb.listOutbox();
      for (const item of queue) {
        try {
          if (item.type === 'create') {
            const payload = JSON.parse(item.payload_json) as CreateRecordInput & { id: string };
            const localUris = JSON.parse(item.local_image_uris_json || '[]') as string[];
            let paths: string[] = [];
            if (localUris.length > 0) {
              const upload = await storageService.uploadRecordImages(localUris, user.id, payload.id);
              if (upload.error) throw new Error(upload.error);
              paths = upload.paths;
            }
            const dbResult = await recordService.createRecord(
              {
                title: payload.title,
                notes: payload.notes,
                category: payload.category,
                image_path: paths[0] ?? null,
                image_paths: paths,
                is_pinned: payload.is_pinned,
              },
              payload.id
            );
            if (dbResult.error || !dbResult.data) throw new Error(dbResult.error || 'Create failed');
            await localDb.upsertCachedRecord(
              user.id,
              JSON.stringify({ ...dbResult.data, sync_status: 'synced' })
            );
          } else if (item.type === 'update') {
            const payload = JSON.parse(item.payload_json) as {
              input: UpdateRecordInput;
              retainedRemotePaths?: string[];
              removeExistingImages?: boolean;
            };
            const localUris = JSON.parse(item.local_image_uris_json || '[]') as string[];
            let paths = payload.retainedRemotePaths ?? [];
            if (localUris.length > 0) {
              const upload = await storageService.uploadRecordImages(
                localUris,
                user.id,
                item.record_id
              );
              if (upload.error) throw new Error(upload.error);
              paths = [...paths, ...upload.paths];
            }
            if (payload.removeExistingImages && localUris.length === 0) {
              paths = [];
            }
            const dbResult = await recordService.updateRecord(item.record_id, {
              ...payload.input,
              image_paths: paths,
              image_path: paths[0] ?? null,
            });
            if (dbResult.error || !dbResult.data) throw new Error(dbResult.error || 'Update failed');
            await localDb.upsertCachedRecord(
              user.id,
              JSON.stringify({ ...dbResult.data, sync_status: 'synced' })
            );
          } else if (item.type === 'delete') {
            const existing = records.find((r) => r.id === item.record_id);
            const paths = existing ? getRecordImagePaths(existing) : [];
            const result = await recordService.deleteRecord(item.record_id);
            if (result.error) throw new Error(result.error);
            if (paths.length) await storageService.deleteImages(paths);
            await localDb.removeCachedRecord(item.record_id);
          } else if (item.type === 'pin') {
            const payload = JSON.parse(item.payload_json) as { is_pinned: boolean };
            const result = await recordService.updateRecord(item.record_id, {
              is_pinned: payload.is_pinned,
            });
            if (result.error) throw new Error(result.error);
          }

          await localDb.removeOutbox(item.id);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Sync failed';
          if (isAuthSessionError(message)) {
            handlePossibleAuthError(message);
            break;
          }
          showToast(`Offline sync issue: ${message}`, 'error');
          break;
        }
      }
      await refreshPendingCount();
      if (!isOffline) {
        await fetchRecords(true);
      }
    } finally {
      flushingRef.current = false;
    }
  }, [
    user,
    isOffline,
    records,
    handlePossibleAuthError,
    showToast,
    refreshPendingCount,
    fetchRecords,
  ]);

  useEffect(() => {
    if (!isOffline && user) {
      flushOutbox().catch(() => {});
    }
  }, [isOffline, user, flushOutbox]);

  const createRecord = useCallback(
    async (
      input: CreateRecordInput,
      localImageUris?: string | string[] | null
    ): Promise<{ success: boolean; error?: string; record?: RecordItem }> => {
      if (!user) {
        return { success: false, error: 'Please sign in to save notes.' };
      }

      const uris = normalizeLocalImageUris(localImageUris).slice(
        0,
        APP_CONFIG.MAX_IMAGES_PER_RECORD
      );
      const recordId = generateUUID();
      const now = new Date().toISOString();

      if (isOffline) {
        const pending: RecordItem = {
          id: recordId,
          user_id: user.id,
          title: input.title.trim(),
          notes: input.notes?.trim() || null,
          category: input.category,
          image_path: null,
          image_paths: [],
          is_pinned: input.is_pinned ?? false,
          created_at: now,
          updated_at: now,
          sync_status: 'pending',
        };
        await localDb.enqueueOutbox({
          id: generateUUID(),
          type: 'create',
          record_id: recordId,
          payload_json: JSON.stringify({ ...input, id: recordId }),
          local_image_uris_json: JSON.stringify(uris),
          created_at: Date.now(),
        });
        await localDb.upsertCachedRecord(user.id, JSON.stringify(pending));
        setRecords((prev) => [pending, ...prev]);
        await refreshPendingCount();
        showToast(OFFLINE_MUTATION_MSG, 'info');
        return { success: true, record: pending };
      }

      let paths: string[] = [];
      if (uris.length > 0) {
        const upload = await storageService.uploadRecordImages(uris, user.id, recordId);
        if (upload.error) {
          handlePossibleAuthError(upload.error);
          return { success: false, error: upload.error };
        }
        paths = upload.paths;
      }

      const dbResult = await recordService.createRecord(
        {
          ...input,
          image_path: paths[0] ?? null,
          image_paths: paths,
        },
        recordId
      );

      if (dbResult.error || !dbResult.data) {
        if (paths.length) await storageService.deleteImages(paths);
        handlePossibleAuthError(dbResult.error);
        return { success: false, error: dbResult.error || 'Failed to save note.' };
      }

      const saved = { ...dbResult.data, sync_status: 'synced' as const };
      setRecords((prev) => [saved, ...prev]);
      await localDb.upsertCachedRecord(user.id, JSON.stringify(saved));
      return { success: true, record: saved };
    },
    [user, isOffline, handlePossibleAuthError, refreshPendingCount, showToast]
  );

  const updateRecord = useCallback(
    async (
      id: string,
      input: UpdateRecordInput,
      localImageUris?: string | string[] | null,
      removeExistingImages: boolean = false,
      retainedRemotePaths: string[] | null = null
    ): Promise<{ success: boolean; error?: string; record?: RecordItem }> => {
      if (!user) {
        return { success: false, error: 'Please sign in to update notes.' };
      }

      const existingRecord = records.find((r) => r.id === id);
      const oldPaths = existingRecord ? getRecordImagePaths(existingRecord) : [];
      const uris = normalizeLocalImageUris(localImageUris).slice(
        0,
        APP_CONFIG.MAX_IMAGES_PER_RECORD
      );
      const kept =
        retainedRemotePaths ??
        (removeExistingImages && uris.length === 0 ? [] : oldPaths);

      if (isOffline) {
        const merged: RecordItem = {
          ...(existingRecord as RecordItem),
          ...input,
          title: input.title?.trim() ?? existingRecord?.title ?? '',
          notes:
            input.notes !== undefined
              ? input.notes?.trim() || null
              : existingRecord?.notes ?? null,
          category: input.category ?? existingRecord?.category ?? 'Personal',
          updated_at: new Date().toISOString(),
          sync_status: 'pending',
        };
        await localDb.enqueueOutbox({
          id: generateUUID(),
          type: 'update',
          record_id: id,
          payload_json: JSON.stringify({
            input,
            retainedRemotePaths: kept,
            removeExistingImages,
          }),
          local_image_uris_json: JSON.stringify(uris),
          created_at: Date.now(),
        });
        await localDb.upsertCachedRecord(user.id, JSON.stringify(merged));
        setRecords((prev) => prev.map((item) => (item.id === id ? merged : item)));
        await refreshPendingCount();
        showToast(OFFLINE_MUTATION_MSG, 'info');
        return { success: true, record: merged };
      }

      let finalPaths = [...kept];
      if (uris.length > 0) {
        const slotsLeft = Math.max(0, APP_CONFIG.MAX_IMAGES_PER_RECORD - finalPaths.length);
        const toUpload = uris.slice(0, slotsLeft);
        const upload = await storageService.uploadRecordImages(toUpload, user.id, id);
        if (upload.error) {
          handlePossibleAuthError(upload.error);
          return { success: false, error: upload.error };
        }
        finalPaths = [...finalPaths, ...upload.paths];
      }

      if (removeExistingImages && uris.length === 0 && retainedRemotePaths === null) {
        finalPaths = [];
      }

      const dbResult = await recordService.updateRecord(id, {
        ...input,
        image_paths: finalPaths,
        image_path: finalPaths[0] ?? null,
      });

      if (dbResult.error || !dbResult.data) {
        handlePossibleAuthError(dbResult.error);
        return { success: false, error: dbResult.error || 'Failed to update note.' };
      }

      const removed = oldPaths.filter((path) => !finalPaths.includes(path));
      if (removed.length) await storageService.deleteImages(removed);

      const saved = { ...dbResult.data, sync_status: 'synced' as const };
      setRecords((prev) => prev.map((item) => (item.id === id ? saved : item)));
      await localDb.upsertCachedRecord(user.id, JSON.stringify(saved));
      return { success: true, record: saved };
    },
    [user, records, isOffline, handlePossibleAuthError, refreshPendingCount, showToast]
  );

  const togglePin = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      const target = records.find((r) => r.id === id);
      if (!target) return { success: false, error: 'Record not found' };

      if (isOffline) {
        return { success: false, error: 'Cannot update pin while offline.' };
      }

      const nextPinned = !target.is_pinned;

      setRecords((prev) =>
        prev
          .map((item) => (item.id === id ? { ...item, is_pinned: nextPinned } : item))
          .sort((a, b) => {
            if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          })
      );

      const result = await recordService.updateRecord(id, { is_pinned: nextPinned });
      if (result.error) {
        setRecords((prev) =>
          prev.map((item) => (item.id === id ? { ...item, is_pinned: !nextPinned } : item))
        );
        handlePossibleAuthError(result.error);
        return { success: false, error: result.error };
      }

      return { success: true };
    },
    [records, isOffline, handlePossibleAuthError]
  );

  const deleteRecord = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      if (!user) return { success: false, error: 'Please sign in.' };

      const existing = records.find((r) => r.id === id);
      const paths = existing ? getRecordImagePaths(existing) : [];

      if (isOffline) {
        await localDb.enqueueOutbox({
          id: generateUUID(),
          type: 'delete',
          record_id: id,
          payload_json: '{}',
          local_image_uris_json: '[]',
          created_at: Date.now(),
        });
        await localDb.removeCachedRecord(id);
        setRecords((prev) => prev.filter((r) => r.id !== id));
        await refreshPendingCount();
        showToast(OFFLINE_MUTATION_MSG, 'info');
        return { success: true };
      }

      const result = await recordService.deleteRecord(id);
      if (result.error) {
        handlePossibleAuthError(result.error);
        return { success: false, error: result.error };
      }

      if (paths.length) await storageService.deleteImages(paths);
      await localDb.removeCachedRecord(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      return { success: true };
    },
    [user, records, isOffline, handlePossibleAuthError, refreshPendingCount, showToast]
  );

  const getRecordById = useCallback(
    async (id: string): Promise<RecordItem | null> => {
      const found = records.find((r) => r.id === id);
      if (found) return found;

      if (isOffline) {
        const cached = await loadCachedRecords();
        return cached.find((r) => r.id === id) ?? null;
      }

      const { data, error: err } = await recordService.getRecordById(id);
      if (err) {
        handlePossibleAuthError(err);
      }
      return data;
    },
    [records, isOffline, loadCachedRecords, handlePossibleAuthError]
  );

  return (
    <RecordsContext.Provider
      value={{
        records,
        loading,
        refreshing,
        loadingMore,
        hasMore,
        error,
        pendingSyncCount,
        searchQuery,
        selectedCategory,
        sortBy,
        setSearchQuery,
        setSelectedCategory,
        setSortBy,
        refreshRecords,
        loadMore,
        flushOutbox,
        createRecord,
        updateRecord,
        togglePin,
        deleteRecord,
        getRecordById,
        clearRecords,
      }}
    >
      {children}
    </RecordsContext.Provider>
  );
};

export const useRecords = (): RecordsContextValue => {
  const context = useContext(RecordsContext);
  if (!context) {
    throw new Error('useRecords must be used within a RecordsProvider');
  }
  return context;
};
