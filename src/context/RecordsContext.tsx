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
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { generateUUID } from '../utils/uuid';
import { APP_CONFIG } from '../utils/constants';
import { isAuthSessionError, isAbortError } from '../utils/errors';

interface RecordsContextValue {
  records: RecordItem[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  searchQuery: string;
  selectedCategory: Category | 'All';
  sortBy: SortOption;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: Category | 'All') => void;
  setSortBy: (sort: SortOption) => void;
  refreshRecords: () => Promise<void>;
  loadMore: () => Promise<void>;
  createRecord: (
    input: CreateRecordInput,
    localImageUri?: string | null
  ) => Promise<{ success: boolean; error?: string; record?: RecordItem }>;
  updateRecord: (
    id: string,
    input: UpdateRecordInput,
    localImageUri?: string | null,
    removeExistingImage?: boolean
  ) => Promise<{ success: boolean; error?: string; record?: RecordItem }>;
  togglePin: (id: string) => Promise<{ success: boolean; error?: string }>;
  deleteRecord: (id: string) => Promise<{ success: boolean; error?: string }>;
  getRecordById: (id: string) => Promise<RecordItem | null>;
  clearRecords: () => void;
}

const RecordsContext = createContext<RecordsContextValue | null>(null);

export const RecordsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isSigningOut, handleSessionExpired } = useAuth();
  const { showToast } = useToast();

  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const offsetRef = useRef<number>(0);
  const activeRequestIdRef = useRef<number>(0);

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

      const { data, count, error: fetchErr } = await recordService.getRecords({
        category: selectedCategory,
        searchQuery,
        sortBy,
        limit: APP_CONFIG.PAGE_SIZE,
        offset: 0,
      });

      // Discard if request was superseded or user logged out
      if (requestId !== activeRequestIdRef.current || !user || isSigningOut) {
        return;
      }

      if (fetchErr) {
        if (!handlePossibleAuthError(fetchErr) && !isAbortError(fetchErr)) {
          setError(fetchErr);
          showToast(fetchErr, 'error');
        }
      } else {
        setRecords(data);
        offsetRef.current = data.length;
        setHasMore(count !== null ? data.length < count : data.length === APP_CONFIG.PAGE_SIZE);
      }

      setLoading(false);
      setRefreshing(false);
    },
    [user, isSigningOut, selectedCategory, searchQuery, sortBy, clearRecords, handlePossibleAuthError, showToast]
  );

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading || refreshing || !user || isSigningOut) return;

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
        const uniqueIncoming = data.filter((item) => !existingIds.has(item.id));
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
    selectedCategory,
    searchQuery,
    sortBy,
    handlePossibleAuthError,
    showToast,
  ]);

  const refreshRecords = useCallback(async () => {
    await fetchRecords(true);
  }, [fetchRecords]);

  const createRecord = useCallback(
    async (
      input: CreateRecordInput,
      localImageUri?: string | null
    ): Promise<{ success: boolean; error?: string; record?: RecordItem }> => {
      if (!user) {
        return { success: false, error: 'Please sign in to save notes.' };
      }

      const recordId = generateUUID();
      let uploadedStoragePath: string | null = null;

      if (localImageUri) {
        const uploadResult = await storageService.uploadRecordImage(
          localImageUri,
          user.id,
          recordId
        );

        if (uploadResult.error || !uploadResult.path) {
          handlePossibleAuthError(uploadResult.error);
          return {
            success: false,
            error: uploadResult.error || 'Failed to upload photo.',
          };
        }

        uploadedStoragePath = uploadResult.path;
      }

      const dbResult = await recordService.createRecord(
        {
          ...input,
          image_path: uploadedStoragePath,
        },
        recordId
      );

      if (dbResult.error || !dbResult.data) {
        if (uploadedStoragePath) {
          await storageService.deleteImage(uploadedStoragePath);
        }
        handlePossibleAuthError(dbResult.error);
        return {
          success: false,
          error: dbResult.error || 'Failed to save note.',
        };
      }

      setRecords((prev) => [dbResult.data!, ...prev]);
      return { success: true, record: dbResult.data };
    },
    [user, handlePossibleAuthError]
  );

  const updateRecord = useCallback(
    async (
      id: string,
      input: UpdateRecordInput,
      localImageUri?: string | null,
      removeExistingImage: boolean = false
    ): Promise<{ success: boolean; error?: string; record?: RecordItem }> => {
      if (!user) {
        return { success: false, error: 'Please sign in to update notes.' };
      }

      const existingRecord = records.find((r) => r.id === id);
      const oldImagePath = existingRecord?.image_path;
      let newImagePath: string | null | undefined = undefined;

      if (localImageUri) {
        const uploadResult = await storageService.uploadRecordImage(
          localImageUri,
          user.id,
          id
        );
        if (uploadResult.error || !uploadResult.path) {
          handlePossibleAuthError(uploadResult.error);
          return {
            success: false,
            error: uploadResult.error || 'Failed to upload new photo.',
          };
        }
        newImagePath = uploadResult.path;
      } else if (removeExistingImage) {
        newImagePath = null;
      }

      const updateData: UpdateRecordInput = {
        ...input,
        ...(newImagePath !== undefined ? { image_path: newImagePath } : {}),
      };

      const dbResult = await recordService.updateRecord(id, updateData);

      if (dbResult.error || !dbResult.data) {
        handlePossibleAuthError(dbResult.error);
        return {
          success: false,
          error: dbResult.error || 'Failed to update note.',
        };
      }

      if (
        (removeExistingImage || (localImageUri && newImagePath !== oldImagePath)) &&
        oldImagePath
      ) {
        await storageService.deleteImage(oldImagePath);
      }

      setRecords((prev) =>
        prev.map((item) => (item.id === id ? dbResult.data! : item))
      );

      return { success: true, record: dbResult.data };
    },
    [user, records, handlePossibleAuthError]
  );

  const togglePin = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      const target = records.find((r) => r.id === id);
      if (!target) return { success: false, error: 'Record not found' };

      const nextPinned = !target.is_pinned;

      // Optimistic update
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
        // Rollback
        setRecords((prev) =>
          prev.map((item) => (item.id === id ? { ...item, is_pinned: !nextPinned } : item))
        );
        handlePossibleAuthError(result.error);
        return { success: false, error: result.error };
      }

      return { success: true };
    },
    [records, handlePossibleAuthError]
  );

  const deleteRecord = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      const existing = records.find((r) => r.id === id);
      const imagePath = existing?.image_path;

      const result = await recordService.deleteRecord(id);
      if (result.error) {
        handlePossibleAuthError(result.error);
        return { success: false, error: result.error };
      }

      if (imagePath) {
        await storageService.deleteImage(imagePath);
      }

      setRecords((prev) => prev.filter((r) => r.id !== id));
      return { success: true };
    },
    [records, handlePossibleAuthError]
  );

  const getRecordById = useCallback(
    async (id: string): Promise<RecordItem | null> => {
      const found = records.find((r) => r.id === id);
      if (found) return found;

      const { data, error: err } = await recordService.getRecordById(id);
      if (err) {
        handlePossibleAuthError(err);
      }
      return data;
    },
    [records, handlePossibleAuthError]
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
        searchQuery,
        selectedCategory,
        sortBy,
        setSearchQuery,
        setSelectedCategory,
        setSortBy,
        refreshRecords,
        loadMore,
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
