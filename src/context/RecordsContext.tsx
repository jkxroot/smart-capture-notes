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
} from '../types/record';
import { recordService } from '../services/recordService';
import { storageService } from '../services/storageService';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { generateUUID } from '../utils/uuid';
import { APP_CONFIG } from '../utils/constants';

interface RecordsContextValue {
  records: RecordItem[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  searchQuery: string;
  selectedCategory: Category | 'All';
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: Category | 'All') => void;
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
  deleteRecord: (id: string) => Promise<{ success: boolean; error?: string }>;
  getRecordById: (id: string) => Promise<RecordItem | null>;
}

const RecordsContext = createContext<RecordsContextValue | null>(null);

export const RecordsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');

  // Keep track of current offset
  const offsetRef = useRef<number>(0);

  // Fetch initial or refreshed records
  const fetchRecords = useCallback(
    async (isRefresh: boolean = false) => {
      if (!user) {
        setRecords([]);
        setLoading(false);
        return;
      }

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
        limit: APP_CONFIG.PAGE_SIZE,
        offset: 0,
      });

      if (fetchErr) {
        setError(fetchErr);
        showToast(fetchErr, 'error');
      } else {
        setRecords(data);
        offsetRef.current = data.length;
        setHasMore(count !== null ? data.length < count : data.length === APP_CONFIG.PAGE_SIZE);
      }

      setLoading(false);
      setRefreshing(false);
    },
    [user, selectedCategory, searchQuery, showToast]
  );

  // Re-fetch when user, category, or search changes
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Load next page of records
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading || refreshing || !user) return;

    setLoadingMore(true);
    const currentOffset = offsetRef.current;

    const { data, count, error: fetchErr } = await recordService.getRecords({
      category: selectedCategory,
      searchQuery,
      limit: APP_CONFIG.PAGE_SIZE,
      offset: currentOffset,
    });

    if (fetchErr) {
      showToast(fetchErr, 'error');
    } else {
      setRecords((prev) => [...prev, ...data]);
      offsetRef.current = currentOffset + data.length;
      setHasMore(
        count !== null
          ? currentOffset + data.length < count
          : data.length === APP_CONFIG.PAGE_SIZE
      );
    }

    setLoadingMore(false);
  }, [loadingMore, hasMore, loading, refreshing, user, selectedCategory, searchQuery, showToast]);

  const refreshRecords = useCallback(async () => {
    await fetchRecords(true);
  }, [fetchRecords]);

  // Create record with robust rollback
  const createRecord = useCallback(
    async (
      input: CreateRecordInput,
      localImageUri?: string | null
    ): Promise<{ success: boolean; error?: string; record?: RecordItem }> => {
      if (!user) {
        return { success: false, error: 'User is not authenticated.' };
      }

      const recordId = generateUUID();
      let uploadedStoragePath: string | null = null;

      // 1. If an image was selected, upload it first to {user_id}/{record_id}.jpg
      if (localImageUri) {
        const uploadResult = await storageService.uploadRecordImage(
          localImageUri,
          user.id,
          recordId
        );

        if (uploadResult.error || !uploadResult.path) {
          return {
            success: false,
            error: uploadResult.error || 'Failed to upload photo.',
          };
        }

        uploadedStoragePath = uploadResult.path;
      }

      // 2. Insert into database
      const dbResult = await recordService.createRecord(
        {
          ...input,
          image_path: uploadedStoragePath,
        },
        recordId
      );

      // 3. Rollback if DB insert fails
      if (dbResult.error || !dbResult.data) {
        if (uploadedStoragePath) {
          // Delete uploaded storage object so no orphaned file remains
          await storageService.deleteImage(uploadedStoragePath);
        }
        return {
          success: false,
          error: dbResult.error || 'Failed to save record.',
        };
      }

      // 4. Update local state
      setRecords((prev) => [dbResult.data!, ...prev]);
      return { success: true, record: dbResult.data };
    },
    [user]
  );

  // Update record with image replacement/removal handling
  const updateRecord = useCallback(
    async (
      id: string,
      input: UpdateRecordInput,
      localImageUri?: string | null,
      removeExistingImage: boolean = false
    ): Promise<{ success: boolean; error?: string; record?: RecordItem }> => {
      if (!user) {
        return { success: false, error: 'User is not authenticated.' };
      }

      const existingRecord = records.find((r) => r.id === id);
      const oldImagePath = existingRecord?.image_path;
      let newImagePath: string | null | undefined = undefined;

      // Case A: User uploaded a new replacement image
      if (localImageUri) {
        const uploadResult = await storageService.uploadRecordImage(
          localImageUri,
          user.id,
          id
        );
        if (uploadResult.error || !uploadResult.path) {
          return {
            success: false,
            error: uploadResult.error || 'Failed to upload new photo.',
          };
        }
        newImagePath = uploadResult.path;
      } else if (removeExistingImage) {
        // Case B: User explicitly removed image
        newImagePath = null;
      }

      // 2. Perform DB update
      const updateData: UpdateRecordInput = {
        ...input,
        ...(newImagePath !== undefined ? { image_path: newImagePath } : {}),
      };

      const dbResult = await recordService.updateRecord(id, updateData);

      if (dbResult.error || !dbResult.data) {
        return {
          success: false,
          error: dbResult.error || 'Failed to update record.',
        };
      }

      // 3. Clean up old image if it was replaced or removed
      if (
        (removeExistingImage || (localImageUri && newImagePath !== oldImagePath)) &&
        oldImagePath
      ) {
        await storageService.deleteImage(oldImagePath);
      }

      // 4. Update local state
      setRecords((prev) =>
        prev.map((item) => (item.id === id ? dbResult.data! : item))
      );

      return { success: true, record: dbResult.data };
    },
    [user, records]
  );

  // Delete record and storage object
  const deleteRecord = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      const existing = records.find((r) => r.id === id);
      const imagePath = existing?.image_path;

      // 1. Delete from DB
      const result = await recordService.deleteRecord(id);
      if (result.error) {
        return { success: false, error: result.error };
      }

      // 2. Delete storage object if present
      if (imagePath) {
        await storageService.deleteImage(imagePath);
      }

      // 3. Update local state
      setRecords((prev) => prev.filter((r) => r.id !== id));
      return { success: true };
    },
    [records]
  );

  const getRecordById = useCallback(
    async (id: string): Promise<RecordItem | null> => {
      const found = records.find((r) => r.id === id);
      if (found) return found;

      const { data } = await recordService.getRecordById(id);
      return data;
    },
    [records]
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
        setSearchQuery,
        setSelectedCategory,
        refreshRecords,
        loadMore,
        createRecord,
        updateRecord,
        deleteRecord,
        getRecordById,
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
